# Spectre Scoring – Version 1.0

Offline match-scoring app (PWA) for Spectre Tactical Shooting, the companion to the Spectre Stage Designer.

## Files (host these as they are, e.g. on GitHub Pages in any sub-folder)
- `index.html` – the whole app (all CSS and JS inline, ~350 KB, includes the QR libraries)
- `sw.js` – service worker, caches everything for offline use (cache name changes with each build)
- `manifest.webmanifest`, `icons/` (180 px apple-touch-icon, 192, 512)

`src/` is the source, `build.sh` rebuilds `index.html` and `sw.js`. `src/vendor/a-data.js`, `b-logic.js` and `c-svg.js` are exact copies of the Stage Designer's
data model, migration, hit requirements and SVG renderer (the designer itself is not changed). QR: qrcode-generator (MIT) and jsQR (Apache-2.0).

## Tests
`t/run-all.sh` (needs the local server: `python3 -m http.server 8765` in a folder that links `spectre-score/`). WebKit iPhone SE / 13 / 15 Pro Max and Chromium Pixel 5 / 7.

## Notes
- Data lives on the phone (localStorage; signatures in IndexedDB). Install it to the Home Screen on iPhone: Safari can clear storage for sites that are not installed and not used for 7 days. Export a backup after each stage.
- The QR camera scanner needs HTTPS (GitHub Pages is fine). Files always work.

## Scoring and ranking rules (MD rulings, 19 Oct 2026)
- One scoring model per match: importing a stage with the other model (or a file mixing both) is blocked.
  Negative match: total time, lowest wins. Positive match: total points, highest wins (equal stage points: faster time ahead).
- Long-Range stages: ranked on their own (within par, most hits, fewest shots, time; no extra penalties) and not added to a
  negative/positive total. A match of only LR stages gets an LR overall in the same order. QS stages: pass/fail, never totalled.
- Not engaged (also when par time ran out): misses = the target's required hits (plate/slug 1, best 2 = 2, Mozambique 3, fixed N = N, buckshot 2).
- No-shoot hits are always penalised; procedural, tactical and "other" (3 s / 3 pts each) only when briefed. Cover: per discrete use, imperfect −1 s / +3, good −2 s / +6.
- Overall ties: most HZ hits over the counted stages, then a shared place.
- Single-firearm match: class rankings plus open. Multi-gun match (a stage using 2+ firearm types, or stages for different firearms): open rankings only.
- Full-match overall: only shooters who completed every counted stage. Per-firearm overalls (multi-gun matches): the stages that use only
  that firearm; a stage that mixes firearms counts only in the full-match overall. A DNF elsewhere does not stop a firearm ranking.
- DQ: the RO records it on the score of the stage where it happened and ticks the stages already shot before it (default: those with saved
  scores; squads rotate, so stage numbers are not used). Ticked stages stay ranked ("DQ later"); the DQ stage shows DQ with no score; any other
  stage score is "After DQ" (not ranked). The list travels with the score in packs/QR and merges like any score (a changed list is a conflict).
  The shooter is removed from every overall and listed as DQ. No timestamps are used.

## Publishing on GitHub Pages (not done yet)
- Publish these files as they are, from a repo root or a /docs folder: index.html, sw.js, manifest.webmanifest, .nojekyll, icons/.
  (src/, t/, shots/ and build.sh are source/tests and can stay in the repo; the app never loads them.)
- All paths are relative, so it works at https://<user>.github.io/<repo>/ or on a custom domain; the service worker scope is the folder.
- Updating: run ./build.sh and publish. sw.js gets a new cache name from the build hash; installed phones fetch it when the app is
  opened or brought to the front (and every 30 min), install it in the background, and show "Update available – Reload".
  The running version is kept until Reload is tapped (an unfinished score entry is saved and resumes); the old cache is then deleted.
- GitHub Pages caches files for ~10 minutes, so a phone may need that long to see a new version.

## Live sync (optional, Firebase)
- Off by default; the app is unchanged without it. Match tab → **Live sync**: the main phone creates a room (6-character match code + QR),
  RO phones join with the code/QR and tick their stages. Firebase SDK 10.14.1 (modular ESM from gstatic) loads only when sync is on and is
  cached by sw.js for offline starts. Config: `src/firebase-config.js` (project spectre-scoring-5ddda).
- Firestore: `rooms/{CODE}` (stage pack as JSON text, owner-only updates), `rooms/{CODE}/scores/{deviceId}~{key}`, `rooms/{CODE}/sigs/{key#rev}`.
  Each phone pushes its own scores; the main phone merges others' through mergeScoresPack (identical skipped, different = conflict).
  RO phones receive stage/shooter updates. Pending = own scores not yet acknowledged (kept across restarts); Firestore persistence queues writes offline.
- Rules: `firestore.rules` (paste into Firebase console → Firestore → Rules). Tests: `t/test-sync.js` (mock), `t/test-rules.js` and
  `t/test-sync-emulator.js` (emulators: `npx firebase emulators:exec --project demo-spectre --only firestore,auth "node t/<test>"`, needs Java + /workspace/fbtools).
- Limits: match pack < 900 KB, score < 60 KB, signature < 700 KB (bigger ones go by pack). Only the room creator merges; RO phones never merge scores.
