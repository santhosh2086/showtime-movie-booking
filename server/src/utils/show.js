import Movie from "../models/Movie.js";
import Venue from "../models/Venue.js";
import { HttpError } from "./errors.js";
import { TIMES } from "./seats.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const isStr = (v) => typeof v === "string";

/**
 * Validate and resolve the identifiers that define a show.
 * Returns { movie, venue, show } where show = { movieId, venue, time, date }.
 */
export async function resolveShow({ movieId, venue, time, date }) {
  if (![movieId, venue, time, date].every(isStr)) {
    throw new HttpError(400, "movieId, venue, time and date are required.");
  }
  if (!TIMES.includes(time)) throw new HttpError(400, "Unknown showtime.");

  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
    throw new HttpError(400, "date must be YYYY-MM-DD.");
  }
  // allow yesterday..+30 days (tolerates client/server timezone differences)
  const diffDays = (Date.parse(date) - Date.now()) / DAY_MS;
  if (diffDays < -2 || diffDays > 30) throw new HttpError(400, "That date is not open for booking.");

  const [movieDoc, venueDoc] = await Promise.all([
    Movie.findOne({ code: movieId }),
    Venue.findOne({ name: venue })
  ]);
  if (!movieDoc) throw new HttpError(404, "Movie not found.");
  if (!venueDoc) throw new HttpError(404, "Venue not found.");

  return { movie: movieDoc, venue: venueDoc, show: { movieId, venue, time, date } };
}
