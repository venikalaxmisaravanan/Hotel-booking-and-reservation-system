"""
app/routes/auth_routes.py
--------------------------
Thin HTTP layer for Authentication (Functional Requirements > Register,
Login, Logout). Parses/validates the request shape only; all business
rules live in services/auth_service.py.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.auth_service import AuthService, AuthError
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    try:
        user = AuthService.register(
            full_name=data.get("full_name"),
            email=data.get("email"),
            username=data.get("username"),
            password=data.get("password"),
            confirm_password=data.get("confirm_password"),
        )
        return jsonify({"message": "Registration successful.", "user": user.to_dict()}), 201
    except AuthError as e:
        return jsonify({"error": str(e)}), 400


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    try:
        user, token = AuthService.login(
            username=data.get("username"),
            password=data.get("password"),
        )
        return jsonify({
            "message": "Login successful.",
            "access_token": token,
            "user": user.to_dict(),
        }), 200
    except AuthError as e:
        return jsonify({"error": str(e)}), 401


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    AuthService.logout()
    # Stateless JWT: the actual "logout" is the SPA discarding its token.
    return jsonify({"message": "Logged out."}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if user is None:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": user.to_dict()}), 200
