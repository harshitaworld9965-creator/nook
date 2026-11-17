# Nook

Your whole day in one place: plan, reminders that ring, routines, habits, journal, goals and a year heatmap.
React + Vite web app, Supabase for sync, Capacitor for the Android app.

## One-time setup

### 1. Database (Supabase)
1. Open your Supabase project, then **SQL Editor > New query**.
2. Paste everything from `supabase/schema.sql` and press **Run**. You should see "Success. No rows returned".
3. Optional but easier: **Authentication > Sign In / Providers > Email**, turn off **Confirm email**, and save.
   If you leave it on, you'll need to tap the link in the confirmation email before your first sign-in.

### 2. Push to GitHub
```bash
npm install
git init
git add .
git commit -m "Nook"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/nook.git
git push -u origin main
```

### 3. Get the APK
- Pushing to `main` starts **Actions > Build Android app** (about 5 to 8 minutes).
- When it's green, open **Releases > Nook (latest build)** on your phone and download `Nook.apk`.
- Install it. Android will ask you to allow installs from your browser, which is fine.
- Do the same on your tablet.

### 4. On first open (phone and tablet)
1. Create your account (same email on every device).
2. Allow notifications when asked.
3. Tap your avatar (top left) for **Settings**:
   - **On-time alarms > Open**: switch on "Allow setting alarms and reminders" so reminders ring on the minute.
   - **Test it**: lock the phone and wait a minute. You should get a Nook notification.
   - Change your name if you like.
4. Samsung only: Settings > Apps > Nook > Battery > **Unrestricted**, so the phone doesn't put Nook to sleep.

## Updating later
Change code, then commit and push. A new APK appears in Releases, and installing it updates Nook in place
(the signing key in `ci/debug.keystore` stays the same, so your app and settings are kept).

## Running it on your laptop
```bash
npm install
npm run dev
```
Open the address it prints. In a browser, reminders show as a pop-up while the page is open.
You can also deploy it to Vercel (import the repo, framework "Vite") to use it from any browser.

## How things are organised
- `src/lib/useNook.js`: all data and every change to it (saves to Supabase in the background).
- `src/lib/notify.js`: phone reminders (Done / Snooze 10 min buttons, repeats).
- `src/lib/dates.js`: which items show on which day, rollovers and streaks.
- `src/components/`: one file per screen.
- `supabase/schema.sql`: the database tables and privacy rules.
- `.github/workflows/android.yml`: builds the APK.
