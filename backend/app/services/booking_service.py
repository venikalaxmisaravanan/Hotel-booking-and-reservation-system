"""
app/services/booking_service.py
--------------------------------
Maps to the OOAD "BookingManager" + "RoomAllocation" control classes
(CRC Cards: BookingManager, RoomAllocation). All room-state transitions
are centralized here, in ONE place, so no route or model can push the
system into an invalid state.

Room State Lifecycle (Functional Requirements):
    Available -> Reserved -> Occupied -> Extended -> Released -> Cleaning -> Available

This module only handles the "normal path" operations: availability
checking, booking creation, payment confirmation, check-in, early
checkout, and cancellation. Stay-extension conflict handling and
automatic room reallocation live in services/reallocation_service.py,
since that logic is a distinct CRC responsibility (RoomAllocation ->
"Notify Booking Manager") built on top of these primitives.
"""

from datetime import datetime

from app.extensions import db
from app.models.room import Room
from app.models.booking import Booking


class BookingError(Exception):
    """Raised for any business-rule violation (invalid transition,
    overlapping booking, etc.). Routes catch this and return HTTP 400."""


class BookingService:

    # Legal room-state transitions. Any transition not listed here is
    # rejected by _transition_room(), regardless of what a caller asks for.
    TRANSITIONS = {
        "Available": {"Reserved", "Occupied"},          # Occupied: check-in of a
                                                          # booking that was queued
                                                          # while the room was busy
                                                          # with an earlier stay
        "Reserved": {"Occupied", "Available"},       # Available = cancellation
        "Occupied": {"Extended", "Released"},
        "Extended": {"Released"},
        "Released": {"Cleaning"},
        "Cleaning": {"Available"},
    }

    # ------------------------------------------------------------------
    # Availability / conflict detection
    # (CRC: Room -> "Check Availability", Reservation -> "Check room
    # Availability")
    # ------------------------------------------------------------------
    @staticmethod
    def check_availability(room_id: int, start_time: datetime, end_time: datetime,
                            exclude_booking_id: int = None) -> bool:
        if end_time <= start_time:
            raise BookingError("end_time must be after start_time.")

        room = Room.query.get(room_id)
        if room is None:
            raise BookingError(f"Room {room_id} does not exist.")

        return room.is_available_for(start_time, end_time, exclude_booking_id)

    @staticmethod
    def find_available_rooms(start_time: datetime, end_time: datetime, room_type: str = None):
        """Used by Search Room (Functional Requirements > Search Room)."""
        query = Room.query
        if room_type:
            query = query.filter(Room.room_type == room_type)

        return [
            room for room in query.all()
            if room.is_available_for(start_time, end_time)
        ]

    # ------------------------------------------------------------------
    # Internal: the single choke point for every room-state change.
    # ------------------------------------------------------------------
    @staticmethod
    def _transition_room(room: Room, new_state: str) -> None:
        allowed = BookingService.TRANSITIONS.get(room.room_state, set())
        if new_state not in allowed:
            raise BookingError(
                f"Cannot transition room {room.room_number} from "
                f"'{room.room_state}' to '{new_state}'."
            )
        room.set_state(new_state)

    # ------------------------------------------------------------------
    # Book Room (Functional Requirements > Book Room)
    # Successful booking: Available -> Reserved
    #
    # Availability is decided purely by time-window overlap against other
    # bookings on this room (check_availability), NOT by the room's
    # current live state. This matters: a room that is currently
    # 'Occupied' by an earlier, non-overlapping stay must still be
    # bookable for a later time slot -- otherwise two future reservations
    # could never coexist on the same room, and the Stay Extension /
    # Automatic Room Reallocation scenario (an extension request runs
    # into an *already-booked* later reservation) could never arise.
    # ------------------------------------------------------------------
    @staticmethod
    def create_booking(user_id: int, room_id: int, start_time: datetime, end_time: datetime) -> Booking:
        if not BookingService.check_availability(room_id, start_time, end_time):
            raise BookingError("Room is not available for the requested time window "
                                "(overlapping booking detected).")

        room = Room.query.get(room_id)
        if room is None:
            raise BookingError(f"Room {room_id} does not exist.")

        booking = Booking(
            user_id=user_id,
            room_id=room_id,
            booking_date=start_time.date(),
            start_time=start_time,
            end_time=end_time,
            booking_status="Pending",
        )
        # Only change the room's *current* displayed state if it's sitting
        # Available right now. If it's Occupied/Extended/Reserved/Cleaning
        # already, that reflects an earlier stay still in progress -- this
        # new booking is queued for later and must not overwrite it.
        if room.room_state == "Available":
            BookingService._transition_room(room, "Reserved")

        db.session.add(booking)
        db.session.commit()
        return booking

    # ------------------------------------------------------------------
    # Dummy Payment (Functional Requirements > Dummy Payment)
    # ------------------------------------------------------------------
    @staticmethod
    def confirm_payment(booking_id: int) -> Booking:
        booking = Booking.query.get(booking_id)
        if booking is None:
            raise BookingError(f"Booking {booking_id} does not exist.")
        if booking.booking_status != "Pending":
            raise BookingError(f"Booking {booking_id} is '{booking.booking_status}', cannot pay again.")

        # Simulated payment always "succeeds" -- no real gateway is involved.
        booking.booking_status = "Confirmed"
        db.session.commit()
        return booking

    # ------------------------------------------------------------------
    # Check-In (Functional Requirements > Check-In): Reserved -> Occupied
    # ------------------------------------------------------------------
    @staticmethod
    def check_in(booking_id: int) -> Booking:
        booking = Booking.query.get(booking_id)
        if booking is None:
            raise BookingError(f"Booking {booking_id} does not exist.")
        if booking.booking_status != "Confirmed":
            raise BookingError("Booking must be Confirmed (paid) before check-in.")

        BookingService._transition_room(booking.room, "Occupied")
        booking.booking_status = "CheckedIn"
        db.session.commit()
        return booking

    # ------------------------------------------------------------------
    # Early Checkout (Functional Requirements > Early Checkout):
    # Occupied/Extended -> Released -> Cleaning -> Available
    # Implemented as one atomic call; Admin can later call
    # mark_cleaning_complete() to separate Cleaning -> Available if the
    # hotel wants a manual housekeeping confirmation step instead.
    # ------------------------------------------------------------------
    @staticmethod
    def checkout(booking_id: int, auto_complete_cleaning: bool = False) -> Booking:
        booking = Booking.query.get(booking_id)
        if booking is None:
            raise BookingError(f"Booking {booking_id} does not exist.")
        if booking.booking_status not in ("CheckedIn", "Extended"):
            raise BookingError("Only a checked-in or extended booking can be checked out.")

        room = booking.room
        BookingService._transition_room(room, "Released")
        BookingService._transition_room(room, "Cleaning")
        if auto_complete_cleaning:
            BookingService._transition_room(room, "Available")

        booking.booking_status = "Completed"
        db.session.commit()
        return booking

    @staticmethod
    def mark_cleaning_complete(room_id: int) -> Room:
        """Admin Dashboard > 'Mark Cleaning Complete': Cleaning -> Available."""
        room = Room.query.get(room_id)
        if room is None:
            raise BookingError(f"Room {room_id} does not exist.")
        BookingService._transition_room(room, "Available")
        db.session.commit()
        return room

    # ------------------------------------------------------------------
    # Cancel Booking (Functional Requirements > Cancel Booking)
    # ------------------------------------------------------------------
    @staticmethod
    def cancel_booking(booking_id: int) -> Booking:
        booking = Booking.query.get(booking_id)
        if booking is None:
            raise BookingError(f"Booking {booking_id} does not exist.")
        if booking.booking_status in ("Completed", "Cancelled"):
            raise BookingError(f"Booking {booking_id} is already '{booking.booking_status}'.")

        # Only release the room back to Available if it was actually holding
        # it (Reserved). A checked-in/extended stay uses early checkout
        # instead, not cancellation.
        if booking.room.room_state == "Reserved":
            BookingService._transition_room(booking.room, "Available")

        booking.booking_status = "Cancelled"
        db.session.commit()
        return booking
