# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
"""Initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-01-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:

    bind = op.get_bind()

    # ---------- ENUM TYPES ----------

    user_role = postgresql.ENUM(
        "bank",
        "corporate",
        "auditor",
        "admin",
        name="user_role",
        create_type=False,
    )
    user_role.create(bind, checkfirst=True)

    document_type = postgresql.ENUM(
        "LOC",
        "INVOICE",
        "BILL_OF_LADING",
        "PO",
        "COO",
        "INSURANCE_CERT",
        name="document_type",
        create_type=False,
    )
    document_type.create(bind, checkfirst=True)

    ledger_action = postgresql.ENUM(
        "ISSUED",
        "AMENDED",
        "SHIPPED",
        "RECEIVED",
        "PAID",
        "CANCELLED",
        "VERIFIED",
        name="ledger_action",
        create_type=False,
    )
    ledger_action.create(bind, checkfirst=True)

    trade_status = postgresql.ENUM(
        "pending",
        "in_progress",
        "completed",
        "disputed",
        "paid",
        name="trade_status",
        create_type=False,
    )
    trade_status.create(bind, checkfirst=True)

    # ---------- USERS TABLE ----------

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("org_name", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )

    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_org_name", "users", ["org_name"])

    # ---------- DOCUMENTS TABLE ----------

    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("doc_type", document_type, nullable=False),
        sa.Column("doc_number", sa.String(100), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column("hash", sa.String(64), nullable=False),
        sa.Column("issued_at", sa.TIMESTAMP(), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_index("ix_documents_owner_id", "documents", ["owner_id"])
    op.create_index("ix_documents_doc_type", "documents", ["doc_type"])
    op.create_index("ix_documents_created_at", "documents", ["created_at"])

    # ---------- LEDGER TABLE ----------

    op.create_table(
        "ledger_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("action", ledger_action, nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_index("ix_ledger_document_id", "ledger_entries", ["document_id"])
    op.create_index("ix_ledger_created_at", "ledger_entries", ["created_at"])

    # ---------- TRADE TABLE ----------

    op.create_table(
        "trade_transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("buyer_id", sa.Integer(), nullable=False),
        sa.Column("seller_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("status", trade_status, nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_index("ix_trades_buyer_id", "trade_transactions", ["buyer_id"])
    op.create_index("ix_trades_seller_id", "trade_transactions", ["seller_id"])
    op.create_index("ix_trades_status", "trade_transactions", ["status"])

    # ---------- RISK SCORES ----------

    op.create_table(
        "risk_scores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False, unique=True),
        sa.Column("score", sa.Numeric(5, 2), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column(
            "last_updated",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint("score >= 0 AND score <= 100", name="score_range_check"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_index("ix_risk_score", "risk_scores", ["score"])

    # ---------- AUDIT LOGS ----------

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("admin_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column(
            "timestamp",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["admin_id"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_index("ix_audit_admin_id", "audit_logs", ["admin_id"])
    op.create_index("ix_audit_timestamp", "audit_logs", ["timestamp"])


def downgrade() -> None:

    bind = op.get_bind()

    op.drop_table("audit_logs")
    op.drop_table("risk_scores")
    op.drop_table("trade_transactions")
    op.drop_table("ledger_entries")
    op.drop_table("documents")
    op.drop_table("users")

    postgresql.ENUM(name="trade_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="ledger_action").drop(bind, checkfirst=True)
    postgresql.ENUM(name="document_type").drop(bind, checkfirst=True)
    postgresql.ENUM(name="user_role").drop(bind, checkfirst=True)
