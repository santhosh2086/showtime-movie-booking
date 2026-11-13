import { useEffect, useState } from "react";
import Ticket from "./Ticket.jsx";
import { api } from "../api.js";
import { loadRazorpay } from "../razorpay.js";
import { money } from "../data/data.js";
import { Loading, ErrorNote } from "./Status.jsx";

function BookingsList({ onBrowse }) {
  const [all, setAll] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getBookings()
      .then((d) => !cancelled && setAll(d))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, []);

  if (error) return <ErrorNote error={error} />;
  if (all === null) return <Loading text="Loading your bookings…" />;
  if (all.length === 0) {
    return (
      <section className="section" style={{ textAlign: "center", paddingTop: 70 }}>
        <span className="eyebrow">My bookings</span>
        <h2 className="display">Nothing booked yet.</h2>
        <p style={{ color: "#8A8FA3", margin: "14px 0 26px" }}>
          Pick a movie or event and your tickets will show up here.
        </p>
        <button className="btn btn-primary" onClick={onBrowse}>Browse shows</button>
      </section>
    );
  }
  return (
    <section className="section">
      <span className="eyebrow">My bookings</span>
      <h2 className="display" style={{ marginBottom: 26 }}>Your tickets</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 460 }}>
        {all.map((b) => <Ticket key={b.id} booking={b} />)}
      </div>
    </section>
  );
}

function CheckoutForm({ booking: b, onPaid, onSeatConflict }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);

  const fail = (e) => {
    setProcessing(false);
    alert(e.message);
    if (e.status === 409) onSeatConflict(); // seats were taken: pick again
  };

  const handlePay = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      alert("Please fill in your name, email and phone to continue.");
      return;
    }
    setProcessing(true);
    let order;
    try {
      // server validates, holds the seats and creates the Razorpay order (price is computed server-side)
      [order] = await Promise.all([
        api.createOrder({
          movieId: b.movieId, venue: b.venue, time: b.time, date: b.date, seats: b.seats,
          name: name.trim(), email: email.trim(), phone: phone.trim()
        }),
        loadRazorpay()
      ]);
    } catch (e) {
      return fail(e);
    }

    let finished = false;
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Showtime",
      description: order.description,
      prefill: { name: name.trim(), email: email.trim(), contact: phone.trim() },
      theme: { color: "#E6435A" },
      handler: async (resp) => {
        finished = true;
        try {
          // the server checks Razorpay's signature before confirming anything
          const booking = await api.verifyPayment({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature
          });
          onPaid(booking);
        } catch (e) {
          fail(e);
        }
      },
      modal: {
        ondismiss: () => {
          if (finished) return;
          api.cancelOrder(order.orderId).catch(() => {}); // release the held seats
          setProcessing(false);
        }
      }
    });
    rzp.on("payment.failed", (r) => alert(r?.error?.description || "Payment failed. Please try again."));
    rzp.open();
  };

  return (
    <div className="checkout-shell">
      <div>
        <div className="stub form-block">
          <h3>Contact details</h3>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" type="text" placeholder="As on your ID" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" type="tel" placeholder="10-digit number" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="stub form-block">
          <h3>Payment</h3>
          <p style={{ color: "#8A8FA3", fontSize: 14 }}>
            Pay securely with Razorpay — UPI, cards, netbanking and wallets. Your seats are held while you pay.
          </p>
        </div>
      </div>

      <div className="stub summary-panel">
        <h3>{b.showTitle}</h3>
        <div className="summary-sub">{b.venue} · {b.time}</div>
        <div className="seat-list">
          {b.seats.map((s) => <span className="seat-tag" key={s}>{s}</span>)}
        </div>
        <div className="stub-tear"></div>
        <div style={{ marginTop: 16 }}>
          <div className="price-line"><span>Tickets ({b.seats.length})</span><span>{money(b.subtotal)}</span></div>
          <div className="price-line"><span>Convenience fee</span><span>{money(b.fee)}</span></div>
          <div className="price-line total"><span>Total</span><b>{money(b.total)}</b></div>
        </div>
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 18 }}
          disabled={processing}
          onClick={handlePay}
        >
          {processing ? "Waiting for payment…" : `Pay ${money(b.total)}`}
        </button>
        <p style={{ fontSize: 11.5, color: "#8A8FA3", marginTop: 10, textAlign: "center" }}>
          Secured by Razorpay.
        </p>
      </div>
    </div>
  );
}

function Confirmation({ booking: b, onBrowse, onViewBookings }) {
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span className="eyebrow">All set</span>
        <h2 className="display">Enjoy the show, {b.name.split(" ")[0]}.</h2>
      </div>
      <Ticket booking={b} />
      <div className="confirm-actions">
        <button className="btn btn-ghost" onClick={onBrowse}>Back to browse</button>
        <button className="btn btn-primary" onClick={onViewBookings}>View my bookings</button>
      </div>
    </section>
  );
}

export default function Checkout({ pendingBooking, onPaid, onSeatConflict, onBackToSeats, onBrowse }) {
  const [confirmed, setConfirmed] = useState(null);

  let content;
  if (confirmed) {
    content = <Confirmation booking={confirmed} onBrowse={onBrowse} onViewBookings={() => setConfirmed(null)} />;
  } else if (pendingBooking) {
    content = (
      <CheckoutForm
        booking={pendingBooking}
        onSeatConflict={onSeatConflict}
        onPaid={(booking) => {
          setConfirmed(booking);
          onPaid();
        }}
      />
    );
  } else {
    content = <BookingsList onBrowse={onBrowse} />;
  }

  return (
    <div className="view active">
      {pendingBooking && !confirmed && (
        <div className="wrap back-row">
          <button onClick={onBackToSeats}>← Change seats</button>
        </div>
      )}
      <div className="wrap">{content}</div>
    </div>
  );
}
