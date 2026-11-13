import Booking from "../models/Booking.js";
import SeatLock from "../models/SeatLock.js";
import { getRazorpay } from "../config/razorpay.js";
import { HttpError } from "./errors.js";

const isDup = (err) => err?.code === 11000 || err?.writeErrors?.some((e) => e.code === 11000);

export const holdMinutes = () => Math.max(1, Number(process.env.HOLD_MINUTES) || 15);

/** Release every seat held by a booking. */
export const releaseSeats = (bookingId) => SeatLock.deleteMany({ bookingId });

/**
 * Mark a pending booking as paid. Safe to call more than once and from both the
 * browser callback and the webhook (whichever arrives first wins, the other is a no-op).
 *
 * If the 15-minute hold expired and someone else took a seat in the meantime, the
 * payment is refunded automatically and a 409 is thrown.
 */
export async function confirmPaid(booking, paymentId) {
  if (booking.status === "confirmed") return booking;
  if (booking.status === "refunded") throw new HttpError(409, "These seats were released and your payment has been refunded.");

  const show = { movieId: booking.movieId, venue: booking.venue, time: booking.time, date: booking.date };

  // make sure we still own every seat (the hold may have expired while paying)
  const held = await SeatLock.find({ bookingId: booking.bookingId }).distinct("seat");
  const missing = booking.seats.filter((s) => !held.includes(s));
  if (missing.length) {
    try {
      await SeatLock.insertMany(
        missing.map((seat) => ({ ...show, seat, bookingId: booking.bookingId })),
        { ordered: true }
      );
    } catch (err) {
      if (!isDup(err)) throw err;
      // seats were sold to someone else: give the money back
      await releaseSeats(booking.bookingId);
      await Booking.updateOne({ _id: booking._id, status: "pending" }, { $set: { status: "refunded", razorpayPaymentId: paymentId } });
      try {
        await getRazorpay().payments.refund(paymentId, { speed: "normal", notes: { reason: "Seats no longer available" } });
      } catch (refundErr) {
        console.error(`REFUND FAILED for payment ${paymentId} (booking ${booking.bookingId}) — refund manually:`, refundErr?.error?.description || refundErr.message);
      }
      throw new HttpError(409, "Sorry — your seats were taken while you were paying. Your payment will be refunded automatically.");
    }
  }

  // atomically flip pending -> confirmed
  const confirmed = await Booking.findOneAndUpdate(
    { _id: booking._id, status: "pending" },
    { $set: { status: "confirmed", razorpayPaymentId: paymentId } },
    { new: true }
  );
  if (!confirmed) return (await Booking.findById(booking._id)); // someone else confirmed first
  await SeatLock.updateMany({ bookingId: booking.bookingId }, { $unset: { expiresAt: 1 } }); // hold becomes permanent
  return confirmed;
}
