// PIECES 2+3 - engine + sprite test. ONE KEY ONLY: SPACE.
// Every scene plays its own animation; SPACE during a scene jumps to its end.
import { Engine, WORLDS, GROUND, tween, ease, sleep } from './engine.js';
import { C } from './palette.js';
import { bakeAll, ITEM_KEYS, ENEMY_KEYS, NPC_KEYS, OUTFITS } from './sprites.js';

const $ = sel => document.querySelector(sel);
const stage = $('#stage'), overlay = $('#overlay'), prompt = $('#prompt'), debug = $('#debug');

// ---------- pixel-perfect scaling ----------
function fit() {
  const scale = Math.max(1, Math.floor(Math.min(innerWidth / 320, innerHeight / 180)));
  stage.style.setProperty('--u', `${scale}px`);
}
addEventListener('resize', fit);
fit();

// ---------- boot ----------
await document.fonts.load('8px "Press Start 2P"').catch(() => {});
const S = await bakeAll();
const engine = new Engine($('#screen'));
const hero = engine.add({ frames: S.hero.kid, x: 70, walker: true, z: 2 });

// ---------- helpers ----------
let temp = [];                                         // actors that live for one scene
const spawn = props => { const a = engine.add(props); temp.push(a); return a; };
const clearTemp = () => { temp.forEach(a => engine.remove(a)); temp = []; };
const live = s => !s.aborted;                          // skip one-off effects when skipped
const setWorld = name => { engine.rain = false; engine.world = WORLDS[name]; };

async function walk(s, dist = 140, ms = 1600) {
  engine.walking = true;
  await tween(engine, { camera: engine.camera + dist }, ms, s, ease.inOut);
  engine.walking = false;
}

async function shoot(s, target, kill = true) {
  const p = spawn({ x: hero.x + 16, y: GROUND - 18, z: 3,
    draw: (g, x, y) => { g.fillStyle = C.yellow; g.fillRect(x - 3, y, 6, 2); } });
  await tween(p, { x: target.x - engine.camera }, 260, s);
  engine.remove(p);
  if (live(s)) engine.burst(target.x - engine.camera, GROUND - 12, 10, [C.green, C.white]);
  if (kill) engine.remove(target);
}

// ---------- scene types ----------
const outfitScene = (outfit, world, label) => [label, async s => {
  setWorld(world);
  Object.assign(hero, { alpha: 1, scale: 2, frames: S.hero[outfit] });
  if (live(s)) { engine.flash(); engine.burst(hero.x, 90, 24); }
  await walk(s);
  hero.scale = 4;                                      // automatic close-up
  await sleep(1800, s);
  hero.scale = 2;
}];

const matrixScene = ['MATRIX + MORPHEUS', async s => {
  engine.rain = true;
  const pill = col => (g, x, y) => { g.fillStyle = col; g.fillRect(x - 2, y, 4, 3); };
  const morpheus = spawn({ frames: S.npc.morpheus, x: 210, flip: true, alpha: 0, z: 2 });
  const red  = spawn({ x: 196, y: GROUND - 20, alpha: 0, z: 3, draw: pill('#ff3030') });
  const blue = spawn({ x: 224, y: GROUND - 20, alpha: 0, z: 3, draw: pill('#3080ff') });
  await Promise.all([morpheus, red, blue].map(a => tween(a, { alpha: 1 }, 800, s)));
  await sleep(800, s);
  await tween(red, { x: hero.x + 8, y: GROUND - 30 }, 700, s, ease.inOut);
  engine.remove(red);
  if (live(s)) { engine.flash(); engine.burst(hero.x, 90, 30, [C.green, C.white]); }
  await sleep(1200, s);
}];

const fightScene = ['BUG FIGHT + IE6 TROLL', async s => {
  setWorld('market');
  hero.frames = S.hero.casual;
  const bugs = [170, 205, 240].map(x =>
    spawn({ img: S.icon.bug, world: true, x: engine.camera + 140 + x, bob: 1, z: 2 }));
  await walk(s);
  for (const b of bugs) await shoot(s, b);
  const troll = spawn({ img: S.icon.troll, world: true, x: engine.camera + 250, alpha: 0, z: 2 });
  await tween(troll, { alpha: 1 }, 500, s);
  for (let i = 0; i < 3; i++) {
    await shoot(s, troll, i === 2);
    if (live(s)) engine.quake(6);
    await sleep(250, s);
  }
}];

// ---------- gallery pages ----------
function paginate(title, imgs, scale = 2) {
  const pages = [];
  let page, x, y, rowH;
  const newPage = () => {
    page = { title: `${title} ${pages.length + 1}`, items: [] };
    pages.push(page); x = 10; y = 24; rowH = 0;
  };
  newPage();
  for (const img of imgs) {
    const w = img.width * scale, h = img.height * scale;
    if (x + w > 310) { x = 10; y += rowH + 8; rowH = 0; }
    if (y + h > 174) newPage();
    page.items.push({ img, scale, x: Math.round(x + w / 2), y: y + h });
    x += w + 10;
    rowH = Math.max(rowH, h);
  }
  return pages;
}

const PAGES = [
  ...paginate('OUTFITS', Object.keys(OUTFITS).map(k => S.hero[k][0]), 3),
  ...paginate('NPCS', NPC_KEYS.map(k => S.npc[k][0]), 3),
  ...paginate('ITEMS', ITEM_KEYS.map(k => S.icon[k])),
  ...paginate('ENEMIES', ENEMY_KEYS.map(k => S.icon[k])),
];

const galleryScene = page => [page.title, async s => {
  setWorld('epam');
  hero.alpha = 0;
  for (const it of page.items) {                       // sprites pop in one by one
    spawn({ ...it, z: 5 });
    if (live(s)) engine.burst(it.x, it.y - 8, 4);
    await sleep(120, s);
  }
}];

// ---------- scene list (1 entry = 1 SPACE press) ----------
const SCENES = [
  outfitScene('kid', 'village', 'KID: PLAIN TEE'),
  matrixScene,
  outfitScene('student', 'academy', 'HOODIE+BACKPACK'),
  outfitScene('casual', 'office', 'CASUAL+COFFEE'),
  fightScene,
  outfitScene('frontend', 'cas', '+SHADES'),
  outfitScene('d2', 'epam', 'D2 HAWAII SHIRT'),
  outfitScene('d3', 'hotel', 'D3 FLIP-FLOPS'),
  outfitScene('d3', 'bank', 'BANK REALM'),
  outfitScene('d4', 'cloud', 'D4 QA CAP'),
  outfitScene('d5', 'throne', "D5 CHIEF'S BREW"),
  ...PAGES.map(galleryScene),
  ['END', async () => {
    hero.alpha = 0;
    overlay.innerHTML = '<p class="sub">END OF PIECE 3 TEST</p>';
    overlay.hidden = false;
  }],
];

// ---------- scene runner ----------
let index = -1, ctl = null;

async function next() {
  if (ctl) return ctl.abort();                         // finish the running scene
  if (index >= SCENES.length - 1) return;
  index++;
  clearTemp();
  overlay.hidden = prompt.hidden = true;
  debug.hidden = false;
  const [label, run] = SCENES[index];
  debug.textContent = `${index + 1}/${SCENES.length} ${label}`;
  ctl = new AbortController();
  await run(ctl.signal);
  ctl = null;
  prompt.hidden = index >= SCENES.length - 1;
}

// ---------- the ONLY key binding ----------
let started = false;
addEventListener('keydown', e => {
  if (e.code !== 'Space') return;
  e.preventDefault();
  if (e.repeat) return;
  if (!started) {
    started = true;
    document.documentElement.requestFullscreen?.().catch(() => {});
  }
  next();
});

// ---------- title ----------
overlay.innerHTML = `
  <h1>CAREER<br>QUEST</h1>
  <p class="sub">FROM C64 TO CHIEF</p>
  <p class="who">JANOS FEKETE * EPAM</p>`;
overlay.hidden = false;
prompt.hidden = false;