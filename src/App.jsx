import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase.js";
import { useNook } from "./lib/useNook.js";
import { itemsForDay, nowHM, today } from "./lib/dates.js";
import { askPermission, isNative, setupNotifications, snoozeItem, syncReminders } from "./lib/notify.js";
import { Icon } from "./components/ui.jsx";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Plan from "./components/Plan.jsx";
import Habits from "./components/Habits.jsx";
import Journal from "./components/Journal.jsx";
import Goals from "./components/Goals.jsx";
import ItemEditor from "./components/ItemEditor.jsx";
import Settings from "./components/Settings.jsx";

const TABS = [
  ["home", "Home", "Dashboard"],
  ["plan", "Plan", "Plan"],
  ["habits", "Habits", "Habits"],
  ["journal", "Journal", "Journal"],
  ["goals", "Goals", "Goals"],
];

function store(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [local, setLocal] = useState(() => read("nook-mode") === "local");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (local)
    return (
      <Main
        mode="local"
        onSignOut={() => {
          store("nook-mode", null);
          syncReminders([]);
          setLocal(false);
        }}
      />
    );
  if (session === undefined) return <div className="splash">Nook</div>;
  if (!session)
    return (
      <Login
        onLocal={() => {
          store("nook-mode", "local");
          setLocal(true);
        }}
      />
    );
  return (
    <Main
      key={session.user.id}
      mode="cloud"
      user={session.user}
      onSignOut={async () => {
        await syncReminders([]);
        store("nook-cache-v1", null);
        await supabase.auth.signOut();
      }}
    />
  );
}

function Main({ mode, user, onSignOut }) {
  const nook = useNook(mode);
  const [tab, setTab] = useState("home");
  const [now, setNow] = useState(() => new Date());
  const [editor, setEditor] = useState(null); // { item, day }
  const [settings, setSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const [night, setNight] = useState(() => read("nook-night") === "1");
  const [name, setName] = useState(() => user?.user_metadata?.name || read("nook-name") || "Harshita");
  const searchRef = useRef(null);
  const panelRef = useRef(null);

  // Keep the clock fresh so "now", "late" and the date roll over on their own.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("night", night);
    store("nook-night", night ? "1" : "0");
  }, [night]);

  // ----- phone reminders -----
  const nookRef = useRef(nook);
  nookRef.current = nook;
  const queue = useRef([]);
  const handle = useCallback((kind, id) => {
    const n = nookRef.current;
    if (n.status !== "ready") return queue.current.push([kind, id]);
    if (kind === "done") n.setItemDone(id, today(), true);
    else snoozeItem(n.dataRef.current.items.find((i) => i.id === id));
  }, []);

  useEffect(() => {
    let cleanup = () => {};
    setupNotifications({ onDone: (id) => handle("done", id), onSnooze: (id) => handle("snooze", id) })
      .then((c) => (cleanup = c))
      .then(askPermission)
      .catch((e) => console.error(e));
    return () => cleanup();
  }, [handle]);

  useEffect(() => {
    if (nook.status !== "ready" || !queue.current.length) return;
    const q = queue.current;
    queue.current = [];
    q.forEach(([k, id]) => handle(k, id));
  }, [nook.status, handle]);

  const items = nook.data.items;
  useEffect(() => {
    if (nook.status !== "ready") return;
    const t = setTimeout(() => syncReminders(items), 700);
    return () => clearTimeout(t);
  }, [items, nook.status]);

  // In a browser there are no phone notifications, so show a pop-up while Nook is open.
  const shown = useRef(new Set());
  useEffect(() => {
    if (isNative || nook.status === "loading") return;
    const hm = nowHM(now);
    const day = today();
    const due = itemsForDay(nook.data.items, nook.data.completions, day).find((i) => i.notify && i.time === hm && !i.done && !shown.current.has(i.id + day + hm));
    if (due) {
      shown.current.add(due.id + day + hm);
      setToast({ kind: "reminder", item: due });
    }
  }, [now, nook.data, nook.status]);

  // ----- navigation -----
  const goTab = (t) => {
    setTab(t);
    panelRef.current?.scrollIntoView({ block: "start" });
    window.scrollTo({ top: 0 });
  };
  const openEditor = (item, day) => setEditor({ item, day });

  const saveItem = (fields) => {
    const it = editor.item;
    if (it?.id) {
      const changes = { ...fields };
      if (it.repeat !== fields.repeat) changes.done_on = null;
      nook.patch("items", it.id, changes);
    } else {
      nook.add("items", { ...fields, done_on: null });
    }
    setEditor(null);
  };

  const day = today();
  const lateRinger = itemsForDay(nook.data.items, nook.data.completions, day).some((i) => i.notify && !i.done && i.time && i.time < nowHM(now));
  const label = TABS.find((t) => t[0] === tab)[2];

  return (
    <div className="stage">
      <svg className="deco d1" viewBox="0 0 330 150" aria-hidden="true">
        <path d="M8 140 C60 120 70 70 120 62 C170 54 175 92 210 70 C245 48 250 14 322 8" fill="none" stroke="#FFD43B" strokeWidth="14" strokeLinecap="round" />
      </svg>
      <svg className="deco d2" viewBox="0 0 120 170" aria-hidden="true">
        <path d="M4 8 C40 20 70 40 64 80 C60 110 30 120 44 140 C58 160 96 150 110 130" fill="none" stroke="var(--lime)" strokeWidth="12" strokeLinecap="round" />
        <path d="M60 120 c-18 -10 -30 18 -6 22 c22 4 26 -24 6 -22" fill="none" stroke="var(--lime)" strokeWidth="10" strokeLinecap="round" />
      </svg>
      <svg className="deco d3" viewBox="0 0 76 70" aria-hidden="true">
        <path d="M38 62 C10 44 4 28 10 16 C17 3 33 6 38 20 C43 6 59 3 66 16 C72 28 66 44 38 62Z" fill="none" stroke="#F25CCB" strokeWidth="9" strokeLinejoin="round" />
      </svg>

      <div className="frame">
        <div className="vword l" aria-hidden="true">
          {label}
        </div>
        <div className="vword r" aria-hidden="true">
          Nook
        </div>
        <div className="panel" ref={panelRef}>
          <svg className="squig" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
            <path d="M200 -10 C230 70 300 110 360 120 C420 130 470 95 440 70 C410 45 380 85 420 110 C470 140 560 130 600 110" fill="none" stroke="#0C0C0C" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <header className="bar">
            <button type="button" className="avatar" onClick={() => setSettings(true)} aria-label="Settings">
              <svg viewBox="0 0 46 46" width="46" height="46" aria-hidden="true">
                <circle cx="23" cy="23" r="23" fill="#B48CF6" />
                <path d="M10 22 C10 10 36 10 36 22 L36 30 L10 30Z" fill="#0C0C0C" />
                <circle cx="23" cy="24" r="9" fill="#F5D2B8" stroke="#0C0C0C" strokeWidth="2" />
                <path d="M14 46 C14 36 32 36 32 46" fill="#fff" stroke="#0C0C0C" strokeWidth="2" />
                <circle cx="20" cy="24" r="1.3" fill="#0C0C0C" />
                <circle cx="26" cy="24" r="1.3" fill="#0C0C0C" />
                <path d="M20.5 28 q2.5 2 5 0" stroke="#0C0C0C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            <nav className="pills" aria-label="Sections">
              {TABS.map(([id, text]) => (
                <button type="button" key={id} aria-current={tab === id ? "page" : undefined} onClick={() => goTab(id)}>
                  {text}
                </button>
              ))}
            </nav>
            <div className="icons">
              <button
                type="button"
                className="ib"
                aria-label="Search journal"
                onClick={() => {
                  goTab("journal");
                  setTimeout(() => searchRef.current?.focus(), 50);
                }}
              >
                <Icon name="search" size={20} stroke="#fff" />
              </button>
              <button type="button" className="ib" aria-label={lateRinger ? "Reminders waiting in your plan" : "Your plan"} onClick={() => goTab("plan")}>
                <Icon name="bell" size={20} stroke="#fff" />
                {lateRinger && <span className="dot" />}
              </button>
              <button type="button" className="ib" aria-label={night ? "Switch to lime" : "Switch to lavender"} onClick={() => setNight((n) => !n)}>
                <Icon name="sun" size={20} stroke="#fff" />
              </button>
            </div>
          </header>

          {nook.status === "offline" && <p className="offline">You're offline. Showing what was saved last time; changes may not save.</p>}
          {nook.status === "loading" && !nook.data.items.length && !nook.data.habits.length && <p className="offline">Loading your day…</p>}

          <main>
            {tab === "home" && <Dashboard nook={nook} name={name} now={now} openEditor={openEditor} goTab={goTab} />}
            {tab === "plan" && <Plan nook={nook} openEditor={openEditor} now={now} />}
            {tab === "habits" && <Habits nook={nook} />}
            {tab === "journal" && <Journal nook={nook} searchRef={searchRef} />}
            {tab === "goals" && <Goals nook={nook} />}
          </main>
        </div>
      </div>

      {editor && (
        <ItemEditor
          item={editor.item}
          day={editor.day}
          onClose={() => setEditor(null)}
          onSave={saveItem}
          onDelete={() => {
            nook.del("items", editor.item.id);
            setEditor(null);
          }}
        />
      )}

      {settings && (
        <Settings
          name={name}
          email={user?.email}
          mode={mode}
          onClose={() => setSettings(false)}
          onResync={() => syncReminders(nookRef.current.data.items)}
          onName={(n) => {
            setName(n);
            store("nook-name", n);
            if (mode === "cloud") supabase.auth.updateUser({ data: { name: n } });
            setSettings(false);
          }}
          onSignOut={() => {
            setSettings(false);
            onSignOut();
          }}
        />
      )}

      {toast?.kind === "reminder" && (
        <div className="toast" role="alertdialog" aria-labelledby="toast-t">
          <div>
            <small className="num">Nook reminder · {toast.item.time}</small>
            <h3 id="toast-t">{toast.item.title}</h3>
          </div>
          <div className="acts">
            <button
              type="button"
              onClick={() => {
                nook.setItemDone(toast.item.id, today(), true);
                setToast(null);
              }}
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => {
                const it = toast.item;
                setToast(null);
                setTimeout(() => setToast({ kind: "reminder", item: it }), 10 * 60000);
              }}
            >
              Snooze 10 min
            </button>
          </div>
        </div>
      )}
      {nook.error && (
        <div className="toast err" role="alert">
          <h3>{nook.error}</h3>
          <div className="acts">
            <button type="button" onClick={nook.clearError}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
