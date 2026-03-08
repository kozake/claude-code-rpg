import { Application } from 'pixi.js';
import { Game } from './Game.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT, COLOR } from './constants.js';

const app = new Application({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  backgroundColor: COLOR.BG,
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.getElementById('canvas-wrapper').appendChild(app.view);

// スマホでソフトキーボードが出るのを防ぐ
// Pixi.js の accessibility plugin が tabindex="0" をcanvasに付与するため無効化する
app.view.tabIndex = -1;
app.renderer.plugins?.accessibility?.destroy();

const game = new Game(app);

// --- ミュートボタン ---
const muteBtn = document.getElementById('btn-mute');
muteBtn?.addEventListener('click', () => {
  game.audio.start();  // まだ未起動の場合に備えて
  const muted = game.audio.toggleMute();
  if (muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊';
});

// --- 仮想Dパッド ---
const dpadMap = {
  'btn-up':    [ 0, -1],
  'btn-down':  [ 0,  1],
  'btn-left':  [-1,  0],
  'btn-right': [ 1,  0],
};

for (const [id, [dx, dy]] of Object.entries(dpadMap)) {
  const btn = document.getElementById(id);
  if (!btn) continue;
  // touchstart で即反応（click は遅延あり）
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    game.move(dx, dy);
  }, { passive: false });
  // デスクトップでもクリックで動かせるようにフォールバック
  btn.addEventListener('click', () => game.move(dx, dy));
}

// --- スワイプ操作（キャンバス上） ---
let swipeStartX = 0;
let swipeStartY = 0;
const SWIPE_THRESHOLD = 25; // px

app.view.addEventListener('touchstart', (e) => {
  e.preventDefault();
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
}, { passive: false });

app.view.addEventListener('touchend', (e) => {
  e.preventDefault();
  const dx = e.changedTouches[0].clientX - swipeStartX;
  const dy = e.changedTouches[0].clientY - swipeStartY;

  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    game.move(dx > 0 ? 1 : -1, 0);
  } else {
    game.move(0, dy > 0 ? 1 : -1);
  }
}, { passive: false });
