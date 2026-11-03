// HUD, dialog box and banners.
// Every wait uses sleep() or a Web Animation that finishes at once when the
// scene's AbortSignal fires (SPACE skip). No scaling animations (R37).
import { sleep } from './engine.js';

const pad2 = n => String(n).padStart(2, '0');

// ---------- <cq-hud>: LV, XP bar, TITLE, GUILD, PATH, ITEMS ----------
class CqHud extends HTMLElement {
  #state = {};
  #signal = null;

  connectedCallback() {
    this.innerHTML = `
      <div class="row">
        <span>LV <b data-k="lv"></b></span>
        <span class="xp"><i></i></span>
        <span>TITLE <b data-k="title"></b></span>
      </div>
      <div class="row">
        <span>GUILD <b data-k="guild"></b></span>
        <span>PATH <b data-k="path"></b></span>
        <span>ITEMS <b data-k="items"></b></span>
      </div>`;
    this.reset();
  }

  reset() {
    this.#state = { lv: 0, title: '---', guild: '---', path: '---', items: 0 };
    for (const [k, v] of Object.entries(this.#state)) this.#put(k, v, false);
    this.style.setProperty('--xp', 0);
  }

  // set({ guild: 'EPAM', title: 'D2*', lv: 10 }, signal): LV counts up step by step
  async set(patch, signal) {
    this.#signal = signal;
    const { lv, ...rest } = patch;
    for (const [k, v] of Object.entries(rest)) { this.#state[k] = v; this.#put(k, v); }
    if (lv === undefined) return;
    this.style.setProperty('--xp', Math.min(1, lv / 20));        // LV 20 = full bar
    while (this.#state.lv !== lv) {
      this.#state.lv += Math.sign(lv - this.#state.lv);
      this.#put('lv', this.#state.lv);
      if (this.#state.lv !== lv) await sleep(160, signal);
    }
  }

  addItem(signal) {
    this.#signal = signal;
    this.#state.items++;
    this.#put('items', this.#state.items);
  }

  #put(k, v, pulse = true) {
    const el = this.querySelector(`[data-k="${k}"]`);
    const txt = typeof v === 'number' ? pad2(v) : String(v);
    if (!el || el.textContent === txt) return;
    el.textContent = txt;
    if (pulse && this.#signal && !this.#signal.aborted)            // colour flash, no scaling
      el.animate([{ color: '#ffffff' }, { color: '#ff4fa3' }, { color: '#ffffff' }],
                 { duration: 480, easing: 'steps(3)' });
  }
}

// ---------- <cq-dialog>: name + real name + typewriter text ----------
class CqDialog extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="who"><span class="name"></span> <span class="real"></span></div>
      <p class="txt"><span class="shown"></span><span class="ghost"></span></p>`;
  }

  async say(text, { who = '', real = '', signal } = {}) {
    const q = sel => this.querySelector(sel);
    q('.name').textContent = who;
    q('.real').textContent = real ? `(${real})` : '';
    const shown = q('.shown'), ghost = q('.ghost');
    this.hidden = false;

    for (let i = 0; i <= text.length; i++) {
      if (signal?.aborted) break;
      shown.textContent = text.slice(0, i);
      ghost.textContent = text.slice(i);                            // reserves the final layout
      await sleep(text[i - 1] === ' ' ? 12 : 28, signal);
    }
    shown.textContent = text;
    ghost.textContent = '';
    await sleep(900 + text.length * 22, signal);                    // reading time
  }

  clear() { this.hidden = true; }
}

customElements.define('cq-hud', CqHud);
customElements.define('cq-dialog', CqDialog);

// ---------- banners: "GOT: ITEM", "SKILL UP", "TITLE UP!" ... ----------
function iconCanvas(bmp) {
  const cv = document.createElement('canvas');
  cv.width = bmp.width;
  cv.height = bmp.height;
  cv.getContext('2d').drawImage(bmp, 0, 0);
  cv.style.width = `calc(var(--u) * ${bmp.width * 2})`;            // same 2x as the world
  cv.style.height = `calc(var(--u) * ${bmp.height * 2})`;
  return cv;
}

// kind: item | skill | equip | boss | chapter | title | info
export async function banner(layer, { text, kind = 'info', icon }, signal) {
  if (signal?.aborted) return;                                      // skipped scenes show no banners
  const el = document.createElement('div');
  el.className = `banner ${kind}`;
  if (icon) el.append(iconCanvas(icon));
  el.append(Object.assign(document.createElement('span'), { textContent: text }));
  layer.append(el);

  const anim = el.animate([
    { opacity: 0, translate: '-50% -90%' },                          // slide down in 8-bit steps
    { opacity: 1, translate: '-50% -50%', offset: 0.12 },
    { opacity: 1, translate: '-50% -50%', offset: 0.88 },
    { opacity: 0, translate: '-50% -50%' },
  ], { duration: 2400, easing: 'steps(24)' });

  const skip = () => anim.finish();
  signal?.addEventListener('abort', skip, { once: true });
  await anim.finished.catch(() => {});
  signal?.removeEventListener('abort', skip);
  el.remove();
}