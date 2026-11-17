import { useMemo, useState } from "react";
import { Badge, ColorPick, Icon, Sheet } from "./ui.jsx";
import { addDays, DAY_SHORT, fmtDay, today, weekday } from "../lib/dates.js";
import { habitInfo } from "../lib/stats.js";

function HabitSheet({ habit, onSave, onDelete, onClose }) {
  const [name, setName] = useState(habit?.name || "");
  const [color, setColor] = useState(habit?.color || "cyan");
  return (
    <Sheet title={habit ? "Edit habit" : "New habit"} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSave({ name: name.trim(), color });
        }}
      >
        <label className="lab" htmlFor="h-name">Habit</label>
        <input id="h-name" className="f" value={name} onChange={(e) => setName(e.target.value)} placeholder="Read 20 pages" autoFocus={!habit} />
        <span className="lab">Colour</span>
        <ColorPick value={color} onChange={setColor} />
        <div className="row-btns">
          {habit && (
            <button type="button" className="btn ghost" onClick={onDelete}>
              <Icon name="trash" size={18} /> Delete
            </button>
          )}
          <button type="submit" className="btn" disabled={!name.trim()}>
            {habit ? "Save" : "Add habit"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

export default function Habits({ nook }) {
  const habits = useMemo(() => habitInfo(nook.data), [nook.data]);
  const [sheet, setSheet] = useState(null); // null | "new" | habit
  const t = today();
  const days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));

  return (
    <div className="section" style={{ marginTop: 0 }}>
      <div className="h">
        <h2>Habits</h2>
        <button type="button" className="btn" onClick={() => setSheet("new")}>
          <Icon name="plus" size={18} width={3} /> New habit
        </button>
      </div>
      {habits.length === 0 && (
        <div className="card empty">
          <b>No habits yet.</b>
          <span>Add the small things you want to do every day. Tick them here and watch the streak grow.</span>
        </div>
      )}
      <div className="cols">
        {habits.map((h) => {
          const on = h.checks.has(t);
          return (
            <div className="card hb" key={h.id}>
              <button type="button" className="hb-tick" aria-pressed={on} onClick={() => nook.toggleHabit(h.id, t)} aria-label={(on ? "Untick " : "Tick ") + h.name + " for today"}>
                <Badge icon="check" color={h.color} dark={on} />
              </button>
              <div className="t">
                <button type="button" className="hb-name" onClick={() => setSheet(h)}>
                  {h.name}
                </button>
                <div className="week" role="group" aria-label={"Last 7 days for " + h.name}>
                  {days.map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={(h.checks.has(d) ? "on" : "") + (d === t ? " today" : "")}
                      aria-pressed={h.checks.has(d)}
                      aria-label={fmtDay(d, { weekday: "long", day: "numeric", month: "short" })}
                      onClick={() => nook.toggleHabit(h.id, d)}
                    >
                      <span>{DAY_SHORT[weekday(d)][0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="fire">
                <b className="num">{h.streak}</b>
                <span>day streak</span>
              </div>
            </div>
          );
        })}
      </div>
      {habits.length > 0 && <p className="hint">Tap the circle to tick today. Tap a day square to fix a past day. Tap the name to edit.</p>}

      {sheet && (
        <HabitSheet
          habit={sheet === "new" ? null : sheet}
          onClose={() => setSheet(null)}
          onSave={(v) => {
            if (sheet === "new") nook.add("habits", v);
            else nook.patch("habits", sheet.id, v);
            setSheet(null);
          }}
          onDelete={() => {
            nook.del("habits", sheet.id);
            setSheet(null);
          }}
        />
      )}
    </div>
  );
}
