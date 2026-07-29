"""
app/routes/booking_routes.py
------------------------------
Thin HTTP layer over BookingService / ReallocationService. Covers the
Functional Requirements: Check Availability, Book Room, Dummy Payment,
Check-In, Stay Extension, Early Checkout, Cancel Booking.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.booking import Booking
from app.services.booking_service import BookingService, BookingError
from app.services.reallocation_service import ReallocationService
from app.utils.validators import parse_datetime, require_fields, ValidationError

booking_bp = Blueprint("bookings", __name__)


# ----------------------------------------------------------------------
# Check Availability (pre-booking, no side effects)
# ----------------------------------------------------------------------
@booking_bp.route("/check-availability", methods=["POST"])
@jwt_required()
def check_availability():
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, "room_id", "start_time", "end_time")
        start_time = parse_datetime(data["start_time"], "start_time")
        end_time = parse_datetime(data["end_time"], "end_time")
        is_available = BookingService.check_availability(int(data["room_id"]), start_time, end_time)
        return jsonify({"available": is_available}), 200
    except (ValidationError, BookingError) as e:
        return jsonify({"error": str(e)}), 400


# ----------------------------------------------------------------------
# Book Room
# ----------------------------------------------------------------------
@booking_bp.route("", methods=["POST"])
@jwt_required()
def create_booking():
    data = request.get_json(silent=True) or {}
    user_id = int(get_jwt_identity())
    try:
        require_fields(data, "room_id", "start_time", "end_time")
        start_time = parse_datetime(data["start_time"], "start_time")
        end_time = parse_datetime(data["end_time"], "end_time")
        booking = BookingService.create_booking(user_id, int(data["room_id"]), start_time, end_time)
        return jsonify({"message": "Booking created. Awaiting payment.", "booking": booking.to_dict()}), 201
    except (ValidationError, BookingError) as e:
        return jsonify({"error": str(e)}), 400


@booking_bp.route("", methods=["GET"])
@jwt_required()
def list_my_bookings():
    user_id = int(get_jwt_identity())
    bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.start_time.desc()).all()
    return jsonify({"bookings": [b.to_dict() for b in bookings]}), 200


@booking_bp.route("/<int:booking_id>", methods=["GET"])
@jwt_required()
def get_booking(booking_id: int):
    booking = Booking.query.get(booking_id)
    if booking is None:
        return jsonify({"error": f"Booking {booking_id} not found."}), 404
    return jsonify({"booking": booking.to_dict()}), 200


# ----------------------------------------------------------------------
# Dummy Payment: "Pay Now" / "Payment Successful"
# ----------------------------------------------------------------------
@booking_bp.route("/<int:booking_id>/pay", methods=["POST"])
@jwt_required()
def pay_booking(booking_id: int):
    try:
        booking = BookingService.confirm_payment(booking_id)
        return jsonify({"message": "Payment Successful.", "booking": booking.to_dict()}), 200
    except BookingError as e:
        return jsonify({"error": str(e)}), 400


# ----------------------------------------------------------------------
# Check-In: Reserved -> Occupied
# ----------------------------------------------------------------------
@booking_bp.route("/<int:booking_id>/checkin", methods=["POST"])
@jwt_required()
def checkin_booking(booking_id: int):
    try:
        booking = BookingService.check_in(booking_id)
        return jsonify({"message": "Checked in.", "booking": booking.to_dict()}), 200
    except BookingError as e:
        return jsonify({"error": str(e)}), 400


# ----------------------------------------------------------------------
# Stay Extension: Occupied -> Extended, with automatic reallocation
# suggestion on conflict.
# ----------------------------------------------------------------------
@booking_bp.route("/<int:booking_id>/extend", methods=["POST"])
@jwt_required()
def extend_booking(booking_id: int):
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, "new_end_time")
        new_end_time = parse_datetime(data["new_end_time"], "new_end_time")
    except ValidationError as e:
        return jsonify({"error": str(e)}), 400

    try:
        booking = ReallocationService.request_extension(booking_id, new_end_time)
        return jsonify({"message": "Stay extended.", "booking": booking.to_dict()}), 200
    except BookingError as e:
        # Conflict path: look for a substitute room covering the whole
        # stay so the admin can reallocate instead of just rejecting.
        suggested_room = ReallocationService.recommend_alternate_room(booking_id, new_end_time)
        return jsonify({
            "error": str(e),
            "conflict": True,
            "suggested_room": suggested_room.to_dict() if suggested_room else None,
        }), 409


# ----------------------------------------------------------------------
# Early Checkout: Occupied/Extended -> Released -> Cleaning (-> Available)
# ----------------------------------------------------------------------
@booking_bp.route("/<int:booking_id>/checkout", methods=["POST"])
@jwt_required()
def checkout_booking(booking_id: int):
    data = request.get_json(silent=True) or {}
    auto_complete = bool(data.get("auto_complete_cleaning", False))
    try:
        booking = BookingService.checkout(booking_id, auto_complete_cleaning=auto_complete)
        return jsonify({"message": "Checked out.", "booking": booking.to_dict()}), 200
    except BookingError as e:
        return jsonify({"error": str(e)}), 400


# ----------------------------------------------------------------------
# Cancel Booking
# ----------------------------------------------------------------------
@booking_bp.route("/<int:booking_id>/cancel", methods=["POST"])
@jwt_required()
def cancel_booking(booking_id: int):
    try:
        booking = BookingService.cancel_booking(booking_id)
        return jsonify({"message": "Booking cancelled.", "booking": booking.to_dict()}), 200
    except BookingError as e:
        return jsonify({"error": str(e)}), 400
