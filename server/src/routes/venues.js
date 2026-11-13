import { Router } from "express";
import Venue from "../models/Venue.js";
import { wrap } from "../utils/errors.js";
import { TIMES } from "../utils/seats.js";

const router = Router();

// GET /api/venues  ->  { venues: [{name, loc}], times: [...] }
router.get("/", wrap(async (_req, res) => {
  const venues = await Venue.find().sort({ order: 1 });
  res.json({ venues: venues.map((v) => v.toClient()), times: TIMES });
}));

export default router;
