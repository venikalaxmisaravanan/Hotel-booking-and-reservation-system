"""
app/routes/admin_routes.py
----------------------------
Functional Requirements > Admin Dashboard:
  - Display totals per room state, current bookings, room status.
  - Refresh Dashboard, Update Room Status, Mark Cleaning Complete.
  - Administrator approves automatic room reallocation.

Note: this prototype does not implement a separate role/permission
system (the OOAD's "Administrator" actor reuses the same User model as
"Guest" for simplicity, consistent with the brief's instruction not to
add unrelated features). Any authenticated user can reach these routes;
a real deployment would add an `is_admin` flag and an `admin_required`
decorator here.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.models.room import Room
from app.models.booking import Booking
from app.services.booking_service import BookingService, BookingError
from app.services.reallocation_service import ReallocationService
from app.utils.validators import require_fields, parse_datetime, ValidationError

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    """Refresh Dashboard: totals per state + current (active) bookings."""
    rooms = Room.query.order_by(Room.room_number.asc()).all()

    state_counts = {state: 0 for state in
                    ("Available", "Reserved", "Occupied", "Extended", "Released", "Cleaning")}
    for room in rooms:
        state_counts[room.room_state] += 1

    active_bookings = Booking.query.filter(
        Booking.booking_status.in_(("Pending", "Confirmed", "CheckedIn", "Extended"))
    ).order_by(Booking.start_time.asc()).all()

    return jsonify({
        "total_rooms": len(rooms),
        "state_counts": state_counts,
        "rooms": [r.to_dict() for r in rooms],
        "current_bookings": [b.to_dict() for b in active_bookings],
    }), 200


@admin_bp.route("/rooms/<int:room_id>/status", methods=["PATCH"])
@jwt_required()
def update_room_status(room_id: int):
    """Update Room Status: administrator manual override of a room's state."""
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, "room_state")
    except ValidationError as e:
        return jsonify({"error": str(e)}), 400

    room = Room.query.get(room_id)
    if room is None:
        return jsonify({"error": f"Room {room_id} not found."}), 404

    try:
        room.set_state(data["room_state"])
        from app.extensions import db
        db.session.commit()
        return jsonify({"message": "Room status updated.", "room": room.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@admin_bp.route("/rooms/<int:room_id>/mark-cleaning-complete", methods=["POST"])
@jwt_required()
def mark_cleaning_complete(room_id: int):
    """Mark Cleaning Complete: Cleaning -> Available."""
    try:
        room = BookingService.mark_cleaning_complete(room_id)
        return jsonify({"message": "Room marked available.", "room": room.to_dict()}), 200
    except BookingError as e:
        return jsonify({"error": str(e)}), 400


@admin_bp.route("/bookings/<int:booking_id>/reallocate", methods=["POST"])
@jwt_required()
def reallocate_booking(booking_id: int):
    """
    Administrator approves reallocating an occupied booking to a new
    room (Functional Requirements > Automatic Room Reallocation >
    "Allow administrator to reallocate booking").
    Body: { "new_room_id": int, "new_end_time": ISO string (optional) }
    """
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, "new_room_id")
        new_end_time = (
            parse_datetime(data["new_end_time"], "new_end_time")
            if data.get("new_end_time") else None
        )
        booking = ReallocationService.reallocate_booking(
            booking_id, int(data["new_room_id"]), new_end_time
        )
        return jsonify({"message": "Booking reallocated.", "booking": booking.to_dict()}), 200
    except (ValidationError, BookingError) as e:
        return jsonify({"error": str(e)}), 400
