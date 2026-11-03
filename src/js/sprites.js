// All pixel art as text maps: 1 character = 1 pixel, '.' = transparent.
import { C } from './palette.js';

const PAL = {
  k: C.ink,     s: '#f2b48c', h: '#5a341c', e: C.ink,     g: '#0b0b10',
  w: C.white,   b: C.blue,    n: '#dcdcdc', p: C.pink,    y: C.yellow,
  Y: '#c9a020', m: '#c8c8d8', M: '#d43a3a', c: '#2bb3a3', H: '#6a5a8e',
  r: '#e8455a', R: '#ff6f3d', f: C.yellow,  F: C.white,   B: '#8a5a2b',
  o: '#a0522d', t: '#6f8f6a', d: '#1a1a1a', K: '#c8a96a', q: C.cyan,
  Q: '#1f8fa0', G: C.green,   u: C.violet,  x: C.red,     i: C.cyan,
  l: '#9a96b8', a: C.yellow,
};

const mirror = rows => {
  const w = Math.max(...rows.map(r => r.length));
  return rows.map(r => [...r.padEnd(w, '.')].reverse().join(''));
};

// ---------- HERO BUILDER (adult 14x19, kid 14x16, faces right) ----------
function shirtPx(type, x, y) {
  if (type === 'hawaii') return (x * 3 + y * 5) % 7 === 0 ? 'f' : 'r';
  if (type === 'legend') return (x + y * 2) % 4 === 0 ? 'f' : (x * 2 + y) % 5 === 0 ? 'F' : 'R';
  return type;                                   // single palette character
}

export function heroRows(o, frame = 0) {
  const head = [
    '...hhhhhh...',
    '..hhhhhhhh..',
    '..hssssssh..',
    o.shades ? '..gggssggg..' : '..ssessess..',
    '..ssssssss..',                               // nose on the right = facing right
    '...sskkss...',
    '....ssss....',
  ];
  if (o.cap) {                                    // Quality Attributes cap, brim at the BACK
    head[0] = '...qqqqqq...';
    head[1] = 'QQqqqqqqqq..';
  }

  let torso = [
    '..XXXXXXXX..',
    '.XXXXXXXXXX.',
    '.XXXXXXXXXX.',
    '.sXXXXXXXXs.',
    '.sXXXXXXXXs.',
    '..XXXXXXXX..',
  ];
  if (o.kid) torso = [torso[0], torso[1], torso[3], torso[5]];

  const legs = frame
    ? ['..PPPPPPPP..', '...PPPPPP...', '...LLLLLL...', '...LLLLLL...']
    : ['..PPPPPPPP..', '..PPP..PPP..', '..LLL..LLL..', '..LLL..LLL..'];

  const feet = o.flipflops
    ? (frame ? ['...ssssss...', '...ppppppp..'] : ['..sss..sss..', '..pppp.pppp.'])
    : (frame ? ['...nnnnnn...', '...nnnnnnn..'] : ['..nnn..nnn..', '..nnnn.nnnn.']);

  const pc = o.pants ?? 'b';
  const lc = o.shorts ? 's' : pc;
  const t0 = head.length;

  const rows = [
    ...head,
    ...torso.map((r, y) => [...r].map((ch, x) => (ch === 'X' ? shirtPx(o.shirt, x, y) : ch)).join('')),
    ...(o.kid ? legs.slice(0, 3) : legs).map(r => r.replaceAll('P', pc).replaceAll('L', lc)),
    ...feet,
  ].map(r => r.padEnd(14, '.'));

  const put = (y, x, str) => {
    const r = [...rows[y]];
    [...str].forEach((ch, i) => { if (ch !== '.') r[x + i] = ch; });
    rows[y] = r.join('');
  };

  const hand = t0 + (o.kid ? 2 : 3);
  if (o.backpack) for (let y = 1; y < torso.length - 1; y++) put(t0 + y, 0, 'B');
  if (o.hold === 'coffee') { put(hand, 11, 'ww'); put(hand + 1, 11, 'ww'); }
  if (o.hold === 'beer')   { put(hand - 1, 11, 'mm'); put(hand, 11, 'MM'); put(hand + 1, 11, 'MM'); }
  return rows;
}

// Hero evolution (Requirements R28)
export const OUTFITS = {
  kid:      { kid: true, shirt: 'w', pants: 'b', shorts: true },
  student:  { shirt: 'H', pants: 'b', backpack: true },
  casual:   { shirt: 'c', pants: 'b', hold: 'coffee' },
  frontend: { shirt: 'c', pants: 'b', hold: 'coffee', shades: true },
  d2:       { shirt: 'hawaii', pants: 'b', hold: 'coffee', shades: true },
  d3:       { shirt: 'hawaii', pants: 'K', shorts: true, flipflops: true, hold: 'coffee', shades: true },
  d4:       { shirt: 'legend', pants: 'K', shorts: true, flipflops: true, hold: 'coffee', shades: true, cap: true },
  d5:       { shirt: 'legend', pants: 'K', shorts: true, flipflops: true, hold: 'beer',   shades: true, cap: true },
};

// NPCs reuse the hero builder with colour overrides
const NPCS = {
  morpheus: [{ shirt: 'd', pants: 'd', shades: true }, { s: '#7a4a2a', h: '#7a4a2a', n: '#1a1a1a' }],
  mate1:    [{ shirt: 'p', pants: 'b', hold: 'coffee' }, { h: '#e0c050' }],
  mate2:    [{ shirt: 'y', pants: 'd', hold: 'coffee' }, { h: '#222222' }],
  mate3:    [{ shirt: 'G', pants: 'b' }, { h: '#b04020' }],
  master:   [{ shirt: 'u', pants: 'd', hold: 'coffee' }, { h: '#a0a0a0' }],
  judge:    [{ shirt: 'd', pants: 'd' }, { h: '#e0e0e0', d: '#3a2a6a' }],
};

// ---------- ITEMS ----------
const SWORD  = ['.......w', '......wa', '.....wa.', '....wa..', '.k.wa...', '..ka....', '.bkk....', 'bb..k...'];
const SHIELD = ['.kkkkkk.', 'kaaaaaak', 'kawaaaak', 'kaaaaaak', 'kaaaaaak', '.kaaaak.', '..kaak..', '...kk...'];
const BOOK   = ['kkkkkkk.', 'kaaaaaak', 'kayyyyak', 'kaaaaaak', 'kayyyaak', 'kaaaaaak', 'kwwwwwwk', 'kkkkkkkk'];

// Block of flats (panel house) for the HOME scene. 27 x 30 pixels.
function flatsRows() {
  const wall = inner => 'kl' + inner + 'k';             // 2 + 24 + 1 = 27 wide
  const plain = wall('l'.repeat(24));
  const rows = ['k'.repeat(27), plain];                  // roof
  for (let f = 0; f < 8; f++) {                          // 8 floors, 6 windows each
    const line = Array.from({ length: 6 }, (_, w) =>
      ((f * 7 + w * 3) % 5 === 0 ? 'yy' : 'dd') + 'll').join('');   // some windows lit
    rows.push(wall(line), wall(line), plain);
  }
  const door = wall('l'.repeat(10) + 'oooo' + 'l'.repeat(10));
  rows.push(door, door, door, 'k'.repeat(27));
  return rows;
}

const ICONS = {
  chest:     [['.kkkkkkkkkk.', 'kooooooooook', 'kooooooooook', 'kkkkkyykkkkk',
               'kooooyyooook', 'kooooooooook', 'kooooooooook', 'kkkkkkkkkkkk'], {}],
  chestOpen: [['.kkkkkkkkkk.', 'kOOOOOOOOOOk', 'kkkkkkkkkkkk', 'kGGGGGGGGGGk',
               'kooooyyooook', 'kooooooooook', 'kooooooooook', 'kkkkkkkkkkkk'], { O: '#6b3a1e', G: '#fff6a0' }],

  // prologue
  c64:      [['kkkkkkkkkkkkkk', 'kbbbbbbbbbbbbk', 'kbwkwkwkwkwbbk', 'kbkwkwkwkwkbbk', 'kbwwwwwwwwbrok', 'kkkkkkkkkkkkkk'],
             { b: '#c9b89a', w: '#5a4a3a', k: '#3a3020', r: '#e04040', o: '#ffa020' }],
  book:     [BOOK, { a: C.blue }],
  scroll:   [['.oooooo.', 'owwwwwwo', '.wkkkkw.', '.wwwwww.', '.wkkkww.', '.wwwwww.', 'owwwwwwo', '.oooooo.'], { w: '#f0e0b0' }],
  phone:    [['.kkkk.', 'kaaaak', 'kwwwwk', 'kwwwwk', 'kaaaak', 'kawawk', 'kaaaak', 'kawawk', 'kaaaak', '.kkkk.'],
             { a: '#2a3a6a', w: '#9bd36a' }],
  dagger:   [['.....w', '....wa', '...wa.', '.kwa..', '..k...', '.b.k..'], { a: '#c8d0e0', b: '#8a5a2b' }],
  bow:      [['..ka....', '...ka...', '....kaw.', '....k.w.', '....k.w.', '....k.w.', '....kaw.', '...ka...', '..ka....'],
             { a: '#8a5a2b' }],
  crossbow: [['....a.....', '...a.a....', '..a...a...', 'bbbbbbbbbw', '..a...a...', '...a.a....', '....a.....'],
             { a: '#43b02a', b: '#8a5a2b' }],
  droplet:  [['...kk...', '..kaak..', '.kaaaak.', 'kaawaaak', 'kawaaaak', 'kaaaaaak', '.kaaaak.', '..kkkk..'], { a: '#0678be' }],
  shield:        [SHIELD, { a: '#9fb4d8' }],
  shieldCracked: [['.kkkkkk.', 'kaaakaak', 'kawakaak', 'kaakaaak', 'kaaakaak', '.kaakak.', '..kaak..', '...kk...'], { a: '#9fb4d8' }],
  halberd:  [['...w....', '..kwk...', '.kwwwkk.', 'kwwwwwwk', 'kwwwwwk.', '.kwwwk..', '...a....', '...a....',
              '...a....', '...a....', '...a....', '...a....', '...a....', '..kak...'], { a: '#8a5a2b', w: '#00b4f0' }],
  sword:    [SWORD, { a: C.yellow, b: '#8a5a2b' }],
  blade:    [SWORD, { a: '#dd1b16', w: '#ffb0b0', b: '#555555' }],
  armor:    [['kk....kk', 'kakkkkak', 'kaaaaaak', 'kawwaaak', 'kaaaaaak', '.kaaaak.', '.kaaaak.', '..kkkk..'], { a: '#3178c6' }],

  // outfit pieces (for EQUIP banners)
  coffee:    [['.w.w..', '..w.w.', 'kkkkk.', 'kwwwkk', 'kwwwk.k', 'kwwwkk', '.kkk..'], {}],
  shades:    [['k..........k', 'kkkkkkkkkkkk', '.kgggkkgggk.', '.kgggk.gggk.', '..kkk...kkk.'], {}],
  shirt:     [['.kkk..kkk.', 'krrrkkrrrk', 'krfrrrrfrk', '.krrfrrrk.', '.krrrrfrk.', '.kfrrrrrk.', '.kkkkkkkk.'], {}],
  flipflops: [['..k....k..', '.kpk..kpk.', 'kpppkkpppk', 'kpppkkpppk', '.kkk..kkk.'], {}],
  cap:       [['...kkkkk..', '..kqqqqqk.', '.kqqwqqqqk', 'kkkkkkkkkk', 'QQQQk.....'], {}],
  beer:      [['.kmmk.', 'kmmmmk', 'kMMMMk', 'kMwMMk', 'kMwMMk', 'kMMMMk', 'kmmmmk', '.kkkk.'], {}],

  // chapter 1-2
  anvil:     [['.kkkkkkkkkk.', 'kllllllllllk', '.kllllllllk.', '...kllllk...', '...kllllk...', '..kllllllk..', '.kkkkkkkkkk.'], {}],
  trophy:    [['yyyyyyyy', 'y.yyyy.y', 'y.yyyy.y', '.yyyyyy.', '..yyyy..', '...yy...', '...yy...', '..YYYY..', '.YYYYYY.'], {}],
  key:       [['.yyy......', 'y...yyyyyy', 'y...y..y.y', '.yyy......'], {}],
  telescope: [['........ww', '......kiik', '....kiiik.', '..kiiik...', 'kiiik.....', '.kk.k.....', '.k...k....', 'k.....k...'],
              { i: '#4285f4' }],
  gem:       [['..kkkk..', '.kiwiik.', 'kiiiiiik', 'kiiiiiik', '.kiiiik.', '..kiik..', '...kk...'], { i: C.pink }],

  // chapter 3-4 and finale
  amulet:    [['.y....y.', '..y..y..', '...yy...', '..kkkk..', '.kGGGGk.', '.kGwGGk.', '.kGGGGk.', '..kkkk..'], {}],
  crystal:   [['..kk..', '.kiik.', 'kiwiik', 'kiiiik', 'kiiiik', 'kiiiik', '.kiik.', '..kk..'], {}],
  tome:      [BOOK, { a: C.pink }],
  lantern:   [['..kkkk..', '...kk...', '.kkkkkk.', '.kyyyyk.', '.kywyyk.', '.kyyyyk.', '.kyyyyk.', '.kkkkkk.', '..kkkk..'], {}],
  cannon:    [['....kkkkkkkk', '..kklllllllk', 'kkllllllllk.', 'kllllllllk..', '.kkokkokk...', '..kok.kok...', '...k...k....'], {}],
  axeShield: [SHIELD, { a: '#2ead33' }],
  npm:       [['.kkkkkk.', 'kxxxxxxk', 'kxxwwxxk', 'kxwxxwxk', 'kxxxxxxk', 'kxxxxxxk', 'kkkkkkkk'], { x: '#cb3837' }],
  monocle:   [['.kkkk..', 'kiiiik.', 'kiwiik.', 'kiiiik.', '.kkkk..', '.....k.', '......k', '.....k.', '......k'],
              { i: '#bfefff' }],
  staff:     [['.kik.', 'kiwik', 'kiiik', '.kik.', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '.kok.'],
              { i: C.green }],
  badge:     [['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '.yy..yy.', 'yy....yy'], {}],
  robot:     [['....kk....', '....ki....', '.kkkkkkkk.', 'kllllllllk', 'klGllllGlk', 'kllllllllk', 'kllkkkkllk',
               '.kkkkkkkk.', '..kllllk..', '.kllllllk.', '.kllllllk.', '..kk..kk..'], {}],
               flats: [flatsRows(), {}],
  node:  [['...kk...', '.kkGGkk.', 'kGGGGGGk', 'kGwGGwGk', 'kGwwGwGk',
           'kGwGwwGk', 'kGwGGwGk', '.kkGGkk.', '...kk...'], { G: '#539e43' }],   // NodeJS hexagon with an "N"
  stack: [['.kkkkkk.', 'kqqqqqqk', '.kkkkkk.', 'kppppppk',
           '.kkkkkk.', 'kGGGGGGk', '.kkkkkk.'], {}],                            // Fullstack: 3 layers
  bird0:     [['k....k', '.kyyk.', '..yy..'], {}],
  bird1:     [['......', '.kyyk.', 'k.yy.k'], {}],
};

// ---------- ENEMIES (face LEFT, towards the hero) ----------
const ENEMIES = {
  bug:    [['..k....k..', '...k..k...', '..kaaaak..', '.kawaawak.', 'kaaaaaaaak', '.kaaaaaak.', 'k.k.kk.k.k'], { a: '#44cc44' }],
  spider: [['k...kkkk...k', '.k.kaaaak.k.', '..kaxaaxak..', 'kkkaaaaaakkk', '..kaaaaaak..', '.k.kaaaak.k.', 'k...kkkk...k'],
           { a: C.violet }],
  goblin: [['..k....k..', '.kgk..kgk.', '.kggggggk.', 'kgwkggkwgk', 'kggggggggk', '.kgkkkkgk.',
            '..kggggk..', '.kyyyyyyk.', 'kgkyyyykgk', '.k.kggk.k.', '...kggk...', '..kk..kk..'], { g: '#7fbf3f' }],
  troll:  [['....kkkkkkkk....', '...kttttttttk...', '..kttttttttttk..', '..kttwkttwktttk.', '..kttttttttttk..',
            '..kttkkkkkkttk..', '...kttwtwtttk...', '..kkkttttttkkk..', '.kttkkkkkkkkttk.', 'kttkbbbbbbbbkttk',
            'kttkbbbwwbbbkttk', 'kttkbbwbbwbbkttk', 'kttkbbwwwwbbkttk', '.kkkbbwbbbbbkkk.', '...kbbbwwwbbk...',
            '...kttk..kttk...', '..kttttk.ttttk..', '..kkkkkk.kkkkk..'], { b: '#1e90ff' }],
  dragon: [mirror([
            '..............kk........', '.............kxxk.......', '............kxxxxkk.....', '...........kxxwkxxxk....',
            '...........kxxxxxxxxk...', '..kk.......kxxxxkkkkk...', '.kxxk.....kxxxxk........', 'kxxxxk...kxxxxxk........',
            'kxxxxxk.kxxxxxxk........', '.kxxxxxkxxxxxxxk........', '..kxxxxxxxxxxxxxk.......', '...kxxxxyyyyxxxxk.......',
            '....kxxyyyyyyxxxk.......', '....kxxxyyyyxxxk........', '.....kxxxxxxxxk.........', '......kxxk.kxxk.........',
            '.....kxxk...kxxk........', '.....kkk....kkk.........']), { x: '#dd1b16' }],
  golem:  [['....kkkkkkkk....', '....kllllllk....', '....klxllxlk....', '....kllllllk....', '....kkllllkk....',
            '.kkkkllllllkkkk.', 'kllllllllllllllk', 'kllkiiiiiiiikllk', 'kllkiGiiiiGikllk', 'kllkiiiiiiiikllk',
            'kllkiGiiiiGikllk', 'kllkiiiiiiiikllk', 'kkkkllllllllkkkk', '...kllllllllk...', '...kllkkkkllk...',
            '...kllk..kllk...', '..kllllk.kllllk.', '..kkkkkk.kkkkkk.'], { i: '#4a4a6a' }],
  hydra:  [['.kkk......kkk......kkk..', 'kaaak....kaaak....kaaak.', 'kwaak....kwaak....kwaak.', 'kaaak....kaaak....kaaak.',
            '.kak......kak......kak..', '.kak......kak......kak..', '..kak.....kak.....kak...', '...kak....kak....kak....',
            '....kak...kak...kak.....', '.....kakkkakakkkak......', '......kaaaaaaaaak.......', '.....kaaaaaaaaaaak......',
            '....kaaaayyyyyaaaak.....', '....kaaayyyyyyyaaak.....', '.....kaaaaaaaaaaak......', '......kaak...kaak.......',
            '.....kkkk...kkkk........'], { a: '#3f9f5f' }],
};

export const ITEM_KEYS  = Object.keys(ICONS);
export const ENEMY_KEYS = Object.keys(ENEMIES);
export const NPC_KEYS   = Object.keys(NPCS);

// ---------- baking: text map -> OffscreenCanvas -> ImageBitmap ----------
async function bake(rows, over = {}) {
  const pal = { ...PAL, ...over };
  const w = Math.max(...rows.map(r => r.length));
  const oc = new OffscreenCanvas(w, rows.length);
  const g = oc.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!pal[ch]) return;
    g.fillStyle = pal[ch];
    g.fillRect(x, y, 1, 1);
  }));
  return createImageBitmap(oc);
}

// S.hero[outfit] = [frame0, frame1], S.npc[name] = [frame0, frame1], S.icon[name] = bitmap
export async function bakeAll() {
  const S = { hero: {}, npc: {}, icon: {} };
  const twoFrames = (o, p) => Promise.all([0, 1].map(f => bake(heroRows(o, f), p)));
  for (const [k, o] of Object.entries(OUTFITS)) S.hero[k] = await twoFrames(o);
  for (const [k, [o, p]] of Object.entries(NPCS)) S.npc[k] = await twoFrames(o, p);
  for (const [k, [rows, p]] of Object.entries({ ...ICONS, ...ENEMIES })) S.icon[k] = await bake(rows, p);
  return S;
}