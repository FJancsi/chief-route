// HUD, dialog box, banners, overlay and view transitions.
// Every wait takes the scene's AbortSignal, so SPACE can skip it (R1).
// Nothing here ever scales: only colour, opacity and position change (R37).
import { sleep } from './engine.js';

// ---------- <cq-hud>: LV, XP bar, YEAR, TITLE / GUILD, PATH ----------
// LV is set by the scene runner only: +1 per SPACE press (R39).
class CqHud extends HTMLElement {
  max = 25;
  #s = {};

  connectedCallback() {
    this.innerHTML = `
      <div class="row">
        <span>LV <b data-k="lv"></b></span><span class="xp"><i></i></span>
        <span>YEAR <b data-k="year"></b></span><span>TITLE <b data-k="title"></b></span>
      </div>
      <div class="row">
        <span>GUILD <b data-k="guild"></b></span><span>PATH <b data-k="path"></b></span>
      </div>`;
    this.reset();
  }

  reset() {
    this.#s = { lv: 0, year: '---', guild: '---', path: '---', title: '---' };
    for (const [k, v] of Object.entries(this.#s)) this.#put(k, v, false);
    this.style.setProperty('--xp', 0);
  }

  set(patch, signal) {
    const fx = !signal?.aborted;                    // skipped scenes update silently
    for (const [k, v] of Object.entries(patch)) {
      if (this.#s[k] === v) continue;
      this.#s[k] = v;
      this.#put(k, v, fx);
    }
    if ('lv' in patch) this.style.setProperty('--xp', Math.min(1, patch.lv / this.max));
  }

  #put(k, v, fx) {
    const el = this.querySelector(`[data-k="${k}"]`);
    if (!el) return;
    el.textContent = k === 'lv' ? String(v).padStart(2, '0') : v;
    if (fx) el.animate([{ color: '#ffffff' }, { color: '#ff4fa3' }, { color: '#ffd23f' }],
                       { duration: 600, easing: 'steps(3)' });   // colour flash, no scaling
  }
}

// ---------- <cq-dialog>: name + real name + typewriter text ----------
class CqDialog extends HTMLElement {
  #advance = null;                                          // what SPACE does while a line is on screen

  connectedCallback() {
    this.innerHTML = `
      <p class="who"><span class="name"></span> <span class="real"></span></p>
      <p class="txt"><span class="shown"></span><span class="ghost"></span></p>
      <span class="timer"></span>`;
    this.hidden = true;
  }

  // true while a line is on screen (typing or counting down)
  get active() { return this.#advance !== null; }

  // SPACE, step 1: finish typing. SPACE, step 2: end the countdown and move on.
  advance() { this.#advance?.(); }

  async say(text, { who = '', real = '', signal } = {}) {
    const q = sel => this.querySelector(sel);
    q('.name').textContent = who;
    q('.real').innerHTML = real ? `(${real})` : '&nbsp;';   // keeps the line height when empty
    const shown = q('.shown'), ghost = q('.ghost');
    if (this.hidden) {                                      // slide in once per box, not once per line
      this.hidden = false;
      this.animate([{ translate: '0 120%' }, { translate: '0 0' }], { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }

    const typing = lineSignal(signal);
    this.#advance = () => typing.abort();
    for (let i = 0; i <= text.length; i++) {                // typewriter
      if (typing.signal.aborted) break;
      shown.textContent = text.slice(0, i);
      ghost.textContent = text.slice(i);                    // reserves the final layout
      await sleep(text[i - 1] === ' ' ? 12 : 28, typing.signal);
    }
    shown.textContent = text;
    ghost.textContent = '';

    const reading = lineSignal(signal);
    this.#advance = () => reading.abort();
    await this.#countdown(10, reading.signal);              // 10 s fallback, SPACE ends it early
    this.#advance = null;
  }

  // visible countdown: 10 -> 1
  async #countdown(seconds, signal) {
    const timer = this.querySelector('.timer');
    for (let s = seconds; s > 0 && !signal.aborted; s--) {
      timer.textContent = String(s);
      await sleep(1000, signal);
    }
    timer.textContent = '';
  }

  clear() { this.#advance = null; this.hidden = true; }
}

// a per-line controller that also aborts when the whole scene is skipped
function lineSignal(parent) {
  const c = new AbortController();
  if (parent?.aborted) c.abort();
  else parent?.addEventListener('abort', () => c.abort(), { once: true });
  return c;
}

customElements.define('cq-hud', CqHud);
customElements.define('cq-dialog', CqDialog);

// ---------- banners: "GOT: ITEM", "SKILL UP", "TITLE UP!" ... ----------
function iconCanvas(bmp) {
  const cv = document.createElement('canvas');
  cv.width = bmp.width; cv.height = bmp.height;
  cv.getContext('2d').drawImage(bmp, 0, 0);
  cv.style.width = `calc(var(--u) * ${bmp.width * 2})`;           // same 2x as the world
  cv.style.height = `calc(var(--u) * ${bmp.height * 2})`;
  return cv;
}

// kind: item | skill | equip | boss | chapter | title | info
// A banner stays up until its 10 s timer ends or SPACE advances it. It always shows,
// even when SPACE is pressed right after the scene started (it is a step, not a skip).
const bannerSteps = new Set();                              // pending banner dismissers (main.js calls them)
export const advanceBanner = () => { const [first] = bannerSteps; first?.(); return !!first; };

export async function banner(layer, text, kind, signal, icon) {
  if (signal.aborted) return;
  const el = document.createElement('div');
  el.className = `banner ${kind}`;
  if (icon) el.append(iconCanvas(icon));
  el.append(Object.assign(document.createElement('span'), { textContent: text }));
  layer.append(el);
  const anim = el.animate([
    { translate: '-50% -120%', opacity: 0 },
    { translate: '-50% -50%', opacity: 1, offset: 0.1, easing: 'ease-out' },
    { translate: '-50% -50%', opacity: 1, offset: 0.9 },
    { translate: '-50% -50%', opacity: 0 },
  ], { duration: 10000, fill: 'forwards' });
  const done = () => anim.finish();
  bannerSteps.add(done);
  signal.addEventListener('abort', done, { once: true });
  await anim.finished.catch(() => {});
  bannerSteps.delete(done);
  el.remove();
}


// ---------- full-screen overlay: title card, C64 screen, end card ----------
export const overlay = {
  el: null,                                                        // set by main.js
  show(html, cls = '') { this.el.className = cls; this.el.innerHTML = html; this.el.hidden = false; },
  hide() { this.el.hidden = true; this.el.innerHTML = ''; this.el.className = ''; },
  async type(lines, signal, speed = 35) {
    const pre = document.createElement('pre');
    this.el.append(pre);
    for (const line of lines) {
      for (const ch of line) {
        if (signal.aborted) break;
        pre.textContent += ch;
        await sleep(speed, signal);
      }
      if (signal.aborted) break;
      pre.textContent += '\n';
      await sleep(180, signal);
    }
    if (signal.aborted) pre.textContent = lines.join('\n');        // final frame stays (R40)
  },
};

// ---------- 8-bit wipe between worlds ----------
export async function viewTransition(update, signal) {
  if (signal.aborted || !document.startViewTransition ||
      matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  const vt = document.startViewTransition(update);
  const skip = () => vt.skipTransition();
  signal.addEventListener('abort', skip, { once: true });
  await vt.finished.catch(() => {});
  signal.removeEventListener('abort', skip);
}
