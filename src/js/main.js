// PIECE 1 - skeleton.
// drawTestScene() and the checkpoint counter are temporary; piece 2 replaces them.

const $ = sel => document.querySelector(sel);
const stage = $('#stage');
const overlay = $('#overlay');
const prompt = $('#prompt');
const g = $('#screen').getContext('2d', { alpha: false });

// ---------- pixel-perfect scaling (whole-number zoom only) ----------
function fit() {
  const scale = Math.max(1, Math.floor(Math.min(innerWidth / 320, innerHeight / 180)));
  stage.style.setProperty('--u', `${scale}px`);
}
addEventListener('resize', fit);
fit();

// ---------- temporary test background ----------
function drawTestScene() {
  const GROUND = 124;

  g.fillStyle = '#1b1036';                       // sky
  g.fillRect(0, 0, 320, GROUND);

  g.fillStyle = '#2d1b5a';                       // 8-bit dither band near the horizon
  for (let y = 84; y < GROUND; y++) {
    const step = y < 104 ? 4 : 2;
    for (let x = (y & 1); x < 320; x += step) g.fillRect(x, y, 1, 1);
  }

  g.fillStyle = '#f4f0ff';                       // stars (fixed positions)
  for (let i = 0; i < 30; i++) g.fillRect((i * 97) % 320, 8 + (i * 53) % 70, 1, 1);

  g.fillStyle = '#3c8a4a';                       // grass line
  g.fillRect(0, GROUND, 320, 3);
  g.fillStyle = '#4a3326';                       // dirt
  g.fillRect(0, GROUND + 3, 320, 180 - GROUND - 3);
}

// ---------- title screen ----------
function showTitle() {
  overlay.innerHTML = `
    <h1>CAREER<br>QUEST</h1>
    <p class="sub">Road to Advanced Software Engineer</p>
    <p class="who">JANOS FEKETE * EPAM</p>`;
  overlay.hidden = false;
}

// ---------- input ----------
let checkpoint = 0;

function next() {
  checkpoint++;
  overlay.innerHTML = `<p class="sub">CHECKPOINT ${String(checkpoint).padStart(2, '0')}</p>`;
}

const toggleFullscreen = () =>
  document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();

addEventListener('keydown', e => {
  if (e.repeat) return;
  switch (e.code) {
    case 'Space':
    case 'ArrowRight':
    case 'PageDown':
      e.preventDefault();
      next();
      break;
    case 'KeyF':
      toggleFullscreen();
      break;
  }
});

// ---------- boot ----------
await document.fonts.load('8px "Press Start 2P"');
drawTestScene();
showTitle();
prompt.hidden = false;