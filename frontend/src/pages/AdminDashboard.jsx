import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";
import { adminApi } from "../services/api";

const ROOM_STATES = ["Available", "Reserved", "Occupied", "Extended", "Released", "Cleaning"];

/**
 * Converted from Stitch admin_dashboard/screen.png. The floor-plan
 * wing map and the maintenance/housekeeping queue in the mockup are
 * decorative extras with no backing data model (no maintenance-ticket
 * entity exists per the OOAD), so they're left out rather than filled
 * with invented content -- everything shown here is real.
 */
export default function AdminDashboard() {
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

  async function handleStatusChange(roomId, newState) {
    setBusyRoomId(roomId);
    setError("");
    try {
      await adminApi.updateRoomStatus(roomId, newState);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyRoomId(null);
    }
  }

  async function handleMarkCleaningComplete(roomId) {
    setBusyRoomId(roomId);
    setError("");
    try {
      await adminApi.markCleaningComplete(roomId);
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
        <main className="flex-1 p-lg text-body-md text-on-surface-variant">Loading...</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-lg">
        <div className="mb-lg flex items-center justify-between">
          <div>
            <p className="text-label-caps text-on-surface-variant">Real-time status</p>
            <h1 className="text-headline-md">Property Overview</h1>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-md bg-primary px-md py-sm text-body-sm font-medium text-on-primary hover:opacity-90"
          >
            <RefreshCw size={16} />
            Refresh Dashboard
          </button>
        </div>

        {error && (
          <p className="mb-md rounded-md bg-error-container px-md py-sm text-body-sm text-on-error-container">
            {error}
          </p>
        )}

        <div className="mb-lg grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-7">
          <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-md shadow-level1">
            <p className="text-label-caps text-on-surface-variant">Total Rooms</p>
            <p className="text-headline-md">{data.total_rooms}</p>
          </div>
          {ROOM_STATES.map((state) => (
            <div key={state} className="rounded-md border border-outline-variant bg-surface-container-lowest p-md shadow-level1">
              <p className="text-label-caps text-on-surface-variant">{state}</p>
              <p className="text-headline-md">{data.state_counts[state]}</p>
            </div>
          ))}
        </div>

        <div className="mb-lg overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest shadow-level1">
          <div className="border-b border-outline-variant p-md">
            <p className="text-title-sm">Current Bookings</p>
            <p className="text-body-sm text-on-surface-variant">Upcoming arrivals and active stays</p>
          </div>
          {data.current_bookings.length === 0 ? (
            <p className="p-md text-body-sm text-on-surface-variant">No active bookings.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-label-caps text-on-surface-variant">
                <tr>
                  <th className="px-md py-sm">Room</th>
                  <th className="px-md py-sm">Guest</th>
                  <th className="px-md py-sm">Check-In</th>
                  <th className="px-md py-sm">Check-Out</th>
                  <th className="px-md py-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.current_bookings.map((b) => (
                  <tr key={b.booking_id} className="border-t border-outline-variant">
                    <td className="px-md py-sm font-data text-mono-data">{b.room_number}</td>
                    <td className="px-md py-sm text-body-sm">{b.guest?.full_name}</td>
                    <td className="px-md py-sm text-body-sm">{new Date(b.start_time).toLocaleString()}</td>
                    <td className="px-md py-sm text-body-sm">{new Date(b.end_time).toLocaleString()}</td>
                    <td className="px-md py-sm">
                      <StatusBadge state={b.booking_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <p className="mb-sm text-title-sm">Room Status</p>
          <div className="grid grid-cols-2 gap-md sm:grid-cols-4 lg:grid-cols-5">
            {data.rooms.map((room) => (
              <div key={room.room_id} className="rounded-md border border-outline-variant bg-surface-container-lowest p-md shadow-level1">
                <div className="mb-sm flex items-center justify-between">
                  <span className="font-data text-mono-data">{room.room_number}</span>
                  <StatusBadge state={room.room_state} />
                </div>
                <p className="mb-md text-body-sm text-on-surface-variant">{room.room_type}</p>

                <select
                  disabled={busyRoomId === room.room_id}
                  value={room.room_state}
                  onChange={(e) => handleStatusChange(room.room_id, e.target.value)}
                  className="mb-sm w-full rounded-md border border-outline-variant px-2 py-1 text-body-sm"
                >
                  {ROOM_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>

                {room.room_state === "Cleaning" && (
                  <button
                    disabled={busyRoomId === room.room_id}
                    onClick={() => handleMarkCleaningComplete(room.room_id)}
                    className="w-full rounded-md bg-primary py-1.5 text-body-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-60"
                  >
                    Mark Cleaning Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
