# Ladle & Lantern — build transcript

An original night-kitchen cooking game for make.fun's "Make the best cooking game" bounty
(best-cooking-game-20261125-0137). Everything below was written for this entry: the name, the
kitchen, the menu and the canvas art are its own; no commercial game's names, characters, art
or levels are used.

## The game in one line

You are the lone cook of a night kitchen: orders land on the board with draining patience
bars, and you run the floor — bins to board to grill to plating counter to the SERVE pass —
building each dish before its customer walks out, against a three-minute shift clock.

## Design

- **Loop.** Take a raw ingredient from the left-wall bins, prep it (chop cheese, tomato,
  lettuce and potato at the boards — chopping only progresses while you stay close; grill
  patties and cut fries, and pull them off before the burn timer blackens them), build the
  plate component by component on the plating counter (two plates at a time), carry it to the
  pass, and score the recipe's points plus a tip scaled by the patience left.
- **Pressure.** Orders arrive faster as the shift wears on (spawn interval 8.5 s → 3.6 s),
  patience shrinks, the recipe pool widens from three dishes to seven, and in the last minute
  patience drains 25% faster. A walked-out order costs 30 points.
- **Menu.** Golden Fries, Market Salad, Lantern Burger, Loaded Fries, Garden Burger,
  Sunset Stack (fries on the burger), Lantern Deluxe — recipes share components, so one
  grilled patty or batch of fries can be routed to whichever order is closest to walking out.
- **Controls.** WASD / arrow keys walk, E (or Space) works the nearest station, and clicking
  a counter walks the cook there and works it on arrival. One contextual key does everything;
  toast lines and the highlight ring always say what will happen.
- **Look.** Pure Canvas 2D vector art, no assets: wood-plank floor with a woven rug, labelled
  crates and counters, and food drawn to be read at a glance — sesame bun, seared patty,
  holed cheese wedge, crowned tomato, ruffled lettuce, fries in a red carton.

## Source layout (one job per file)

- `game/index.html` — the page shell and the canvas.
- `game/src/config.js` — view size, station layout, walk floor, timing constants.
- `game/src/recipes.js` — ingredients, prep rules and the seven recipes.
- `game/src/input.js` — keyboard state, click queue, one-shot action edges.
- `game/src/kitchen.js` — the shift's state and every rule: walking, prep, cooking, plating,
  serving, order spawning and expiry.
- `game/src/drawFood.js` — how every ingredient, component and plate is drawn.
- `game/src/render.js` — the whole frame: HUD clock, order board, counters, cook, popups.
- `game/src/shots.js` — the staged mid-rush scenes behind `?shot=`, used for the screenshots.
- `game/src/main.js` — boot, the fixed-step loop, and the screenshot hook.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory
  and writes `dossier.json` with the vendored `buildDossier`, unchanged from the kit.

## Iteration

1. **First build.** Full game as designed above; screenshots staged and taken with Playwright
   Chromium from the real renderer. Self-review of the cover found the floor's rug reading as
   one huge flat red block, the score popup in the serve scene overlapping the carried plate,
   and the pass giving no signal when a carried plate was actually servable.
2. **Revision pass.** The rug moved into `config.js` as a named constant, shrank, and gained a
   double woven border; the pass now glows green when the carried plate matches a live order;
   the serve popup moved clear of the plate; plate components draw larger; a seventh recipe
   (Sunset Stack) joined the menu and the late-shift spawn pool; patience drains faster in the
   last minute; Space now also confirms the title and final cards; the page gained a data-URI
   favicon so the browser stops asking the network for one; `main.ts` logs the dossier size it
   wrote. Every file carries both rounds.

## Verification (run locally before hand-in)

- A scripted play-through with real keyboard and mouse input in Chromium: took a bun from its
  bin, plated it, took a patty, grilled it to cooked, picked it up and plated it — the plate
  ended as `['bun', 'patty']`, orders spawned and the shift clock ticked throughout.
- The gate's five rows, checked one by one:
  1. **game_files** — `game/` holds 9 plain files (10 entries with the `src/` directory),
     52,455 bytes in all, no symlinks, `index.html` is 1,001 bytes. Pass.
  2. **references** — no `http:`/`https:` string anywhere under `game/`; the only loads are
     `index.html`'s module script `./src/main.js` and its relative imports, all inside
     `game/`; the favicon is a `data:` URI. Pass.
  3. **screenshots** — 4 JPEGs (`1-cover`, `2-chop`, `3-fry`, `4-serve`), each 1280×800 and
     82–90 KiB, all real renders of the game's own code staged via `?shot=` scenes, viewed
     one by one: the cover shows three order cards with patience bars, the ingredient bins,
     a patty grilling with progress, chopped tomato and lettuce on the boards, a half-built
     plate on the plating counter, the cook carrying a finished Garden Burger plate, the
     shift timer at 1:47 and the score. Pass.
  4. **dossier_matches** — `main.ts` run twice into two directories produced byte-identical
     `dossier.json` (512,681 bytes, under the 1.5 MiB cap), and rebuilding the dossier from
     the produced output with the kit's `buildDossier` matched it byte for byte; the full
     source fits inside the 160 KiB text cap (no truncation note). Pass.
  5. **js_parses** — all eight `.js` files parse as ES modules (checked with Node's
     `vm.SourceTextModule`). Pass (shown, never decides validity).
