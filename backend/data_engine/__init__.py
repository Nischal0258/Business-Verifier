"""Data engine package — parallelised company data fetching and summarization."""

from data_engine.engine import generate_full_report
from data_engine.student_score import calculate_student_trust_score

__all__ = ["generate_full_report", "calculate_student_trust_score"]
