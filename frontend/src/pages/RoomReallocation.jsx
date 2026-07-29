import { useEffect, useState, useCallback } from "react";
import { ArrowLeftRight } from "lucide-react";

import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";
import { adminApi } from "../services/api";

/**
 * Converted from Stitch room_reallocation/screen.png. The mockup frames
 * this as resolving one specific system-detected conflict; here it's
 * generalized into a proactive tool: pick any currently occupied/
 * extended booking, then reallocate it to any Available room of the
 * same type. (The reactive path -- an extension request that hits a
 * conflict -- is handled inline on the Booking Details page instead,
 * since that's where the conflict is actually detected.)
 */
export default function RoomReallocation() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await adminApi.dashboard();
      setData(result);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-lg text-body-md text-on-surface-variant">Loading...</main>
      </div>
    );
  }

  const activeBookings = data.current_bookings.filter((b) =>
    ["CheckedIn", "Extended"].includes(b.booking_status)
  );
  const selectedBooking = activeBookings.find((b) => b.booking_id === selectedBookingId);
  const candidateRooms = selectedBooking
    ? data.rooms.filter(
        (r) => r.room_state === "Available" && r.room_type === selectedBooking.room_type && r.room_id !== selectedBooking.room_id
      )
    : [];

  async function handleReallocate() {
    if (!selectedBooking || !selectedRoomId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await adminApi.reallocateBooking(selectedBooking.booking_id, selectedRoomId, null);
      setMessage(`Booking #${result.booking.booking_id} reallocated to Room ${result.booking.room_number}.`);
      setSelectedBookingId(null);
      setSelectedRoomId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-lg">
        <h1 className="mb-sm text-headline-md">Booking Reallocation</h1>
        <p className="mb-lg text-body-md text-on-surface-variant">
          Resolve occupancy conflicts for extending or displaced guests.
        </p>

        {message && (
          <p className="mb-md rounded-md bg-status-available-bg px-md py-sm text-body-sm text-status-available">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-md rounded-md bg-error-container px-md py-sm text-body-sm text-on-error-container">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
          <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
            <p className="mb-md text-title-sm">Active Reservation</p>
            {activeBookings.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No occupied or extended stays right now.</p>
            ) : (
              <div className="flex flex-col gap-sm">
                {activeBookings.map((b) => (
                  <button
                    key={b.booking_id}
                    onClick={() => {
                      setSelectedBookingId(b.booking_id);
                      setSelectedRoomId(null);
                    }}
                    className={`flex items-center justify-between rounded-md border px-md py-sm text-left ${
                      selectedBookingId === b.booking_id
                        ? "border-primary bg-surface-container"
                        : "border-outline-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <div>
                      <p className="font-data text-mono-data">Room {b.room_number}</p>
                      <p className="text-body-sm text-on-surface-variant">
                        {b.guest?.full_name} · until {new Date(b.end_time).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge state={b.booking_status} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
            <p className="mb-md text-title-sm">Suggested Available Rooms</p>
            {!selectedBooking && (
              <p className="text-body-sm text-on-surface-variant">Select an active reservation first.</p>
            )}
            {selectedBooking && candidateRooms.length === 0 && (
              <p className="text-body-sm text-on-surface-variant">
                No other {selectedBooking.room_type} rooms are currently available.
              </p>
            )}
            {selectedBooking && candidateRooms.length > 0 && (
              <div className="flex flex-col gap-sm">
                {candidateRooms.map((room) => (
                  <button
                    key={room.room_id}
                    onClick={() => setSelectedRoomId(room.room_id)}
                    className={`flex items-center justify-between rounded-md border px-md py-sm text-left ${
                      selectedRoomId === room.room_id
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
            )}

            {selectedBooking && selectedRoomId && (
              <button
                onClick={handleReallocate}
                disabled={busy}
                className="mt-lg flex w-full items-center justify-center gap-2 rounded-md bg-primary py-sm text-body-md font-medium text-on-primary hover:opacity-90 disabled:opacity-60"
              >
                <ArrowLeftRight size={16} />
                {busy ? "Reallocating..." : "Confirm Reallocation"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
