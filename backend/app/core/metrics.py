"""
Prometheus metrics for Typeshala.

Exposes:
  - Default HTTP metrics via prometheus-fastapi-instrumentator
  - typeshala_sessions_total        (counter)   — sessions submitted, labelled by language_code
  - typeshala_wpm_histogram         (histogram) — WPM distribution
  - typeshala_accuracy_histogram    (histogram) — accuracy distribution
  - typeshala_active_users_total    (gauge)     — distinct users with sessions in last 24h
"""
from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram
from prometheus_fastapi_instrumentator import Instrumentator

# ── Custom metrics ─────────────────────────────────────────────────────────────

sessions_counter = Counter(
    "typeshala_sessions_total",
    "Number of typing sessions submitted",
    labelnames=["language_code"],
)

wpm_histogram = Histogram(
    "typeshala_wpm",
    "WPM distribution across all sessions",
    buckets=[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200],
)

accuracy_histogram = Histogram(
    "typeshala_accuracy",
    "Accuracy distribution across all sessions",
    buckets=[50, 60, 70, 75, 80, 85, 90, 92, 95, 97, 99, 100],
)

active_users_gauge = Gauge(
    "typeshala_active_users",
    "Distinct users who submitted a session in the last 24 hours",
)

# ── Instrumentator factory ─────────────────────────────────────────────────────

def create_instrumentator() -> Instrumentator:
    """
    Returns a configured Instrumentator.
    Call instrumentator.instrument(app).expose(app) in main.py.
    The /metrics endpoint is only exposed in non-production environments
    by default; flip should_gzip=True if behind a proxy that handles gzip.
    """
    return Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_respect_env_var=False,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/metrics", "/api/v1/health"],
        inprogress_name="typeshala_http_requests_inprogress",
        inprogress_labels=True,
    )
