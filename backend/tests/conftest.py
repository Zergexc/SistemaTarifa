"""Configuración compartida de las pruebas de integración y seguridad.

Las pruebas usan TestClient de FastAPI (la app corre en el propio proceso
de pytest, no requiere uvicorn levantado) contra la base de datos de desarrollo.
Requiere: usuario semilla admin@tarifaia.com (python -m app.db.seed).
"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402

ADMIN_EMAIL = "admin@tarifaia.com"
ADMIN_PASSWORD = "admin1234"


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def token_admin(client: TestClient) -> str:
    res = client.post(
        "/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert res.status_code == 200, "El usuario semilla no existe: ejecutar python -m app.db.seed"
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(token_admin: str) -> dict:
    return {"Authorization": f"Bearer {token_admin}"}
