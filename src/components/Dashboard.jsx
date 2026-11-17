import { useMemo, useState } from "react";
import { Badge, Check, Face, Icon, MOODS } from "./ui.jsx";
import YearHeatmap from "./YearHeatmap.jsx";
import { fmtDay, itemsForDay, nowHM, today } from "../lib/dates.js";
import { focusHours, habitInfo, weekCounts } from "../lib/stats.js";

function greeting(h) {
  return h < 5 ? "Up Late" : h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}

function PathCard({ next }) {
  const pins = [
    [40, 38],
    [118, 98],
    [184, 56],
  ];
  return (
    <div className="card path">
      <svg viewBox="0 0 300 130" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Your next stops today">
        <rect width="300" height="130" fill="#F3F3EC" />
        <path d="M40 60 C70 20 150 18 190 40 C230 62 250 100 200 115 C150 128 70 120 50 100 C35 86 30 72 40 60Z" fill="#7FD99A" stroke="#3E9E5E" strokeWidth="2" />
        <path d="M-10 120 C60 104 90 60 140 70 C190 80 210 30 310 18" fill="none" stroke="#FFD43B" strokeWidth="9" />
        <path d="M-10 120 C60 104 90 60 140 70 C190 80 210 30 310 18" fill="none" stroke="#0C0C0C" strokeWidth="1.4" strokeDasharray="5 6" />
        <path d="M250 -5 C240 40 270 70 310 80" fill="none" stroke="#F25CCB" strokeWidth="4" />
        <path d="M0 30 C40 36 60 10 100 0" fill="none" stroke="#5CCFF2" strokeWidth="3" />
        <rect x="206" y="96" width="74" height="22" rx="11" fill="#fff" stroke="#0C0C0C" strokeWidth="2" />
        <text x="243" y="111" textAnchor="middle" fontSize="10" fontWeight="900">Today's path</text>
        {next.length === 0 && (
          <text x="150" y="70" textAnchor="middle" fontSize="14" fontWeight="900">
            Nothing timed left. Rest.
          </text>
        )}
        {next.map((it, n) => {
          const [x, y] = pins[n];
          const label = it.title.length > 13 ? it.title.slice(0, 12) + "…" : it.title;
          return (
            <g key={it.id}>
              <path d={`M${x} ${y + 12} C${x - 9} ${y + 1} ${x - 9} ${y - 8} ${x} ${y - 8} C${x + 9} ${y - 8} ${x + 9} ${y + 1} ${x} ${y + 12}Z`} fill="#FFD43B" stroke="#0C0C0C" strokeWidth="2" />
              <circle cx={x} cy={y - 1} r="2.6" fill="#0C0C0C" />
              <text x={x + 11} y={y - 6} fontSize="10.5" fontWeight="800">{label}</text>
              <text x={x + 11} y={y + 6} fontSize="10" fontWeight="700" opacity=".7">{it.time}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Spark({ week }) {
  const w = 160;
  const h = 56;
  const max = Math.max(4, ...week.map((d) => d.count));
  const pts = week.map((d, i) => [6 + (i * (w - 12)) / 6, h - 6 - (d.count / max) * (h - 14)]);
  const line = "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
  const last = pts[pts.length - 1];
  const names = week.map((d) => fmtDay(d.day, { weekday: "short" }));
  return (
    <div className="card spark c3">
      <span className="label">This week</span>
      <div className="spark-box">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={"Things done each day: " + week.map((d, i) => `${names[i]} ${d.count}`).join(", ")}>
        <path d={`M6 ${h - 6} H${w - 6}`} stroke="#0C0C0C" strokeWidth="1" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        <path d={`M6 ${h / 2} H${w - 6}`} stroke="#0C0C0C" strokeOpacity=".25" strokeWidth="1" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        <path d={line} fill="none" stroke="#0C0C0C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="spark-dot" style={{ left: `${(last[0] / w) * 100}%`, top: `${(last[1] / h) * 100}%` }} />
      </div>
      <div className="days">
        {names.map((n, i) => (
          <span key={i}>{n}</span>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ nook, name, now, openEditor, goTab }) {
  const { data } = nook;
  const day = today();
  const hm = nowHM(now);
  const list = useMemo(() => itemsForDay(data.items, data.completions, day), [data.items, data.completions, day]);
  const habits = useMemo(() => habitInfo(data), [data]);
  const week = useMemo(() => weekCounts(data), [data]);
  const [draft, setDraft] = useState("");

  const done = list.filter((i) => i.done).length;
  const open = list.filter((i) => !i.done);
  const next = open.find((i) => i.time && i.time >= hm) || open[0];
  const nextTimed = open.filter((i) => i.time && i.time >= hm).slice(0, 3);
  const rest = list.filter((i) => i !== next).slice(0, 6);
  const dayRow = data.days.find((r) => r.day === day);
  const water = (dayRow?.water_ml || 0) / 1000;
  const mood = dayRow?.mood || null;
  const best = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const habitsToday = habits.filter((h) => h.checks.has(day)).length;
  const msDone = data.milestones.filter((m) => m.done).length;

  const addTodo = (e) => {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    nook.add("items", { title: t, kind: "todo", date: day, time: null, end_time: null, repeat: "none", days: [], notify: false, done_on: null });
    setDraft("");
  };

  const scrollYear = () => document.getElementById("year")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <div className="grid">
        <div className="card greet">
          <h1>
            {greeting(now.getHours())} {name}!
          </h1>
          <p>{fmtDay(day)}</p>
        </div>

        <div className="card water">
          <Badge icon="water" color="cyan" />
          <span className="vlab">Water intake</span>
          <div className="big num">
            {Number(water.toFixed(2))}
            <small>Litre</small>
          </div>
          <div className="pm">
            <button type="button" onClick={() => nook.addWater(day, -250)} aria-label="Remove 250 ml of water" disabled={!water}>
              <Icon name="minus" size={16} width={3} />
            </button>
            <button type="button" className="add" onClick={() => nook.addWater(day, 250)} aria-label="Add 250 ml of water">
              <Icon name="plus" size={16} width={3} />
            </button>
          </div>
        </div>

        <button type="button" className="card tap tasks" onClick={() => goTab("plan")}>
          <Badge icon="tasks" color="coral" />
          <span className="label push">Done today</span>
          <div className="big num">
            {done}
            <small>/ {list.length}</small>
          </div>
        </button>

        <PathCard next={nextTimed} />

        <div className="card tall">
          <h2>Today:</h2>
          <div className="scene" aria-hidden="true">
            <span className="sunc" />
            <span className="hill" style={{ left: -20, width: 150, height: 80 }} />
            <span className="hill" style={{ right: -30, width: 180, height: 66, background: "#3E9E5E" }} />
            <span className="what">{next ? next.title : list.length ? "All done for today" : "A fresh, empty day"}</span>
          </div>
          <div className="cap">
            <div>
              <b>Up next:</b>
              <span className="num">
                {next ? `${next.title}${next.time ? ", " + next.time : ""}${next.time && next.time < hm ? " (late)" : ""}` : "Nothing left"}
              </span>
            </div>
            {next && (
              <button type="button" className="tri" onClick={() => nook.setItemDone(next.id, day, true)} aria-label={`Mark ${next.title} done`}>
                <Icon name="play" size={20} fill="#0C0C0C" width={0} />
              </button>
            )}
          </div>
          {rest.length > 0 && (
            <ul className="list">
              {rest.map((i) => (
                <li key={i.id}>
                  <Check on={i.done} label={i.title} meta={i.time || ""} sub={i.carried && !i.done ? "from earlier" : null} onClick={() => nook.setItemDone(i.id, day, !i.done)} />
                </li>
              ))}
            </ul>
          )}
          <div className="cap">
            <div>
              <b>Everything today:</b>
              <span>{list.length ? `${open.length} left of ${list.length}` : "Add your first thing below"}</span>
            </div>
            <button type="button" className="tri" onClick={() => goTab("plan")} aria-label="Open your plan">
              <Icon name="right" size={18} width={3} />
            </button>
          </div>
          <form className="addrow" onSubmit={addTodo}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a to-do" aria-label="Add a to-do" />
            <button type="submit" aria-label="Add to-do">
              <Icon name="plus" size={16} width={3} />
            </button>
          </form>
          <button type="button" className="linkbtn" onClick={() => openEditor(null, day)}>
            Add with a time or reminder
          </button>
        </div>

        <button type="button" className="card tap c2" onClick={() => goTab("plan")}>
          <Badge icon="pencil" color="sun" small />
          <span className="label push">Focus time</span>
          <div className="mid num">
            {focusHours(list)}
            <small>hrs</small>
          </div>
        </button>

        <Spark week={week} />

        <button type="button" className="card tap c4" onClick={() => goTab("habits")}>
          <Badge icon="heart" color="pink" small />
          <span className="label push">Best streak</span>
          <div className="mid num">
            {best}
            <small>{best === 1 ? "day" : "days"}</small>
          </div>
          <span className="tiny num">{habits.length ? `${habitsToday} of ${habits.length} habits today` : "Add a habit"}</span>
        </button>

        <button type="button" className="card tap c5" onClick={() => goTab("goals")}>
          <Badge icon="check" color="violet" small />
          <span className="label push">Milestones</span>
          <div className="mid num">
            {msDone}
            <small>/ {data.milestones.length}</small>
          </div>
          <span className="tiny">{data.goals.length ? `${data.goals.length} goal${data.goals.length > 1 ? "s" : ""}` : "Set a goal"}</span>
        </button>

        <button type="button" className="card tap c2 journal" onClick={() => goTab("journal")}>
          <span className="note" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div>
            <span className="label">Journal entries</span>
            <div className="mid num">{data.journal.length}</div>
          </div>
        </button>

        <div className="card mood">
          <div className="now">
            {mood ? <Face mood={mood} size={40} /> : <span className="q">?</span>}
            <b>{mood || "Not set"}</b>
          </div>
          <div className="opts">
            <span className="label">How are you feeling?</span>
            <div className="row" role="group" aria-label="Mood">
              {MOODS.map(([m]) => (
                <button type="button" key={m} className="face" aria-pressed={mood === m} onClick={() => nook.setMood(day, mood === m ? null : m)}>
                  <Face mood={m} />
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="down">
        <button type="button" onClick={scrollYear} aria-label="Scroll to your year">
          <Icon name="down" width={3} />
        </button>
      </div>
      <YearHeatmap data={data} id="year" />
    </>
  );
}
