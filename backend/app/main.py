from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, documentos, usuarios
from app.core.config import settings

app = FastAPI(
    title="TarifaIA API",
    version="0.1.0",
    description="API para procesamiento inteligente de tarifarios",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuarios"])
app.include_router(documentos.router, prefix="/api/documentos", tags=["Documentos"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "0.1.0"}
