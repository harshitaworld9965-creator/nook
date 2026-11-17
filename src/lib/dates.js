// All dates in Nook are local calendar days written as "YYYY-MM-DD".

const pad = (n) => String(n).padStart(2, "0");

export function iso(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today() {
  return iso(new Date());
}

export function parse(day) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day, n) {
  const d = parse(day);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function weekday(day) {
  return parse(day).getDay(); // 0 = Sunday
}

export function nowHM(d = new Date()) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function minutes(hm) {
  if (!hm) return null;
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function fmtDay(day, opts = { weekday: "long", day: "numeric", month: "long" }) {
  return parse(day).toLocaleDateString("en-IN", opts);
}

export function fmtStamp(ts) {
  const d = new Date(ts);
  const day = iso(d);
  const t = today();
  const label =
    day === t ? "Today" : day === addDays(t, -1) ? "Yesterday" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return `${label}, ${nowHM(d)}`;
}

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Does this item show up on this day?
export function occursOn(item, day) {
  if (item.repeat === "daily") return item.date <= day;
  if (item.repeat === "weekdays") {
    const w = weekday(day);
    return item.date <= day && w >= 1 && w <= 5;
  }
  if (item.repeat === "weekly") return item.date <= day && (item.days || []).includes(weekday(day));
  return item.date === day;
}

// Items for a day, with done state. Unfinished one-off items from earlier days roll over to today.
export function itemsForDay(items, completions, day) {
  const t = today();
  const doneSet = new Set(completions.filter((c) => c.day === day).map((c) => c.item_id));
  const out = [];
  for (const it of items) {
    const repeating = it.repeat && it.repeat !== "none";
    if (repeating) {
      if (occursOn(it, day)) out.push({ ...it, done: doneSet.has(it.id), carried: false });
    } else if (it.date === day) {
      out.push({ ...it, done: !!it.done_on, carried: false });
    } else if (day === t && it.date < t && !it.done_on) {
      out.push({ ...it, done: false, carried: true });
    } else if (it.done_on === day && it.date < day) {
      out.push({ ...it, done: true, carried: true });
    }
  }
  return out.sort(byTime);
}

export function byTime(a, b) {
  const ta = a.time || "99:99";
  const tb = b.time || "99:99";
  if (ta !== tb) return ta < tb ? -1 : 1;
  return (a.created_at || "") < (b.created_at || "") ? -1 : 1;
}

export function habitStreak(checkDays, day = today()) {
  // Counts back from today; if today isn't ticked yet, the streak from yesterday still stands.
  let d = checkDays.has(day) ? day : addDays(day, -1);
  let n = 0;
  while (checkDays.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
