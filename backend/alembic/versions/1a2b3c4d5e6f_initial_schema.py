"""initial schema

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1a2b3c4d5e6f"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id_usuario", sa.Integer(), primary_key=True, index=True),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("apellido", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("rol", sa.String(length=50), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_registro", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_usuarios_email"), "usuarios", ["email"], unique=True)

    op.create_table(
        "tipos_documento",
        sa.Column("id_tipo_documento", sa.Integer(), primary_key=True),
        sa.Column("descripcion", sa.String(length=50), nullable=False),
        sa.UniqueConstraint("descripcion"),
    )

    op.create_table(
        "estados_documento",
        sa.Column("id_estado_documento", sa.Integer(), primary_key=True),
        sa.Column("descripcion", sa.String(length=50), nullable=False),
        sa.UniqueConstraint("descripcion"),
    )

    op.create_table(
        "estados_plantilla",
        sa.Column("id_estado_plantilla", sa.Integer(), primary_key=True),
        sa.Column("descripcion", sa.String(length=50), nullable=False),
        sa.UniqueConstraint("descripcion"),
    )

    op.create_table(
        "documentos",
        sa.Column("id_documento", sa.Integer(), primary_key=True),
        sa.Column("id_usuario", sa.Integer(), sa.ForeignKey("usuarios.id_usuario"), nullable=False),
        sa.Column("id_tipo_documento", sa.Integer(), sa.ForeignKey("tipos_documento.id_tipo_documento"), nullable=False),
        sa.Column("id_estado_documento", sa.Integer(), sa.ForeignKey("estados_documento.id_estado_documento"), nullable=False),
        sa.Column("nombre_archivo", sa.String(length=255), nullable=False),
        sa.Column("ruta_almacenamiento", sa.String(length=500), nullable=False),
        sa.Column("tamano_bytes", sa.Integer(), nullable=False),
        sa.Column("fecha_carga", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_documentos_id_documento"), "documentos", ["id_documento"], unique=False)

    op.create_table(
        "resultados_extraccion",
        sa.Column("id_resultado", sa.Integer(), primary_key=True),
        sa.Column("id_documento", sa.Integer(), sa.ForeignKey("documentos.id_documento"), nullable=False),
        sa.Column("texto_extraido", sa.Text(), nullable=True),
        sa.Column("json_ia", sa.JSON(), nullable=True),
        sa.Column("json_editado", sa.JSON(), nullable=True),
        sa.Column("modelo_ia_usado", sa.String(length=100), nullable=True),
        sa.Column("tokens_entrada", sa.Integer(), nullable=True),
        sa.Column("tokens_salida", sa.Integer(), nullable=True),
        sa.Column("nivel_confianza", sa.Float(), nullable=True),
        sa.Column("numero_iteracion", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("fecha_generacion", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_resultados_extraccion_id_resultado"), "resultados_extraccion", ["id_resultado"], unique=False)

    op.create_table(
        "plantillas_generadas",
        sa.Column("id_plantilla", sa.Integer(), primary_key=True),
        sa.Column("id_resultado", sa.Integer(), sa.ForeignKey("resultados_extraccion.id_resultado"), nullable=False),
        sa.Column("id_estado_plantilla", sa.Integer(), sa.ForeignKey("estados_plantilla.id_estado_plantilla"), nullable=False),
        sa.Column("id_plantilla_padre", sa.Integer(), sa.ForeignKey("plantillas_generadas.id_plantilla"), nullable=True),
        sa.Column("nombre_archivo", sa.String(length=255), nullable=False),
        sa.Column("ruta_almacenamiento", sa.String(length=500), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("fecha_generacion", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_plantillas_generadas_id_plantilla"), "plantillas_generadas", ["id_plantilla"], unique=False)

    op.create_table(
        "historial_prompts",
        sa.Column("id_prompt", sa.Integer(), primary_key=True),
        sa.Column("id_documento", sa.Integer(), sa.ForeignKey("documentos.id_documento"), nullable=False),
        sa.Column("id_resultado", sa.Integer(), sa.ForeignKey("resultados_extraccion.id_resultado"), nullable=False),
        sa.Column("texto_prompt", sa.Text(), nullable=False),
        sa.Column("id_usuario", sa.Integer(), sa.ForeignKey("usuarios.id_usuario"), nullable=False),
        sa.Column("fecha_envio", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_historial_prompts_id_prompt"), "historial_prompts", ["id_prompt"], unique=False)

    op.create_table(
        "errores_detectados",
        sa.Column("id_error", sa.Integer(), primary_key=True),
        sa.Column("id_resultado", sa.Integer(), sa.ForeignKey("resultados_extraccion.id_resultado"), nullable=False),
        sa.Column("tipo_error", sa.String(length=100), nullable=False),
        sa.Column("campo_afectado", sa.String(length=100), nullable=True),
        sa.Column("valor_detectado", sa.String(length=500), nullable=True),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("severidad", sa.String(length=20), nullable=False),
        sa.Column("resuelto", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("resuelto_por", sa.Integer(), sa.ForeignKey("usuarios.id_usuario"), nullable=True),
        sa.Column("metodo_resolucion", sa.String(length=50), nullable=True),
        sa.Column("fecha_resolucion", sa.DateTime(), nullable=True),
    )
    op.create_index(op.f("ix_errores_detectados_id_error"), "errores_detectados", ["id_error"], unique=False)

    op.create_table(
        "revisiones",
        sa.Column("id_revision", sa.Integer(), primary_key=True),
        sa.Column("id_plantilla", sa.Integer(), sa.ForeignKey("plantillas_generadas.id_plantilla"), nullable=False),
        sa.Column("id_usuario", sa.Integer(), sa.ForeignKey("usuarios.id_usuario"), nullable=False),
        sa.Column("comentario", sa.Text(), nullable=True),
        sa.Column("decision", sa.String(length=20), nullable=False),
        sa.Column("fecha_revision", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_revisiones_id_revision"), "revisiones", ["id_revision"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_revisiones_id_revision"), table_name="revisiones")
    op.drop_table("revisiones")
    op.drop_index(op.f("ix_errores_detectados_id_error"), table_name="errores_detectados")
    op.drop_table("errores_detectados")
    op.drop_index(op.f("ix_historial_prompts_id_prompt"), table_name="historial_prompts")
    op.drop_table("historial_prompts")
    op.drop_index(op.f("ix_plantillas_generadas_id_plantilla"), table_name="plantillas_generadas")
    op.drop_table("plantillas_generadas")
    op.drop_index(op.f("ix_resultados_extraccion_id_resultado"), table_name="resultados_extraccion")
    op.drop_table("resultados_extraccion")
    op.drop_index(op.f("ix_documentos_id_documento"), table_name="documentos")
    op.drop_table("documentos")
    op.drop_table("estados_plantilla")
    op.drop_table("estados_documento")
    op.drop_table("tipos_documento")
    op.drop_index(op.f("ix_usuarios_email"), table_name="usuarios")
    op.drop_table("usuarios")
