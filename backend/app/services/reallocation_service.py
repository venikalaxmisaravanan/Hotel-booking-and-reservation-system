"""
app/services/reallocation_service.py
-------------------------------------
Maps to the OOAD "RoomAllocation" control class handling the Extend Stay
and Reallocate Room use cases (Sequence Diagram 3.10, Activity Diagram
3.19, State Chart 3.25).

Functional Requirements covered:
  - Stay Extension: request extension, check conflicts, approve if
    available -> Occupied -> Extended.
  - Automatic Room Reallocation: if extension cannot be approved,
    detect the conflict, find an available room, recommend it, and let
    an administrator reallocate the booking to it.
"""

from datetime import datetime

from app.extensions import db
from app.models.room import Room
from app.models.booking import Booking
from app.services.booking_service import BookingService, BookingError


class ReallocationService:

    # ------------------------------------------------------------------
    # Stay Extension (Functional Requirements > Stay Extension)
    # ------------------------------------------------------------------
    @staticmethod
    def request_extension(booking_id: int, new_end_time: datetime) -> Booking:
        """
        Attempts to extend a currently occupied booking's end_time.

        On success:   Occupied -> Extended, booking.end_time updated.
        On conflict:   raises BookingError -- the caller (route) should
                       then call recommend_alternate_room() to offer the
                       guest/admin a substitute room instead of just
                       failing silently.
        """
        booking = Booking.query.get(booking_id)
        if booking is None:
            raise BookingError(f"Booking {booking_id} does not exist.")
        if booking.booking_status not in ("CheckedIn", "Extended"):
            raise BookingError("Only a currently occupied stay can be extended.")
        if new_end_time <= booking.end_time:
            raise BookingError("New end_time must be later than the current end_time.")

        # Check the room for conflicts only in the *additional* window
        # (current end_time -> new end_time), excluding this booking itself.
        is_free = BookingService.check_availability(
            booking.room_id, booking.end_time, new_end_time,
            exclude_booking_id=booking.booking_id,
        )
        if not is_free:
            raise BookingError(
                "Extension conflicts with another reservation on this room. "
                "Call recommend_alternate_room() to find a substitute room."
            )

        if booking.booking_status == "CheckedIn":
            BookingService._transition_room(booking.room, "Extended")
        booking.booking_status = "Extended"
        booking.end_time = new_end_time
        db.session.commit()
        return booking

    # ------------------------------------------------------------------
    # Automatic Room Reallocation (Functional Requirements >
    # Automatic Room Reallocation)
    # ------------------------------------------------------------------
    @staticmethod
    def recommend_alternate_room(booking_id: int, new_end_time: datetime) -> Room | None:
        """
        Detects a conflict and finds an available room of the same type
        that is free for [booking.start_time, new_end_time), i.e. a room
        that could host the guest's *entire* stay if reallocated.
        Returns None if no substitute is currently available.
        """
        booking = Booking.query.get(booking_id)
        if booking is None:
            raise BookingError(f"Booking {booking_id} does not exist.")

        candidates = Room.query.filter(
            Room.room_type == booking.room.room_type,
            Room.room_id != booking.room_id,
            Room.room_state == "Available",
        ).all()

        for room in candidates:
            if room.is_available_for(booking.start_time, new_end_time):
                return room
        return None

    @staticmethod
    def reallocate_booking(booking_id: int, new_room_id: int, new_end_time: datetime = None) -> Booking:
        """
        Administrator-approved move of an in-progress booking to a
        different room (CRC: RoomAllocation -> "Notify Booking Manager").

        This is an authorized override of the normal state machine: the
        old room is released for cleaning, and the new room is put
        directly into 'Occupied' because the guest is already staying
        (there is no new "Reserved" hold period for a mid-stay move).
        """
        booking = Booking.query.get(booking_id)
        if booking is None:
            raise BookingError(f"Booking {booking_id} does not exist.")
        if booking.booking_status not in ("CheckedIn", "Extended"):
            raise BookingError("Only a currently occupied booking can be reallocated.")

        new_room = Room.query.get(new_room_id)
        if new_room is None:
            raise BookingError(f"Room {new_room_id} does not exist.")
        if new_room.room_state != "Available":
            raise BookingError(f"Room {new_room.room_number} is not Available for reallocation.")

        effective_end = new_end_time or booking.end_time
        if not new_room.is_available_for(booking.start_time, effective_end):
            raise BookingError(f"Room {new_room.room_number} cannot cover the full requested stay window.")

        old_room = booking.room

        # Release + send the vacated room to Cleaning.
        BookingService._transition_room(old_room, "Released")
        BookingService._transition_room(old_room, "Cleaning")

        # Move the guest into the new room immediately (administrative
        # override -- see docstring).
        new_room.set_state("Occupied")

        booking.room_id = new_room.room_id
        booking.end_time = effective_end
        booking.booking_status = "CheckedIn" if new_end_time is None else "Extended"

        db.session.commit()
        return booking
