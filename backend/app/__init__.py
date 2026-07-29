"""
app/__init__.py
----------------
Application factory for the Hotel Booking and Reservation System backend.

Using a factory (create_app) instead of a module-level `app = Flask(...)`
lets us:
  - create multiple app instances with different configs (e.g. for tests)
  - avoid circular imports, since blueprints/models are only imported
    *inside* the function, after extensions are already initialized
"""

from flask import Flask, jsonify

from app.config import Config
from app.extensions import db, bcrypt, cors, jwt


def create_app(config_class: type = Config) -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    # --- Initialize extensions ---
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    # --- Register blueprints ---
    # Imported here (not at module top) so that model/service modules can
    # safely import `db` from app.extensions without hitting a circular
    # import back into this file.
    from app.routes.auth_routes import auth_bp
    from app.routes.room_routes import room_bp
    from app.routes.booking_routes import booking_bp
    from app.routes.admin_routes import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(room_bp, url_prefix="/api/rooms")
    app.register_blueprint(booking_bp, url_prefix="/api/bookings")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    # --- Import models so SQLAlchemy is aware of them for create_all() ---
    from app.models import user, room, booking  # noqa: F401

    # --- Global error handlers (consistent JSON error shape for the SPA) ---
    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(400)
    def bad_request(error):
        message = error.description if hasattr(error, "description") else "Bad request"
        return jsonify({"error": message}), 400

    @app.errorhandler(500)
    def server_error(_error):
        return jsonify({"error": "Internal server error"}), 500

    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "ok", "service": "hotel-pms-backend"})

    return app
