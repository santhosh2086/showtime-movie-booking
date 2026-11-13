import "dotenv/config";
import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import Venue from "../models/Venue.js";
import { connectDB } from "../config/db.js";
import { MOVIES, VENUES } from "./data.js";

/** Upserts movies and venues (safe to run repeatedly; never touches bookings). */
export async function seed() {
  await Movie.bulkWrite(
    MOVIES.map((m) => ({ updateOne: { filter: { code: m.code }, update: { $set: m }, upsert: true } }))
  );
  await Venue.bulkWrite(
    VENUES.map((v, i) => ({ updateOne: { filter: { name: v.name }, update: { $set: { ...v, order: i } }, upsert: true } }))
  );
  console.log(`Seeded ${MOVIES.length} movies and ${VENUES.length} venues.`);
}

// run directly: `npm run seed`
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await connectDB(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/showtime");
    await seed();
  } finally {
    await mongoose.disconnect();
  }
}
