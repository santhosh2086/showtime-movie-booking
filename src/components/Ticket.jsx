import { money } from "../data/data.js";

export default function Ticket({ booking: b }) {
  return (
    <div className="stub ticket">
      <div className="ticket-top">
        <span className="eyebrow">✓ Booking confirmed</span>
        <div className="ticket-movie">{b.showTitle}</div>
        <div className="venue-loc" style={{ margin: 0 }}>{b.venue}</div>
        <div className="ticket-grid">
          <div className="ticket-field"><div className="k">Showtime</div><div className="v">{b.time}</div></div>
          <div className="ticket-field"><div className="k">Seats</div><div className="v">{b.seats.join(", ")}</div></div>
          <div className="ticket-field"><div className="k">Guest</div><div className="v">{b.name}</div></div>
          <div className="ticket-field"><div className="k">Paid</div><div className="v">{money(b.total)}</div></div>
        </div>
      </div>
      <div className="stub-tear"></div>
      <div className="ticket-bottom">
        <div className="booking-id">Booking ID<b>{b.id}</b></div>
        <div className="qr-fake" title="Show this at the counter"></div>
      </div>
    </div>
  );
}
