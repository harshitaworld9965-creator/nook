import { useState } from "react";
import { Icon, Sheet } from "./ui.jsx";
import { fmtStamp } from "../lib/dates.js";

export default function Journal({ nook, searchRef }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [confirm, setConfirm] = useState(false);

  const all = nook.data.journal.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const needle = q.trim().toLowerCase();
  const list = needle ? all.filter((e) => e.body.toLowerCase().includes(needle)) : all;

  const save = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    nook.add("journal", { body: text.trim() });
    setText("");
  };

  return (
    <div className="section" style={{ marginTop: 0 }}>
      <div className="h">
        <h2>Journal</h2>
        <span className="label">{all.length} entries</span>
      </div>
      <form className="card form" onSubmit={save}>
        <label className="lab" htmlFor="j-text">How is today going?</label>
        <textarea id="j-text" className="f" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a few lines. The date and time are saved for you." />
        <button className="btn" type="submit" disabled={!text.trim()}>
          Save entry
        </button>
      </form>
      <input ref={searchRef} className="f" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your entries" aria-label="Search your entries" />
      <div className="cols">
        {list.map((e) => (
          <article className="card entry" key={e.id}>
            <div className="entry-top">
              <span className="when num">{fmtStamp(e.created_at)}</span>
              <button
                type="button"
                className="linkbtn"
                onClick={() => {
                  setEditing(e);
                  setEditText(e.body);
                  setConfirm(false);
                }}
              >
                Edit
              </button>
            </div>
            <p>{e.body}</p>
          </article>
        ))}
        {list.length === 0 && (
          <div className="card empty">
            <b>{needle ? "No entries match." : "Nothing written yet."}</b>
            {!needle && <span>Your first entry will show up here.</span>}
          </div>
        )}
      </div>

      {editing && (
        <Sheet title={"Entry from " + fmtStamp(editing.created_at)} onClose={() => setEditing(null)}>
          <form
            className="form"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!editText.trim()) return;
              nook.patch("journal", editing.id, { body: editText.trim() });
              setEditing(null);
            }}
          >
            <textarea className="f tall-f" value={editText} onChange={(ev) => setEditText(ev.target.value)} aria-label="Entry text" />
            {confirm && <p className="warn">Delete this entry for good? Tap Delete again.</p>}
            <div className="row-btns">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  if (!confirm) return setConfirm(true);
                  nook.del("journal", editing.id);
                  setEditing(null);
                }}
              >
                <Icon name="trash" size={18} /> Delete
              </button>
              <button type="submit" className="btn">
                Save
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  );
}
