import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";
import { bookingApi } from "../services/api";

export default function BookingsList() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    bookingApi
      .listMine()
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-lg">
        <div className="mb-lg flex items-center justify-between">
          <h1 className="text-headline-md">My Bookings</h1>
          <Link
            to="/bookings/new"
            className="rounded-md bg-primary px-md py-sm text-body-sm font-medium text-on-primary hover:opacity-90"
          >
            New Reservation
          </Link>
        </div>

        {error && (
          <p className="rounded-md bg-error-container px-md py-sm text-body-sm text-on-error-container">
            {error}
          </p>
        )}

        {bookings && bookings.length === 0 && (
          <p className="text-body-md text-on-surface-variant">
            No bookings yet. Create your first reservation to see it here.
          </p>
        )}

        {bookings && bookings.length > 0 && (
          <div className="overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest shadow-level1">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-label-caps text-on-surface-variant">
                <tr>
                  <th className="px-md py-sm">Room</th>
                  <th className="px-md py-sm">Check-In</th>
                  <th className="px-md py-sm">Check-Out</th>
                  <th className="px-md py-sm">Status</th>
                  <th className="px-md py-sm" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.booking_id} className="border-t border-outline-variant">
                    <td className="px-md py-sm font-data text-mono-data">
                      {b.room_number} — {b.room_type}
                    </td>
                    <td className="px-md py-sm text-body-sm">{new Date(b.start_time).toLocaleString()}</td>
                    <td className="px-md py-sm text-body-sm">{new Date(b.end_time).toLocaleString()}</td>
                    <td className="px-md py-sm">
                      <StatusBadge state={b.booking_status} />
                    </td>
                    <td className="px-md py-sm text-right">
                      <Link to={`/bookings/${b.booking_id}`} className="text-body-sm text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
