"""
Unit tests for the typing metrics computation functions.
No DB or Redis required.
"""
from __future__ import annotations

import pytest
from app.services.session import compute_accuracy, compute_cpm, compute_wpm, compute_consistency


class TestComputeWpm:
    def test_standard_case(self):
        # 300 chars in 60s → (300/5) / 1 min = 60 WPM
        assert compute_wpm(300, 60.0) == 60.0

    def test_zero_duration(self):
        assert compute_wpm(100, 0) == 0.0

    def test_fast_typist(self):
        # 600 chars in 60s → 120 WPM
        assert compute_wpm(600, 60.0) == 120.0

    def test_short_duration(self):
        # 50 chars in 30s → (50/5) / 0.5 min = 20 WPM
        assert compute_wpm(50, 30.0) == 20.0


class TestComputeAccuracy:
    def test_perfect(self):
        assert compute_accuracy(100, 0) == 100.0

    def test_zero_typed(self):
        assert compute_accuracy(0, 0) == 100.0

    def test_half_errors(self):
        # 50 errors out of 100 → 50% accuracy
        assert compute_accuracy(100, 50) == 50.0

    def test_all_errors(self):
        assert compute_accuracy(50, 50) == 0.0

    def test_rounding(self):
        # 1 error out of 3 → 66.7%
        result = compute_accuracy(3, 1)
        assert abs(result - 66.7) < 0.1


class TestComputeCpm:
    def test_standard(self):
        # 300 chars in 60s → 300 CPM
        assert compute_cpm(300, 60.0) == 300.0

    def test_zero_duration(self):
        assert compute_cpm(100, 0) == 0.0


class TestComputeConsistency:
    def test_no_keystrokes(self):
        assert compute_consistency(None, 60.0) == 100.0

    def test_too_few_keystrokes(self):
        assert compute_consistency([], 60.0) == 100.0

    def test_returns_0_to_100(self):
        # Build fake keystrokes with varying gaps (inconsistent)
        from app.schemas.session import KeystrokeEvent
        keystrokes = []
        base = 0
        # First burst: fast
        for i in range(10):
            keystrokes.append(KeystrokeEvent(
                timestamp_ms=base + i * 100, expected="a", actual="a", correct=True
            ))
        # Gap: slow
        base += 6000
        for i in range(10):
            keystrokes.append(KeystrokeEvent(
                timestamp_ms=base + i * 1000, expected="a", actual="a", correct=True
            ))
        result = compute_consistency(keystrokes, 60.0)
        assert 0.0 <= result <= 100.0
