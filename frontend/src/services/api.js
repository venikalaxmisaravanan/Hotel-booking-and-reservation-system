/**
 * src/services/api.js
 * ---------------------
 * Single point of contact between the React app and the Flask backend.
 * No component calls `fetch` directly -- everything goes through the
 * functions exported here, so the request/response shape only has to
 * change in one place if the API ever changes.
 *
 * Token storage: kept in sessionStorage (not localStorage) so it is
 * automatically cleared when the tab/browser closes, reducing the
 * window an XSS attack could reuse a stolen token -- a reasonable
 * middle ground for an academic prototype that still wants page
 * refreshes to keep the user logged in.
 */

const TOKEN_KEY = "hotel_pms_token";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Core request helper. Every API function below is a thin wrapper
 * around this so headers, JSON parsing, and error handling only need
 * to be correct once.
 */
async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Every backend error handler returns { error: "..." } (see
    // app/__init__.py error handlers and each route's except blocks),
    // so this message is always meaningful to show the user directly.
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

// ------------------------------------------------------------------
// Auth
// ------------------------------------------------------------------
export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: { username, password }, auth: false }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
};

// ------------------------------------------------------------------
// Rooms
// ------------------------------------------------------------------
export const roomApi = {
  list: () => request("/rooms"),
  get: (roomId) => request(`/rooms/${roomId}`),
  search: ({ roomType, startTime, endTime }) => {
    const params = new URLSearchParams({ start_time: startTime, end_time: endTime });
    if (roomType) params.set("room_type", roomType);
    return request(`/rooms/search?${params.toString()}`);
  },
};

// ------------------------------------------------------------------
// Bookings
// ------------------------------------------------------------------
export const bookingApi = {
  checkAvailability: (roomId, startTime, endTime) =>
    request("/bookings/check-availability", {
      method: "POST",
      body: { room_id: roomId, start_time: startTime, end_time: endTime },
    }),
  create: (roomId, startTime, endTime) =>
    request("/bookings", { method: "POST", body: { room_id: roomId, start_time: startTime, end_time: endTime } }),
  listMine: () => request("/bookings"),
  get: (bookingId) => request(`/bookings/${bookingId}`),
  pay: (bookingId) => request(`/bookings/${bookingId}/pay`, { method: "POST" }),
  checkIn: (bookingId) => request(`/bookings/${bookingId}/checkin`, { method: "POST" }),
  extend: (bookingId, newEndTime) =>
    request(`/bookings/${bookingId}/extend`, { method: "POST", body: { new_end_time: newEndTime } }),
  checkout: (bookingId, autoCompleteCleaning = false) =>
    request(`/bookings/${bookingId}/checkout`, {
      method: "POST",
      body: { auto_complete_cleaning: autoCompleteCleaning },
    }),
  cancel: (bookingId) => request(`/bookings/${bookingId}/cancel`, { method: "POST" }),
};

// ------------------------------------------------------------------
// Admin
// ------------------------------------------------------------------
export const adminApi = {
  dashboard: () => request("/admin/dashboard"),
  updateRoomStatus: (roomId, roomState) =>
    request(`/admin/rooms/${roomId}/status`, { method: "PATCH", body: { room_state: roomState } }),
  markCleaningComplete: (roomId) =>
    request(`/admin/rooms/${roomId}/mark-cleaning-complete`, { method: "POST" }),
  reallocateBooking: (bookingId, newRoomId, newEndTime) =>
    request(`/admin/bookings/${bookingId}/reallocate`, {
      method: "POST",
      body: { new_room_id: newRoomId, new_end_time: newEndTime || undefined },
    }),
};
