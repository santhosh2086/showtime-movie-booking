import { HttpError } from "./errors.js";
import { SEAT_PRICES, MAX_SEATS } from "./seats.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact({ name, email, phone }) {
  const errs = [];
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) errs.push("name");
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) errs.push("email");
  if (typeof phone !== "string" || phone.replace(/\D/g, "").length < 10) errs.push("phone");
  if (errs.length) throw new HttpError(400, `Invalid or missing: ${errs.join(", ")}.`);
}

export function validateSeats(seats) {
  if (!Array.isArray(seats) || seats.length === 0) throw new HttpError(400, "Select at least one seat.");
  if (seats.length > MAX_SEATS) throw new HttpError(400, `You can book at most ${MAX_SEATS} seats.`);
  if (!seats.every((s) => typeof s === "string" && SEAT_PRICES.has(s))) {
    throw new HttpError(400, "One or more seats are invalid.");
  }
  if (new Set(seats).size !== seats.length) throw new HttpError(400, "Duplicate seats.");
}

// Anonymous per-browser identity (the UI has no login). Sent as `x-client-id`.
export function getClientId(req) {
  const id = req.get("x-client-id");
  if (!id || id.length < 8 || id.length > 100) {
    throw new HttpError(400, "Missing or invalid x-client-id header.");
  }
  return id;
}
