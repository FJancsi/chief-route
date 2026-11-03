// PIECE 4 - HUD, dialog and banner demo. ONE KEY ONLY: SPACE.
// Every scene plays its own animation; SPACE during a scene jumps to its end.
// The hero is always drawn at scale 2 (R37).
import { Engine, WORLDS, GROUND, tween, ease, sleep } from './engine.js';
import { C } from './palette.js';
import { bakeAll } from './sprites.js';
import { banner } from './ui.js';

const $ = sel => document.querySelector(sel);
const stage = $('#stage'), overlay = $('#overlay'), prompt = $('#prompt'), debug = $('#debug');
const hud = $('cq-hud'), dialog = $('cq-dialog'), fx = $('#fx');

if (new URLSearchParams(location.search).has('anon')) document.body.classList.add('anon');

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

// ---------- helpers (these move to story.js in Piece 5) ----------
let temp = [];
const spawn = props => { const a = engine.add(props); temp.push(a); return a; };
const clearTemp = () => { temp.forEach(a => engine.remove(a)); temp = []; };
const live = s => !s.aborted;
const setWorld = name => { engine.rain = false; engine.world = WORLDS[name]; };
const ahead = sx => engine.camera + 140 + sx;            // world x that lands at screen x after walk()

async function walk(s, dist = 140, ms = 1600) {
  engine.walking = true;
  await tween(engine, { camera: engine.camera + dist }, ms, s, ease.inOut);
  engine.walking = false;
}

const say = (s, text, opt = {}) => dialog.say(text, { ...opt, signal: s });
const show = (s, text, kind, icon) => banner(fx, { text, kind, icon: icon && S.icon[icon] }, s);
const withNote = (a, b) => (b ? `${a}\n${b}` : a);

async function loot(s, icon, name, note) {
  if (live(s)) engine.burst(hero.x, 80, 16);
  hud.addItem(s);
  await show(s, withNote(`GOT: ${name}`, note), 'item', icon);
}
async function equip(s, outfit, name, note) {
  if (live(s)) { engine.flash(); engine.burst(hero.x, 100, 24, [C.pink, C.yellow]); }
  hero.frames = S.hero[outfit];                          // outfit swap, same size
  await show(s, withNote(`EQUIP: ${name}`, note), 'equip');
}
async function skill(s, name, note) {
  if (live(s)) engine.burst(hero.x, 80, 12, [C.green, C.white]);
  await show(s, withNote(`SKILL UP: ${name}`, note), 'skill');
}
async function shoot(s, target, kill = true) {
  const p = spawn({ x: hero.x + 16, y: GROUND - 18, z: 3,
    draw: (g, x, y) => { g.fillStyle = C.yellow; g.fillRect(x - 3, y, 6, 2); } });
  await tween(p, { x: target.x - engine.camera - 20 }, 260, s);
  engine.remove(p);
  if (live(s)) { engine.burst(target.x - engine.camera, GROUND - 20, 10, [C.green, C.white]); engine.quake(4); }
  if (kill) engine.remove(target);
}

// ---------- demo scenes (1 entry = 1 SPACE press) ----------
const SCENES = [
  ['HUD + DIALOG + LOOT', async s => {
    setWorld('village');
    hero.frames = S.hero.kid;
    hud.hidden = false;
    await hud.set({ lv: 0, guild: 'HOME', title: '---', path: '---' }, s);
    const chest = spawn({ img: S.icon.chest, world: true, x: ahead(150), z: 1 });
    await walk(s);
    await say(s, 'Age 12. A big box is waiting at home...', { who: 'NARRATOR' });
    chest.img = S.icon.chestOpen;
    await loot(s, 'c64', 'COMMODORE 64', 'YOUR FIRST PC!');
  }],

  ['SKILL + EQUIP', async s => {
    setWorld('academy');
    await hud.set({ guild: 'UNIVERSITY' }, s);
    await walk(s);
    await skill(s, 'POINT & CLICK', 'WINDOWS 95');
    await loot(s, 'book', 'PASCAL SPELLBOOK');
    await equip(s, 'student', 'STUDENT HOODIE', 'PROCRASTINATION +1');
  }],

  ['CHAPTER + LV 1', async s => {
    setWorld('office');
    await show(s, '2007 - FIRST REAL JOB', 'chapter');
    await hud.set({ guild: 'SMALL CO.', lv: 1 }, s);
    await equip(s, 'casual', 'CASUAL WEAR', 'COFFEE UNLOCKED');
    await walk(s);
    await say(s, 'Automation tester: Java + Selenium E2E tests.', { who: 'GUILD MASTER' });
    await loot(s, 'crossbow', 'SELENIUM CROSSBOW', 'AUTO-FIRE E2E TESTS');
  }],

  ['LV COUNT-UP + PATH', async s => {
    setWorld('cas');
    await hud.set({ guild: 'CAS', lv: 8 }, s);              // counts 1 -> 8
    await walk(s);
    if (live(s)) engine.flash();
    await show(s, 'PATH CHOSEN: FRONT-END', 'title');
    await hud.set({ path: 'FRONT-END*' }, s);
    await equip(s, 'frontend', 'SHADES OF CLARITY', 'YOU SEE THE DOM CLEARLY NOW');
  }],

  ['FIRST TITLE + REAL NAME', async s => {
    setWorld('epam');
    await walk(s);
    if (live(s)) { engine.flash(); engine.burst(160, 60, 40); }
    await show(s, 'FIRST TITLE EARNED!\nD2 - SOFTWARE ENGINEER', 'title');
    await hud.set({ guild: 'EPAM', title: 'D2*', lv: 10 }, s);
    await equip(s, 'd2', 'HAWAIIAN SHIRT', 'IMPOSTOR SYNDROME ++');
    await say(s, 'Build the JS SDK, launch sites in days!', { who: 'SODA KINGDOM', real: 'Coca-Cola' });
  }],

  ['BOSS BANNER + FIGHT', async s => {
    setWorld('cloud');
    hero.frames = S.hero.d4;
    await hud.set({ title: 'D4*', lv: 16 }, s);
    const dragon = spawn({ img: S.icon.dragon, world: true, x: ahead(230), z: 1 });
    await walk(s);
    await show(s, 'BOSS: ANGULARJS SUNSET DRAGON', 'boss');
    await say(s, 'The blade you forged at CAS has turned against you!', { who: 'DRAGON' });
    for (let i = 0; i < 3; i++) await shoot(s, dragon, i === 2);
  }],

  ['TITLE UP: D5', async s => {
    setWorld('throne');
    await walk(s);
    await hud.set({ lv: 20 }, s);                           // counts 16 -> 20, full XP bar
    if (live(s)) { engine.flash(); engine.burst(160, 60, 40, [C.yellow, C.white]); }
    await show(s, 'TITLE UP!\nCHIEF SOFTWARE ENGINEER I', 'title');
    await hud.set({ title: 'D5*' }, s);
    await equip(s, 'd5', "CHIEF'S BREW", 'UNLOCKED AFTER 19 LEVELS');
  }],

  ['END', async () => {
    hud.hidden = true;
    overlay.innerHTML = '<p class="sub">END OF PIECE 4 TEST</p>';
    overlay.hidden = false;
  }],
];

// ---------- scene runner ----------
let index = -1, ctl = null;

async function next() {
  if (ctl) return ctl.abort();                             // finish the running scene
  if (index >= SCENES.length - 1) return;
  index++;
  clearTemp();
  dialog.clear();
  fx.replaceChildren();
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