// Thin client for the Showtime API. In dev, Vite proxies /api to the Express server.
const BASE = "https://showtime-movie-booking.onrender.com/api";

// The UI has no login, so each browser gets an anonymous id used to scope "My bookings".
function clientId() {
  try {
    let id = localStorage.getItem("showtimeClientId");
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("showtimeClientId", id);
    }
    return id;
  } catch {
    return (window.__showtimeCid ||= `c-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }
}

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "x-client-id": clientId() },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "Request failed.", data);
  return data;
}

const qs = (o) => new URLSearchParams(o).toString();

export const api = {
  getMovies: (genre = "all") => request(`/movies?${qs({ genre })}`),
  getVenues: () => request("/venues"),
  getSeats: ({ movieId, venue, time, date }) => request(`/shows/seats?${qs({ movieId, venue, time, date })}`),
  createOrder: (payload) => request("/payments/order", { method: "POST", body: payload }),
  verifyPayment: (payload) => request("/payments/verify", { method: "POST", body: payload }),
  cancelOrder: (orderId) => request("/payments/cancel", { method: "POST", body: { orderId } }),
  getBookings: () => request("/bookings")
};
