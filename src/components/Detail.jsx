import { useEffect, useState } from "react";
import { api } from "../api.js";
import { nextDays, fillFor } from "../data/data.js";
import { Loading, ErrorNote } from "./Status.jsx";

export default function Detail({ item, dayIndex, setDayIndex, onBack, onPickShow }) {
  const days = nextDays(6);
  const [venueData, setVenueData] = useState(null); // { venues, times }
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api.getVenues()
      .then((d) => !cancelled && setVenueData(d))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [attempt]);

  return (
    <div className="view active">
      <div className="wrap back-row">
        <button onClick={onBack}>← Back to browse</button>
      </div>
      <div className="wrap">
        {!item ? (
          <div className="section"><p>We couldn't find that show.</p></div>
        ) : (
          <>
            <section className="detail-hero">
              <div className="detail-poster"><img src={item.poster} alt={`${item.title} poster`} /></div>
              <div className="detail-info">
                <span className="eyebrow">{item.type === "event" ? "Live event" : "Now showing"}</span>
                <h1>{item.title}</h1>
                <div className="detail-meta-row">
                  <span><b>{item.rating}</b></span>
                  <span>{item.lang}</span>
                  <span>{item.duration}</span>
                  <span>{item.genre.join(", ")}</span>
                </div>
                <p className="synopsis">{item.synopsis}</p>
              </div>
            </section>

            <section className="section">
              <span className="eyebrow">Select a date</span>
              <div className="day-picker">
                {days.map((d, i) => (
                  <button
                    key={i}
                    className={`day-btn ${i === dayIndex ? "active" : ""}`}
                    onClick={() => setDayIndex(i)}
                  >
                    <span className="d">{d.label}</span>
                    <span className="n">{d.num}</span>
                  </button>
                ))}
              </div>

              {error ? (
                <ErrorNote error={error} onRetry={() => setAttempt((a) => a + 1)} />
              ) : !venueData ? (
                <Loading text="Loading showtimes…" />
              ) : (
              <div>
                {venueData.venues.map((v) => (
                  <div className="venue-block" key={v.name}>
                    <div className="venue-name">{v.name}</div>
                    <div className="venue-loc">{v.loc}</div>
                    <div className="show-row">
                      {venueData.times.map((t) => {
                        const fill = fillFor(item.id, v.name, t + dayIndex);
                        const label = fill > 80 ? "Filling fast" : fill > 50 ? `${100 - fill}% left` : "Plenty left";
                        return (
                          <button className="show-time" key={t} onClick={() => onPickShow(v.name, t)}>
                            {t}
                            <span className="fill">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
