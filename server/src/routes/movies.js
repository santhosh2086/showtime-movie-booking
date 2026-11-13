import { Router } from "express";
import Movie from "../models/Movie.js";
import { HttpError, wrap } from "../utils/errors.js";

const router = Router();

// GET /api/movies?genre=Drama
router.get("/", wrap(async (req, res) => {
  const { genre } = req.query;
  const filter = {};
  if (genre !== undefined && genre !== "all") {
    if (typeof genre !== "string") throw new HttpError(400, "genre must be a string.");
    filter.genre = genre;
  }
  const movies = await Movie.find(filter).sort({ code: 1 });
  res.json(movies.map((m) => m.toClient()));
}));

// GET /api/movies/:id   (id is the short code, e.g. m1)
router.get("/:id", wrap(async (req, res) => {
  const movie = await Movie.findOne({ code: req.params.id });
  if (!movie) throw new HttpError(404, "Movie not found.");
  res.json(movie.toClient());
}));

export default router;
