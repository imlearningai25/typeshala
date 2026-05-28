"""
Seed script — populates languages, sample lessons, and an optional superuser.

Usage:
    python -m app.seed
    FIRST_SUPERUSER_EMAIL=admin@example.com FIRST_SUPERUSER_PASSWORD=Secret1! python -m app.seed
"""
from __future__ import annotations

import asyncio
import os

from sqlalchemy import select

from app.database import db_session
from app.models.language import DifficultyLevel, Language, Lesson
from app.models.user import User, UserRole
from app.core.security import hash_password

# ── Language seed data ─────────────────────────────────────────────────────────

LANGUAGES = [
    {
        "code": "en",
        "name": "English",
        "native_name": "English",
        "flag_emoji": "🇬🇧",
        "keyboard_layout": "qwerty",
        "direction": "ltr",
    },
    {
        "code": "ne",
        "name": "Nepali",
        "native_name": "नेपाली",
        "flag_emoji": "🇳🇵",
        "keyboard_layout": "romanized",
        "direction": "ltr",
    },
    {
        "code": "hi",
        "name": "Hindi",
        "native_name": "हिन्दी",
        "flag_emoji": "🇮🇳",
        "keyboard_layout": "inscript",
        "direction": "ltr",
    },
]

LESSONS: list[dict] = [
    # English — Beginner
    {
        "lang": "en",
        "title": "Home Row Basics",
        "description": "Master the home row keys: A S D F J K L ;",
        "content": "asdf jkl; asdf jkl; sad flask; jad flass; ask a sad lad; a flask falls",
        "difficulty": DifficultyLevel.BEGINNER,
        "order_index": 1,
    },
    {
        "lang": "en",
        "title": "Common Words",
        "description": "Practice the most common English words",
        "content": "the be to of and a in that have it for not on with he as you do at this but his by from they we",
        "difficulty": DifficultyLevel.BEGINNER,
        "order_index": 2,
    },
    {
        "lang": "en",
        "title": "Quick Brown Fox",
        "description": "Classic pangram covering all letters",
        "content": "the quick brown fox jumps over the lazy dog the quick brown fox jumps over the lazy dog",
        "difficulty": DifficultyLevel.BEGINNER,
        "order_index": 3,
    },
    # English — Intermediate
    {
        "lang": "en",
        "title": "Typing Speed Drill",
        "description": "High-frequency words for speed building",
        "content": "time year people way day man woman child world life hand part place case week company system program question government number night point home water room mother area money story fact month lot right study book eye job word business issue side kind head",
        "difficulty": DifficultyLevel.INTERMEDIATE,
        "order_index": 1,
    },
    {
        "lang": "en",
        "title": "Punctuation Practice",
        "description": "Commas, periods, apostrophes and more",
        "content": "Hello, world! It's a great day. Don't stop now; keep going. Are you ready? I think so. Let's begin: one, two, three.",
        "difficulty": DifficultyLevel.INTERMEDIATE,
        "order_index": 2,
    },
    # English — Advanced
    {
        "lang": "en",
        "title": "Code Snippet",
        "description": "Practice typing programming syntax",
        "content": "def fibonacci(n: int) -> int:\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)",
        "difficulty": DifficultyLevel.ADVANCED,
        "order_index": 1,
    },
    # Nepali — Beginner
    {
        "lang": "ne",
        "title": "Basic Romanized Nepali",
        "description": "Common Nepali words in romanized form",
        "content": "namaste nepal kathmandu pokhara chitwan lumbini janakpur biratnagar dharan",
        "difficulty": DifficultyLevel.BEGINNER,
        "order_index": 1,
    },
    # Hindi — Beginner
    {
        "lang": "hi",
        "title": "Basic Romanized Hindi",
        "description": "Common Hindi words in romanized form",
        "content": "namaste bharat delhi mumbai kolkata chennai bangalore hyderabad ahmedabad",
        "difficulty": DifficultyLevel.BEGINNER,
        "order_index": 1,
    },
]


async def seed() -> None:
    async with db_session() as session:
        print("Seeding languages...")
        lang_map: dict[str, Language] = {}
        for lang_data in LANGUAGES:
            result = await session.execute(
                select(Language).where(Language.code == lang_data["code"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                lang_map[lang_data["code"]] = existing
                print(f"  ✓ Language '{lang_data['code']}' already exists")
            else:
                lang = Language(**lang_data)
                session.add(lang)
                await session.flush()
                lang_map[lang_data["code"]] = lang
                print(f"  + Created language '{lang_data['code']}'")

        print("Seeding lessons...")
        for lesson_data in LESSONS:
            lang_code = lesson_data.pop("lang")
            lang = lang_map.get(lang_code)
            if not lang:
                print(f"  ✗ Language '{lang_code}' not found, skipping lesson")
                lesson_data["lang"] = lang_code
                continue
            result = await session.execute(
                select(Lesson).where(
                    Lesson.language_id == lang.id,
                    Lesson.title == lesson_data["title"],
                )
            )
            if result.scalar_one_or_none():
                print(f"  ✓ Lesson '{lesson_data['title']}' already exists")
                lesson_data["lang"] = lang_code
            else:
                lesson = Lesson(language_id=lang.id, **lesson_data)
                session.add(lesson)
                print(f"  + Created lesson '{lesson_data['title']}' [{lang_code}]")
                lesson_data["lang"] = lang_code

        # Optional superuser
        su_email = os.getenv("FIRST_SUPERUSER_EMAIL")
        su_password = os.getenv("FIRST_SUPERUSER_PASSWORD")
        su_username = os.getenv("FIRST_SUPERUSER_USERNAME", "admin")
        if su_email and su_password:
            print(f"Seeding superuser '{su_username}'...")
            result = await session.execute(
                select(User).where(User.email == su_email)
            )
            if result.scalar_one_or_none():
                print("  ✓ Superuser already exists")
            else:
                admin = User(
                    username=su_username,
                    email=su_email,
                    hashed_password=hash_password(su_password),
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True,
                )
                session.add(admin)
                print(f"  + Created superuser '{su_username}'")

        await session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
