import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true }, // e.g. "m1"
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["movie", "event"], default: "movie" },
    genre: { type: [String], default: [] },
    lang: String,
    rating: String,
    duration: String,
    poster: String,
    synopsis: String
  },
  { timestamps: true }
);
movieSchema.index({ genre: 1 });

// The frontend refers to a movie by its short code under the key `id`.
movieSchema.methods.toClient = function () {
  const { code, title, type, genre, lang, rating, duration, poster, synopsis } = this;
  return { id: code, title, type, genre, lang, rating, duration, poster, synopsis };
};

export default mongoose.model("Movie", movieSchema);
