# Luxor PMS — Hotel Booking and Reservation System

Academic OOAD-to-implementation prototype built from the *Analysis and
Design of Hotel Booking and Reservation System* documentation (VIT
University, April 2026) and its accompanying Google Stitch UI export.

Demonstrates: time-based / partial-duration booking, dynamic room-state
management, stay extension with conflict detection, and automatic room
reallocation — **not** a commercial booking platform.

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Python Flask (MVC + service layer), Flask-JWT-Extended, Flask-Bcrypt
- **Database:** SQLite (via SQLAlchemy)

## Project structure

```
hotel-pms/
├── backend/
│   ├── app/
│   │   ├── models/        # User, Room, Booking (SQLAlchemy)
│   │   ├── services/      # BookingService, ReallocationService, AuthService
│   │   ├── routes/        # auth / rooms / bookings / admin blueprints
│   │   └── utils/         # request validators
│   ├── seed.py             # creates the 10 fixed rooms + a demo user
│   ├── run.py               # dev server entry point
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/          # Login, Register, Dashboard, BookRoom,
        │                   # BookingsList, BookingDetails, AdminDashboard,
        │                   # RoomReallocation
        ├── components/     # Sidebar, RoomCard, StatusBadge, ProtectedRoute
        ├── context/        # AuthContext (JWT session state)
        └── services/api.js # single fetch wrapper for the whole backend
```

## Running it

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python seed.py                  # creates instance/hotel.db, seeds 10 rooms
                                 # + demo user (username: demo / password: Password123)
python run.py                    # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

Open http://localhost:5173 and log in with `demo` / `Password123`, or
register a new account.

## Room state lifecycle

```
Available → Reserved → Occupied → Extended → Released → Cleaning → Available
```

All transitions are validated in one place:
`backend/app/services/booking_service.py::BookingService.TRANSITIONS`.
No route or model can write an invalid state directly.

## Design decisions worth knowing about

These are deliberate, documented departures from the Stitch mockups —
each one exists because the underlying data didn't support the visual,
not because of a redesign:

- **No price/billing figures anywhere** (Book Room, Booking Details).
  The Functional Requirements' database schema has no `price` column
  on `Room` or `Booking`, so a dollar estimate would be fabricated.
  Add a `base_price` column + a `PricingPolicy`-equivalent service if
  you want this back.
- **No walk-in guest name/phone fields on Book Room.** Every booking
  is tied to the logged-in account (no separate walk-in guest record
  exists in the schema).
- **No maintenance/housekeeping ticket queue or floor-plan map on
  Admin Dashboard.** No such entity exists in the OOAD class diagram;
  everything shown on that page is queried live from the database.
- **Availability is judged purely by time-window overlap, not by a
  room's current live state.** A room "Occupied" by an earlier stay
  can still be booked for a later, non-overlapping time slot — this
  is what makes the Stay Extension → conflict → Automatic Room
  Reallocation scenario (OOAD Sequence/Activity Diagrams 3.10/3.19)
  actually reachable, rather than a dead code path.
- **No separate admin role/permission system.** The OOAD's
  "Administrator" actor reuses the same `User` model as "Guest" for
  this prototype's scope; any authenticated user can reach
  `/api/admin/*`. Add an `is_admin` boolean + a decorator in
  `routes/admin_routes.py` if you need real access control.

## API reference

See the route files directly for full request/response shapes —
each route's docstring cites the exact Functional Requirement /
Use Case it implements:

| Endpoint | Method | File |
|---|---|---|
| `/api/auth/register`, `/login`, `/logout`, `/me` | POST/GET | `routes/auth_routes.py` |
| `/api/rooms`, `/api/rooms/search`, `/api/rooms/<id>` | GET | `routes/room_routes.py` |
| `/api/bookings/check-availability` | POST | `routes/booking_routes.py` |
| `/api/bookings` (create/list), `/api/bookings/<id>` | POST/GET | `routes/booking_routes.py` |
| `/api/bookings/<id>/pay`, `/checkin`, `/extend`, `/checkout`, `/cancel` | POST | `routes/booking_routes.py` |
| `/api/admin/dashboard` | GET | `routes/admin_routes.py` |
| `/api/admin/rooms/<id>/status`, `/mark-cleaning-complete` | PATCH/POST | `routes/admin_routes.py` |
| `/api/admin/bookings/<id>/reallocate` | POST | `routes/admin_routes.py` |
