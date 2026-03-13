// Web Audio API を使ったBGM・効果音マネージャー
// 外部ファイル不要、すべてプログラム合成

const N = {
  D2: 73.42,  E2: 82.41,  F2: 87.31,  G2: 98.00,
  A2: 110.00, Bb2: 116.54, C3: 130.81, D3: 146.83,
  E3: 164.81, F3: 174.61,  G3: 196.00, A3: 220.00,
  Bb3: 233.08, C4: 261.63, D4: 293.66, E4: 329.63,
  F4: 349.23,  G4: 392.00, A4: 440.00, Bb4: 466.16,
  C5: 523.25,  D5: 587.33, E5: 659.25,
};

// ══════════════════════════════════════════════════════════════
// BGM楽曲データ  76 BPM / Dナチュラルマイナー（D-E-F-G-A-Bb-C）
//   Section A (拍 0-15)  "暗黒の行進" i→v→iv→i
//   Section B (拍16-31)  "迫り来る脅威" VI→III→iv→i
// ══════════════════════════════════════════════════════════════

const MEL_A = [
  N.D4,  0,     N.F4,  N.A4,   N.G4,  N.F4,  0,     N.D4,
  0,     N.G4,  N.Bb4, N.A4,   N.G4,  N.F4,  N.E4,  N.D4,
];
const MEL_B = [
  N.F4,  N.G4,  N.A4,  0,      N.C5,  N.Bb4, N.A4,  N.G4,
  N.A4,  0,     N.Bb4, 0,      N.G4,  N.F4,  0,     N.D4,
];

// 3度・5度下の対位声部
const HARM_A = [
  N.A3,  0,     N.D4,  N.F4,   N.E4,  N.D4,  0,     N.A3,
  0,     N.E4,  N.G4,  N.F4,   N.E4,  N.D4,  N.C4,  N.A3,
];
const HARM_B = [
  N.D4,  N.E4,  N.F4,  0,      N.G4,  N.G4,  N.F4,  N.E4,
  N.F4,  0,     N.G4,  0,      N.E4,  N.D4,  0,     N.A3,
];

// ウォーキングベース（Bb がポイント）
const BASS_A = [
  N.D2,  0,     0,     0,      N.A2,  0,     0,     N.Bb2,
  N.G2,  0,     0,     0,      N.A2,  0,     N.D2,  0,
];
const BASS_B = [
  N.F2,  0,     N.F2,  0,      N.C3,  0,     N.Bb2, 0,
  N.A2,  0,     0,     0,      N.D2,  0,     0,     0,
];

// コードパッド（4拍ごと）
const PAD_A = [
  N.D3,  0, 0, 0,   N.A3,  0, 0, 0,
  N.G3,  0, 0, 0,   N.A3,  0, 0, 0,
];
const PAD_B = [
  N.F3,  0, 0, 0,   N.C4,  0, 0, 0,
  N.A3,  0, 0, 0,   N.D3,  0, 0, 0,
];

const MEL  = [...MEL_A,  ...MEL_B];
const HARM = [...HARM_A, ...HARM_B];
const BASS = [...BASS_A, ...BASS_B];
const PAD  = [...PAD_A,  ...PAD_B];
const TOTAL = MEL.length; // 32

// ══════════════════════════════════════════════════════════════

export class AudioManager {
  constructor() {
    this.ctx         = null;
    this.masterGain  = null;
    this.bgmGain     = null;
    this.sfxGain     = null;
    this._bgmTimer   = null;
    this._bgmRunning = false;
    this._bgmBeat    = 0;
    this._nextNote   = 0;
    this._droneOsc   = null;
    this._droneLfo   = null;
    this._started    = false;
    this.muted       = false;
  }

  start() {
    if (this._started) return;
    this._started = true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return; }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.38;
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.85;
    this.sfxGain.connect(this.masterGain);

    this._startBGM();
  }

  resume() { this.ctx?.resume(); }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.muted ? 0 : 0.7, this.ctx.currentTime + 0.05
      );
    }
    return this.muted;
  }

  // ─── 内部ユーティリティ ───────────────────────────────

  _t() { return this.ctx?.currentTime ?? 0; }

  /** シンプルなオシレーター＋エンベロープ */
  _osc(freq, type, at, dur, dst, vol = 0.3) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0.001, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(g); g.connect(dst);
    osc.start(at); osc.stop(at + dur + 0.05);
  }

  /** 周波数スイープ */
  _sweep(f0, f1, type, at, dur, dst, vol = 0.3) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(f1, at + dur);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(g); g.connect(dst);
    osc.start(at); osc.stop(at + dur + 0.05);
  }

  /** ノイズ */
  _noise(at, dur, dst, vol = 0.2, filterFreq = 1200, filterType = 'lowpass') {
    if (!this.ctx) return;
    const len  = Math.ceil(this.ctx.sampleRate * dur);
    const buf  = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src  = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type  = filterType;
    filt.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    src.connect(filt); filt.connect(g); g.connect(dst);
    src.start(at); src.stop(at + dur + 0.05);
  }

  /**
   * パイプオルガン音色
   * 基音 (8') + オクターブ (4') + クィント (2⅔') + スーパーオクターブ (2')
   */
  _organ(freq, at, dur, dst, vol = 0.15) {
    this._osc(freq,     'square', at, dur, dst, vol * 0.50);
    this._osc(freq * 2, 'square', at, dur, dst, vol * 0.22);
    this._osc(freq * 3, 'sine',   at, dur, dst, vol * 0.10);
    this._osc(freq * 4, 'sine',   at, dur, dst, vol * 0.06);
  }

  /**
   * ストリングス音色
   * ノコギリ波2本をわずかにデチューン（アンサンブル感）＋スローアタック
   */
  _strings(freq, at, dur, dst, vol = 0.10) {
    if (!this.ctx) return;
    const att = Math.min(0.22, dur * 0.32);
    [[freq, 0.60], [freq * 1.003, 0.40]].forEach(([f, ratio]) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type  = 'sawtooth';
      osc.frequency.setValueAtTime(f, at);
      g.gain.setValueAtTime(0.001, at);
      g.gain.linearRampToValueAtTime(vol * ratio, at + att);
      g.gain.setValueAtTime(vol * ratio * 0.88, at + dur - 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, at + dur);
      osc.connect(g); g.connect(dst);
      osc.start(at); osc.stop(at + dur + 0.15);
    });
  }

  /**
   * ティンパニ（音程付きオーケストラ打楽器）
   * 音程のある低い打撃音 ＋ 打撃ノイズ
   */
  _timpani(freq, at, dst, vol = 0.28) {
    this._sweep(freq * 1.55, freq * 0.88, 'sine', at, 0.60, dst, vol);
    this._osc(freq, 'sine', at, 0.80, dst, vol * 0.25);
    this._noise(at, 0.07, dst, vol * 0.28, 350, 'lowpass');
  }

  // ─── 効果音 ──────────────────────────────────────────

  playAttack() {
    if (!this.ctx) return;
    const t = this._t();
    this._sweep(700, 300, 'sawtooth', t, 0.07, this.sfxGain, 0.28);
    this._noise(t, 0.05, this.sfxGain, 0.25, 4000, 'highpass');
  }

  playHit() {
    if (!this.ctx) return;
    const t = this._t();
    this._sweep(180, 55, 'square', t, 0.18, this.sfxGain, 0.45);
    this._noise(t, 0.12, this.sfxGain, 0.30, 350, 'lowpass');
  }

  playEnemyDie() {
    if (!this.ctx) return;
    const t = this._t();
    this._sweep(520, 75, 'sine', t, 0.22, this.sfxGain, 0.32);
    this._noise(t + 0.04, 0.18, this.sfxGain, 0.18, 600, 'lowpass');
  }

  playLevelUp() {
    if (!this.ctx) return;
    const t = this._t();
    [N.C4, N.E4, N.G4, N.C5].forEach((freq, i) => {
      this._osc(freq,     'sine', t + i * 0.11, 0.35, this.sfxGain, 0.38);
      this._osc(freq * 2, 'sine', t + i * 0.11, 0.18, this.sfxGain, 0.12);
    });
  }

  playItemPickup() {
    if (!this.ctx) return;
    const t = this._t();
    // 明るいアルペジオ音（アイテム取得感）
    [N.G4, N.B3 || N.A3, N.D5].forEach((freq, i) => {
      this._osc(freq, 'sine', t + i * 0.08, 0.22, this.sfxGain, 0.28);
    });
    this._osc(N.D5, 'sine', t + 0.22, 0.30, this.sfxGain, 0.16);
  }

  playSpecialAttack() {
    if (!this.ctx) return;
    const t = this._t();
    // 上昇スイープ＋和音で「必殺技発動」感を演出
    this._sweep(N.D3, N.D5, 'sine',     t,        0.18, this.sfxGain, 0.50);
    this._sweep(N.A3, N.A4, 'sine',     t + 0.04, 0.16, this.sfxGain, 0.35);
    this._osc(N.D5,          'square',  t + 0.18, 0.28, this.sfxGain, 0.28);
    this._osc(N.A4,          'square',  t + 0.18, 0.28, this.sfxGain, 0.18);
    this._noise(t,           0.08,  this.sfxGain, 0.22, 6000, 'highpass');
    this._noise(t + 0.18,    0.20,  this.sfxGain, 0.15, 3000, 'bandpass');
  }

  playStairs() {
    if (!this.ctx) return;
    const t = this._t();
    this._sweep(N.A3, N.D5, 'sine', t, 0.40, this.sfxGain, 0.30);
    this._osc(N.D5, 'sine', t + 0.35, 0.55, this.sfxGain, 0.22);
  }

  playGameOver() {
    if (!this.ctx) return;
    const t = this._t();
    [N.A3, N.G3, N.F3, N.D3].forEach((freq, i) => {
      this._osc(freq, 'sine', t + i * 0.42, 0.55, this.sfxGain, 0.42);
    });
    this._osc(N.D2, 'triangle', t + 1.7, 1.2, this.sfxGain, 0.48);
  }

  playWin() {
    if (!this.ctx) return;
    const t = this._t();
    [[N.C4,0],[N.E4,0.15],[N.G4,0.3],[N.C5,0.52],[N.G4,0.78],[N.C5,1.05]]
      .forEach(([freq, dt]) => {
        this._osc(freq,       'sine',     t + dt, 0.35, this.sfxGain, 0.42);
        this._osc(freq * 0.5, 'triangle', t + dt, 0.28, this.sfxGain, 0.16);
      });
  }

  // ─── BGM ─────────────────────────────────────────────

  _startBGM() {
    const BPM     = 76;                 // 重厚な行進曲テンポ
    const beatSec = 60 / BPM;          // ≈ 0.789 秒/拍
    const AHEAD   = 0.35;              // 先読み秒数
    const TICK_MS = 100;               // スケジューラー起動間隔

    this._bgmRunning = true;
    this._nextNote   = this.ctx.currentTime + 0.1;

    const schedule = () => {
      if (!this._bgmRunning || !this.ctx) return;

      while (this._nextNote < this.ctx.currentTime + AHEAD) {
        const b = this._bgmBeat % TOTAL;
        const t = this._nextNote;
        const isB = b >= 16; // Section B

        // ── パイプオルガン・メロディ ──────────────────────
        if (MEL[b]) {
          const melVol = isB ? 0.19 : 0.16;
          this._organ(MEL[b], t, beatSec * 0.88, this.bgmGain, melVol);
        }

        // ── ストリングス・ハーモニー ──────────────────────
        if (HARM[b]) {
          this._strings(HARM[b], t, beatSec * 1.15, this.bgmGain, 0.09);
        }

        // ── 2オクターブ重ねのベース ───────────────────────
        if (BASS[b]) {
          this._osc(BASS[b],     'triangle', t, beatSec * 1.90, this.bgmGain, 0.30);
          this._osc(BASS[b] * 2, 'triangle', t, beatSec * 1.50, this.bgmGain, 0.14);
        }

        // ── ストリングスパッド（長い持続）─────────────────
        if (PAD[b]) {
          this._strings(PAD[b], t, beatSec * 3.85, this.bgmGain, 0.055);
        }

        // ── ティンパニ（1拍目・3拍目）────────────────────
        if (b % 4 === 0) {
          // Section A: D/G, Section B: F/A
          const tFreq = b < 8  ? N.D2 :
                        b < 16 ? N.G2 :
                        b < 24 ? N.F2 : N.A2;
          const tVol = (b === 0 || b === 16) ? 0.32 : 0.24; // セクション頭を強調
          this._timpani(tFreq, t, this.bgmGain, tVol);
        }

        // ── オーケストラスネア（2拍目・4拍目）─────────────
        if (b % 4 === 2) {
          this._noise(t, 0.14, this.bgmGain, 0.12, 5000, 'highpass');
          this._osc(200, 'sine', t, 0.07, this.bgmGain, 0.04);
        }

        // ── ハイハット（オフビート、極小）────────────────
        if (b % 2 === 1) {
          this._noise(t, 0.03, this.bgmGain, 0.038, 10000, 'highpass');
        }

        // ── Section B 開始のシンバルクラッシュ ───────────
        if (b === 16) {
          this._noise(t, 0.6, this.bgmGain, 0.065, 6000, 'highpass');
        }

        this._bgmBeat++;
        this._nextNote += beatSec;
      }

      this._bgmTimer = setTimeout(schedule, TICK_MS);
    };

    schedule();
    this._startDrone();
  }

  /** 低音ドローン: D2 ＋ LFO で緩やかに揺れる持続音 */
  _startDrone() {
    if (!this.ctx) return;

    const osc  = this.ctx.createOscillator();
    const lfo  = this.ctx.createOscillator();
    const lfog = this.ctx.createGain();
    const g    = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = N.D2;

    lfo.type = 'sine';
    lfo.frequency.value = 0.20;
    lfog.gain.value = 1.5;

    g.gain.value = 0.030;

    lfo.connect(lfog);
    lfog.connect(osc.frequency);
    osc.connect(g);
    g.connect(this.bgmGain);

    osc.start(); lfo.start();
    this._droneOsc = osc;
    this._droneLfo = lfo;
  }

  stopBGM() {
    this._bgmRunning = false;
    clearTimeout(this._bgmTimer);
    try { this._droneOsc?.stop(); } catch { /* stopped */ }
    try { this._droneLfo?.stop(); } catch { /* stopped */ }
    this._droneOsc = null;
    this._droneLfo = null;
  }
}
