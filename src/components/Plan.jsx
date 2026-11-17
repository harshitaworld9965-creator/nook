import { useMemo, useState } from "react";
import { Icon } from "./ui.jsx";
import { addDays, DAY_SHORT, fmtDay, itemsForDay, nowHM, parse, today, weekday } from "../lib/dates.js";

const KIND = { todo: "To-do", reminder: "Reminder", routine: "Routine", block: "Schedule" };

export function repeatText(it) {
  if (it.repeat === "daily") return "Every day";
  if (it.repeat === "weekdays") return "Mon to Fri";
  if (it.repeat === "weekly") return (it.days || []).map((d) => DAY_SHORT[d]).join(", ");
  return null;
}

function Row({ it, day, nook, onEdit, late }) {
  const rep = repeatText(it);
  return (
    <li className={"prow k-" + it.kind + (it.done ? " done" : "")}>
      <button type="button" className="pcheck" aria-pressed={it.done} aria-label={(it.done ? "Undo " : "Done: ") + it.title} onClick={() => nook.setItemDone(it.id, day, !it.done)}>
        <i />
      </button>
      <button type="button" className="pbody" onClick={() => onEdit(it)}>
        <span className="ptime num">
          {it.time || "Any"}
          {it.end_time && <small>{it.end_time}</small>}
        </span>
        <span className="pmain">
          <b>{it.title}</b>
          <span className="tags">
            <span className="tag">{KIND[it.kind]}</span>
            {rep && (
              <span className="tag plain">
                <Icon name="repeat" size={12} width={2.6} /> {rep}
              </span>
            )}
            {it.notify && (
              <span className="tag plain">
                <Icon name="bell" size={12} width={2.6} /> Rings
              </span>
            )}
            {it.carried && !it.done && <span className="tag warnt">From {fmtDay(it.date, { weekday: "short", day: "numeric" })}</span>}
            {late && <span className="tag warnt">Late</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

export default function Plan({ nook, openEditor, now }) {
  const { data } = nook;
  const t = today();
  const [day, setDay] = useState(t);
  const monday = addDays(day, -((weekday(day) + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const list = useMemo(() => itemsForDay(data.items, data.completions, day), [data.items, data.completions, day]);
  const repeating = data.items.filter((i) => i.repeat && i.repeat !== "none").sort((a, b) => ((a.time || "99") < (b.time || "99") ? -1 : 1));
  const hm = nowHM(now);
  const left = list.filter((i) => !i.done).length;

  return (
    <div className="section" style={{ marginTop: 0 }}>
      <div className="h">
        <h2>Plan</h2>
        <button type="button" className="btn" onClick={() => openEditor(null, day)}>
          <Icon name="plus" size={18} width={3} /> Add
        </button>
      </div>

      <div className="card weekbar">
        <div className="wb-head">
          <button type="button" className="ib light" onClick={() => setDay(addDays(day, -7))} aria-label="Previous week">
            <Icon name="left" size={18} width={3} />
          </button>
          <b>{parse(monday).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</b>
          <button type="button" className="ib light" onClick={() => setDay(addDays(day, 7))} aria-label="Next week">
            <Icon name="right" size={18} width={3} />
          </button>
        </div>
        <div className="wb-days">
          {week.map((d) => {
            const n = itemsForDay(data.items, data.completions, d);
            const doneAll = n.length > 0 && n.every((i) => i.done);
            return (
              <button type="button" key={d} aria-pressed={d === day} className={(d === t ? "is-today" : "") + (doneAll ? " all" : "")} onClick={() => setDay(d)}>
                <small>{DAY_SHORT[weekday(d)]}</small>
                <b className="num">{parse(d).getDate()}</b>
                <i>{n.length ? n.length : ""}</i>
              </button>
            );
          })}
        </div>
        {day !== t && (
          <button type="button" className="linkbtn" onClick={() => setDay(t)}>
            Back to today
          </button>
        )}
      </div>

      <div className="h">
        <span className="label big-label">{day === t ? "Today" : fmtDay(day)}</span>
        <span className="label num">{list.length ? `${left} left of ${list.length}` : ""}</span>
      </div>
      {list.length === 0 ? (
        <div className="card empty">
          <b>Nothing planned{day === t ? " today" : ""}.</b>
          <span>Tap Add to put in a to-do, a reminder that rings, a routine or a study/work block.</span>
        </div>
      ) : (
        <ul className="plist">
          {list.map((it) => (
            <Row key={it.id} it={it} day={day} nook={nook} onEdit={(x) => openEditor(x, day)} late={day === t && !it.done && it.time && it.time < hm} />
          ))}
        </ul>
      )}

      {repeating.length > 0 && (
        <>
          <div className="h" style={{ marginTop: 10 }}>
            <span className="label big-label">Repeating</span>
            <span className="label">Tap one to change or remove it</span>
          </div>
          <ul className="replist">
            {repeating.map((it) => (
              <li key={it.id}>
                <button type="button" className="card tap rep" onClick={() => openEditor(it, day)}>
                  <span className="num ptime">{it.time || "Any"}</span>
                  <span className="pmain">
                    <b>{it.title}</b>
                    <small>
                      {KIND[it.kind]} · {repeatText(it)}
                      {it.notify ? " · rings" : ""}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
