"""
Compatibility module re-exporting MedicalLabStatusEngine from reference_range_system package.
"""

from reference_range_system.engine import MedicalLabStatusEngine, normalize_sex, normalize_unit

__all__ = ["MedicalLabStatusEngine", "normalize_sex", "normalize_unit"]
