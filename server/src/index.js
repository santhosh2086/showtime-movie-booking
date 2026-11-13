import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import Movie from "./models/Movie.js";
import Venue from "./models/Venue.js";
import SeatLock from "./models/SeatLock.js";
import Booking from "./models/Booking.js";
import { seed } from "./seed/seed.js";

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/showtime";

async function main() {
  await connectDB(MONGODB_URI);
  // make sure the unique seat index (and TTL indexes) exist before taking bookings
  await Promise.all([Movie.init(), Venue.init(), SeatLock.init(), Booking.init()]);
  if ((await Movie.estimatedDocumentCount()) === 0) await seed(); // first run

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("⚠ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — checkout will return 503 until you add them to .env");
  }

  const server = createApp().listen(PORT, () => console.log(`Showtime API on http://localhost:${PORT}`));

  const shutdown = () => server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
