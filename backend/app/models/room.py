"""
app/models/room.py
-------------------
Maps to the OOAD "Room" entity class (CRC Card: Room). Implements the
Room State Lifecycle from the Functional Requirements:

    Available -> Reserved -> Occupied -> Extended -> Released -> Cleaning -> Available

`room_state` is validated against Config.ROOM_STATES at the point of
transition (see services/booking_service.py) rather than left as free
text, so an invalid state can never be written to the database.
"""

from app.extensions import db


class Room(db.Model):
    __tablename__ = "rooms"

    room_id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.Integer, unique=True, nullable=False, index=True)
    room_type = db.Column(db.String(50), nullable=False)
    room_state = db.Column(db.String(20), nullable=False, default="Available")

    # Room 1 -- 0..* Reservation (refined class diagram, Figure 3.7)
    bookings = db.relationship(
        "Booking", back_populates="room", cascade="all, delete-orphan"
    )

    # ------------------------------------------------------------------
    # CRC responsibility: "Update Status"
    # ------------------------------------------------------------------
    def set_state(self, new_state: str) -> None:
        """
        Directly assign a new room state. Callers are expected to have
        already validated the transition is legal (see
        BookingService.TRANSITIONS) -- this method only guards against
        completely unknown state strings reaching the database.
        """
        from flask import current_app

        valid_states = current_app.config["ROOM_STATES"]
        if new_state not in valid_states:
            raise ValueError(f"'{new_state}' is not a valid room state. Must be one of {valid_states}")
        self.room_state = new_state

    def is_available_for(self, requested_start, requested_end, exclude_booking_id=None) -> bool:
        """
        CRC responsibility: "Check Availability".
        Returns True if no *active* booking on this room overlaps the
        requested [start, end) time window. Used by AvailabilityService
        to detect overlapping bookings before confirming a booking
        (Functional Requirements > Check Availability).
        """
        from app.models.booking import Booking

        active_statuses = ("Pending", "Confirmed", "CheckedIn", "Extended")
        query = Booking.query.filter(
            Booking.room_id == self.room_id,
            Booking.booking_status.in_(active_statuses),
            Booking.start_time < requested_end,
            Booking.end_time > requested_start,
        )
        if exclude_booking_id is not None:
            query = query.filter(Booking.booking_id != exclude_booking_id)

        return query.first() is None

    # ------------------------------------------------------------------
    def to_dict(self) -> dict:
        return {
            "room_id": self.room_id,
            "room_number": self.room_number,
            "room_type": self.room_type,
            "room_state": self.room_state,
        }

    def __repr__(self) -> str:
        return f"<Room {self.room_number} [{self.room_state}]>"
