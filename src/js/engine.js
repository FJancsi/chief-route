// Canvas renderer, worlds, particles and skippable timing helpers.
import { C } from './palette.js';

export const W = 320, H = 180, GROUND = 124;

const mod = (v, m) => ((v % m) + m) % m;
const hash = i => {
  let n = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13;
  n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
};

export const ease = {
  linear: t => t,
  inOut: t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  out: t => 1 - (1 - t) ** 3,
};

// ---------- worlds (one per career stage) ----------
export const WORLDS = {
  village: { sky: ['#2a1d5c', '#4a3a8e'], far: 'hills',  farC: '#2f5b4a', ground: '#3c8a4a', dirt: '#4a3326', stars: true },
  academy: { sky: ['#1b1036', '#3d2a7a'], far: 'towers', farC: '#2a1f55', win: C.yellow, ground: '#6a5a8e', dirt: '#2d2448', stars: true },
  office:  { sky: ['#1b1036', '#2d1b5a'], far: 'city',   farC: '#241a40', win: C.yellow, ground: '#55557a', dirt: '#2a2a40' },
  market:  { sky: ['#3a1d5c', '#c0507a'], far: 'city',   farC: '#4a2550', win: C.orange, ground: '#a07a40', dirt: '#5a3d26' },
  cas:     { sky: ['#101a38', '#1d3060'], far: 'city',   farC: '#18264a', win: C.cyan,   ground: '#3a4a7a', dirt: '#1d2440', stars: true },
  epam:    { sky: ['#1b1036', '#7a2a6a'], far: 'towers', farC: '#2d1b5a', win: C.pink,   ground: '#5b3a9e', dirt: '#2d1b5a', stars: true },
  hotel:   { sky: ['#3a1d5c', '#ff8a3d'], far: 'city',   farC: '#5a2a50', win: C.yellow, ground: '#c0905a', dirt: '#6a4a30' },
  bank:    { sky: ['#0f2a2a', '#1f6a4a'], far: 'towers', farC: '#123a30', win: C.green,  ground: '#2a8a5a', dirt: '#143a2a', stars: true },
  cloud:   { sky: ['#2a3a8e', '#7aa0ff'], far: 'peaks',  farC: '#4a5aa0', ground: '#e0e8ff', dirt: '#8a96c8', clouds: true },
  throne:  { sky: ['#1b1036', '#5b3a9e'], far: 'towers', farC: '#3a2470', win: C.yellow, ground: C.yellow, dirt: '#7a5a20', stars: true },
};

// ---------- timing: every wait can be skipped with an AbortSignal ----------
export const sleep = (ms, signal) => new Promise(res => {
  if (signal?.aborted || ms <= 0) return res();
  const id = setTimeout(res, ms);
  signal?.addEventListener('abort', () => { clearTimeout(id); res(); }, { once: true });
});

export function tween(obj, props, ms, signal, easing = ease.linear) {
  const from = {};
  for (const k in props) from[k] = obj[k];
  return new Promise(res => {
    const done = () => { Object.assign(obj, props); res(); };
    if (signal?.aborted || ms <= 0) return done();
    const t0 = performance.now();
    const step = now => {
      if (signal?.aborted) return done();
      const p = Math.min(1, (now - t0) / ms), e = easing(p);
      for (const k in props) obj[k] = from[k] + (props[k] - from[k]) * e;
      p < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  });
}

// ---------- renderer ----------
export class Engine {
  camera = 0; world = WORLDS.village; walking = false; rain = false;
  shake = 0; flashA = 0; actors = [];
  #g; #parts = []; #drops = []; #last = 0;
  #calm = matchMedia('(prefers-reduced-motion: reduce)');

  constructor(canvas) {
    this.#g = canvas.getContext('2d', { alpha: false });
    this.#g.imageSmoothingEnabled = false;
    for (let i = 0; i < 40; i++) this.#drops.push({ x: i * 8, y: hash(i) * H, v: 40 + hash(i + 99) * 80 });
    requestAnimationFrame(t => this.#frame(t));
  }

  // actor: { x, y, img | frames | draw, scale, alpha, z, world, walker, moving, anim, flip, bob }
  add(props) {
    const a = { x: 0, y: GROUND, alpha: 1, scale: 2, z: 0, ...props };
    this.actors.push(a);
    return a;
  }
  remove(a) { this.actors = this.actors.filter(b => b !== a); }
  reset() {
    Object.assign(this, { camera: 0, world: WORLDS.village, walking: false, rain: false, shake: 0, flashA: 0, actors: [] });
    this.#parts = [];
  }
  burst(x, y, n = 16, colors = [C.yellow, C.pink, C.cyan, C.white]) {
    for (let i = 0; i < n; i++) this.#parts.push({
      x, y, vx: (Math.random() - 0.5) * 140, vy: -Math.random() * 130 - 20,
      life: 0.5 + Math.random() * 0.6, c: colors[i % colors.length],
    });
  }
  flash() { this.flashA = 1; }
  quake(power = 4) { if (!this.#calm.matches) this.shake = power; }

  #frame(t) {
    const dt = Math.min(0.05, (t - this.#last) / 1000 || 0);
    this.#last = t;
    const g = this.#g;
    g.save();
    if (this.shake > 0.3) {
      g.translate(Math.round((Math.random() - 0.5) * this.shake), Math.round((Math.random() - 0.5) * this.shake));
      this.shake *= 0.9;
    } else this.shake = 0;

    this.rain ? this.#matrix(g, dt) : this.#background(g, t);
    for (const a of [...this.actors].sort((p, q) => p.z - q.z)) this.#actor(g, a, t);
    this.#particles(g, dt);
    g.restore();

    if (this.flashA > 0.02) {
      g.fillStyle = `rgb(255 255 255 / ${this.flashA})`;
      g.fillRect(0, 0, W, H);
      this.flashA *= 0.88;
    }
    requestAnimationFrame(n => this.#frame(n));
  }

  #background(g, t) {
    const w = this.world, cam = this.camera, b0 = GROUND - 50;

    // sky + 8-bit dither band
    g.fillStyle = w.sky[0]; g.fillRect(0, 0, W, GROUND);
    g.fillStyle = w.sky[1];
    for (let y = b0; y < b0 + 20; y++) {
      const dense = y >= b0 + 10;
      for (let x = dense ? (y & 1) : (y & 1) * 2; x < W; x += dense ? 2 : 4) g.fillRect(x, y, 1, 1);
    }
    g.fillRect(0, b0 + 20, W, GROUND - b0 - 20);

    if (w.stars) {
      g.fillStyle = C.white;
      for (let i = 0; i < 28; i++) {
        if (((t / 500 + i * 7) | 0) % 6 === 0) continue;   // twinkle
        g.fillRect(mod(hash(i) * 640 - cam * 0.05, W) | 0, (26 + hash(i + 77) * (b0 - 30)) | 0, 1, 1);
      }
    }
    if (w.clouds) {
      g.fillStyle = C.white;
      for (let i = 0; i < 6; i++) {
        const x = Math.round(mod(i * 70 - cam * 0.15, W + 40) - 20), y = 22 + (i * 13) % 30;
        g.fillRect(x, y, 16, 4); g.fillRect(x + 4, y - 3, 8, 3);
      }
    }

    // far parallax layer
    const off = cam * 0.3;
    g.fillStyle = w.farC;
    if (w.far === 'hills') {
      for (let x = 0; x < W; x += 2) {
        const u = x + off, h = 26 + Math.round((Math.sin(u / 37) * 10 + Math.sin(u / 17) * 5) / 2) * 2;
        g.fillRect(x, GROUND - h, 2, h);
      }
    } else if (w.far === 'peaks') {
      for (let x = 0; x < W; x += 2) {
        const tri = Math.abs(mod(x + off, 80) - 40), h = 60 - tri;
        g.fillStyle = w.farC; g.fillRect(x, GROUND - h, 2, h);
        if (tri < 6) { g.fillStyle = C.white; g.fillRect(x, GROUND - h, 2, 3); }
      }
    } else {
      const tower = w.far === 'towers', bw = tower ? 26 : 18, i0 = Math.floor(off / bw) - 1;
      for (let i = i0; i < i0 + W / bw + 3; i++) {
        const h = (tower ? 30 : 18) + Math.floor(hash(i) * 40), x = Math.round(i * bw - off);
        g.fillStyle = w.farC;
        g.fillRect(x, GROUND - h, bw - 3, h);
        if (tower) g.fillRect(x + 7, GROUND - h - 6, 8, 6);
        if (!w.win) continue;
        g.fillStyle = w.win;
        for (let wy = GROUND - h + 4; wy < GROUND - 4; wy += 6)
          for (let wx = 3; wx < bw - 6; wx += 5)
            if (hash(i * 131 + wy * 7 + wx) > 0.6) g.fillRect(x + wx, wy, 2, 2);
      }
    }

    // ground
    g.fillStyle = w.ground; g.fillRect(0, GROUND, W, 3);
    g.fillStyle = w.dirt;   g.fillRect(0, GROUND + 3, W, H - GROUND - 3);
    g.fillStyle = w.ground;
    const o = Math.round(cam) % 16;
    for (let x = -o; x < W; x += 16) { g.fillRect(x, GROUND + 8, 6, 2); g.fillRect(x + 8, GROUND + 16, 4, 2); }
  }

  #matrix(g, dt) {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (const d of this.#drops) {
      d.y += d.v * dt;
      if (d.y > H + 30) d.y = -10;
      for (let k = 0; k < 6; k++) {
        const yy = Math.round(d.y - k * 5);
        if ((Math.floor(yy / 5) + d.x) % 3 === 0) continue;
        g.fillStyle = k === 0 ? '#cfffcf' : `rgb(63 255 122 / ${1 - k / 6})`;
        g.fillRect(d.x + 2, yy, 3, 4);
      }
    }
  }

  #actor(g, a, t) {
    if (a.alpha <= 0) return;
    const x = Math.round(a.world ? a.x - this.camera : a.x);
    const y = Math.round(a.y + (a.bob ? Math.sin(t / 220 + a.x) * a.bob : 0));
    g.globalAlpha = Math.min(1, a.alpha);
    if (a.draw) a.draw(g, x, y, t, a);
    else {
      const moving = a.anim || a.moving || (a.walker && this.walking);
      const img = a.frames ? a.frames[moving ? ((t / 140) | 0) % 2 : 0] : a.img;
      if (img) {
        const w = img.width * a.scale, h = img.height * a.scale, L = x - (w >> 1), T = y - h;
        if (a.flip) { g.save(); g.translate(L + w, T); g.scale(-1, 1); g.drawImage(img, 0, 0, w, h); g.restore(); }
        else g.drawImage(img, L, T, w, h);
      }
    }
    g.globalAlpha = 1;
  }

  #particles(g, dt) {
    this.#parts = this.#parts.filter(p => (p.life -= dt) > 0);
    for (const p of this.#parts) {
      p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      g.fillStyle = p.c;
      g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
  }
}