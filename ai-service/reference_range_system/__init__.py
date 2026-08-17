"""
Reference Range System Submodule for MedExtract AI Service.
Provides 4-tier reference range priority lookup, demographic matching (sex/unit),
validation rules, item-level status evaluation, and overall report aggregation.
"""

from .engine import MedicalLabStatusEngine, normalize_sex, normalize_unit

__all__ = ["MedicalLabStatusEngine", "normalize_sex", "normalize_unit"]
