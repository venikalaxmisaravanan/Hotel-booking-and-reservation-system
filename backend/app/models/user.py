"""
app/models/user.py
-------------------
Maps to the OOAD "Guest" entity class (CRC Card: Guest) plus the fields
needed for Authentication (Register/Login/Logout) from the Functional
Requirements.

Passwords are never stored in plaintext: only a bcrypt hash is persisted,
generated/verified via app.extensions.bcrypt (Functional Requirements >
Authentication > "Passwords must be securely stored.").
"""

from app.extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # One guest can have many bookings (Guest 1 -- 0..* Reservation, per the
    # refined class diagram, Figure 3.7).
    bookings = db.relationship(
        "Booking", back_populates="user", cascade="all, delete-orphan"
    )

    # ------------------------------------------------------------------
    # Password handling (CRC responsibility: "Register Guest")
    # ------------------------------------------------------------------
    def set_password(self, raw_password: str) -> None:
        """Hash and store the given plaintext password."""
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    # ------------------------------------------------------------------
    def to_dict(self) -> dict:
        """Serialize for API responses. Never includes password_hash."""
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "email": self.email,
            "username": self.username,
        }

    def __repr__(self) -> str:
        return f"<User {self.username}>"
