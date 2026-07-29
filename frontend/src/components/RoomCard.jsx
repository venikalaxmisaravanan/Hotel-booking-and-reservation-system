import StatusBadge from "./StatusBadge";

/**
 * One room tile, matching the Stitch dashboard grid: room number +
 * type on top, state badge, then a state-appropriate action button.
 * The action button and its handler are passed in by the parent page
 * because the correct action (Check In vs Extend Stay vs Assign
 * Housekeeping...) depends on which page is rendering the grid and
 * what that room's active booking is.
 */
export default function RoomCard({ room, actionLabel, onAction, disabled }) {
  return (
    <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-md shadow-level1">
      <div className="mb-sm flex items-start justify-between">
        <span className="rounded bg-surface-container px-2 py-1 font-data text-mono-data text-on-surface">
          {room.room_number}
        </span>
        <StatusBadge state={room.room_state} />
      </div>

      <p className="text-title-sm text-on-surface">{room.room_type}</p>
      <p className="mb-md text-body-sm text-on-surface-variant">Room {room.room_number}</p>

      {actionLabel && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAction?.(room)}
          className="w-full rounded-md border border-outline-variant py-1.5 text-body-sm font-medium text-primary hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
