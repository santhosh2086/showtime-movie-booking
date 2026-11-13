import express from "express";
import cors from "cors";
import movies from "./routes/movies.js";
import venues from "./routes/venues.js";
import shows from "./routes/shows.js";
import bookings from "./routes/bookings.js";
import payments, { webhookHandler } from "./routes/payments.js";

export function createApp() {
  const app = express();

  const origins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",").map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins }));
  // Razorpay webhook needs the *raw* body to verify its signature, so mount it before express.json()
  app.post("/api/payments/webhook", express.raw({ type: "application/json", limit: "100kb" }), webhookHandler);
  app.use(express.json({ limit: "20kb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/movies", movies);
  app.use("/api/venues", venues);
  app.use("/api/shows", shows);
  app.use("/api/bookings", bookings);
  app.use("/api/payments", payments);

  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body." });
    if (err.status) return res.status(err.status).json({ error: err.message, ...err.extra });
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Something went wrong on our side." });
  });

  return app;
}
