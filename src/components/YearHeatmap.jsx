import { useEffect, useMemo, useRef, useState } from "react";
import { Chips } from "./ui.jsx";
import { heatmap } from "../lib/stats.js";
import { fmtDay } from "../lib/dates.js";

const FILTERS = [
  ["all", "Everything"],
  ["plan", "Plan"],
  ["habits", "Habits"],
  ["journal", "Journal"],
];

export default function YearHeatmap({ data, id }) {
  const [filter, setFilter] = useState("all");
  const [picked, setPicked] = useState(null);
  const cells = useMemo(() => heatmap(data, filter), [data, filter]);
  const wrap = useRef(null);
  useEffect(() => {
    if (wrap.current) wrap.current.scrollLeft = wrap.current.scrollWidth;
  }, [filter]);
  const active = cells.filter((c) => c.v > 0).length;
  const unit = filter === "habits" ? "habit ticks" : filter === "journal" ? "entries" : "things done";

  return (
    <section className="section" id={id}>
      <div className="h">
        <h2>Your year</h2>
        <Chips label="What to show" options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <div className="card">
        <div className="h">
          <span className="label">Last 12 months, Monday to Sunday</span>
          <span className="label num">{active} active days</span>
        </div>
        <div className="heatwrap" ref={wrap}>
          <div className="heat">
            {cells.map((c) => (
              <button
                type="button"
                key={c.day}
                className={(c.level ? "l" + c.level : "") + (c.today ? " t" : "")}
                aria-label={`${fmtDay(c.day)}: ${c.v} ${unit}`}
                onClick={() => setPicked(c)}
              />
            ))}
          </div>
        </div>
        <div className="legend">
          Less <i /> <i className="l1" /> <i className="l2" /> <i className="l3" /> <i className="l4" /> More
          <span className="legend-pick num">
            {picked ? `${fmtDay(picked.day, { weekday: "short", day: "numeric", month: "short" })}: ${picked.v} ${unit}` : "Tap a square to see that day"}
          </span>
        </div>
      </div>
    </section>
  );
}
