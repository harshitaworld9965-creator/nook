import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { emptyData, getBackend, cascade } from "./backend.js";

const HAS_CREATED_AT = new Set(["items", "habits", "journal", "goals", "milestones"]);
const CACHE = "nook-cache-v1";

export function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE) || "null");
    return c ? { ...emptyData(), ...c } : null;
  } catch {
    return null;
  }
}

// One place that holds all of Nook's data and every change to it.
// Changes show on screen straight away, then save in the background.
export function useNook(mode) {
  const backend = useMemo(() => getBackend(mode), [mode]);
  const [data, setData] = useState(() => (mode === "cloud" && readCache()) || emptyData());
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const pending = useRef(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  const reload = useCallback(async () => {
    if (pending.current > 0) return;
    try {
      const d = await backend.load();
      setData(d);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("offline");
    }
  }, [backend]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (mode !== "cloud" || status !== "ready") return;
    try {
      localStorage.setItem(CACHE, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data, mode, status]);

  // Pick up changes made on your other devices when you come back to the app.
  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVis);
    let sub;
    if (Capacitor.isNativePlatform()) CapApp.addListener("resume", reload).then((h) => (sub = h));
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      sub?.remove();
    };
  }, [reload]);

  const run = useCallback(
    async (fn) => {
      pending.current++;
      try {
        await fn();
      } catch (e) {
        console.error(e);
        setError("That change didn't save. Check your internet and try again.");
        pending.current--;
        reload();
        return;
      }
      pending.current--;
    },
    [reload]
  );

  const add = useCallback(
    (table, fields) => {
      const row = { id: uuid(), ...(HAS_CREATED_AT.has(table) ? { created_at: new Date().toISOString() } : {}), ...fields };
      setData((d) => ({ ...d, [table]: [...d[table], row] }));
      run(() => backend.insert(table, row));
      return row;
    },
    [backend, run]
  );

  const patch = useCallback(
    (table, id, changes) => {
      setData((d) => ({ ...d, [table]: d[table].map((r) => (r.id === id ? { ...r, ...changes } : r)) }));
      run(() => backend.update(table, id, changes));
    },
    [backend, run]
  );

  const del = useCallback(
    (table, id) => {
      setData((d) => {
        const n = { ...d, [table]: d[table].filter((r) => r.id !== id) };
        cascade(n, table, id);
        return n;
      });
      run(() => backend.remove(table, id));
    },
    [backend, run]
  );

  // ----- everyday actions -----
  const setItemDone = useCallback(
    (itemId, day, done) => {
      const d = dataRef.current;
      const item = d.items.find((i) => i.id === itemId);
      if (!item) return;
      if (item.repeat && item.repeat !== "none") {
        const c = d.completions.find((x) => x.item_id === itemId && x.day === day);
        if (done && !c) add("completions", { item_id: itemId, day });
        if (!done && c) del("completions", c.id);
      } else {
        patch("items", itemId, { done_on: done ? day : null });
      }
    },
    [add, del, patch]
  );

  const dayRow = useCallback((day) => dataRef.current.days.find((r) => r.day === day), []);

  const addWater = useCallback(
    (day, ml) => {
      const r = dayRow(day);
      if (r) patch("days", r.id, { water_ml: Math.max(0, r.water_ml + ml) });
      else if (ml > 0) add("days", { day, water_ml: ml, mood: null });
    },
    [add, patch, dayRow]
  );

  const setMood = useCallback(
    (day, mood) => {
      const r = dayRow(day);
      if (r) patch("days", r.id, { mood });
      else add("days", { day, water_ml: 0, mood });
    },
    [add, patch, dayRow]
  );

  const toggleHabit = useCallback(
    (habitId, day) => {
      const c = dataRef.current.habit_checks.find((x) => x.habit_id === habitId && x.day === day);
      if (c) del("habit_checks", c.id);
      else add("habit_checks", { habit_id: habitId, day });
    },
    [add, del]
  );

  return {
    data,
    dataRef,
    status,
    error,
    clearError: () => setError(null),
    reload,
    add,
    patch,
    del,
    setItemDone,
    addWater,
    setMood,
    toggleHabit,
  };
}
