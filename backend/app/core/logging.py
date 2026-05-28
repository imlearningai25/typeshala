"""
Structured logging setup using Python's stdlib logging + JSON formatter.
"""
from __future__ import annotations

import logging
import sys
from typing import Any

from app.config import settings


class _JSONFormatter(logging.Formatter):
    """Emit log records as single-line JSON strings (production-friendly)."""

    def format(self, record: logging.LogRecord) -> str:
        import json

        log: dict[str, Any] = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
        }
        if record.exc_info:
            log["exc_info"] = self.formatException(record.exc_info)
        # Merge any extra fields passed via logger.info("msg", extra={...})
        for key, value in record.__dict__.items():
            if key not in {
                "args", "asctime", "created", "exc_info", "exc_text",
                "filename", "funcName", "id", "levelname", "levelno",
                "lineno", "module", "msecs", "message", "msg", "name",
                "pathname", "process", "processName", "relativeCreated",
                "stack_info", "thread", "threadName",
            }:
                log[key] = value
        return json.dumps(log, ensure_ascii=False)


def configure_logging() -> None:
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    handler = logging.StreamHandler(sys.stdout)

    if settings.ENVIRONMENT == "development":
        handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"))
    else:
        handler.setFormatter(_JSONFormatter())

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]

    # Quieten noisy libraries
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
