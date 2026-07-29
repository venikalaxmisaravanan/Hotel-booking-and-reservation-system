import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";
import { bookingApi, adminApi } from "../services/api";

/**
 * Converted from Stitch booking_details/screen.png. The mockup's
 * billing summary (room rate x nights, taxes, grand total) is omitted
 * for the same reason as on BookRoom: there is no price field in the
 * Room/Booking schema, so a dollar figure here would be fabricated.
 * The action buttons (Check In, Extend Stay, Early Checkout, Cancel
 * Booking) are preserved and wired to the real endpoints.
 */
export default function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [extending, setExtending] = useState(false);
  const [newEndTime, setNewEndTime] = useState("");
  const [conflict, setConflict] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await bookingApi.get(bookingId);
      setBooking(data.booking);
    } catch (err) {
      setError(err.message);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(apiCall, successMessage) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiCall();
      setMessage(successMessage);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleExtendSubmit(e) {
    e.preventDefault();
    setConflict(null);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await bookingApi.extend(bookingId, new Date(newEndTime).toISOString());
      setMessage("Stay extended.");
      setExtending(false);
      await load();
    } catch (err) {
      if (err.status === 409) {
        // Conflict: the backend already looked for a substitute room
        // covering the whole stay -- surface it instead of just failing.
        setConflict(err.payload.suggested_room);
        setError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReallocate() {
    if (!conflict) return;
    await runAction(
      () => adminApi.reallocateBooking(bookingId, conflict.room_id, new Date(newEndTime).toISOString()),
      `Reallocated to Room ${conflict.room_number}.`
    );
    setConflict(null);
    setExtending(false);
  }

  if (error && !booking) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-lg text-body-md text-on-error-container">{error}</main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-lg text-body-md text-on-surface-variant">Loading...</main>
      </div>
    );
  }

  const canPay = booking.booking_status === "Pending";
  const canCheckIn = booking.booking_status === "Confirmed";
  const canExtend = booking.booking_status === "CheckedIn" || booking.booking_status === "Extended";
  const canCheckout = booking.booking_status === "CheckedIn" || booking.booking_status === "Extended";
  const canCancel = ["Pending", "Confirmed"].includes(booking.booking_status);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-lg">
        <p className="text-label-caps text-on-surface-variant">Bookings / Reservation Details</p>
        <div className="mb-lg flex flex-wrap items-center justify-between gap-md">
          <h1 className="font-data text-headline-md">Reservation #{booking.booking_id}</h1>
          <div className="flex flex-wrap gap-sm">
            {canPay && (
              <button
                disabled={busy}
                onClick={() => runAction(() => bookingApi.pay(booking.booking_id), "Payment Successful.")}
                className="rounded-md bg-primary px-md py-sm text-body-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-60"
              >
                Pay Now
              </button>
            )}
            {canCheckIn && (
              <button
                disabled={busy}
                onClick={() => runAction(() => bookingApi.checkIn(booking.booking_id), "Checked in.")}
                className="rounded-md bg-primary px-md py-sm text-body-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-60"
              >
                Check In
              </button>
            )}
            {canExtend && (
              <button
                disabled={busy}
                onClick={() => setExtending((v) => !v)}
                className="rounded-md border border-outline-variant px-md py-sm text-body-sm font-medium text-primary hover:bg-surface-container-low"
              >
                Extend Stay
              </button>
            )}
            {canCheckout && (
              <button
                disabled={busy}
                onClick={() => runAction(() => bookingApi.checkout(booking.booking_id, true), "Checked out.")}
                className="rounded-md border border-outline-variant px-md py-sm text-body-sm font-medium text-primary hover:bg-surface-container-low"
              >
                Early Checkout
              </button>
            )}
            {canCancel && (
              <button
                disabled={busy}
                onClick={() => runAction(() => bookingApi.cancel(booking.booking_id), "Booking cancelled.")}
                className="rounded-md bg-error-container px-md py-sm text-body-sm font-medium text-on-error-container hover:opacity-90 disabled:opacity-60"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>

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

        {extending && (
          <form
            onSubmit={handleExtendSubmit}
            className="mb-lg max-w-md rounded-md border border-outline-variant bg-surface-container-lowest p-lg shadow-level1"
          >
            <p className="mb-sm text-title-sm">Request Stay Extension</p>
            <label className="mb-1 block text-label-caps text-on-surface-variant">New Check-Out Date &amp; Time</label>
            <input
              type="datetime-local"
              required
              className="mb-md w-full rounded-md border border-outline-variant px-md py-sm text-body-md"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-primary px-md py-sm text-body-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-60"
            >
              Submit Extension
            </button>

            {conflict && (
              <div className="mt-md rounded-md border border-status-extended bg-status-extended-bg p-md">
                <p className="mb-sm text-body-sm text-status-extended">
                  Conflict detected. Suggested alternate room:
                </p>
                <p className="mb-sm font-data text-mono-data">
                  Room {conflict.room_number} — {conflict.room_type}
                </p>
                <button
                  type="button"
                  onClick={handleReallocate}
                  disabled={busy}
                  className="rounded-md bg-status-extended px-md py-sm text-body-sm font-medium text-white hover:opacity-90"
                >
                  Reallocate to This Room
                </button>
              </div>
            )}
          </form>
        )}

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-md border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
            <p className="mb-sm text-label-caps text-on-surface-variant">Guest Identity</p>
            <p className="text-title-sm">{booking.guest?.full_name}</p>
            <p className="mb-md text-body-sm text-on-surface-variant">{booking.guest?.email}</p>

            <div className="grid grid-cols-2 gap-md border-t border-outline-variant pt-md">
              <div>
                <p className="text-label-caps text-on-surface-variant">Room</p>
                <p className="font-data text-mono-data">{booking.room_number}</p>
                <p className="text-body-sm text-on-surface-variant">{booking.room_type}</p>
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant">Room State</p>
                <StatusBadge state={booking.room_state} />
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant">Check-In</p>
                <p className="text-body-md">{new Date(booking.start_time).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant">Check-Out</p>
                <p className="text-body-md">{new Date(booking.end_time).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant">Duration</p>
                <p className="text-body-md">{booking.duration_hours} hours</p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
            <p className="mb-sm text-label-caps text-on-surface-variant">Current Status</p>
            <p className="text-title-sm">{booking.booking_status}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
