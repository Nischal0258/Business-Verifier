# Optional CrewAI imports
try:
    from .config import AgentConfig
    from .crew import build_student_report_crew, build_comparator_crew, build_conversational_crew

    __all__ = [
        "AgentConfig",
        "build_student_report_crew",
        "build_comparator_crew",
        "build_conversational_crew",
    ]
except ImportError:
    __all__ = []
