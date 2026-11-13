import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true }, // e.g. ST-AB12CDE
    clientId: { type: String, required: true, index: true },   // anonymous browser id
    movieId: { type: String, required: true },
    showTitle: { type: String, required: true },
    poster: String,
    venue: { type: String, required: true },
    time: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    seats: { type: [String], required: true },
    subtotal: { type: Number, required: true },
    fee: { type: Number, required: true },
    total: { type: Number, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    // Razorpay
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: String,
    amountPaise: Number,
    // pending = seats held, awaiting payment · confirmed = paid
    // cancelled = customer closed the payment window / hold expired · refunded = paid but seats were lost
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "refunded"], default: "pending" }
  },
  { timestamps: true }
);
// unpaid bookings are cleaned up after a day (confirmed ones are kept forever)
bookingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400, partialFilterExpression: { status: "pending" } });

// Shape the frontend's Ticket component expects.
bookingSchema.methods.toClient = function () {
  return {
    id: this.bookingId,
    showId: this.movieId,
    showTitle: this.showTitle,
    poster: this.poster,
    venue: this.venue,
    time: this.time,
    date: this.date,
    seats: this.seats,
    subtotal: this.subtotal,
    fee: this.fee,
    total: this.total,
    name: this.name,
    email: this.email,
    phone: this.phone,
    paymentId: this.razorpayPaymentId,
    status: this.status,
    bookedAt: this.createdAt
  };
};

export default mongoose.model("Booking", bookingSchema);
