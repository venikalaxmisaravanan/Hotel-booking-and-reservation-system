import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BookRoom from "./pages/BookRoom";
import BookingsList from "./pages/BookingsList";
import BookingDetails from "./pages/BookingDetails";
import AdminDashboard from "./pages/AdminDashboard";
import RoomReallocation from "./pages/RoomReallocation";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <BookingsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/new"
        element={
          <ProtectedRoute>
            <BookRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/:bookingId"
        element={
          <ProtectedRoute>
            <BookingDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reallocation"
        element={
          <ProtectedRoute>
            <RoomReallocation />
          </ProtectedRoute>
        }
      />

      {/* Sidebar links to /settings but no such page exists in the
          Functional Requirements -- redirect home rather than 404. */}
      <Route path="/settings" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
