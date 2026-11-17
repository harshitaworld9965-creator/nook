import { supabase } from "./supabase.js";

export const TABLES = ["items", "completions", "habits", "habit_checks", "journal", "days", "goals", "milestones"];

export function emptyData() {
  return Object.fromEntries(TABLES.map((t) => [t, []]));
}

// Cloud: Supabase, synced across phone, tablet and laptop.
async function fetchAll(table) {
  const size = 1000;
  let from = 0;
  let rows = [];
  for (;;) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + size - 1);
    if (error) throw error;
    rows = rows.concat(data);
    if (data.length < size) return rows;
    from += size;
  }
}

const cloud = {
  async load() {
    const lists = await Promise.all(TABLES.map(fetchAll));
    return Object.fromEntries(TABLES.map((t, i) => [t, lists[i]]));
  },
  async insert(table, row) {
    const { user_id, ...clean } = row;
    const { error } = await supabase.from(table).insert(clean);
    if (error) throw error;
  },
  async update(table, id, patch) {
    const { error } = await supabase.from(table).update(patch).eq("id", id);
    if (error) throw error;
  },
  async remove(table, id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
  },
};

// Local: this device only, for trying the app without an account.
const KEY = "nook-local-v1";
function readLocal() {
  try {
    return { ...emptyData(), ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return emptyData();
  }
}
function writeLocal(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full or unavailable */
  }
}
const local = {
  async load() {
    return readLocal();
  },
  async insert(table, row) {
    const d = readLocal();
    d[table] = [...d[table], row];
    writeLocal(d);
  },
  async update(table, id, patch) {
    const d = readLocal();
    d[table] = d[table].map((r) => (r.id === id ? { ...r, ...patch } : r));
    writeLocal(d);
  },
  async remove(table, id) {
    const d = readLocal();
    d[table] = d[table].filter((r) => r.id !== id);
    cascade(d, table, id);
    writeLocal(d);
  },
};

// When a parent row goes, its children go too (the database does this itself for the cloud).
export function cascade(d, table, id) {
  if (table === "items") d.completions = d.completions.filter((c) => c.item_id !== id);
  if (table === "habits") d.habit_checks = d.habit_checks.filter((c) => c.habit_id !== id);
  if (table === "goals") d.milestones = d.milestones.filter((m) => m.goal_id !== id);
}

export function getBackend(mode) {
  return mode === "local" ? local : cloud;
}
