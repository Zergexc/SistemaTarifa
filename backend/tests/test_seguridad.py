"""Pruebas de seguridad de la API de TarifaIA.

Enfocadas en control de acceso (JWT) e inyección. Verifican que la API
rechace tokens manipulados, ausentes o expirados, y que los filtros de
consulta no sean vulnerables a inyección SQL (SQLAlchemy usa parámetros
ligados, aquí se comprueba que efectivamente resiste).
"""
import base64
import json
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.config import settings


def _b64url(data: dict) -> str:
    raw = json.dumps(data).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

ENDPOINT_PROTEGIDO = "/api/documentos"


class TestControlDeAcceso:
    def test_sin_token_devuelve_401(self, client):
        res = client.get(ENDPOINT_PROTEGIDO)
        assert res.status_code == 401

    def test_token_con_texto_basura_devuelve_401(self, client):
        res = client.get(ENDPOINT_PROTEGIDO, headers={"Authorization": "Bearer esto.no.es.jwt"})
        assert res.status_code == 401

    def test_token_firmado_con_secreto_falso_devuelve_401(self, client):
        # Un atacante que no conoce SECRET_KEY no puede forjar un token válido.
        token_falso = jwt.encode(
            {"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            "secreto-del-atacante",
            algorithm=settings.ALGORITHM,
        )
        res = client.get(ENDPOINT_PROTEGIDO, headers={"Authorization": f"Bearer {token_falso}"})
        assert res.status_code == 401

    def test_token_expirado_devuelve_401(self, client):
        token_expirado = jwt.encode(
            {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        res = client.get(ENDPOINT_PROTEGIDO, headers={"Authorization": f"Bearer {token_expirado}"})
        assert res.status_code == 401

    def test_token_sin_claim_sub_devuelve_401(self, client):
        token_incompleto = jwt.encode(
            {"exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        res = client.get(ENDPOINT_PROTEGIDO, headers={"Authorization": f"Bearer {token_incompleto}"})
        assert res.status_code == 401

    def test_algoritmo_none_es_rechazado(self, client):
        # Ataque clásico "alg: none": token fabricado a mano, sin firma.
        # Se construye manualmente porque una librería segura ni permite crearlo.
        header = _b64url({"alg": "none", "typ": "JWT"})
        payload = _b64url({"sub": "1"})
        token_none = f"{header}.{payload}."  # firma vacía
        res = client.get(ENDPOINT_PROTEGIDO, headers={"Authorization": f"Bearer {token_none}"})
        assert res.status_code == 401

    def test_usuario_inexistente_en_token_valido_devuelve_401(self, client):
        # Token bien firmado pero apuntando a un id que no existe.
        token = jwt.encode(
            {"sub": "99999999", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        res = client.get(ENDPOINT_PROTEGIDO, headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 401


class TestInyeccion:
    def test_sql_injection_en_login_no_autentica(self, client):
        # Payload clásico de bypass de autenticación.
        res = client.post(
            "/api/auth/login",
            json={"email": "admin@tarifaia.com' OR '1'='1", "password": "' OR '1'='1"},
        )
        assert res.status_code in (401, 422)

    def test_sql_injection_en_email_no_rompe_el_servidor(self, client):
        res = client.post(
            "/api/auth/login",
            json={"email": "x'; DROP TABLE usuarios; --", "password": "cualquiera1"},
        )
        # No debe caerse (500); rechaza como credencial inválida o email mal formado.
        assert res.status_code in (401, 422)


class TestExposicionDeDatos:
    def test_login_no_expone_el_hash_de_password(self, client):
        res = client.post(
            "/api/auth/login",
            json={"email": "admin@tarifaia.com", "password": "admin1234"},
        )
        cuerpo = res.text.lower()
        assert "password_hash" not in cuerpo and "$2b$" not in cuerpo

    def test_perfil_no_expone_hash_de_password(self, client, auth_headers):
        res = client.get("/api/auth/me", headers=auth_headers)
        assert res.status_code == 200
        assert "password" not in res.text.lower()
