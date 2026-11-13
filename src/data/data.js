export const TIMES = ["10:15 AM", "1:30 PM", "4:45 PM", "7:30 PM", "10:00 PM"];

const pad = (n) => String(n).padStart(2, "0");

export function nextDays(n) {
  const days = [];
  const names = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: i === 0 ? "TODAY" : names[d.getDay()],
      num: d.getDate(),
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` // local YYYY-MM-DD
    });
  }
  return days;
}

// purely cosmetic "filling fast" label on the showtime buttons
export function fillFor(itemId, venue, time) {
  let hash = 0;
  const str = itemId + venue + time;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

export const money = (n) => `₹${n}`;
