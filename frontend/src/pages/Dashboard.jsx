import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import Sidebar from "../components/Sidebar";
import RoomCard from "../components/RoomCard";
import { adminApi, bookingApi } from "../services/api";


/**
 * The main "Room Inventory Dashboard" (Stitch: dashboard/screen.png).
 *
 * Reuses GET /api/admin/dashboard rather than GET /api/rooms alone,
 * because this screen needs each room's *active booking* (to know
 * whether a Reserved room is still awaiting payment or ready for
 * check-in) as well as its state -- both come back in one response.
 * This prototype has no separate guest/staff role split (see the note
 * in admin_routes.py), so the operator-facing Dashboard and the more
 * detailed Admin Dashboard legitimately share the same aggregate data.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyRoomId, setBusyRoomId] = useState(null);

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

  function findBookingForRoom(roomId) {
    return data?.current_bookings.find((b) => b.room_id === roomId);
  }

  function resolveAction(room) {
    const booking = findBookingForRoom(room.room_id);

    switch (room.room_state) {
      case "Available":
        return {
          label: "New Reservation",
          run: () => navigate(`/bookings/new?room=${room.room_id}`),
        };
      case "Reserved":
        if (booking?.booking_status === "Pending") {
          return { label: "Pay Now", run: () => act(room.room_id, () => bookingApi.pay(booking.booking_id)) };
        }
        if (booking?.booking_status === "Confirmed") {
          return { label: "Check In", run: () => act(room.room_id, () => bookingApi.checkIn(booking.booking_id)) };
        }
        return null;
      case "Occupied":
      case "Extended":
        return {
          label: room.room_state === "Occupied" ? "Extend Stay" : "Manage Stay",
          run: () => navigate(booking ? `/bookings/${booking.booking_id}` : "/bookings"),
        };
      case "Cleaning":
      case "Released":
        return {
          label: "Set Ready",
          run: () => act(room.room_id, () => adminApi.markCleaningComplete(room.room_id)),
        };
      default:
        return null;
    }
  }

  async function act(roomId, apiCall) {
    setBusyRoomId(roomId);
    setError("");
    try {
      await apiCall();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyRoomId(null);
    }
  }

  if (!data) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-lg text-body-md text-on-surface-variant">Loading dashboard...</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-lg">
        <div className="mb-lg flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-sm text-on-surface-variant">
            <Search size={16} />
            Search rooms or guests...
          </div>
          <div className="flex gap-md text-body-md">
            <span className="border-b-2 border-primary pb-1 font-medium text-primary">Availability</span>
            <span className="text-on-surface-variant">Housekeeping</span>
            <span className="text-on-surface-variant">Reports</span>
          </div>
        </div>

        <p className="text-label-caps text-on-surface-variant">Operational Overview</p>
        <div className="mb-lg flex items-center justify-between">
          <h1 className="text-headline-md">Room Inventory Dashboard</h1>
          <div className="flex gap-sm text-body-sm">
            <span className="status-pill bg-status-available-bg text-status-available">
              Available ({data.state_counts.Available})
            </span>
            <span className="status-pill bg-status-occupied-bg text-status-occupied">
              Occupied ({data.state_counts.Occupied})
            </span>
          </div>
        </div>

        {error && (
          <p className="mb-md rounded-md bg-error-container px-md py-sm text-body-sm text-on-error-container">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-5">
          {data.rooms.map((room) => {
            const action = resolveAction(room);
            return (
              <RoomCard
                key={room.room_id}
                room={room}
                actionLabel={action?.label}
                onAction={action?.run}
                disabled={busyRoomId === room.room_id}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
