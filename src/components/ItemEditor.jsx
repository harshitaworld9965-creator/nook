import { useState } from "react";
import { Sheet, Chips, Icon } from "./ui.jsx";
import { today, DAY_SHORT, weekday } from "../lib/dates.js";

const KINDS = [
  ["todo", "To-do"],
  ["reminder", "Reminder"],
  ["routine", "Routine"],
  ["block", "Schedule block"],
];
const REPEATS = [
  ["none", "Once"],
  ["daily", "Every day"],
  ["weekdays", "Mon to Fri"],
  ["weekly", "Some days"],
];

// Add or edit anything on your day: to-dos, reminders, routines and schedule blocks.
export default function ItemEditor({ item, day, onSave, onDelete, onClose }) {
  const editing = !!item?.id;
  const [f, setF] = useState(() => ({
    title: item?.title || "",
    kind: item?.kind || "todo",
    date: item?.date || day || today(),
    time: item?.time || "",
    end_time: item?.end_time || "",
    repeat: item?.repeat || "none",
    days: item?.days?.length ? item.days : [weekday(day || today())],
    notify: item ? !!item.notify : false,
    touchedNotify: editing,
  }));
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const setKind = (kind) =>
    setF((x) => ({ ...x, kind, notify: x.touchedNotify ? x.notify : kind !== "todo" && !!x.time }));
  const setTime = (time) =>
    setF((x) => ({ ...x, time, notify: x.touchedNotify ? x.notify : x.kind !== "todo" && !!time }));

  const problem = !f.title.trim()
    ? "Give it a name."
    : f.notify && !f.time
    ? "Pick a time so it can ring."
    : f.repeat === "weekly" && !f.days.length
    ? "Pick at least one day."
    : f.kind === "block" && f.time && f.end_time && f.end_time <= f.time
    ? "End time should be after the start time."
    : null;

  const save = (e) => {
    e.preventDefault();
    if (problem) return;
    onSave({
      title: f.title.trim(),
      kind: f.kind,
      date: f.repeat === "none" ? f.date : item?.repeat && item.repeat !== "none" ? item.date : today(),
      time: f.time || null,
      end_time: f.kind === "block" && f.end_time ? f.end_time : null,
      repeat: f.repeat,
      days: f.repeat === "weekly" ? [...f.days].sort() : [],
      notify: !!f.notify && !!f.time,
    });
  };

  return (
    <Sheet title={editing ? "Edit" : "Add to your day"} onClose={onClose}>
      <form className="form" onSubmit={save}>
        <label className="lab" htmlFor="it-title">What is it?</label>
        <input id="it-title" className="f" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Drink water, gym, call mum…" autoFocus={!editing} />

        <span className="lab">Type</span>
        <Chips label="Type" options={KINDS} value={f.kind} onChange={setKind} />

        <div className="two">
          <div>
            <label className="lab" htmlFor="it-time">{f.kind === "block" ? "Starts" : "Time"}</label>
            <input id="it-time" type="time" className="f" value={f.time} onChange={(e) => setTime(e.target.value)} />
          </div>
          {f.kind === "block" ? (
            <div>
              <label className="lab" htmlFor="it-end">Ends</label>
              <input id="it-end" type="time" className="f" value={f.end_time} onChange={(e) => set("end_time", e.target.value)} />
            </div>
          ) : (
            f.repeat === "none" && (
              <div>
                <label className="lab" htmlFor="it-date">Day</label>
                <input id="it-date" type="date" className="f" value={f.date} onChange={(e) => set("date", e.target.value)} />
              </div>
            )
          )}
        </div>
        {f.kind === "block" && f.repeat === "none" && (
          <>
            <label className="lab" htmlFor="it-date2">Day</label>
            <input id="it-date2" type="date" className="f" value={f.date} onChange={(e) => set("date", e.target.value)} />
          </>
        )}
        {f.time && (
          <button type="button" className="linkbtn" onClick={() => setF((x) => ({ ...x, time: "", end_time: "", notify: false }))}>
            Clear time (make it "anytime")
          </button>
        )}

        <span className="lab">Repeat</span>
        <Chips label="Repeat" options={REPEATS} value={f.repeat} onChange={(v) => set("repeat", v)} />
        {f.repeat === "weekly" && (
          <Chips label="Days" multi options={DAY_SHORT.map((d, i) => [i, d])} value={f.days} onChange={(v) => set("days", v)} />
        )}

        <button
          type="button"
          className={"toggle" + (f.notify ? " on" : "")}
          aria-pressed={f.notify}
          onClick={() => setF((x) => ({ ...x, notify: !x.notify, touchedNotify: true }))}
        >
          <span className="knob" />
          <span>
            <b>Ring on my phone</b>
            <small>{f.time ? `Notification at ${f.time}${f.repeat === "none" ? "" : ", every time it repeats"}` : "Needs a time"}</small>
          </span>
        </button>

        {problem && f.title && <p className="warn">{problem}</p>}
        <div className="row-btns">
          {editing && (
            <button type="button" className="btn ghost" onClick={onDelete}>
              <Icon name="trash" size={18} /> Delete
            </button>
          )}
          <button type="submit" className="btn" disabled={!!problem}>
            {editing ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
