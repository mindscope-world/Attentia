"""ad link library

Revision ID: b4f8d2c61a90
Revises: 9d3c5a1e7b22
Create Date: 2026-11-27 00:00:01.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b4f8d2c61a90"
down_revision: Union[str, Sequence[str], None] = "9d3c5a1e7b22"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ad_links",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("youtube_id", sa.String(length=11), nullable=False),
        sa.Column("url", sa.String(length=200), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=True),
        sa.Column("channel_title", sa.String(length=200), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=300), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("category", sa.String(length=64), nullable=True),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("asset_id", sa.Uuid(), nullable=True),
        sa.Column("campaign_id", sa.Uuid(), nullable=True),
        sa.Column("decided_by", sa.Uuid(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["decided_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ad_links_youtube_id"), "ad_links", ["youtube_id"], unique=True)
    op.create_index(op.f("ix_ad_links_status"), "ad_links", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ad_links_status"), table_name="ad_links")
    op.drop_index(op.f("ix_ad_links_youtube_id"), table_name="ad_links")
    op.drop_table("ad_links")
