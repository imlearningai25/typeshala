"""Initial schema — all tables

Revision ID: 0001
Revises:
Create Date: 2025-05-01 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.Column("username", sa.String(50), unique=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(100), nullable=True),
        sa.Column("avatar_url", sa.Text, nullable=True),
        sa.Column("role", sa.Enum("user", "admin", "moderator", name="userrole"), nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("total_xp", sa.Integer, nullable=False, server_default="0"),
        sa.Column("level", sa.Integer, nullable=False, server_default="1"),
        sa.Column("current_streak", sa.Integer, nullable=False, server_default="0"),
        sa.Column("longest_streak", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── languages ─────────────────────────────────────────────────────────────
    op.create_table(
        "languages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.Column("code", sa.String(10), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("native_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("flag_emoji", sa.String(10), nullable=True),
        sa.Column("keyboard_layout", sa.String(50), nullable=False, server_default="qwerty"),
        sa.Column("direction", sa.String(3), nullable=False, server_default="ltr"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_languages_code", "languages", ["code"], unique=True)

    # ── lessons ───────────────────────────────────────────────────────────────
    op.create_table(
        "lessons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.Column("language_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("languages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("difficulty", sa.Enum("beginner", "intermediate", "advanced", name="difficultylevel"), nullable=False, server_default="beginner"),
        sa.Column("order_index", sa.Integer, nullable=False, server_default="0"),
        sa.Column("time_limit_seconds", sa.Integer, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_lessons_language_id", "lessons", ["language_id"])

    # ── typing_sessions ───────────────────────────────────────────────────────
    op.create_table(
        "typing_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True),
        sa.Column("wpm", sa.Float, nullable=False, server_default="0"),
        sa.Column("accuracy", sa.Float, nullable=False, server_default="0"),
        sa.Column("consistency", sa.Float, nullable=False, server_default="100"),
        sa.Column("characters_per_minute", sa.Float, nullable=False, server_default="0"),
        sa.Column("duration_seconds", sa.Float, nullable=False),
        sa.Column("characters_typed", sa.Integer, nullable=False, server_default="0"),
        sa.Column("errors", sa.Integer, nullable=False, server_default="0"),
        sa.Column("xp_earned", sa.Integer, nullable=False, server_default="0"),
        sa.Column("details", postgresql.JSON, nullable=True),
    )
    op.create_index("ix_typing_sessions_user_id", "typing_sessions", ["user_id"])
    op.create_index("ix_typing_sessions_lesson_id", "typing_sessions", ["lesson_id"])

    # ── achievements ──────────────────────────────────────────────────────────
    op.create_table(
        "achievements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("icon", sa.String(100), nullable=False, server_default="🏅"),
        sa.Column("xp_reward", sa.Integer, nullable=False, server_default="0"),
        sa.Column("condition", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )
    op.create_index("ix_achievements_slug", "achievements", ["slug"], unique=True)

    # ── user_achievements ─────────────────────────────────────────────────────
    op.create_table(
        "user_achievements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("achievement_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )
    op.create_index("ix_user_achievements_user_id", "user_achievements", ["user_id"])

    # ── daily_challenges ──────────────────────────────────────────────────────
    op.create_table(
        "daily_challenges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.Column("challenge_date", sa.Date, unique=True, nullable=False),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_wpm", sa.Float, nullable=False),
        sa.Column("target_accuracy", sa.Float, nullable=False),
        sa.Column("xp_reward", sa.Integer, nullable=False, server_default="50"),
    )
    op.create_index("ix_daily_challenges_challenge_date", "daily_challenges", ["challenge_date"], unique=True)

    # ── leaderboard_entries ───────────────────────────────────────────────────
    op.create_table(
        "leaderboard_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("language_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("languages.id", ondelete="CASCADE"), nullable=True),
        sa.Column("period", sa.String(10), nullable=False),
        sa.Column("period_key", sa.String(20), nullable=False),
        sa.Column("wpm", sa.Float, nullable=False),
        sa.Column("accuracy", sa.Float, nullable=False),
        sa.Column("sessions", sa.Integer, nullable=False, server_default="1"),
        sa.UniqueConstraint("user_id", "period", "period_key", "language_id", name="uq_lb_entry"),
    )
    op.create_index("ix_leaderboard_entries_user_id", "leaderboard_entries", ["user_id"])
    op.create_index("ix_leaderboard_entries_language_id", "leaderboard_entries", ["language_id"])


def downgrade() -> None:
    op.drop_table("leaderboard_entries")
    op.drop_table("daily_challenges")
    op.drop_table("user_achievements")
    op.drop_table("achievements")
    op.drop_table("typing_sessions")
    op.drop_table("lessons")
    op.drop_table("languages")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS difficultylevel")
