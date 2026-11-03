// ALL STORY CONTENT. One scene = one SPACE press. LV is set by the runner (scene index, R39).
// R1:  SPACE is the only key; every scene plays its own animation.
// R37: the hero is always drawn at scale 2 - outfits/ages are sprite swaps, never zooms.
// R40: whatever is on screen when a scene ends is its "final frame" - skipping lands there.
import { GROUND, WORLDS, ease, sleep, tween } from './engine.js';
import { C } from './palette.js';
import { banner, overlay, viewTransition } from './ui.js';

export const LV_MAX = 25;
const WALK = 140;

// extra worlds for the split prologue
Object.assign(WORLDS, {
  home:   { sky: ['#3a2a7a', '#ff8a3d'], far: 'city',  farC: '#2d1b5a', win: C.yellow, ground: '#3c8a4a', dirt: '#4a3326' },
  school: { sky: ['#2a3a8e', '#5a7ad8'], far: 'hills', farC: '#2f5b4a', ground: '#3c8a4a', dirt: '#4a3326', clouds: true },
  high:   { sky: ['#1b1036', '#3d2a7a'], far: 'city',  farC: '#2a1f55', win: C.cyan, ground: '#6a5a8e', dirt: '#2d2448', stars: true },
});

export const dropOld = engine => { engine.actors = engine.actors.filter(a => !a.old); };

// ---------- scene toolkit ----------
export function makeCtx(d, signal) {
  const { engine, S, hud, dialog, fx } = d;
  const live = () => !signal.aborted;
  const look = s => typeof s === 'string' ? { img: S.icon[s] } : Array.isArray(s) ? { frames: s } : {};
  const c = {
    S, engine, signal, hero: d.hero, state: d.state,
    wait: ms => sleep(ms, signal),
    tween: (o, p, ms, e) => tween(o, p, ms, signal, e),
    say: (text, opt = {}) => dialog.say(text, { ...opt, signal }),
    set: patch => hud.set(patch, signal),
    banner: (text, kind = 'info', icon) => banner(fx, text, kind, signal, icon && S.icon[icon]),
    burst: (...a) => { if (live()) engine.burst(...a); },
    flash: () => { if (live()) engine.flash(); },
    quake: p => { if (live()) engine.quake(p); },
    world: name => { engine.rain = false; engine.world = WORLDS[name]; },
    outfit: name => { d.hero.frames = S.hero[name]; },
    here: (s, sx, extra = {}) => engine.add({ world: true, x: engine.camera + sx, ...look(s), ...extra }),
    prop: (s, sx, extra = {}) => c.here(s, sx + WALK, extra),     // stands at screen x = sx after walk()
    async walk(dist = WALK, ms = 1600) {
      engine.walking = true;
      await c.tween(engine, { camera: engine.camera + dist }, ms, ease.inOut);
      engine.walking = false;
      dropOld(engine);
    },
    transition: update => viewTransition(() => { dropOld(engine); update(); }, signal),
    open(chest) { chest.img = S.icon.chestOpen; c.burst(chest.x - engine.camera, GROUND - 16); },
    async loot(icon, name, note = '') {
      c.burst(d.hero.x, GROUND - 40, 16);
      await c.banner(`GOT: ${name}${note ? '\n' + note : ''}`, 'item', icon);
    },
    async equip(outfit, name, note = '') {
      c.flash(); c.burst(d.hero.x, GROUND - 20, 24, [C.pink, C.yellow]);
      c.outfit(outfit);
      await c.banner(`EQUIP: ${name}${note ? '\n' + note : ''}`, 'equip');
    },
    async skill(name, note = '') {
      c.burst(d.hero.x, GROUND - 40, 12, [C.green, C.white]);
      await c.banner(`SKILL UP: ${name}${note ? '\n' + note : ''}`, 'skill');
    },
    async shoot(target, kill = true) {
      const p = engine.add({ temp: true, x: d.hero.x + 16, y: GROUND - 18, z: 3,
        draw: (g, x, y) => { g.fillStyle = C.yellow; g.fillRect(x - 3, y, 6, 2); } });
      await c.tween(p, { x: target.x - engine.camera }, 260);
      engine.remove(p);
      c.burst(target.x - engine.camera, GROUND - 12, 10, [C.green, C.white]);
      if (kill) engine.remove(target); else c.quake(4);
    },
  };
  return c;
}

// ---------- custom-drawn props ----------
function drawWin95(g, x, y) {
  const L = x - 30, T = y - 56;
  g.fillStyle = '#008080'; g.fillRect(L - 2, T - 2, 64, 46);
  g.fillStyle = '#c0c0c0'; g.fillRect(L + 4, T + 4, 52, 34);
  g.fillStyle = '#000080'; g.fillRect(L + 5, T + 5, 50, 6);
  g.fillStyle = '#ffffff'; g.fillRect(L + 50, T + 6, 4, 4);
  [['#e04040', 0, 0], ['#40c040', 5, 0], ['#4060e0', 0, 5], ['#e0c040', 5, 5]]
    .forEach(([col, dx, dy]) => { g.fillStyle = col; g.fillRect(L + 25 + dx, T + 18 + dy, 4, 4); });
  g.fillStyle = '#c0c0c0'; g.fillRect(L + 26, T + 44, 8, 6); g.fillRect(L + 18, T + 50, 24, 4);
}

function drawFork(g, _x, _y, t) {
  const glow = ((t / 250) | 0) % 2 ? C.pink : C.yellow;
  g.fillStyle = C.grey; g.fillRect(90, GROUND + 8, 70, 3);
  for (let i = 0; i < 160; i += 2) {
    g.fillStyle = C.grey; g.fillRect(160 + i, GROUND + 10 + (i >> 2), 2, 3);
    g.fillStyle = glow;   g.fillRect(160 + i, GROUND + 6 - (i >> 3), 2, 3);
  }
}

function drawGate(g, x, y, t, a) {
  const L = x - 40, T = y - 76;
  g.fillStyle = C.purple; g.fillRect(L, T + 8, 80, 68);
  for (let i = 0; i < 5; i++) g.fillRect(L + i * 17, T, 12, 8);
  g.fillStyle = C.violet;
  for (let yy = T + 12; yy < y; yy += 8)
    for (let xx = L + (((yy - T) >> 3) & 1) * 8; xx < L + 76; xx += 16) g.fillRect(xx, yy, 6, 1);
  g.fillStyle = C.ink; g.fillRect(L + 20, T + 30, 40, 46);
  if (a.open > 0) { g.fillStyle = ((t / 200) | 0) % 2 ? C.pink : C.yellow; g.fillRect(L + 24, T + 34, 32, 42); }
  g.fillStyle = '#6b3a1e'; g.fillRect(L + 20, T + 30, 40, Math.round(46 * (1 - a.open)));
  g.fillStyle = C.yellow; g.font = '8px "Press Start 2P"'; g.textBaseline = 'top';
  g.fillText('<epam>', L + 16, T + 16);
}

const TITLE = `
  <h1>CAREER<br>QUEST</h1>
  <p class="sub">FROM C64 TO CHIEF</p>
  <p class="who">JANOS FEKETE * EPAM</p>`;

const C64_LINES = ['**** COMMODORE 64 BASIC V2 ****', '64K RAM SYSTEM 38911 BYTES FREE', '',
  'READY.', 'LOAD"*",8,1', 'SEARCHING FOR *', 'LOADING', 'READY.',
  '10 PRINT "HELLO WORLD"', '20 GOTO 10', 'RUN'];

// ---------- SCENES (index = LV) ----------
export const scenes = [
  { name: 'TITLE', noLv: true, hud: false, async run() { overlay.show(TITLE); } },

  { name: 'HOME', async run(c) {                                        // LV 1
    c.world('home'); c.outfit('kid');
    await c.set({ year: 'AGE 12', guild: 'HOME' });
    c.prop('flats', 240);
    const chest = c.prop('chest', 150);
    await c.walk();
    await c.say('Age 12. A big box is waiting at home...', { who: 'NARRATOR' });
    c.open(chest);
    await c.loot('c64', 'COMMODORE 64', 'YOUR FIRST PC!');
    overlay.show('', 'c64');
    await overlay.type(C64_LINES, c.signal);
    await c.say('Custom commands, first queries. Something clicked.', { who: 'NARRATOR' });
    // final frame: the C64 screen stays until the next SPACE
  }},

  { name: 'ELEMENTARY SCHOOL', async run(c) {                           // LV 2
    await c.transition(() => c.world('school'));
    await c.set({ guild: 'ELEMENTARY SCHOOL', year: '1995+' });
    c.prop(null, 175, { draw: drawWin95 });
    await c.walk();
    await c.say('1-2 IT lessons a week. Hello, Windows 95!', { who: 'TEACHER' });
    await c.skill('POINT & CLICK', 'MOUSE MASTERY +1');
  }},

  { name: 'HIGH SCHOOL', async run(c) {                                 // LV 3
    await c.transition(() => c.world('high'));
    await c.set({ guild: 'HIGH SCHOOL' });
    c.flash(); c.outfit('teen');                                        // he grew up (sprite swap)
    const chest = c.prop('chest', 170);
    await c.walk();
    await c.say('High school with an IT specialisation.', { who: 'NARRATOR' });
    c.open(chest);
    await c.loot('book', 'PASCAL SPELLBOOK');
    await c.loot('scroll', 'DBASE SCROLL');
  }},

  { name: 'THE MATRIX', async run(c) {                                  // LV 4
    await c.transition(() => { c.engine.rain = true; });
    await c.set({ year: '1999' });
    const pill = col => (g, x, y) => { g.fillStyle = col; g.fillRect(x - 2, y, 4, 3); };
    const m = c.here(c.S.npc.morpheus, 210, { flip: true, alpha: 0, z: 1 });
    const red = c.here(null, 196, { y: GROUND - 20, alpha: 0, z: 2, draw: pill('#ff3030') });
    const blue = c.here(null, 224, { y: GROUND - 20, alpha: 0, z: 2, draw: pill('#3080ff') });
    await c.say('1999. "The Matrix" hits the cinemas.', { who: 'NARRATOR' });
    await Promise.all([m, red, blue].map(a => c.tween(a, { alpha: 1 }, 800)));
    await c.say('Blue pill: the story ends. Red pill: see how deep the rabbit hole goes.', { who: 'MORPHEUS' });
    await c.tween(red, { x: c.engine.camera + c.hero.x + 8, y: GROUND - 30 }, 700, ease.inOut);
    c.engine.remove(red); c.flash();
    await c.banner('QUEST ACCEPTED:\nBECOME A SOFTWARE ENGINEER', 'title');
  }},

  { name: 'UNIVERSITY', async run(c) {                                  // LV 5
    await c.transition(() => c.world('academy'));
    await c.set({ guild: 'UNIVERSITY' });
    await c.equip('student', 'STUDENT HOODIE', 'PROCRASTINATION +1');
    const chests = [130, 180, 230].map(x => c.prop('chest', x));
    await c.walk();
    await c.say('3.5 years of Informatics... plus internships on the side.', { who: 'NARRATOR' });
    const quests = [
      ['phone',  'NOKIA BRICK',     'Nokia OS app: Bluetooth pairing.',     'SZTE SOFTWARE DEPT.', ''],
      ['dagger', 'C DAGGER',        'Embedded heat-measuring system in C.', 'BIRD WATCH TOWER', 'Ornithological Institute'],
      ['bow',    'OBJECTIVE-C BOW', 'iOS development as an intern.',        'CAS', ''],
    ];
    for (const [i, [icon, name, text, who, real]] of quests.entries()) {
      c.open(chests[i]);
      await c.say(text, { who, real });
      await c.loot(icon, name);
      if (icon === 'dagger' && !c.state.bird)
        c.state.bird = c.engine.add({ frames: [c.S.icon.bird0, c.S.icon.bird1], x: c.hero.x - 18,
                                      y: GROUND - 44, anim: true, bob: 2, z: 2, keep: true });
    }
  }},

  { name: 'FIRST JOB', async run(c) {                                   // LV 6
    const bird = c.state.bird;
    if (bird) { c.state.bird = null; c.tween(bird, { x: 400, y: 20 }, 1500).then(() => c.engine.remove(bird)); }
    await c.transition(() => c.world('office'));
    await c.set({ guild: 'SMALL CO.', year: '2007' });
    await c.banner('2007 - FIRST REAL JOB', 'chapter');
    await c.equip('casual', 'CASUAL WEAR', 'COFFEE UNLOCKED');
    const bugs = [170, 210, 250].map(x => c.prop('bug', x, { bob: 1 }));
    await c.walk();
    await c.say('Automation tester: Java + Selenium E2E tests.', { who: 'GUILD MASTER' });
    await c.loot('crossbow', 'SELENIUM CROSSBOW', 'AUTO-FIRE E2E TESTS');
    for (const b of bugs) await c.shoot(b);
    await c.skill('MARKUP & STYLE', 'HTML + CSS');
  }},

  { name: 'MERCHANT TOWN', async run(c) {                               // LV 7
    await c.transition(() => c.world('market'));
    const bug = c.prop('bug', 150, { bob: 1 }), goblin = c.prop('goblin', 195), troll = c.prop('troll', 255);
    await c.walk();
    await c.say('Side quest: web shops! Drupal, JS, HTML, CSS.', { who: 'MERCHANT TOWN', real: 'early web shop projects' });
    await c.shoot(bug);
    await c.banner('PAYMENT GATEWAY GOBLIN!', 'boss');
    await c.shoot(goblin);
    await c.say('"Your float layout is mine!"', { who: 'IE6 TROLL' });
    for (let i = 0; i < 3; i++) await c.shoot(troll, i === 2);
    await c.loot('droplet', 'DRUPAL DROPLET', '+MANA FOR CMS MAGIC');
    await c.skill('JAVASCRIPT BASICS');
  }},

  { name: 'CAS', async run(c) {                                         // LV 8
    await c.transition(() => c.world('cas'));
    await c.set({ guild: 'CAS', year: '2012' });
    await c.banner('2012 - GUILD CHANGE: CAS', 'chapter');
    await c.walk();
    await c.say('Back to my intern guild. Role: Silverlight developer.', { who: 'CAS' });
    await c.loot('shield', 'SILVERLIGHT SHIELD');
    await c.set({ year: '2013' });
    await c.say('2013. Silverlight fades... the shield cracks.', { who: 'NARRATOR' });
    c.quake(3);
    await c.banner('SILVERLIGHT SHIELD BROKEN', 'boss', 'shieldCracked');
    await c.loot('halberd', 'VAADIN HALBERD', 'JAVA ON THE WEB - 1 YEAR');
  }},

  { name: 'THE GREAT CHOICE', async run(c) {                            // LV 9
    await c.set({ year: '2014' });
    await c.walk(80, 900);
    await c.banner('BOSS DUEL:\nTHE GREAT CHOICE', 'boss');
    await c.say('Silverlight -> HTML5. My first real PoC: Vaadin or JavaScript?', { who: 'POC' });
    const hal = c.here('halberd', 130, { y: GROUND - 30 });
    const swd = c.here('sword', 230, { y: GROUND - 30, flip: true });
    for (let i = 0; i < 3; i++) {
      await Promise.all([c.tween(hal, { x: hal.x + 40 }, 220), c.tween(swd, { x: swd.x - 40 }, 220)]);
      c.burst(180, GROUND - 40, 14); c.quake(5);
      await Promise.all([c.tween(hal, { x: hal.x - 40 }, 220), c.tween(swd, { x: swd.x + 40 }, 220)]);
    }
    await c.tween(hal, { y: GROUND + 20, alpha: 0 }, 600);
    c.engine.remove(hal); c.engine.remove(swd);
    await c.say('Verdict: the next solution is built in JAVASCRIPT.', { who: 'POC' });
    c.engine.add({ temp: true, draw: drawFork }); c.flash();
    await c.set({ path: 'FRONT-END' });
    await c.banner('PATH CHOSEN: FRONT-END', 'title');
    await c.equip('frontend', 'SHADES OF CLARITY', 'YOU SEE THE DOM CLEARLY NOW');
    await c.loot('sword', 'JS SWORD', 'MAIN WEAPON FROM NOW ON');
    await c.loot('armor', 'TYPESCRIPT ARMOR', 'TYPE SAFETY +5');
    await c.loot('blade', 'ANGULARJS BETA BLADE', '+ DOJO TOOLKIT');
    await c.say('Warning: this weapon may return...', { who: '???' });
  }},

  { name: 'PARTY LEADER', async run(c) {                                // LV 10
    await c.set({ year: '2015' });
    const m1 = c.engine.add({ frames: c.S.npc.mate1, x: -20, walker: true, moving: true, z: 1, keep: true });
    const m2 = c.engine.add({ frames: c.S.npc.mate2, x: -40, walker: true, moving: true, z: 1, keep: true });
    await Promise.all([c.tween(m1, { x: 46 }, 900), c.tween(m2, { x: 24 }, 1100)]);
    m1.moving = m2.moving = false;
    c.state.party = [m1, m2];
    await c.banner('ROLE: PARTY LEADER\n2 TEAMS, 2 PROJECTS', 'chapter');
    await c.walk();
    await c.skill('SDLC CYCLE', '4 YEARS OF REAL BASICS');
    await c.say('Leading teams... and still TITLE: ---.', { who: 'NARRATOR' });
  }},

  { name: 'EPAM - D2', async run(c) {                                   // LV 11
    await c.transition(() => c.world('epam'));
    const gate = c.prop(null, 220, { draw: drawGate, open: 0 });
    await c.walk();
    const party = c.state.party ?? [];
    party.forEach(m => { m.flip = true; m.moving = true; });
    await c.say('2016. The EPAM guild gate. The CAS party stays behind.', { who: 'NARRATOR' });
    await Promise.all(party.map(m => c.tween(m, { x: -30, alpha: 0 }, 900)));
    party.forEach(m => c.engine.remove(m));
    c.state.party = [];
    await c.set({ guild: 'EPAM', year: '2016' });
    await c.tween(gate, { open: 1 }, 1200);
    c.flash(); c.burst(160, 60, 40); c.quake(3);
    await c.set({ title: 'D2' });
    await c.banner('FIRST TITLE EARNED!\nD2 - MID SOFTWARE ENGINEER', 'title');
    await c.equip('d2', 'HAWAIIAN SHIRT', 'FIRST TITLE, FIRST ALOHA\nIMPOSTOR SYNDROME ++');
    await c.say('Mid developer at last. Chapter 1 begins...', { who: 'GUILD MASTER', real: 'EPAM' });
  }},

  { name: 'TO BE CONTINUED', noLv: true, hud: false, async run() {
    overlay.show('<h1>TO BE<br>CONTINUED</h1><p class="sub">D2 -> D5 IN PIECE 6</p>');
  }},
];
