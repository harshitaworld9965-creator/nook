import { useEffect, useState } from "react";
import { Sheet } from "./ui.jsx";
import { askPermission, isNative, openExactAlarmSettings, permissionState, sendTest } from "../lib/notify.js";

const STATE_TEXT = { granted: "Allowed", denied: "Blocked", prompt: "Not asked yet", "prompt-with-rationale": "Not asked yet", web: "Only in the phone app" };

export default function Settings({ name, onName, email, mode, onSignOut, onClose, onResync }) {
  const [n, setN] = useState(name);
  const [perm, setPerm] = useState(null);
  const [msg, setMsg] = useState("");

  const refresh = () => permissionState().then(setPerm).catch(() => setPerm(null));
  useEffect(() => {
    refresh();
  }, []);

  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="form">
        <label className="lab" htmlFor="s-name">Your name on the home screen</label>
        <div className="addrow big">
          <input id="s-name" value={n} onChange={(e) => setN(e.target.value)} />
          <button type="button" onClick={() => n.trim() && onName(n.trim())}>
            Save
          </button>
        </div>

        <span className="lab">Reminders</span>
        {!isNative ? (
          <p className="hint">Reminders ring from the Android app. In a browser, Nook shows a pop-up while the page is open.</p>
        ) : (
          <div className="card setgrid">
            <div>
              <b>Notifications</b>
              <span>{STATE_TEXT[perm?.display] || "Checking…"}</span>
            </div>
            <button
              type="button"
              className="btn small"
              onClick={async () => {
                await askPermission();
                await refresh();
                onResync();
              }}
            >
              Allow
            </button>
            <div>
              <b>On-time alarms</b>
              <span>{perm?.exact === "granted" ? "Allowed, reminders ring on the minute" : "Off, reminders may ring a few minutes late"}</span>
            </div>
            <button
              type="button"
              className="btn small"
              onClick={async () => {
                await openExactAlarmSettings();
                await refresh();
                onResync();
              }}
            >
              Open
            </button>
            <div>
              <b>Test it</b>
              <span>Sends a reminder in 1 minute. Lock your phone and wait.</span>
            </div>
            <button
              type="button"
              className="btn small"
              onClick={async () => {
                const ok = await sendTest();
                setMsg(ok ? "Test reminder set for 1 minute from now." : "");
                refresh();
              }}
            >
              Test
            </button>
          </div>
        )}
        {msg && <p className="ok">{msg}</p>}

        <span className="lab">Account</span>
        <p className="hint">{mode === "local" ? "You're trying Nook without an account. Everything is saved on this device only." : `Signed in as ${email}. Your data syncs to every device you sign in on.`}</p>
        <button type="button" className="btn ghost" onClick={onSignOut}>
          {mode === "local" ? "Leave and sign in" : "Sign out"}
        </button>
      </div>
    </Sheet>
  );
}
