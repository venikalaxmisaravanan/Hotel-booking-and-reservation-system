"""
seed.py
-------
Populates a fresh database with the fixed 10-room inventory required by
the Functional Requirements (Dashboard section: rooms 101-105, 201-205),
plus one demo user account for quick manual testing.

Run with:  python seed.py
Safe to re-run: existing rooms/users are left untouched (checked by
room_number / username uniqueness) rather than duplicated.
"""

from app import create_app
from app.extensions import db
from app.models.room import Room
from app.models.user import User

# Room type assignment mirrors the mix shown in the Stitch dashboard
# mockup (a spread of Standard/Deluxe/Premier rooms across both floors).
ROOM_TYPE_MAP = {
    101: "Deluxe Suite",
    102: "Standard King",
    103: "Standard King",
    104: "Deluxe Suite",
    105: "Deluxe Twin",
    201: "Premier Suite",
    202: "Standard King",
    203: "Premier Suite",
    204: "Standard King",
    205: "Deluxe Suite",
}


def seed_rooms():
    created = 0
    for room_number, room_type in ROOM_TYPE_MAP.items():
        if Room.query.filter_by(room_number=room_number).first():
            continue
        db.session.add(Room(room_number=room_number, room_type=room_type, room_state="Available"))
        created += 1
    db.session.commit()
    print(f"Seeded {created} new room(s); {len(ROOM_TYPE_MAP) - created} already existed.")


def seed_demo_user():
    if User.query.filter_by(username="demo").first():
        print("Demo user already exists (username='demo').")
        return

    user = User(full_name="Demo Guest", email="demo@example.com", username="demo")
    user.set_password("Password123")
    db.session.add(user)
    db.session.commit()
    print("Created demo user -> username: demo / password: Password123")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
        seed_rooms()
        seed_demo_user()
