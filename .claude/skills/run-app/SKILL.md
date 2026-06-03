---
name: run-app
description: Build, launch, and drive the BattleChess Expo app on the iOS simulator. Use when asked to run, build, start, play, or screenshot the app, or to verify a change in the real app (not just tests). Covers the native dev build, Metro, and observing via screenshots.
---

# Running BattleChess (Expo / iOS simulator)

This is an Expo SDK 54 / React Native app. Native modules (`expo-audio`,
`expo-haptics`) mean **you need a dev build** (`npx expo run:ios`) — a plain
`npm start` + Expo Go will not load them. Once a dev build is installed, JS-only
changes just need a Metro reload.

Run everything from the repo root (`/Users/lee/Desktop/BattleChess/repo/mobile`).

## 1. Free stale Metro ports

```bash
for p in 8081 8082; do
  pid=$(lsof -ti tcp:$p 2>/dev/null) && kill -9 $pid 2>/dev/null && echo "killed $p" || echo "$p free"
done
```

## 2. Preflight

```bash
test -f .env && echo ".env present" || echo "MISSING .env — app cannot reach Supabase"
node -v   # needs >= 22
```

`.env` (gitignored) must hold `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. See `.env.example`.

## 3. Find the booted simulator

```bash
xcrun simctl list devices booted | grep Booted
```

Grab the UDID in parentheses. If nothing is booted, boot one first
(`xcrun simctl boot "iPhone 16e"` then `open -a Simulator`).

## 4. Build + install + open (first build is slow)

Run in the **background** — the first build does CocoaPods + a full Xcode
compile (several minutes). Subsequent builds are fast.

```bash
npx expo run:ios --device "<UDID>"
```

It ends with `Build Succeeded`, installs `com.leenapthine.battlechess`, and opens
the dev client (which connects to Metro on 8081). If Metro isn't already up the
command starts it; otherwise it reuses the running one.

## 5. Confirm it's live

```bash
curl -s -o /dev/null -w "metro %{http_code}\n" http://localhost:8081/status   # want 200
```

## 6. Drive it — screenshot to see state

There is **no `idb`/`cliclick`** on this machine, so you can't tap the board
programmatically. Observe with screenshots and have the user perform taps:

```bash
xcrun simctl io booted screenshot /tmp/bc-shot.png
```

Then Read `/tmp/bc-shot.png`. A blank/grey frame means the bundle didn't load —
check Metro and reload the app (Cmd+R in the simulator, or shake → Reload).

## Smoke path

Title screen → **PRESS ENTER** → sign in (anonymous) → name prompt (first run) →
**Lobby**. From the lobby's NEW GAME list: **PLAY VS AI** (solo vs the bot),
**PLAY LOCAL** (pass-and-play), or **PLAY ONLINE**. To verify a change, drive to
the screen it touches and screenshot the result.

## Notes

- JS/TS change after a build exists → no rebuild; just reload Metro.
- Native/config change (new native dep, `app.json`, Podfile) → rebuild via step 4.
- UDID is machine-specific — always discover it (step 3), never hardcode.
