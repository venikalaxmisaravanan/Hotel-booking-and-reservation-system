"""
app/config.py
---------------
Centralized configuration for the Hotel Booking and Reservation System.

Keeping configuration in one class (rather than scattering constants across
the codebase) makes the app easier to reconfigure for testing vs. production
and keeps secrets out of business-logic modules.
"""

import os
from datetime import timedelta

# Absolute path to the backend/ directory so the SQLite file location is
# stable no matter where the app is launched from.
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class Config:
    """Base configuration shared by all environments."""

    # --- Core Flask ---
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

    # --- Database ---
    # SQLite file lives in backend/instance/hotel.db
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'hotel.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Auth / JWT ---
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    # --- CORS ---
    # The React dev server runs on a different port, so the frontend origin
    # must be explicitly allowed to call the API with credentials/headers.
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

    # --- Domain constants (from the OOAD Functional Requirements) ---
    # The dashboard always shows exactly these 10 rooms (Functional
    # Requirements > Dashboard). Used by seed.py to initialize the database.
    ROOM_NUMBERS = [101, 102, 103, 104, 105, 201, 202, 203, 204, 205]

    ROOM_TYPES = ["Standard King", "Deluxe Suite", "Deluxe Twin", "Premier Suite"]

    # Valid room states and the only transitions allowed between them.
    # Enforced centrally in services/booking_service.py so no route or
    # model can silently create an invalid state.
    ROOM_STATES = [
        "Available",
        "Reserved",
        "Occupied",
        "Extended",
        "Released",
        "Cleaning",
    ]

    BOOKING_STATUSES = [
        "Pending",     # created, awaiting payment
        "Confirmed",   # payment successful -> room Reserved
        "CheckedIn",   # room Occupied
        "Extended",    # room Extended
        "Completed",   # released + cleaned -> room Available again
        "Cancelled",
    ]


class TestingConfig(Config):
    """In-memory database for fast, isolated automated tests."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
