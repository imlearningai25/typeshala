"""
UserRepository — all DB access for the User model.

Follows the repository pattern: no business logic, only CRUD and queries.
Services depend on this interface, making it easy to swap or mock in tests.
"""
from __future__ import annotations

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ── Reads ──────────────────────────────────────────────────────────────────

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self._db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._db.execute(
            select(User).where(func.lower(User.email) == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self._db.execute(
            select(User).where(func.lower(User.username) == username.lower())
        )
        return result.scalar_one_or_none()

    async def get_by_username_or_email(self, identifier: str) -> User | None:
        """Used during login — accept either username or email."""
        result = await self._db.execute(
            select(User).where(
                or_(
                    func.lower(User.username) == identifier.lower(),
                    func.lower(User.email) == identifier.lower(),
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_users(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
    ) -> tuple[list[User], int]:
        """Return paginated users with optional search."""
        query = select(User)
        if search:
            pattern = f"%{search.lower()}%"
            query = query.where(
                or_(
                    func.lower(User.username).like(pattern),
                    func.lower(User.email).like(pattern),
                )
            )

        # Total count
        count_q = select(func.count()).select_from(query.subquery())
        total: int = (await self._db.execute(count_q)).scalar_one()

        # Paginated results
        offset = (page - 1) * page_size
        query = query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
        users = (await self._db.execute(query)).scalars().all()

        return list(users), total

    async def email_exists(self, email: str) -> bool:
        result = await self._db.execute(
            select(func.count()).where(func.lower(User.email) == email.lower())
        )
        return (result.scalar_one() or 0) > 0

    async def username_exists(self, username: str) -> bool:
        result = await self._db.execute(
            select(func.count()).where(func.lower(User.username) == username.lower())
        )
        return (result.scalar_one() or 0) > 0

    # ── Writes ─────────────────────────────────────────────────────────────────

    async def create(
        self,
        *,
        username: str,
        email: str,
        hashed_password: str,
        full_name: str | None = None,
    ) -> User:
        user = User(
            username=username,
            email=email.lower(),
            hashed_password=hashed_password,
            full_name=full_name,
        )
        self._db.add(user)
        await self._db.flush()  # Get the generated ID without committing
        await self._db.refresh(user)
        return user

    async def update(self, user: User, **fields) -> User:
        for key, value in fields.items():
            setattr(user, key, value)
        await self._db.flush()
        await self._db.refresh(user)
        return user

    async def delete(self, user: User) -> None:
        await self._db.delete(user)
        await self._db.flush()
