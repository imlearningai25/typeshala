"""
Import all models here so Alembic's autogenerate can discover them.
"""
from app.models.base import Base  # noqa: F401
from app.models.gamification import (  # noqa: F401
    Achievement,
    DailyChallenge,
    LeaderboardEntry,
    UserAchievement,
)
from app.models.language import Language, Lesson  # noqa: F401
from app.models.session import TypingSession  # noqa: F401
from app.models.user import User  # noqa: F401