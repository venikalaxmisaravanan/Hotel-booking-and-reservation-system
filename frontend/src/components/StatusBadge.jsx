/**
 * Renders a room/booking state as the colored pill defined in
 * DESIGN.md > Room Status Logic. Centralized here so the Available /
 * Reserved / Occupied / Extended / Released / Cleaning color mapping
 * only has to be correct in one place.
 */
const STATE_STYLES = {
  // Room states
  Available: "bg-status-available-bg text-status-available",
  Reserved: "bg-status-reserved-bg text-status-reserved",
  Occupied: "bg-status-occupied-bg text-status-occupied",
  Extended: "bg-status-extended-bg text-status-extended",
  Released: "bg-status-released-bg text-status-released",
  Cleaning: "bg-status-cleaning-bg text-status-cleaning",

  // Booking statuses (a separate value space -- e.g. "Confirmed" means
  // paid-but-not-checked-in, which has no equivalent room state)
  Pending: "bg-status-cleaning-bg text-status-cleaning",
  Confirmed: "bg-status-reserved-bg text-status-reserved",
  CheckedIn: "bg-status-occupied-bg text-status-occupied",
  Completed: "bg-status-available-bg text-status-available",
  Cancelled: "bg-error-container text-on-error-container",
};

export default function StatusBadge({ state }) {
  const classes = STATE_STYLES[state] || "bg-surface-container text-on-surface-variant";
  return <span className={`status-pill ${classes}`}>{state}</span>;
}
