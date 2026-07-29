import { NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarRange, Repeat2, LineChart, Settings, BedDouble, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/bookings", label: "Bookings", icon: CalendarRange },
  { to: "/reallocation", label: "Reallocation", icon: Repeat2 },
  { to: "/admin", label: "Analytics", icon: LineChart },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-sidebar flex-col justify-between border-r border-outline-variant bg-surface-container-lowest px-md py-lg">
      <div>
        <div className="mb-xl flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-on-primary">
            <BedDouble size={20} />
          </div>
          <div>
            <p className="text-title-sm text-primary">Luxor PMS</p>
            <p className="text-body-sm text-on-surface-variant">Admin Terminal v2.4</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-md py-sm text-body-md transition-colors ${
                  isActive
                    ? "bg-surface-container text-primary font-medium"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-md py-sm text-body-md transition-colors ${
                isActive
                  ? "bg-surface-container text-primary font-medium"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`
            }
          >
            <Settings size={18} />
            Settings
          </NavLink>
        </nav>
      </div>

      <div className="flex flex-col gap-md">
        <NavLink
          to="/bookings/new"
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-md py-sm text-body-md font-medium text-on-primary hover:opacity-90"
        >
          <Plus size={18} />
          New Reservation
        </NavLink>

        {user && (
          <div className="flex items-center justify-between border-t border-outline-variant pt-md">
            <div className="min-w-0">
              <p className="truncate text-body-sm font-medium text-on-surface">{user.full_name}</p>
              <p className="truncate text-body-sm text-on-surface-variant">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="shrink-0 text-body-sm text-primary hover:underline"
              type="button"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
