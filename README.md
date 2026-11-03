# chief-route

My path to the Chief title as a funny animation.

**Career Quest** is a side-scrolling 8-bit RPG that runs in the browser and tells a career story: from a C64 at age 12, through the first job in 2007, to Chief Software Engineer (D5) at EPAM. One SPACE press = one scene = one level.

It uses plain HTML, CSS and JavaScript modules: no framework, no build step, no dependencies.

## Running it

ES modules need an HTTP server (opening `file://` won't work). From the repo root:

```sh
python3 -m http.server 8080 --directory src
# or
npx serve src
```

Open <http://localhost:8080> in Brave or Chrome.

| How | What it does |
|---|---|
| **SPACE** | Starts the next scene. During a scene, it jumps to that scene's final frame. The first press also switches to fullscreen. |
| `#9` in the URL | Opens directly at LV 9 for rehearsal. Earlier scenes are fast-forwarded silently, so the HUD and outfit are correct. |
| `?anon` | Hides real client names in dialogs, for public showings. |

After editing a file, hard-reload with **Ctrl+Shift+R** (**Cmd+Shift+R** on a Mac).

## Locked rules

| # | Rule |
|---|---|
| **R1** | **SPACE is the only key.** Never add other key bindings. Every scene starts its own animation. |
| **R37** | The hero is always drawn at **2×**. No zoom, grow or shrink effects anywhere. Outfit and age changes are sprite swaps. |
| **R38** | Home, elementary school, high school and university are separate scenes, each with its own GUILD. |
| **R39** | **LV = scene index.** The runner adds +1 per SPACE press. Scenes never set `lv` themselves. |
| **R40** | Whatever is on screen when a scene ends is its **final frame**. Skipping a scene lands on that same frame (for example, the C64 screen). |

## Project layout

```
src/
├─ index.html     stage: canvas, HUD, effects layer, overlay, dialog, prompt
├─ css/main.css   pixel-perfect layout, HUD/dialog/banner/overlay styles, world wipe
├─ fonts/         Press Start 2P
└─ js/
   ├─ palette.js  shared colours (match the CSS variables and the ASMT deck)
   ├─ engine.js   canvas renderer, worlds, particles, skippable timing helpers
   ├─ sprites.js  all pixel art as text maps, baked to bitmaps at startup
   ├─ ui.js       <cq-hud>, <cq-dialog>, banners, overlay, view transitions
   ├─ story.js    every scene (the content) + the scene toolkit
   └─ main.js     boot, scene runner, the single SPACE key binding
```

```
main.js ──uses──> engine.js, sprites.js, ui.js, story.js
story.js ─uses──> engine.js, ui.js, palette.js
```

## How it works

### Pixel-perfect scaling
The game is **320×180 game pixels**. `main.js` sets the CSS variable `--u` to the largest **whole-number** pixel size that fits the window. All sizes in CSS are written as `calc(var(--u) * N)`, so the HTML layers (HUD, dialog, banners) line up exactly with the canvas pixels.

### engine.js: the renderer
- One `requestAnimationFrame` loop draws ~60 frames a second: background, then actors sorted by `z`, then particles, then the white flash.
- **Worlds** (`WORLDS`) are small config objects: sky colours, a far parallax layer (`hills`, `city`, `towers`, `peaks`), lit windows, ground colours, stars and clouds. Changing `engine.world` changes the scenery.
- **Parallax:** stars move at 0.05× the camera, clouds at 0.15×, the far layer at 0.3×, and the ground at 1×. The hero stays at a fixed screen x, and `walk()` moves the camera.
- **Actors** are plain objects: `{ x, y, img | frames | draw, scale, alpha, z, world, walker, moving, anim, flip, bob }`. `world: true` means `x` is a world position that scrolls with the camera. A `draw(g, x, y, t, a)` function lets a prop draw itself, for example the Win95 monitor or the EPAM gate.
- **Effects:** `burst()` (confetti), `flash()`, `quake()` (turned off for `prefers-reduced-motion`) and `rain` (Matrix code rain, which replaces the background).
- **Skippable timing:** `sleep(ms, signal)` and `tween(obj, props, ms, signal, easing)` both finish **immediately** when the scene's `AbortSignal` fires. This is what makes the SPACE skip work everywhere.

### sprites.js: pixel art as text
- Every sprite is an array of strings: **1 character = 1 pixel**, `.` = transparent. Characters map to colours through `PAL`, and each sprite can override palette entries.
- `heroRows(outfit, frame)` builds the hero from parts (head, torso, legs, feet) and adds outfit details: shades, the backwards Quality Attributes cap, backpack, coffee or beer, flip-flops. `OUTFITS` lists the hero's evolution: `kid → teen → student → casual → frontend → d2 → d3 → d4 → d5`.
- NPCs reuse the hero builder with colour overrides. `ICONS` are items and props, and `ENEMIES` face left, towards the hero.
- `bakeAll()` turns every map into an `ImageBitmap` once at startup: `S.hero[outfit]` and `S.npc[name]` are two-frame walk cycles, and `S.icon[name]` is one bitmap.

### ui.js: the interface
- **`<cq-hud>`** shows LV, the XP bar (LV / 25), YEAR, TITLE, GUILD and PATH. Changed values flash in colour, but only when the scene isn't being skipped.
- **`<cq-dialog>`** has a speaker name, an optional real name (hidden with `?anon`), typewriter text and a reading pause. Hidden "ghost" text reserves the final layout, so words never jump between lines while typing.
- **Banners** (`item`, `skill`, `equip`, `boss`, `chapter`, `title`) slide in and fade out in 8-bit steps. When a scene is skipped they don't appear at all.
- **`overlay`** is for full-screen cards (title, C64 screen, end card). `overlay.type()` types the C64 lines. If skipped, it prints them all at once, so the final frame is the same (R40).
- **`viewTransition()`** does the 8-bit wipe between worlds with the View Transitions API. It falls back to an instant switch.

### main.js: the scene runner
1. Loads the font, bakes the sprites, creates the engine and the hero.
2. `play(i, signal)` marks the previous scene's props as old, sets **`lv = i`** (R39), runs `scenes[i].run(ctx)`, and then removes the old props.
3. `goto(i)`: when jumping (for example `#9`), it first replays scenes `0…i-1` with a **pre-aborted** signal. They run instantly to their final frames, so the HUD, outfit and party state are correct.
4. **SPACE**: if a scene is playing, it aborts that scene's controller, which skips to the final frame. Otherwise it starts the next scene.
5. A Wake Lock keeps the screen on while presenting.

### story.js: the content
`scenes` is an array where **index = LV**. Each entry is:

```js
{ name: 'HIGH SCHOOL', async run(c) { ... } }   // optional: noLv: true, hud: false
```

`makeCtx()` gives every scene a toolkit `c`. All of its waits use the scene's signal:

| Helper | Does |
|---|---|
| `c.world(name)`, `c.transition(fn)` | switch scenery, with or without the wipe |
| `c.walk(dist?, ms?)` | the hero walks: the camera scrolls, then old props are removed |
| `c.prop(sprite, sx)` / `c.here(sprite, sx)` | place a prop where it will be on screen after / before the walk |
| `c.say(text, { who, real })` | dialog line |
| `c.set({ year, guild, title, path })` | update the HUD (never `lv`) |
| `c.loot / c.equip / c.skill / c.banner` | banners plus effects; `equip` also swaps the outfit |
| `c.open(chest)`, `c.shoot(target, kill?)` | small interactions |
| `c.flash / c.burst / c.quake / c.wait / c.tween` | effects and timing |

`c.state` carries things between scenes, such as the bird companion or the CAS party.

## Adding a scene

1. Add an entry to `scenes` in `src/js/story.js` at the right position. Its index is its LV.
2. Use only `c.*` helpers, or pass `c.signal` to anything else that waits, so SPACE can skip it.
3. Make sure the last thing on screen is the frame you want to stay up (R40).
4. Don't add key handlers (R1) and don't change actor `scale` (R37).
5. New pixel art goes into `ICONS`, `ENEMIES` or `NPCS` in `sprites.js`.

## Status

- [x] Piece 1: setup, scaling, font, SPACE input
- [x] Piece 2: engine (worlds, parallax, effects, skippable timing)
- [x] Piece 3: sprites (hero outfits, NPCs, items, enemies)
- [x] Piece 4: HUD, dialog box, banners
- [x] Piece 5: scenes LV 1–11 (Home → EPAM D2)
- [ ] Piece 6: scenes LV 12–25 (Coca-Cola, Hotels.com + NodeJS, D3 → D5, Fullstack 2026, AI era, Mahalo finale)

## License

MIT
