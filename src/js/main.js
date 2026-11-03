// Boot + scene runner. ONE KEY ONLY: SPACE.
// SPACE: start the next scene, or (while a scene plays) jump to its final frame.
import { Engine, GROUND } from './engine.js';
import { bakeAll } from './sprites.js';
import { overlay } from './ui.js';
import { scenes, makeCtx, dropOld, LV_MAX } from './story.js';

const $ = sel => document.querySelector(sel);
const stage = $('#stage'), prompt = $('#prompt');
overlay.el = $('#overlay');

function fit() {
  const scale = Math.max(1, Math.floor(Math.min(innerWidth / 320, innerHeight / 180)));
  stage.style.setProperty('--u', `${scale}px`);
}
addEventListener('resize', fit);
fit();

await document.fonts.load('8px "Press Start 2P"').catch(() => {});
const S = await bakeAll();
const engine = new Engine($('#screen'));
const hud = $('cq-hud');
hud.max = LV_MAX;
const deps = { engine, S, hud, dialog: $('cq-dialog'), fx: $('#fx'), hero: null, state: {} };

// URL options (no keys): ?anon hides real client names, #9 opens at LV 9 for rehearsal
if (new URLSearchParams(location.search).has('anon')) document.body.classList.add('anon');

function resetAll() {
  engine.reset(); hud.reset(); deps.dialog.clear(); overlay.hide(); deps.fx.replaceChildren();
  deps.state = {};
  deps.hero = engine.add({ frames: S.hero.kid, x: 70, y: GROUND, walker: true, z: 1 });
}

function begin(scene) {
  overlay.hide(); deps.dialog.clear(); deps.fx.replaceChildren();
  hud.hidden = scene.hud === false;
  for (const a of engine.actors) if ((a.world || a.temp) && !a.keep) a.old = true;
}

async function play(i, signal) {
  const scene = scenes[i];
  begin(scene);
  if (!scene.noLv) hud.set({ lv: i }, signal);         // R39: +1 LV per scene
  await scene.run(makeCtx(deps, signal));
  dropOld(engine);
}

const FAST = AbortSignal.abort();                      // pre-aborted: a scene runs to its final frame
let index = -1, ctl = null, busy = false;

async function goto(i) {
  busy = true;
  prompt.hidden = true;
  if (i !== index + 1) { resetAll(); for (let j = 0; j < i; j++) await play(j, FAST); }
  index = i;
  history.replaceState(null, '', `#${i}`);
  ctl = new AbortController();
  await play(i, ctl.signal);
  ctl = null;
  busy = false;
  prompt.hidden = index >= scenes.length - 1;
}

function next() {
  if (ctl) return ctl.abort();
  if (busy || index >= scenes.length - 1) return;
  goto(index + 1);
}

// keep the screen awake while presenting
let lock = null;
async function keepAwake() {
  if (lock && !lock.released) return;
  try { lock = await navigator.wakeLock?.request('screen'); } catch { /* ignore */ }
}
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && lock && keepAwake());

// ---------- the ONLY key binding ----------
let started = false;
addEventListener('keydown', e => {
  if (e.code !== 'Space') return;
  e.preventDefault();
  if (e.repeat) return;
  if (!started) {
    started = true;
    document.documentElement.requestFullscreen?.().catch(() => {});
    keepAwake();
  }
  next();
});

resetAll();
const start = Math.min(scenes.length - 1, Math.max(0, parseInt(location.hash.slice(1), 10) || 0));
goto(start);
