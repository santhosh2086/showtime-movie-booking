export const SEAT_TIERS = [
  { key: "gold", label: "Gold", price: 380, rows: ["A", "B"] },
  { key: "prime", label: "Prime", price: 280, rows: ["C", "D", "E", "F"] },
  { key: "classic", label: "Classic", price: 180, rows: ["G", "H"] }
];
export const SEATS_PER_ROW = 12;
export const FEE_PER_SEAT = 15;
export const MAX_SEATS = 10;
export const TIMES = ["10:15 AM", "1:30 PM", "4:45 PM", "7:30 PM", "10:00 PM"];

// seat key -> price
export const SEAT_PRICES = (() => {
  const map = new Map();
  for (const t of SEAT_TIERS) {
    for (const row of t.rows) {
      for (let n = 1; n <= SEATS_PER_ROW; n++) map.set(`${row}${n}`, t.price);
    }
  }
  return map;
})();

export function seedRand(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

/**
 * Seats that are already "sold" before anyone uses the app — keeps the demo
 * seat map looking realistic. Deterministic per show (movie/venue/time/date).
 */
export function presoldSeats({ movieId, venue, time, date }) {
  const rand = seedRand(movieId + venue + time + date);
  const taken = new Set();
  for (const t of SEAT_TIERS) {
    for (const row of t.rows) {
      for (let n = 1; n <= SEATS_PER_ROW; n++) {
        if (rand() < 0.22) taken.add(`${row}${n}`);
      }
    }
  }
  return taken;
}

export function priceFor(seatKeys) {
  const subtotal = seatKeys.reduce((sum, k) => sum + SEAT_PRICES.get(k), 0);
  const fee = seatKeys.length * FEE_PER_SEAT;
  return { subtotal, fee, total: subtotal + fee };
}

/** Seat map for one show: tiers -> rows -> seats with `taken` flags. */
export function buildLayout(show, bookedSeats = []) {
  const taken = presoldSeats(show);
  for (const s of bookedSeats) taken.add(s);
  return {
    fee: FEE_PER_SEAT,
    maxSeats: MAX_SEATS,
    tiers: SEAT_TIERS.map((t) => ({
      key: t.key,
      label: t.label,
      price: t.price,
      rows: t.rows.map((row) => ({
        row,
        seats: Array.from({ length: SEATS_PER_ROW }, (_, i) => {
          const key = `${row}${i + 1}`;
          return { key, n: i + 1, taken: taken.has(key) };
        })
      }))
    }))
  };
}
