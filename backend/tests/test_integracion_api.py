"""Pruebas de integración de la API REST de TarifaIA.

Validan el contrato de cada endpoint con casos válidos y casos borde,
atravesando la pila completa: FastAPI → servicios → SQLAlchemy → PostgreSQL.
"""
import io

from conftest import ADMIN_EMAIL, ADMIN_PASSWORD


class TestSalud:
    def test_health_check_responde_ok(self, client):
        res = client.get("/")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


class TestAutenticacion:
    def test_login_con_credenciales_validas_devuelve_token(self, client):
        res = client.post(
            "/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert res.status_code == 200
        body = res.json()
        assert "access_token" in body and len(body["access_token"]) > 20

    def test_login_con_password_incorrecta_devuelve_401(self, client):
        res = client.post(
            "/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "password-incorrecta"},
        )
        assert res.status_code == 401

    def test_login_con_email_inexistente_devuelve_401(self, client):
        res = client.post(
            "/api/auth/login",
            json={"email": "nadie@ejemplo.com", "password": "loquesea123"},
        )
        assert res.status_code == 401

    def test_login_con_email_invalido_devuelve_422(self, client):
        res = client.post(
            "/api/auth/login",
            json={"email": "esto-no-es-un-email", "password": "abc12345"},
        )
        assert res.status_code == 422

    def test_perfil_me_devuelve_datos_del_usuario(self, client, auth_headers):
        res = client.get("/api/auth/me", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["email"] == ADMIN_EMAIL


class TestDocumentos:
    def test_listar_documentos_autenticado_devuelve_lista(self, client, auth_headers):
        res = client.get("/api/documentos", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_listar_documentos_sin_token_devuelve_401(self, client):
        res = client.get("/api/documentos")
        assert res.status_code == 401

    def test_documento_inexistente_devuelve_404(self, client, auth_headers):
        res = client.get("/api/documentos/99999999", headers=auth_headers)
        assert res.status_code == 404

    def test_subir_archivo_con_formato_no_permitido_devuelve_400(self, client, auth_headers):
        archivo = ("virus.exe", io.BytesIO(b"MZ contenido binario"), "application/octet-stream")
        res = client.post("/api/documentos", headers=auth_headers, files={"file": archivo})
        assert res.status_code == 400
        assert "Formato no permitido" in res.json()["detail"]

    def test_resultado_de_documento_no_procesado_devuelve_404(self, client, auth_headers):
        res = client.get("/api/documentos/99999999/resultado", headers=auth_headers)
        assert res.status_code == 404

    def test_listar_plantillas_devuelve_lista(self, client, auth_headers):
        res = client.get("/api/documentos/plantillas", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)


class TestUsuarios:
    def test_listar_usuarios_como_admin_devuelve_lista(self, client, auth_headers):
        res = client.get("/api/usuarios/", headers=auth_headers)
        assert res.status_code == 200
        emails = [u["email"] for u in res.json()]
        assert ADMIN_EMAIL in emails

    def test_listar_usuarios_sin_token_devuelve_401(self, client):
        res = client.get("/api/usuarios/")
        assert res.status_code == 401
