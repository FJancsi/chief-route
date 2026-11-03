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
  connectedCallback() {
    this.innerHTML = `
      <p class="who"><span class="name"></span> <span class="real"></span></p>
      <p class="txt"><span class="shown"></span><span class="ghost"></span></p>`;
  }

  async say(text, { who = '', real = '', signal } = {}) {
    const q = sel => this.querySelector(sel);
    q('.name').textContent = who;
    q('.real').textContent = real ? `(${real})` : '';
    const shown = q('.shown'), ghost = q('.ghost');
    this.hidden = false;
    for (let i = 0; i <= text.length; i++) {        // typewriter
      if (signal?.aborted) break;
      shown.textContent = text.slice(0, i);
      ghost.textContent = text.slice(i);            // reserves the final layout
      await sleep(text[i - 1] === ' ' ? 12 : 28, signal);
    }
    shown.textContent = text;
    ghost.textContent = '';
    await sleep(900 + text.length * 30, signal);    // reading time
  }

  clear() { this.hidden = true; }
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
// Banners are short-lived pop-ups. When the scene is skipped they don't appear at all.
export async function banner(layer, text, kind, signal, icon) {
  if (signal.aborted) return;
  const el = document.createElement('div');
  el.className = `banner ${kind}`;
  if (icon) el.append(iconCanvas(icon));
  el.append(Object.assign(document.createElement('span'), { textContent: text }));
  layer.append(el);
  const anim = el.animate([
    { translate: '-50% -120%', opacity: 0 },                       // slide down in 8-bit steps
    { translate: '-50% -50%', opacity: 1, offset: 0.12 },
    { translate: '-50% -50%', opacity: 1, offset: 0.85 },
    { translate: '-50% -50%', opacity: 0 },
  ], { duration: 2600, easing: 'steps(26)', fill: 'forwards' });
  const skip = () => anim.finish();
  signal.addEventListener('abort', skip, { once: true });
  await anim.finished.catch(() => {});
  signal.removeEventListener('abort', skip);
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
