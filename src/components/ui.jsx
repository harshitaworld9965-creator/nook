import { useEffect } from "react";

export const COLORS = ["cyan", "coral", "pink", "violet", "sun", "mint"];

const PATHS = {
  water: "M7 6h10l-1.2 13a2 2 0 0 1-2 1.8h-3.6a2 2 0 0 1-2-1.8z M8 10.5c2.5 1.5 5.5-1.5 8 0",
  check: "M5 12.5l4.5 4.5L19 7.5",
  pencil: "M15 4.5l4.5 4.5L9 19.5H4.5V15z M13 6.5l4.5 4.5",
  heart: "M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z",
  flag: "M6 21V4 M6 4.5h11l-2.5 4 2.5 4H6",
  tasks: "M9 6h11M9 12h11M9 18h11 M3.5 6l1.2 1.2L6.8 5M3.5 12l1.2 1.2L6.8 11M3.5 18l1.2 1.2L6.8 17",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20.5a2 2 0 0 0 4 0",
  search: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M16 16l4.5 4.5",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  down: "M12 4v15M5.5 12.5L12 19l6.5-6.5",
  close: "M6 6l12 12M18 6L6 18",
  repeat: "M4 11V9a3 3 0 0 1 3-3h12l-3-3 M20 13v2a3 3 0 0 1-3 3H5l3 3",
  trash: "M5 7h14 M9 7V4.5h6V7 M7 7l1 13h8l1-13",
  play: "M7 4.5l12 7.5-12 7.5z",
};

export function Icon({ name, size = 22, stroke = "currentColor", width = 2.4, fill = "none" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill={fill} stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Badge({ icon, color, small, dark }) {
  return (
    <span className={"badge" + (small ? " s" : "")} style={{ background: dark ? "var(--ink)" : `var(--${color})` }}>
      <Icon name={icon} size={small ? 17 : 22} stroke={dark ? "var(--lime)" : "var(--ink)"} />
    </span>
  );
}

export const MOODS = [
  ["Happy", "M8.5 14.5c2 2.2 5 2.2 7 0"],
  ["Calm", "M9 15c2 1 4 1 6 0"],
  ["Okay", "M9 15h6"],
  ["Sad", "M8.5 16.5c2-2.2 5-2.2 7 0"],
  ["Angry", "M8.5 16.5c2-2 5-2 7 0 M7.5 8l3 1.2 M16.5 8l-3 1.2"],
  ["Tired", "M9 15.5h6 M7.8 10h2.6 M13.6 10h2.6"],
];

export function Face({ mood, size = 28 }) {
  const m = MOODS.find((x) => x[0] === mood) || MOODS[2];
  const tired = mood === "Tired";
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#fff" stroke="#0C0C0C" strokeWidth="2" />
      {!tired && <circle cx="9" cy="10" r="1.2" fill="#0C0C0C" />}
      {!tired && <circle cx="15" cy="10" r="1.2" fill="#0C0C0C" />}
      <path d={m[1]} fill="none" stroke="#0C0C0C" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="ib light" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Chips({ options, value, onChange, label, multi }) {
  const isOn = (v) => (multi ? value.includes(v) : value === v);
  const toggle = (v) => {
    if (!multi) return onChange(v);
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button type="button" key={v} aria-pressed={isOn(v)} onClick={() => toggle(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function ColorPick({ value, onChange }) {
  return (
    <div className="swatches" role="group" aria-label="Colour">
      {COLORS.map((c) => (
        <button type="button" key={c} aria-label={c} aria-pressed={value === c} style={{ background: `var(--${c})` }} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}

export function Check({ on, label, onClick, meta, sub }) {
  return (
    <button type="button" className={"chk" + (on ? " on" : "")} aria-pressed={on} onClick={onClick}>
      <i />
      <span className="chk-t">
        {label}
        {sub && <small>{sub}</small>}
      </span>
      {meta && <em className="num">{meta}</em>}
    </button>
  );
}
