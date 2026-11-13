import { Fragment, useEffect, useState } from "react";
import { api } from "../api.js";
import { nextDays, money } from "../data/data.js";
import { Loading, ErrorNote } from "./Status.jsx";

export default function Seats({ item, dayIndex, venue, time, onBack, onContinue }) {
  const date = nextDays(6)[dayIndex].date;
  const [layout, setLayout] = useState(null); // { tiers, fee, maxSeats }
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(() => new Set());

  // real seat availability comes from the server (pre-sold + already booked)
  useEffect(() => {
    let cancelled = false;
    setError(null);
    api.getSeats({ movieId: item.id, venue, time, date })
      .then((d) => !cancelled && setLayout(d))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [item.id, venue, time, date, attempt]);

  const priceOf = {};
  layout?.tiers.forEach((t) => t.rows.forEach((r) => r.seats.forEach((s) => { priceOf[s.key] = t.price; })));

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < layout.maxSeats) next.add(key);
      return next;
    });
  };

  const keys = [...selected].sort();
  const subtotal = keys.reduce((sum, k) => sum + priceOf[k], 0);
  const fee = keys.length * (layout?.fee ?? 0);
  const total = subtotal + fee;

  const handleContinue = () => {
    if (!keys.length) return;
    onContinue({
      movieId: item.id, showTitle: item.title, poster: item.poster,
      venue, time, date, day: dayIndex,
      seats: keys, subtotal, fee, total
    });
  };

  return (
    <div className="view active">
      <div className="wrap back-row">
        <button onClick={onBack}>← Change showtime</button>
      </div>
      <div className="wrap seat-shell">
        <div>
          <div className="screen-curve"></div>
          <div className="screen-label">screen this way</div>
          <div className="seat-map">
            {error ? (
              <ErrorNote error={error} onRetry={() => setAttempt((a) => a + 1)} />
            ) : !layout ? (
              <Loading text="Loading seats…" />
            ) : (
              layout.tiers.map((tier) => (
                <Fragment key={tier.key}>
                  <div className="tier-label">{tier.label} · ₹{tier.price}</div>
                  {tier.rows.map((r) => (
                    <div className="seat-row" key={r.row}>
                      <span className="row-label">{r.row}</span>
                      <div className="seats">
                        {r.seats.map((s) => {
                          const status = s.taken ? "taken" : selected.has(s.key) ? "selected" : "available";
                          return (
                            <Fragment key={s.key}>
                              <button
                                className={`seat ${status}`}
                                disabled={s.taken}
                                onClick={() => toggle(s.key)}
                              >
                                {s.n}
                              </button>
                              {s.n === 6 && <div className="seat-gap"></div>}
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </Fragment>
              ))
            )}
          </div>

          <div className="legend">
            <div className="legend-item"><div className="seat available" style={{ width: 18, height: 16 }}></div> Available</div>
            <div className="legend-item"><div className="seat selected" style={{ width: 18, height: 16 }}></div> Selected</div>
            <div className="legend-item"><div className="seat taken" style={{ width: 18, height: 16 }}></div> Taken</div>
          </div>
        </div>

        <div className="stub summary-panel">
          <h3>{item.title}</h3>
          <div className="summary-sub">{venue} · {time}</div>

          <div className="seat-list">
            {keys.length === 0 ? (
              <span className="empty-note">Tap seats on the map to add them here.</span>
            ) : (
              keys.map((k) => <span className="seat-tag" key={k}>{k}</span>)
            )}
          </div>

          <div className="stub-tear"></div>

          <div style={{ marginTop: 16 }}>
            <div className="price-line">
              <span>{keys.length} seat{keys.length === 1 ? "" : "s"}</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="price-line"><span>Convenience fee</span><span>{money(fee)}</span></div>
            <div className="price-line total"><span>Total</span><b>{money(total)}</b></div>
          </div>

          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 18 }}
            disabled={keys.length === 0}
            onClick={handleContinue}
          >
            {keys.length === 0 ? "Select seats to continue" : `Continue · ${money(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
