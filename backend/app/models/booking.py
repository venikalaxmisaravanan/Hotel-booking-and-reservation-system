"""
app/models/booking.class.py -> app/models/booking.py
------------------------------------------------------
Maps to the OOAD "Reservation" entity class (CRC Card: Reservation).

Supports Time-Based Booking and Partial Duration Booking (Functional
Requirements) by storing `start_time` / `end_time` as full DateTime
values rather than only a date -- two bookings on the same
`booking_date` but different hours are treated as non-overlapping.
"""

from datetime import datetime

from app.extensions import db


class Booking(db.Model):
    __tablename__ = "bookings"

    booking_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.room_id"), nullable=False)

    booking_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)

    # One of Config.BOOKING_STATUSES: Pending / Confirmed / CheckedIn /
    # Extended / Completed / Cancelled.
    booking_status = db.Column(db.String(20), nullable=False, default="Pending")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships (back_populates keeps both sides of Guest<->Reservation
    # and Room<->Reservation in sync automatically).
    user = db.relationship("User", back_populates="bookings")
    room = db.relationship("Room", back_populates="bookings")

    # ------------------------------------------------------------------
    def duration_hours(self) -> float:
        """Used by PricingPolicy-equivalent logic and the UI summary."""
        delta = self.end_time - self.start_time
        return round(delta.total_seconds() / 3600, 2)

    def overlaps(self, other_start: datetime, other_end: datetime) -> bool:
        """True if [other_start, other_end) intersects this booking's window."""
        return self.start_time < other_end and self.end_time > other_start

    # ------------------------------------------------------------------
    def to_dict(self) -> dict:
        return {
            "booking_id": self.booking_id,
            "user_id": self.user_id,
            "room_id": self.room_id,
            "room_number": self.room.room_number if self.room else None,
            "room_type": self.room.room_type if self.room else None,
            "room_state": self.room.room_state if self.room else None,
            "guest": self.user.to_dict() if self.user else None,
            "booking_date": self.booking_date.isoformat(),
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "booking_status": self.booking_status,
            "duration_hours": self.duration_hours(),
        }

    def __repr__(self) -> str:
        return f"<Booking {self.booking_id} room={self.room_id} status={self.booking_status}>"
