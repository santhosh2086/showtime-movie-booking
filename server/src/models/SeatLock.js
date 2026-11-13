import mongoose from "mongoose";

/**
 * One document per booked seat per show. The unique compound index is what
 * guarantees two people can never book the same seat, even under concurrent
 * requests (no replica-set transaction needed).
 */
const seatLockSchema = new mongoose.Schema({
  movieId: { type: String, required: true },
  venue: { type: String, required: true },
  time: { type: String, required: true },
  date: { type: String, required: true },
  seat: { type: String, required: true },
  bookingId: { type: String, required: true, index: true },
  // Set only while a payment is pending; removed once the booking is confirmed.
  // The TTL index below frees abandoned holds automatically (confirmed locks have no expiresAt).
  expiresAt: { type: Date }
});
seatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
seatLockSchema.index({ movieId: 1, venue: 1, time: 1, date: 1, seat: 1 }, { unique: true });

export default mongoose.model("SeatLock", seatLockSchema);
