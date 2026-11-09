// ALL STORY CONTENT. One scene = one SPACE press. LV is set by the runner (scene index, R39).
// R1:  SPACE is the only key; every scene plays its own animation.
// R37: the hero is always drawn at scale 2 - outfits/ages are sprite swaps, never zooms.
// R40: whatever is on screen when a scene ends is its "final frame" - skipping lands there.
import { GROUND, WORLDS, ease, sleep, tween } from './engine.js';
import { C } from './palette.js';
import { banner, overlay, viewTransition } from './ui.js';

export const LV_MAX = 26;                // timeline v1.2 (25) + the TMP mentor scene, LV 21 (2024)
const WALK = 140;

// extra worlds for the split prologue
Object.assign(WORLDS, {
  home:   { sky: ['#3a2a7a', '#ff8a3d'], far: 'city',  farC: '#2d1b5a', win: C.yellow, ground: '#3c8a4a', dirt: '#4a3326' },
  school: { sky: ['#2a3a8e', '#5a7ad8'], far: 'hills', farC: '#2f5b4a', ground: '#3c8a4a', dirt: '#4a3326', clouds: true },
  high:   { sky: ['#1b1036', '#3d2a7a'], far: 'city',  farC: '#2a1f55', win: C.cyan, ground: '#6a5a8e', dirt: '#2d2448', stars: true },
  // TMP mentor scene: misty green swamp hills (a quiet nod to a certain small green master)
  dojo:   { sky: ['#0f1f1a', '#2f5a3a'], far: 'hills', farC: '#1f3a2a', ground: '#3a6a3a', dirt: '#1f2a1a', stars: true },
  // Piece 6 worlds
  soda:   { sky: ['#3a0f2a', '#ff4fa3'], far: 'city',  farC: '#5a1a3a', win: C.yellow, ground: '#e83b3b', dirt: '#5a1a1a' },
  lair:   { sky: ['#0a0a12', '#2a1020'], far: 'towers', farC: '#1a1a24', win: C.red, ground: '#3a3a4a', dirt: '#1a1a24', stars: true },
  beach:  { sky: ['#ff6f9a', '#ffd23f'], far: 'peaks', farC: '#3a2a7a', ground: '#f2d27a', dirt: '#c9a050', clouds: true },
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
  <p class="sub">The road to Chief Engineering</p>
  <p class="who">JANOS FEKETE * EPAM</p>`;

const C64_LINES = ['**** COMMODORE 64 BASIC V2 ****', '64K RAM SYSTEM 38911 BYTES FREE', '',
  'READY.', 'LOAD"*",8,1', 'SEARCHING FOR *', 'LOADING', 'READY.',
  '10 PRINT "HELLO WORLD"', '20 GOTO 10', 'RUN'];

// Piece 6 props, drawn like drawWin95 (y = ground line)
function drawBeachChair(g, x, y) {
  const L = x - 14, T = y - 14;
  g.fillStyle = C.orange; g.fillRect(L, T, 28, 3);
  g.fillStyle = C.white;  g.fillRect(L + 4, T + 3, 20, 2);
  g.fillStyle = C.yellow; g.fillRect(L, T + 5, 28, 2);
  g.fillStyle = C.ink;    g.fillRect(L + 2, T + 7, 2, 7); g.fillRect(L + 24, T + 7, 2, 7);
  g.fillRect(L + 4, T + 12, 20, 2);
}

function drawJudgeBench(g, x, y) {
  const L = x - 36, T = y - 26;
  g.fillStyle = '#6b3a1e'; g.fillRect(L, T, 72, 6);
  g.fillStyle = C.ink;     g.fillRect(L + 4, T + 6, 4, 20); g.fillRect(L + 64, T + 6, 4, 20);
  g.fillStyle = C.yellow;  g.font = '6px "Press Start 2P"'; g.textBaseline = 'top';
  g.fillText('ASMT', L + 24, T - 8);
}

// TMP - Technology Mentoring Program (2024, D4). Andrii: mentor, friend, "kinda Yoda".
// Final frame (R40): Andrii stands behind the hero as a party member.
export const TMP_MENTOR = { name: 'TMP: THE MENTOR', async run(c) {
  await c.transition(() => c.world('dojo'));
  await c.set({ year: '2024' });
  await c.banner('SIDE QUEST: TMP\nTECHNOLOGY MENTORING PROGRAM', 'chapter');
  const sage = c.prop(c.S.npc.andrii, 220, { flip: true, z: 1 });      // faces the hero
  await c.walk();
  await c.say('Hmm. Long you have walked, D4. Ready for the Chief path, you are.',
              { who: 'MASTER ANDRII', real: 'TMP mentor' });
  await c.say('Associate Chief first, maybe? Safer, it sounds...', { who: 'YOU' });
  await c.say('Associate Chief? No! Chief, or Chief not. There is no associate.',
              { who: 'MASTER ANDRII', real: 'TMP mentor' });
  c.quake(2);
  await c.skill('CHIEF MINDSET', 'CONFIDENCE ++\nIMPOSTOR SYNDROME --');
  await c.say('Train you, I will. And a friend, I will be.', { who: 'MASTER ANDRII', real: 'TMP mentor' });

  // the world prop becomes a screen-space party member that follows the hero
  const sx = sage.x - c.engine.camera;
  c.engine.remove(sage);
  const mentor = c.engine.add({ frames: c.S.npc.andrii, x: sx, walker: true, moving: true,
                                flip: true, z: 1, keep: true });
  c.state.mentor = mentor;
  await c.tween(mentor, { x: 44 }, 1400, ease.inOut);
  mentor.moving = false; mentor.flip = false;
  c.burst(44, GROUND - 40, 16, [C.green, C.white]);
  await c.banner('NEW PARTY MEMBER:\nANDRII - MENTOR & FRIEND', 'item');
}};

// Call inside the D5 ASMT Trial scene (LV 22, 2025), after the title banner.
// The mentor stays in the party until D5 (he walks along through 2024-2025).
export async function mentorNod(c) {
  if (!c.state.mentor) return;
  await c.say('Chief, now you are. Proud, I am.', { who: 'MASTER ANDRII', real: 'TMP mentor' });
  c.burst(c.state.mentor.x, GROUND - 40, 12, [C.green, C.yellow]);
}

// Andrii leaves the party after the ASMT trial (LV 22): he walks off to the left.
export async function mentorLeaves(c) {
  const m = c.state.mentor;
  if (!m) return;
  m.moving = true; m.flip = true;                  // walks off to the left, facing away
  await c.tween(m, { x: -40, alpha: 0 }, 1400, ease.inOut);
  c.engine.remove(m);
  c.state.mentor = null;
}

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
    await c.set({ year: '2004' });
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

  // ---------- PIECE 6: LV 12-20 (Coca-Cola -> RFP Hydra) ----------

  { name: 'SODA KINGDOM', async run(c) {                                  // LV 12
    await c.transition(() => c.world('soda'));
    await c.set({ guild: 'EPAM', year: '2016' });
    const bugs = [190, 230].map(x => c.prop('bug', x, { bob: 1 }));
    await c.walk();
    await c.say('Coca-Cola e-commerce. Your small web shops finally pay off.', { who: 'GUILD MASTER', real: 'Coca-Cola' });
    for (const b of bugs) await c.shoot(b);
    await c.loot('anvil', 'WIDGET FORGE', 'LAUNCH SITES IN DAYS');
    await c.skill('JS SDK CORE', 'YOU BUILT THE CORE');
  }},

  { name: 'HOTEL EMPIRE', async run(c) {                                  // LV 13
    await c.transition(() => c.world('hotel'));
    await c.set({ guild: 'HOTELS.COM', year: '2017' });
    const spiders = [200, 240].map(x => c.prop('spider', x, { bob: 1 }));
    await c.walk();
    await c.say('SEO crawler spiders everywhere. Let us clean the web.', { who: 'HOTELS.COM', real: 'Hotels.com' });
    for (const s of spiders) await c.shoot(s);
    await c.banner('9 UIE COMPANIONS JOIN\nFIRST MENTEE - NOV 2017', 'chapter');
    await c.loot('trophy', 'HACKATHON ARENA', 'WON THE HOTELS.COM HACKATHON');
    await c.skill('NODEJS', 'LEARNED DURING HCOM');
    await c.loot('node', 'NODEJS ICON', 'NODE.JS');
  }},

  { name: 'D3: SENIOR', async run(c) {                                    // LV 14
    await c.transition(() => c.world('hotel'));
    await c.set({ year: '2018', title: 'D3' });
    await c.banner('TITLE UP!\nD3 - SENIOR SOFTWARE ENGINEER', 'title');
    await c.equip('d3', 'FLIP-FLOPS', 'REVIEW SPEED ++\nRESPONSIBILITY ++');
    await c.say('Gatekeeper: tech interviews and ASMT expert. The counters start now.', { who: 'GUILD MASTER', real: 'EPAM' });
    await c.say('Still in Hotel Empire: KES re-architecture, CMS -> FLEX', { who: 'NARRATOR' });
  }},

  { name: 'EMERALD VAULT', async run(c) {                                 // LV 15
    await c.transition(() => c.world('bank'));
    await c.set({ year: '2021' });
    await c.set({ guild: 'BANK OF IRELAND' });
    const chest = c.prop('chest', 170);
    await c.walk();
    await c.say('Audience Builder on GCP. Big finance, big data.', { who: 'BANK OF IRELAND', real: 'Bank of Ireland' });
    c.open(chest);
    await c.loot('telescope', 'BIGQUERY TELESCOPE');
    await c.skill('MICROFRONTEND SHARDS', 'GCP MFE PROOF OF CONCEPT');
  }},

  { name: 'D4: LEAD', async run(c) {                                      // LV 16
    await c.transition(() => c.world('epam'));
    await c.set({ year: '2022', title: 'D4' });
    await c.banner('TITLE UP!\nD4 - LEAD SOFTWARE ENGINEER', 'title');
    await c.equip('d4', 'QUALITY ATTRIBUTES CAP', 'WORN BACKWARDS\nSCALABILITY ++\nAVAILABILITY ++\nTRADE-OFF VISION ++');
    await c.banner('GWS ARMY OF 26\n13 DEV - 6 QA - 5 DEVOPS - 1 BA - 1 SA', 'chapter');
    await c.loot('amulet', 'LOAN CALCULATOR AMULET');
    await c.loot('crystal', 'WEB CHAT CRYSTAL');
    await c.loot('tome', 'PATTERN LIBRARY TOME');
    await c.skill('AWS CLOUD ASCENSION', 'SQS - SNS - LAMBDA');
  }},

  { name: 'ANGULARJS SUNSET', async run(c) {                              // LV 17
    await c.transition(() => c.world('lair'));
    const dragon = c.prop('dragon', 200, { bob: 2 });
    await c.walk();
    await c.banner('BOSS: ANGULARJS SUNSET DRAGON', 'boss');
    await c.say('The blade you forged at CAS has turned against you!', { who: 'ANGULARJS', real: 'AngularJS sunset' });
    await c.shoot(dragon, false);
    await c.shoot(dragon, false);
    await c.shoot(dragon, true);
    await c.skill('SUNSET DISCOVERY', 'LEGACY MIGRATION PLANNED');
  }},

  { name: 'QUALITY ARSENAL', async run(c) {                               // LV 18
    await c.transition(() => c.world('epam'));
    await c.set({ guild: 'EPAM' });
    await c.walk();
    await c.loot('lantern', 'LIGHTHOUSE LANTERN', 'CLI TOOL ON AWS');
    await c.loot('cannon', 'ARTILLERY CANNON', 'LOAD TESTING');
    await c.loot('axeShield', 'PLAYWRIGHT + AXE SHIELD', 'WCAG 2.1 AA');
    await c.loot('npm', 'NPM CRAFT', 'ADAPTIVE-LOADING-HELPER');
    await c.loot('npm', 'NPM CRAFT', 'IMAGE-OPTIMIZER');
  }},

  { name: 'ON-PREM GOLEM', async run(c) {                                  // LV 19
    await c.transition(() => c.world('lair'));
    await c.set({ guild: 'EPAM' });
    const golem = c.prop('golem', 210, { bob: 1 });
    await c.walk();
    await c.banner('BOSS: ON-PREM GOLEM', 'boss');
    await c.shoot(golem, false);
    await c.loot('monocle', 'MONOCLE OF AUDIT', 'BUNGIE AND VAS CODE AUDITS');
    await c.say('Ticket X moves from on-premises to GCP.', { who: 'SAS GRADUATE WORK', real: 'SAS graduate project' });
    await c.shoot(golem, true);
  }},

  { name: 'RFP HYDRA', async run(c) {                                     // LV 20
    await c.transition(() => c.world('lair'));
    const hydra = c.prop('hydra', 200, { bob: 2 });
    await c.walk();
    await c.banner('BOSS: RFP HYDRA', 'boss');
    await c.say('Landis IoT RFP. The Hydra grows a head.', { who: 'RFP', real: 'Landis IoT' });
    await c.shoot(hydra, false);
    await c.say('GWS UK migration RFP. Another head.', { who: 'RFP', real: 'GWS UK migration' });
    await c.shoot(hydra, false);
    await c.shoot(hydra, true);
    await c.skill('RFP RESPONSE', 'THE HYDRA FALLS');
  }},

  // ---------- LV 21 (2024, D4): TMP mentor ----------
  // Andrii: mentor, friend, "kinda Yoda". Final frame (R40): he stands behind the hero.
  TMP_MENTOR,

  // ---------- LV 22-26 (D5 -> finale) ----------

  { name: 'D5: ASMT TRIAL', async run(c) {                                // LV 22
    await c.transition(() => c.world('throne'));
    await c.set({ year: '2025' });
    const bench = c.prop(null, 200, { draw: drawJudgeBench });
    await c.walk();
    await c.say('The ASMT trial. The committee is watching.', { who: 'ASMT COMMITTEE', real: 'ASMT' });
    await c.set({ title: 'D5' });
    c.flash(); c.burst(160, 60, 40, [C.yellow, C.pink]); c.quake(3);
    await c.banner('TITLE UP!\nD5 - CHIEF SOFTWARE ENGINEER I', 'title');
    await c.equip('d5', "CHIEF'S BREW", 'THE CHIEF LEGEND');
    await mentorNod(c);
    await mentorLeaves(c);
  }},

  { name: 'MENTORING COUNCIL', async run(c) {                             // LV 23
    await c.transition(() => c.world('bank'));
    await c.set({ guild: 'EPAM' });
    const hydra = c.prop('hydra', 200, { bob: 2 });
    await c.walk();
    await c.banner('ASE MENTORING - JSCC AMBASSADOR', 'chapter');
    await c.banner('51 INTERVIEWS - 46 ASMT SESSIONS (9 COMMITTEES)\n27 MENTEES', 'info');
    await c.say('The Hydra grows new heads. You cut them faster now, with more RFPs.', { who: 'NARRATOR' });
    await c.shoot(hydra, false);
    await c.shoot(hydra, true);
    await c.skill('MENTOR', 'ASE MENTORING - JSCC AMBASSADOR');
  }},

  { name: 'FULLSTACK 2026', async run(c) {                                // LV 24
    await c.transition(() => c.world('cloud'));
    await c.set({ year: '2026' });
    await c.banner('2026 - PATH CHANGE', 'chapter');
    await c.set({ path: 'FULLSTACK' });
    c.flash();
    await c.banner('PATH: FULLSTACK\nFRONT END + NODEJS + CLOUD', 'title', 'stack');
    await c.loot('stack', 'FULLSTACK STACK', 'THE ARMOR OF BOTH WORLDS');
  }},

  { name: 'AI ERA', async run(c) {                                        // LV 25
    await c.transition(() => { c.engine.rain = true; });
    await c.set({ year: '2026' });
    await c.say('The Matrix rain returns. The JS sword dissolves into code.', { who: 'NARRATOR' });
    await c.loot('staff', 'AGENT STAFF', 'COPILOT - CLAUDE CODE - MCP PORTALS');
    await c.transition(() => c.world('beach'));
    const chair = c.prop(null, 200, { draw: drawBeachChair });
    await c.walk();
    await c.say('Relaxing in a beach chair while the agents code.', { who: 'NARRATOR' });
    await c.skill('AI COMPANIONS', 'AGENTS CODE, THE HERO RELAXES');
  }},

  { name: 'FINALE', async run(c) {                                       // LV 26
    await c.transition(() => c.world('beach'));
    await c.set({ guild: 'EPAM', title: 'D5', path: 'FULLSTACK' });
    overlay.show(`
      <h1>TROPHY ROOM</h1>
      <p class="stat">D5 - CHIEF SOFTWARE ENGINEER I</p>
      <p class="stat">408 BADGES</p>
      <p class="stat">FULLSTACK - 2026</p>`, 'end');
    await c.wait(3000);
    overlay.show(`
      <h1>A NEW GAME<br>BEGINS...</h1>
      <p class="sub">YOU HAVE ONE LIFE, DON'T BLOW IT.</p>
      <p class="who">MAHALO</p>`, 'end');
  }},
];
