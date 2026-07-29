"""
app/routes/room_routes.py
--------------------------
Functional Requirements covered:
  - Dashboard: display exactly the 10 configured rooms with their
    current state (GET /api/rooms).
  - Search Room: search by room type, date, start time, end time
    (GET /api/rooms/search).
"""

from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.models.room import Room
from app.services.booking_service import BookingService, BookingError
from app.utils.validators import parse_datetime, ValidationError

room_bp = Blueprint("rooms", __name__)


@room_bp.route("", methods=["GET"])
@jwt_required()
def list_rooms():
    """Dashboard grid: all rooms ordered by room_number, each with its state."""
    rooms = Room.query.order_by(Room.room_number.asc()).all()
    return jsonify({"rooms": [r.to_dict() for r in rooms]}), 200


@room_bp.route("/search", methods=["GET"])
@jwt_required()
def search_rooms():
    """
    Query params:
      room_type (optional) - e.g. "Deluxe Suite"
      start_time (required) - ISO datetime
      end_time   (required) - ISO datetime

    Returns rooms of the given type that are free for the whole window,
    i.e. free of any Pending/Confirmed/CheckedIn/Extended overlapping
    booking (Functional Requirements > Search Room, > Check Availability).
    """
    room_type = request.args.get("room_type")
    try:
        start_time = parse_datetime(request.args.get("start_time"), "start_time")
        end_time = parse_datetime(request.args.get("end_time"), "end_time")
    except ValidationError as e:
        return jsonify({"error": str(e)}), 400

    if end_time <= start_time:
        return jsonify({"error": "end_time must be after start_time."}), 400

    available_rooms = BookingService.find_available_rooms(start_time, end_time, room_type)
    return jsonify({
        "count": len(available_rooms),
        "rooms": [r.to_dict() for r in available_rooms],
    }), 200


@room_bp.route("/<int:room_id>", methods=["GET"])
@jwt_required()
def get_room(room_id: int):
    room = Room.query.get(room_id)
    if room is None:
        return jsonify({"error": f"Room {room_id} not found."}), 404
    return jsonify({"room": room.to_dict()}), 200
