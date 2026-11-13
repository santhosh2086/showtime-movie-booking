import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Browse from "./components/Browse.jsx";
import Detail from "./components/Detail.jsx";
import Seats from "./components/Seats.jsx";
import Checkout from "./components/Checkout.jsx";

export default function App() {
  const [view, setView] = useState("browse");
  const [item, setItem] = useState(null);
  const [genre, setGenre] = useState("all");
  const [dayIndex, setDayIndex] = useState(0);
  const [venue, setVenue] = useState(null);
  const [time, setTime] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);

  // scroll to top whenever the view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const navigate = (name) => setView(name);

  const handleNav = (target) => {
    if (target === "bookings") {
      setPendingBooking(null);
      setView("checkout");
    } else {
      setView(target);
    }
  };

  return (
    <>
      <Header onNav={handleNav} />

      {view === "browse" && (
        <Browse
          genre={genre}
          setGenre={setGenre}
          onOpen={(movie) => {
            setItem(movie);
            setDayIndex(0);
            navigate("detail");
          }}
        />
      )}

      {view === "detail" && (
        <Detail
          item={item}
          dayIndex={dayIndex}
          setDayIndex={setDayIndex}
          onBack={() => navigate("browse")}
          onPickShow={(v, t) => {
            setVenue(v);
            setTime(t);
            navigate("seats");
          }}
        />
      )}

      {view === "seats" && (
        <Seats
          item={item}
          dayIndex={dayIndex}
          venue={venue}
          time={time}
          onBack={() => navigate("detail")}
          onContinue={(booking) => {
            setPendingBooking(booking);
            navigate("checkout");
          }}
        />
      )}

      {view === "checkout" && (
        <Checkout
          pendingBooking={pendingBooking}
          onPaid={() => setPendingBooking(null)}
          onSeatConflict={() => {
            setPendingBooking(null);
            navigate("seats");
          }}
          onBackToSeats={() => navigate("seats")}
          onBrowse={() => navigate("browse")}
        />
      )}

      <Footer />
    </>
  );
}
