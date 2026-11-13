import { Router } from "express";
import SeatLock from "../models/SeatLock.js";
import { wrap } from "../utils/errors.js";
import { resolveShow } from "../utils/show.js";
import { buildLayout } from "../utils/seats.js";

const router = Router();

// GET /api/shows/seats?movieId=m1&venue=...&time=7:30 PM&date=2026-11-14
router.get("/seats", wrap(async (req, res) => {
  const { show } = await resolveShow(req.query);
  const booked = await SeatLock.find(show).distinct("seat");
  res.json(buildLayout(show, booked));
}));

export default router;
