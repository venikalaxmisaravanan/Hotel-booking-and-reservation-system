import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, CheckCircle2 } from "lucide-react";

import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";
import { roomApi, bookingApi } from "../services/api";

/**
 * Converted from Stitch book_room/screen.png. The mockup shows a
 * front-desk "book on behalf of a walk-in guest" form (name/phone
 * fields) -- but the backend ties every booking to the logged-in
 * user's account (no separate walk-in guest record), so those fields
 * are dropped rather than faked. The room-type + date/time search,
 * availability check, and confirm-booking flow are preserved exactly.
 *
 * The mockup's price panel is also omitted: the Room/Booking schema
 * (Functional Requirements > Database) has no price field, so showing
 * a dollar estimate here would be fabricated data.
 */
export default function BookRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRoomId = searchParams.get("room");

  const [roomTypes, setRoomTypes] = useState([]);
  const [roomType, setRoomType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [availableRooms, setAvailableRooms] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    roomApi.list().then((data) => {
      const types = [...new Set(data.rooms.map((r) => r.room_type))];
      setRoomTypes(types);
      if (preselectedRoomId) {
        const room = data.rooms.find((r) => String(r.room_id) === preselectedRoomId);
        if (room) setRoomType(room.room_type);
      }
    });
  }, [preselectedRoomId]);

  async function handleCheckAvailability(e) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setSelectedRoom(null);
    setSearching(true);
    try {
      const data = await roomApi.search({
        roomType: roomType || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      setAvailableRooms(data.rooms);
    } catch (err) {
      setError(err.message);
      setAvailableRooms(null);
    } finally {
      setSearching(false);
    }
  }

  async function handleConfirmBooking() {
    if (!selectedRoom) return;
    setConfirming(true);
    setError("");
    try {
      const data = await bookingApi.create(
        selectedRoom.room_id,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString()
      );
      setSuccess(data.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-lg">
        <p className="text-label-caps text-on-surface-variant">PMS / Reservations</p>
        <h1 className="mb-lg text-headline-md">Book New Room</h1>

        {success ? (
          <div className="max-w-xl rounded-md border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
            <div className="mb-md flex items-center gap-2 text-status-available">
              <CheckCircle2 size={22} />
              <p className="text-title-sm">Booking created — awaiting payment</p>
            </div>
            <p className="mb-md text-body-md text-on-surface-variant">
              Room {success.room_number} reserved for {success.duration_hours}h, from{" "}
              {new Date(success.start_time).toLocaleString()} to {new Date(success.end_time).toLocaleString()}.
            </p>
            <button
              onClick={() => navigate(`/bookings/${success.booking_id}`)}
              className="rounded-md bg-primary px-md py-sm text-body-md font-medium text-on-primary hover:opacity-90"
            >
              Go to Booking &amp; Pay
            </button>
          </div>
        ) : (
          <div className="grid max-w-4xl grid-cols-1 gap-lg lg:grid-cols-3">
            <form onSubmit={handleCheckAvailability} className="lg:col-span-2 flex flex-col gap-md rounded-md border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
              <div>
                <label className="mb-1 block text-label-caps text-on-surface-variant">Room Type</label>
                <select
                  className="w-full rounded-md border border-outline-variant px-md py-sm text-body-md"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                >
                  <option value="">Any room type</option>
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="mb-1 block text-label-caps text-on-surface-variant">
                    Check-In Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full rounded-md border border-outline-variant px-md py-sm text-body-md"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-label-caps text-on-surface-variant">
                    Check-Out Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full rounded-md border border-outline-variant px-md py-sm text-body-md"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="flex items-center justify-center gap-2 rounded-md bg-primary-container py-sm text-body-md font-medium text-on-primary hover:opacity-90 disabled:opacity-60"
              >
                <Search size={16} />
                {searching ? "Checking..." : "Check Availability"}
              </button>

              {error && (
                <p className="rounded-md bg-error-container px-md py-sm text-body-sm text-on-error-container">
                  {error}
                </p>
              )}

              {availableRooms && (
                <div className="mt-sm">
                  <p className="mb-sm text-body-sm text-on-surface-variant">
                    {availableRooms.length} room(s) available
                  </p>
                  <div className="flex flex-col gap-sm">
                    {availableRooms.map((room) => (
                      <button
                        type="button"
                        key={room.room_id}
                        onClick={() => setSelectedRoom(room)}
                        className={`flex items-center justify-between rounded-md border px-md py-sm text-left ${
                          selectedRoom?.room_id === room.room_id
                            ? "border-primary bg-surface-container"
                            : "border-outline-variant hover:bg-surface-container-low"
                        }`}
                      >
                        <span className="font-data text-mono-data">
                          Room {room.room_number} — {room.room_type}
                        </span>
                        <StatusBadge state={room.room_state} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>

            <div className="flex flex-col gap-md rounded-md border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
              <p className="text-title-sm">Selected Room</p>
              {selectedRoom ? (
                <>
                  <p className="font-data text-mono-data">Room {selectedRoom.room_number}</p>
                  <p className="text-body-sm text-on-surface-variant">{selectedRoom.room_type}</p>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={confirming}
                    className="mt-md rounded-md bg-primary py-sm text-body-md font-medium text-on-primary hover:opacity-90 disabled:opacity-60"
                  >
                    {confirming ? "Confirming..." : "Confirm Booking"}
                  </button>
                </>
              ) : (
                <p className="text-body-sm text-on-surface-variant">
                  Search and select a room to see it here.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
