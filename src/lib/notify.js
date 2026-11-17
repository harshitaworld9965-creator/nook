import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { minutes } from "./dates.js";

export const isNative = Capacitor.isNativePlatform();

const CHANNEL = "nook-reminders";
const ACTIONS = "NOOK_REMINDER";
const KIND_LABEL = { todo: "To-do", reminder: "Reminder", routine: "Routine", block: "Schedule" };

// Notification ids must be whole numbers, so each item's id is turned into a number.
// Slots: 0 = one-off or daily, 1 to 7 = a weekday, 8 = snooze, 9 = test.
function baseId(uuid) {
  let h = 2166136261;
  for (let i = 0; i < uuid.length; i++) {
    h ^= uuid.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) & 0x07ffffff;
}
const nid = (uuid, slot) => baseId(uuid) * 16 + slot;

export async function setupNotifications({ onDone, onSnooze, onOpen }) {
  if (!isNative) return () => {};
  await LocalNotifications.createChannel({
    id: CHANNEL,
    name: "Reminders",
    description: "Your Nook reminders",
    importance: 5,
    visibility: 1,
    vibration: true,
  });
  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: ACTIONS,
        actions: [
          { id: "done", title: "Done" },
          { id: "snooze", title: "Snooze 10 min" },
        ],
      },
    ],
  });
  const handle = await LocalNotifications.addListener("localNotificationActionPerformed", (a) => {
    const itemId = a.notification?.extra?.itemId;
    if (!itemId) return;
    if (a.actionId === "done") onDone(itemId);
    else if (a.actionId === "snooze") onSnooze(itemId);
    else onOpen?.(itemId);
  });
  return () => handle.remove();
}

export async function permissionState() {
  if (!isNative) return { display: "web", exact: "web" };
  const p = await LocalNotifications.checkPermissions();
  let exact = "granted";
  try {
    exact = (await LocalNotifications.checkExactNotificationSetting()).exact_alarm;
  } catch {
    /* older Android: exact alarms are always allowed */
  }
  return { display: p.display, exact };
}

export async function askPermission() {
  if (!isNative) return;
  const p = await LocalNotifications.checkPermissions();
  if (p.display !== "granted") await LocalNotifications.requestPermissions();
}

export async function openExactAlarmSettings() {
  if (!isNative) return;
  try {
    await LocalNotifications.changeExactNotificationSetting();
  } catch {
    /* not needed on this Android version */
  }
}

function base(item, exact) {
  return {
    title: item.title,
    body: `${KIND_LABEL[item.kind] || "Reminder"} · ${item.time}`,
    channelId: CHANNEL,
    actionTypeId: ACTIONS,
    extra: { itemId: item.id },
    isExactNotification: exact,
    foreground: true,
  };
}

// Builds the full list of alarms from your items. Called whenever items change.
export function buildSchedule(items, exact, now = new Date()) {
  const out = [];
  for (const it of items) {
    if (!it.notify || !it.time) continue;
    const m = minutes(it.time);
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    const repeat = it.repeat || "none";
    if (repeat === "none") {
      if (it.done_on) continue;
      const [y, mo, d] = it.date.split("-").map(Number);
      const at = new Date(y, mo - 1, d, hour, minute, 0);
      if (at <= now) continue;
      out.push({ ...base(it, exact), id: nid(it.id, 0), schedule: { at, allowWhileIdle: true } });
    } else if (repeat === "daily") {
      out.push({ ...base(it, exact), id: nid(it.id, 0), schedule: { on: { hour, minute }, allowWhileIdle: true } });
    } else {
      const days = repeat === "weekdays" ? [1, 2, 3, 4, 5] : it.days || [];
      for (const wd of days) {
        // Android counts Sunday as 1, Nook counts Sunday as 0.
        out.push({
          ...base(it, exact),
          id: nid(it.id, wd + 1),
          schedule: { on: { weekday: wd + 1, hour, minute }, allowWhileIdle: true },
        });
      }
    }
  }
  return out;
}

let syncing = Promise.resolve();
export function syncReminders(items) {
  if (!isNative) return Promise.resolve();
  syncing = syncing.then(async () => {
    try {
      const p = await LocalNotifications.checkPermissions();
      if (p.display !== "granted") return;
      const { exact } = await permissionState();
      const pending = await LocalNotifications.getPending();
      const old = pending.notifications.filter((n) => n.id % 16 < 8);
      if (old.length) await LocalNotifications.cancel({ notifications: old.map((n) => ({ id: n.id })) });
      const list = buildSchedule(items, exact === "granted");
      for (let i = 0; i < list.length; i += 50) {
        await LocalNotifications.schedule({ notifications: list.slice(i, i + 50) });
      }
    } catch (e) {
      console.error("Could not schedule reminders", e);
    }
  });
  return syncing;
}

export async function snoozeItem(item, mins = 10) {
  if (!isNative || !item) return;
  const { exact } = await permissionState();
  const at = new Date(Date.now() + mins * 60000);
  await LocalNotifications.schedule({
    notifications: [{ ...base({ ...item, time: "snoozed" }, exact === "granted"), body: `Snoozed reminder`, id: nid(item.id, 8), schedule: { at, allowWhileIdle: true } }],
  });
}

export async function sendTest() {
  if (!isNative) return false;
  await askPermission();
  const { exact } = await permissionState();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 9,
        title: "Nook test reminder",
        body: "If you can see this with the app closed, reminders work.",
        channelId: CHANNEL,
        isExactNotification: exact === "granted",
        foreground: true,
        schedule: { at: new Date(Date.now() + 60000), allowWhileIdle: true },
      },
    ],
  });
  return true;
}
