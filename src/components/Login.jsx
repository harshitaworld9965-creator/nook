import { useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Login({ onLocal }) {
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fn = mode === "in" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await fn.call(supabase.auth, { email: email.trim(), password: pw });
    setBusy(false);
    if (error) {
      const m = error.message || "";
      setMsg({
        bad: true,
        text: /confirm/i.test(m)
          ? "Your email isn't confirmed yet. Open the link Supabase emailed you, then sign in."
          : /invalid login/i.test(m)
          ? "That email and password don't match. Check them, or create an account first."
          : /fetch|network/i.test(m)
          ? "Can't reach the server. Check your internet."
          : m,
      });
      return;
    }
    if (mode === "up" && !data.session) {
      setMsg({ text: "Account made. Open the confirmation email, then come back and sign in." });
      setMode("in");
    }
  };

  return (
    <div className="login">
      <div className="frame">
        <div className="panel login-panel">
          <svg className="login-heart" viewBox="0 0 76 70" aria-hidden="true">
            <path d="M38 62 C10 44 4 28 10 16 C17 3 33 6 38 20 C43 6 59 3 66 16 C72 28 66 44 38 62Z" fill="#F25CCB" stroke="#0C0C0C" strokeWidth="5" strokeLinejoin="round" />
          </svg>
          <h1>Nook</h1>
          <p className="login-sub">Your whole day in one place: plan, reminders, habits, journal and goals.</p>
          <form className="card form" onSubmit={submit}>
            <div className="seg2" role="group" aria-label="Sign in or create account">
              <button type="button" aria-pressed={mode === "in"} onClick={() => setMode("in")}>
                Sign in
              </button>
              <button type="button" aria-pressed={mode === "up"} onClick={() => setMode("up")}>
                Create account
              </button>
            </div>
            <label className="lab" htmlFor="l-email">Email</label>
            <input id="l-email" className="f" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="lab" htmlFor="l-pw">Password</label>
            <input id="l-pw" className="f" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} />
            {msg && <p className={msg.bad ? "warn" : "ok"}>{msg.text}</p>}
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button type="button" className="linkbtn" onClick={onLocal}>
            Try it without an account (saved on this device only)
          </button>
        </div>
      </div>
    </div>
  );
}
