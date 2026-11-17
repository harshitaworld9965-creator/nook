import { addDays, iso, itemsForDay, minutes, today, weekday, habitStreak } from "./dates.js";

export function doneCountByDay(data) {
  const m = new Map();
  const bump = (d) => m.set(d, (m.get(d) || 0) + 1);
  data.completions.forEach((c) => bump(c.day));
  data.items.forEach((i) => i.done_on && bump(i.done_on));
  return m;
}

export function countBy(list, key) {
  const m = new Map();
  list.forEach((r) => {
    const d = key(r);
    m.set(d, (m.get(d) || 0) + 1);
  });
  return m;
}

export function focusHours(dayItems) {
  let mins = 0;
  for (const i of dayItems) {
    if (i.kind === "block" && i.done && i.time && i.end_time) mins += Math.max(0, minutes(i.end_time) - minutes(i.time));
  }
  return Math.round((mins / 60) * 10) / 10;
}

export function weekCounts(data) {
  const t = today();
  return Array.from({ length: 7 }, (_, n) => {
    const day = addDays(t, n - 6);
    return { day, count: itemsForDay(data.items, data.completions, day).filter((i) => i.done).length };
  });
}

export function habitInfo(data) {
  return data.habits
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    .map((h) => {
      const days = new Set(data.habit_checks.filter((c) => c.habit_id === h.id).map((c) => c.day));
      return { ...h, checks: days, streak: habitStreak(days) };
    });
}

const LEVELS = {
  all: [1, 3, 5, 8],
  plan: [1, 3, 5, 8],
  habits: [1, 2, 3, 4],
  journal: [1, 2, 3, 4],
};

// 52 weeks of days, Monday to Sunday, ending this week.
export function heatmap(data, filter) {
  const t = today();
  const start = addDays(t, -((weekday(t) + 6) % 7) - 51 * 7);
  const plan = doneCountByDay(data);
  const habits = countBy(data.habit_checks, (c) => c.day);
  const journal = countBy(data.journal, (j) => iso(new Date(j.created_at)));
  const pick = (d) =>
    filter === "plan" ? plan.get(d) || 0 : filter === "habits" ? habits.get(d) || 0 : filter === "journal" ? journal.get(d) || 0 : (plan.get(d) || 0) + (habits.get(d) || 0) + (journal.get(d) || 0);
  const steps = LEVELS[filter];
  const cells = [];
  for (let d = start; d <= t; d = addDays(d, 1)) {
    const v = pick(d);
    const level = v === 0 ? 0 : steps.filter((s) => v >= s).length;
    cells.push({ day: d, v, level, today: d === t });
  }
  return cells;
}
