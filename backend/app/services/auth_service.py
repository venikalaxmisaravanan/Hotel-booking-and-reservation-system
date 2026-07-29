"""
app/services/auth_service.py
-----------------------------
Maps to the Login use case (Table 2.2) and the Register/Login/Logout
Functional Requirements. Encapsulates credential validation and JWT
issuance so routes stay thin (routes/auth_routes.py just parses the
request and calls these functions).
"""

import re

from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models.user import User


class AuthError(Exception):
    """Raised for registration/login failures. Routes map this to HTTP 400/401."""


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class AuthService:

    # ------------------------------------------------------------------
    # Register (Functional Requirements > Authentication > Registration)
    # ------------------------------------------------------------------
    @staticmethod
    def register(full_name: str, email: str, username: str, password: str, confirm_password: str) -> User:
        full_name = (full_name or "").strip()
        email = (email or "").strip().lower()
        username = (username or "").strip()

        if not full_name or not email or not username or not password:
            raise AuthError("All fields (full name, email, username, password) are required.")
        if not EMAIL_PATTERN.match(email):
            raise AuthError("Invalid email address.")
        if len(password) < 8:
            raise AuthError("Password must be at least 8 characters long.")
        if password != confirm_password:
            raise AuthError("Password and confirmation do not match.")

        if User.query.filter_by(email=email).first():
            raise AuthError("An account with this email already exists.")
        if User.query.filter_by(username=username).first():
            raise AuthError("This username is already taken.")

        user = User(full_name=full_name, email=email, username=username)
        user.set_password(password)

        db.session.add(user)
        db.session.commit()
        return user

    # ------------------------------------------------------------------
    # Login (Table 2.2: Use case description for Login)
    # ------------------------------------------------------------------
    @staticmethod
    def login(username: str, password: str) -> tuple[User, str]:
        username = (username or "").strip()
        user = User.query.filter_by(username=username).first()

        # Same error for "no such user" and "wrong password" -- avoids
        # leaking which usernames exist.
        if user is None or not user.check_password(password or ""):
            raise AuthError("Invalid username or password.")

        access_token = create_access_token(identity=str(user.user_id))
        return user, access_token

    # ------------------------------------------------------------------
    # Logout: with stateless JWTs, logout is a client-side action (the
    # SPA discards the token). Exposed here as a no-op hook in case a
    # token-blocklist is added later.
    # ------------------------------------------------------------------
    @staticmethod
    def logout() -> None:
        return None
