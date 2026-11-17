import { useState } from "react";
import { Badge, Check, ColorPick, Icon, Sheet } from "./ui.jsx";

function GoalSheet({ goal, onSave, onDelete, onClose }) {
  const [name, setName] = useState(goal?.name || "");
  const [color, setColor] = useState(goal?.color || "violet");
  const [steps, setSteps] = useState("");
  return (
    <Sheet title={goal ? "Edit goal" : "New goal"} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSave({ name: name.trim(), color }, steps.split("\n").map((s) => s.trim()).filter(Boolean));
        }}
      >
        <label className="lab" htmlFor="g-name">Goal</label>
        <input id="g-name" className="f" value={name} onChange={(e) => setName(e.target.value)} placeholder="Run a 10k" autoFocus={!goal} />
        {!goal && (
          <>
            <label className="lab" htmlFor="g-steps">Milestones (one per line, optional)</label>
            <textarea id="g-steps" className="f" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={"Run 3k without stopping\nRun 5k\nRun 10k"} />
          </>
        )}
        <span className="lab">Colour</span>
        <ColorPick value={color} onChange={setColor} />
        <div className="row-btns">
          {goal && (
            <button type="button" className="btn ghost" onClick={onDelete}>
              <Icon name="trash" size={18} /> Delete goal
            </button>
          )}
          <button type="submit" className="btn" disabled={!name.trim()}>
            {goal ? "Save" : "Add goal"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function GoalCard({ goal, steps, nook, onEdit }) {
  const [draft, setDraft] = useState("");
  const done = steps.filter((s) => s.done).length;
  const pct = steps.length ? (done / steps.length) * 100 : 0;
  return (
    <div className="card goal">
      <div className="goal-top">
        <Badge icon="flag" color={goal.color} />
        <button type="button" className="hb-name" onClick={onEdit}>
          {goal.name}
        </button>
        <span className="mid num">
          {done}
          <small>/ {steps.length}</small>
        </span>
      </div>
      <div className="meter" aria-label={`${Math.round(pct)}% done`}>
        <i style={{ width: pct + "%", background: `var(--${goal.color})` }} />
      </div>
      {steps.length > 0 && (
        <ul className="list">
          {steps.map((s) => (
            <li key={s.id} className="ms">
              <Check on={s.done} label={s.title} onClick={() => nook.patch("milestones", s.id, { done: !s.done })} />
              <button type="button" className="x" aria-label={"Remove " + s.title} onClick={() => nook.del("milestones", s.id)}>
                <Icon name="close" size={14} width={3} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="addrow"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          nook.add("milestones", { goal_id: goal.id, title: draft.trim(), done: false });
          setDraft("");
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a milestone" aria-label={"Add a milestone to " + goal.name} />
        <button type="submit" aria-label="Add milestone">
          <Icon name="plus" size={16} width={3} />
        </button>
      </form>
    </div>
  );
}

export default function Goals({ nook }) {
  const [sheet, setSheet] = useState(null);
  const goals = nook.data.goals.slice().sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const stepsOf = (id) => nook.data.milestones.filter((m) => m.goal_id === id).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

  return (
    <div className="section" style={{ marginTop: 0 }}>
      <div className="h">
        <h2>Goals</h2>
        <button type="button" className="btn" onClick={() => setSheet("new")}>
          <Icon name="plus" size={18} width={3} /> New goal
        </button>
      </div>
      {goals.length === 0 && (
        <div className="card empty">
          <b>No goals yet.</b>
          <span>Add something bigger you're working towards and break it into milestones.</span>
        </div>
      )}
      <div className="cols">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} steps={stepsOf(g.id)} nook={nook} onEdit={() => setSheet(g)} />
        ))}
      </div>
      {sheet && (
        <GoalSheet
          goal={sheet === "new" ? null : sheet}
          onClose={() => setSheet(null)}
          onSave={(v, steps) => {
            if (sheet === "new") {
              const g = nook.add("goals", v);
              steps.forEach((title, i) =>
                nook.add("milestones", { goal_id: g.id, title, done: false, created_at: new Date(Date.now() + i).toISOString() })
              );
            } else nook.patch("goals", sheet.id, v);
            setSheet(null);
          }}
          onDelete={() => {
            nook.del("goals", sheet.id);
            setSheet(null);
          }}
        />
      )}
    </div>
  );
}
