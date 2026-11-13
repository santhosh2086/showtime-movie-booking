export default function Header({ onNav }) {
  return (
    <header className="top">
      <div className="wrap top-inner">
        <button className="brand" onClick={() => onNav("browse")}>
          SHOW<span>TIME</span>
        </button>
        <nav className="top-nav">
          <button className="nav-link" onClick={() => onNav("browse")}>Browse</button>
          <button className="nav-link" onClick={() => onNav("bookings")}>My bookings</button>
        </nav>
        <div className="city-pill">📍 <strong>Madurai</strong></div>
      </div>
    </header>
  );
}
