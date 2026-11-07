"""youtube-hosted assets

Revision ID: 7b1e2f9a4c10
Revises: c36a3a3c1d40
Create Date: 2026-11-07 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "7b1e2f9a4c10"
down_revision: Union[str, Sequence[str], None] = "c36a3a3c1d40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE asset_kind ADD VALUE IF NOT EXISTS 'youtube'")
    op.add_column("assets", sa.Column("youtube_id", sa.String(length=11), nullable=True))
    op.add_column("assets", sa.Column("title", sa.String(length=300), nullable=True))
    op.create_index(op.f("ix_assets_youtube_id"), "assets", ["youtube_id"], unique=False)


def downgrade() -> None:
    op.execute("DELETE FROM assets WHERE kind = 'youtube'")
    op.drop_index(op.f("ix_assets_youtube_id"), table_name="assets")
    op.drop_column("assets", "title")
    op.drop_column("assets", "youtube_id")
    # Postgres cannot drop a single enum value; rebuild the type without it.
    op.execute("ALTER TYPE asset_kind RENAME TO asset_kind_old")
    op.execute("CREATE TYPE asset_kind AS ENUM ('video', 'image')")
    op.execute("ALTER TABLE assets ALTER COLUMN kind TYPE asset_kind USING kind::text::asset_kind")
    op.execute("DROP TYPE asset_kind_old")
