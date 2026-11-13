import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Loading, ErrorNote } from "./Status.jsx";

const GENRES = ["all", "Action", "Drama", "Comedy", "Thriller", "Romance", "Horror"];
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1517602302552-471fe67acf66?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop"
];

function MovieCard({ item, onOpen }) {
  return (
    <button className="card" onClick={() => onOpen(item)}>
      <div className="poster">
        <img src={item.poster} alt={`${item.title} poster`} loading="lazy" />
        <span className="rating-badge">{item.rating}</span>
      </div>
      <div className="card-body">
        <div className="card-title">{item.title}</div>
        <div className="card-meta">{item.lang} · {item.duration}</div>
        <div className="chip-row">
          {item.genre.map((g) => (
            <span className="chip" key={g}>{g}</span>
          ))}
        </div>
      </div>
    </button>
  );
}

export default function Browse({ onOpen, genre, setGenre }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api.getMovies(genre)
      .then((data) => !cancelled && setList(data))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [genre, attempt]);

  return (
    <div className="view active">
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Now booking</span>
            <h1 className="display">Lights down.<br />Seats up.</h1>
            <p className="lede">
              Movies, stand-up, theatre and live music — pick a show, pick your seat, and skip the box-office queue entirely.
            </p>
            <div className="hero-actions">
              <a href="#movies-section" className="btn btn-primary">Browse movies</a>
            </div>
          </div>
          <div className="hero-reel">
            {HERO_IMAGES.map((src) => (
              <div className="reel-card" key={src}><img src={src} alt="" /></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section wrap" id="movies-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">In theatres</span>
            <h2 className="display">Movies</h2>
          </div>
          <div className="tabs">
            {GENRES.map((g) => (
              <button
                key={g}
                className={`tab ${genre === g ? "active" : ""}`}
                onClick={() => setGenre(g)}
              >
                {g === "all" ? "All" : g}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <ErrorNote error={error} onRetry={() => setAttempt((a) => a + 1)} />
        ) : list === null ? (
          <Loading text="Loading movies…" />
        ) : (
          <div className="grid">
            {list.length ? (
              list.map((item) => <MovieCard key={item.id} item={item} onOpen={onOpen} />)
            ) : (
              <p style={{ color: "#8A8FA3" }}>No movies match that filter right now.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
