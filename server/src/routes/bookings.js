import { Router } from "express";
import Booking from "../models/Booking.js";
import { HttpError, wrap } from "../utils/errors.js";
import { getClientId } from "../utils/validate.js";

// Bookings are created only by a verified Razorpay payment (see routes/payments.js).
const router = Router();

// GET /api/bookings  -> this browser's paid bookings, newest first
router.get("/", wrap(async (req, res) => {
  const clientId = getClientId(req);
  const list = await Booking.find({ clientId, status: "confirmed" }).sort({ createdAt: -1 });
  res.json(list.map((b) => b.toClient()));
}));

// GET /api/bookings/:id
router.get("/:id", wrap(async (req, res) => {
  const clientId = getClientId(req);
  const booking = await Booking.findOne({ bookingId: req.params.id, clientId, status: "confirmed" });
  if (!booking) throw new HttpError(404, "Booking not found.");
  res.json(booking.toClient());
}));

export default router;
