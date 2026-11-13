import { Router } from "express";
import crypto from "node:crypto";
import Booking from "../models/Booking.js";
import SeatLock from "../models/SeatLock.js";
import { getRazorpay, razorpayKeyId } from "../config/razorpay.js";
import { HttpError, wrap } from "../utils/errors.js";
import { resolveShow } from "../utils/show.js";
import { validateContact, validateSeats, getClientId } from "../utils/validate.js";
import { presoldSeats, priceFor } from "../utils/seats.js";
import { verifyPaymentSignature, verifyWebhookSignature } from "../utils/razorpaySig.js";
import { confirmPaid, releaseSeats, holdMinutes } from "../utils/payments.js";

const router = Router();

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genBookingId() {
  const bytes = crypto.randomBytes(7);
  let id = "ST-";
  for (let i = 0; i < 7; i++) id += ID_CHARS[bytes[i] % ID_CHARS.length];
  return id;
}
const isDup = (err) => err?.code === 11000 || err?.writeErrors?.some((e) => e.code === 11000);
const str = (v) => (typeof v === "string" ? v : "");

/**
 * POST /api/payments/order
 * Validates the selection, holds the seats, and creates a Razorpay order.
 * The amount is always computed here — the browser never sends a price.
 */
router.post("/order", wrap(async (req, res) => {
  const clientId = getClientId(req);
  const body = req.body || {};
  validateContact(body);
  validateSeats(body.seats);
  const rzp = getRazorpay();
  const { movie, show } = await resolveShow(body);
  const seatKeys = [...body.seats].sort();

  const presold = presoldSeats(show);
  const unavailable = seatKeys.filter((s) => presold.has(s));
  if (unavailable.length) {
    throw new HttpError(409, `Seats already taken: ${unavailable.join(", ")}.`, { seats: unavailable });
  }

  // drop expired holds that the TTL job hasn't reaped yet, and this browser's own earlier
  // unpaid attempt for the same show (e.g. closed the popup and retried)
  await SeatLock.deleteMany({ ...show, expiresAt: { $lt: new Date() } });
  const stale = await Booking.find({ clientId, status: "pending", ...show });
  for (const b of stale) {
    await releaseSeats(b.bookingId);
    await Booking.updateOne({ _id: b._id }, { $set: { status: "cancelled" } });
  }

  const bookingId = genBookingId();
  const expiresAt = new Date(Date.now() + holdMinutes() * 60 * 1000);

  // hold the seats (unique index => nobody else can take them)
  try {
    await SeatLock.insertMany(seatKeys.map((seat) => ({ ...show, seat, bookingId, expiresAt })), { ordered: true });
  } catch (err) {
    await releaseSeats(bookingId);
    if (isDup(err)) {
      const taken = await SeatLock.find({ ...show, seat: { $in: seatKeys } }).distinct("seat");
      throw new HttpError(409, `Seats already taken: ${taken.join(", ") || "some seats"}.`, { seats: taken });
    }
    throw err;
  }

  const { subtotal, fee, total } = priceFor(seatKeys);
  const amountPaise = total * 100;

  let order;
  try {
    order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: bookingId,
      notes: { bookingId, movie: movie.title, venue: show.venue, time: show.time, date: show.date, seats: seatKeys.join(",") }
    });
  } catch (err) {
    await releaseSeats(bookingId);
    console.error("Razorpay order creation failed:", err?.error?.description || err.message);
    throw new HttpError(502, "Couldn't start the payment. Please try again.");
  }

  try {
    await Booking.create({
      bookingId, clientId,
      movieId: show.movieId, showTitle: movie.title, poster: movie.poster,
      venue: show.venue, time: show.time, date: show.date,
      seats: seatKeys, subtotal, fee, total,
      name: body.name.trim(), email: body.email.trim().toLowerCase(), phone: body.phone.trim(),
      razorpayOrderId: order.id, amountPaise, status: "pending"
    });
  } catch (err) {
    await releaseSeats(bookingId);
    throw err;
  }

  res.status(201).json({
    keyId: razorpayKeyId(),
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    bookingId,
    description: `${movie.title} · ${show.venue} · ${show.time}`,
    holdMinutes: holdMinutes()
  });
}));

/**
 * POST /api/payments/verify
 * Called by the browser after Razorpay Checkout succeeds. We trust nothing until the
 * HMAC signature checks out, then confirm the booking.
 */
router.post("/verify", wrap(async (req, res) => {
  const clientId = getClientId(req);
  const orderId = str(req.body?.razorpay_order_id);
  const paymentId = str(req.body?.razorpay_payment_id);
  const signature = str(req.body?.razorpay_signature);

  if (!verifyPaymentSignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET)) {
    throw new HttpError(400, "Payment verification failed.");
  }
  const booking = await Booking.findOne({ razorpayOrderId: orderId, clientId });
  if (!booking) throw new HttpError(404, "Booking not found for this payment.");

  const confirmed = await confirmPaid(booking, paymentId);
  res.json(confirmed.toClient());
}));

/**
 * POST /api/payments/cancel   { orderId }
 * Customer closed the payment window: release the held seats right away.
 * Only affects bookings that are still unpaid.
 */
router.post("/cancel", wrap(async (req, res) => {
  const clientId = getClientId(req);
  const orderId = str(req.body?.orderId);
  const booking = await Booking.findOneAndUpdate(
    { razorpayOrderId: orderId, clientId, status: "pending" },
    { $set: { status: "cancelled" } }
  );
  if (booking) await releaseSeats(booking.bookingId);
  res.json({ ok: true });
}));

/**
 * POST /api/payments/webhook   (mounted with a raw body parser in app.js)
 * Safety net: confirms the booking even if the customer's browser closed after paying.
 */
export async function webhookHandler(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "Webhook not configured." });

  const raw = req.body; // Buffer
  if (!verifyWebhookSignature(raw, req.get("x-razorpay-signature"), secret)) {
    return res.status(400).json({ error: "Invalid signature." });
  }

  try {
    const event = JSON.parse(raw.toString("utf8"));
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        const booking = await Booking.findOne({ razorpayOrderId: payment.order_id });
        if (booking) {
          await confirmPaid(booking, payment.id).catch((e) => console.error("Webhook confirm:", e.message));
        }
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed." }); // Razorpay will retry
  }
}

export default router;
