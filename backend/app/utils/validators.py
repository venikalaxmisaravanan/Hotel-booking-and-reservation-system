"""
app/utils/validators.py
------------------------
Small, dependency-free helpers shared by route modules. Kept separate
from services so parsing/formatting concerns don't leak into business
logic (services only ever work with real `datetime` objects).
"""

from datetime import datetime


class ValidationError(Exception):
    """Raised when request data is malformed. Routes map this to HTTP 400."""


def parse_datetime(value: str, field_name: str = "datetime") -> datetime:
    """
    Parses an ISO-8601 string (as sent by an HTML <input type="datetime-local">
    or a JS `Date.toISOString()`) into a datetime object.
    Accepts both 'YYYY-MM-DDTHH:MM' and full ISO strings with seconds/offset.
    """
    if not value:
        raise ValidationError(f"'{field_name}' is required.")
    try:
        # datetime.fromisoformat handles 'YYYY-MM-DDTHH:MM[:SS[.ffffff]][+HH:MM]'
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise ValidationError(f"'{field_name}' must be a valid ISO-8601 datetime, got '{value}'.")


def require_fields(data: dict, *field_names: str) -> None:
    """Raises ValidationError listing every missing field at once."""
    missing = [name for name in field_names if not data.get(name)]
    if missing:
        raise ValidationError(f"Missing required field(s): {', '.join(missing)}.")
