import { Container, Graphics, Text } from 'pixi.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './constants.js';

const PIXEL_FONT = '"Press Start 2P", monospace';

const OPENING_LINES = [
  { text: 'かつて、この大地は\n光に満ちていた…', color: 0xaaddff },
  { text: 'しかし突然、\n闇の魔王「ダークロード」が現れた。', color: 0xff6666 },
  { text: '魔王は「深淵の迷宮」を創り出し、\n恐怖で王国を覆い尽くした。', color: 0xff8888 },
  { text: '絶望の淵で、\n一人の若き勇者が立ち上がった。', color: 0xffffaa },
  { text: '魔王を倒し、\n王国に光を取り戻すために…', color: 0xaaffaa },
  { text: '勇者よ！\n深淵の迷宮へ降り立て！', color: 0xffd700 },
];

const ENDING_LINES = [
  { text: '魔王ダークロードを\nついに打ち倒した！', color: 0xffd700 },
  { text: '闇の力が消え去り、\n王国に太陽の光が戻ってきた。', color: 0xaaddff },
  { text: '人々は喜びの声をあげ、\n勇者の名を称えた。', color: 0xaaffaa },
  { text: '「深淵の迷宮」の冒険は、\nこうして幕を閉じた。', color: 0xffffaa },
  { text: 'あなたは真の英雄だ！', color: 0xffd700 },
];

// 決定論的な星配置用の簡易シードランダム
class SeededRandom {
  constructor(seed) { this._s = seed; }
  next() {
    this._s = (this._s * 1664525 + 1013904223) & 0xffffffff;
    return (this._s >>> 0) / 0xffffffff;
  }
}

export class StoryScene {
  constructor(app) {
    this.app = app;
    this.container = new Container();
    this.container.visible = false;
    app.stage.addChild(this.container);

    this._type = null;    // 'title' | 'opening' | 'ending'
    this._lineIndex = 0;
    this._charIndex = 0;
    this._typeTimer = 0;
    this._waitingForInput = false;
    this._onComplete = null;
    this._animTime = 0;
    this._fullText = '';

    this._buildLayout();
    app.ticker.add((delta) => this._tick(delta));
  }

  _buildLayout() {
    this._bg = new Graphics();
    this.container.addChild(this._bg);

    this._panel = new Graphics();
    this.container.addChild(this._panel);

    this._decorLine = new Graphics();
    this.container.addChild(this._decorLine);

    // ── タイトル ──────────────────────────────────────────────
    this._titleText = new Text('深淵の迷宮', {
      fontFamily: PIXEL_FONT,
      fontSize: 40,
      fill: 0xffd700,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0xcc2200,
      dropShadowDistance: 5,
      dropShadowBlur: 6,
    });
    this._titleText.anchor.set(0.5);
    this._titleText.x = SCREEN_WIDTH / 2;
    this._titleText.y = SCREEN_HEIGHT / 2 - 130;
    this.container.addChild(this._titleText);

    this._subtitleText = new Text('DUNGEON  OF  SOULS', {
      fontFamily: PIXEL_FONT,
      fontSize: 14,
      fill: 0x7777bb,
      align: 'center',
    });
    this._subtitleText.anchor.set(0.5);
    this._subtitleText.x = SCREEN_WIDTH / 2;
    this._subtitleText.y = SCREEN_HEIGHT / 2 - 65;
    this.container.addChild(this._subtitleText);

    // ── ストーリーテキスト ─────────────────────────────────────
    this._storyText = new Text('', {
      fontFamily: PIXEL_FONT,
      fontSize: 18,
      fill: 0xffffff,
      align: 'center',
      lineHeight: 42,
      wordWrap: true,
      wordWrapWidth: SCREEN_WIDTH - 150,
    });
    this._storyText.anchor.set(0.5);
    this._storyText.x = SCREEN_WIDTH / 2;
    this._storyText.y = SCREEN_HEIGHT / 2 - 10;
    this.container.addChild(this._storyText);

    // ── プロンプト / 開始ボタン ────────────────────────────────
    this._promptText = new Text('', {
      fontFamily: PIXEL_FONT,
      fontSize: 12,
      fill: 0x8899bb,
      align: 'center',
    });
    this._promptText.anchor.set(0.5);
    this._promptText.x = SCREEN_WIDTH / 2;
    this._promptText.y = SCREEN_HEIGHT - 80;
    this.container.addChild(this._promptText);

    // ── スキップヒント ─────────────────────────────────────────
    this._skipText = new Text('[S] SKIP', {
      fontFamily: PIXEL_FONT,
      fontSize: 7,
      fill: 0x334455,
    });
    this._skipText.x = SCREEN_WIDTH - 90;
    this._skipText.y = 18;
    this.container.addChild(this._skipText);

    // ── シーンカウンター ───────────────────────────────────────
    this._counterText = new Text('', {
      fontFamily: PIXEL_FONT,
      fontSize: 7,
      fill: 0x334455,
    });
    this._counterText.x = 20;
    this._counterText.y = 18;
    this.container.addChild(this._counterText);

    // ── タップオーバーレイ（画面全体をタッチ可能にする） ────────
    this._tapOverlay = new Graphics();
    this._tapOverlay.beginFill(0x000000, 0.001);
    this._tapOverlay.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this._tapOverlay.endFill();
    this._tapOverlay.eventMode = 'static';
    this._tapOverlay.cursor = 'pointer';
    this._tapOverlay.on('pointerdown', () => this.onInput());
    this.container.addChild(this._tapOverlay);
  }

  // ──────────────────────────────────────────────────────────────
  //  公開メソッド
  // ──────────────────────────────────────────────────────────────

  showTitle(onStart) {
    this._type = 'title';
    this._onComplete = onStart;
    this._animTime = 0;
    this.container.visible = true;

    this._titleText.visible = true;
    this._subtitleText.visible = true;
    this._storyText.visible = false;
    this._skipText.visible = false;
    this._counterText.visible = false;
    this._panel.visible = false;

    this._promptText.text = '~ TAP OR PRESS ANY KEY ~';
    this._promptText.visible = true;
    this._promptText.alpha = 1;

    this._drawTitleBg();
    this._drawDecorLine();
  }

  showOpening(onComplete) {
    this._initStoryScene('opening', onComplete, false);
  }

  showEnding(onComplete) {
    this._initStoryScene('ending', onComplete, true);
  }

  hide() {
    this.container.visible = false;
    this._type = null;
  }

  /** キー・タップ入力を受け付ける */
  onInput() {
    if (!this.container.visible) return false;

    // DOM pointerdown と Pixi.js overlay の二重発火を防ぐ
    const now = Date.now();
    if (this._lastInputTime && now - this._lastInputTime < 150) return false;
    this._lastInputTime = now;

    if (this._type === 'title') {
      this._finishScene();
      return true;
    }

    if (this._waitingForInput) {
      this._lineIndex++;
      this._startNextLine();
    } else {
      // 現在行を一気に表示
      this._charIndex = this._fullText.length;
      this._storyText.text = this._fullText;
      this._showWaitPrompt();
    }
    return true;
  }

  /** Sキーでシーン全体をスキップ */
  onSkip() {
    if (!this.container.visible) return false;
    if (this._type === 'opening' || this._type === 'ending') {
      this._finishScene();
      return true;
    }
    return false;
  }

  // ──────────────────────────────────────────────────────────────
  //  内部メソッド
  // ──────────────────────────────────────────────────────────────

  _initStoryScene(type, onComplete, isEnding) {
    this._type = type;
    this._onComplete = onComplete;
    this._lineIndex = 0;
    this._charIndex = 0;
    this._typeTimer = 0;
    this._waitingForInput = false;
    this._animTime = 0;
    this.container.visible = true;

    this._titleText.visible = false;
    this._subtitleText.visible = false;
    this._decorLine.clear();
    this._storyText.visible = true;
    this._skipText.visible = !isEnding;
    this._counterText.visible = !isEnding;
    this._panel.visible = true;
    this._promptText.visible = false;
    this._storyText.text = '';

    this._drawStoryBg(isEnding);
    this._startNextLine();
  }

  _startNextLine() {
    const lines = this._getLines();
    if (this._lineIndex >= lines.length) {
      this._finishScene();
      return;
    }
    this._charIndex = 0;
    this._typeTimer = 0;
    this._waitingForInput = false;
    this._fullText = lines[this._lineIndex].text;
    this._storyText.style.fill = lines[this._lineIndex].color;
    this._storyText.text = '';
    this._promptText.visible = false;
    this._counterText.text = `${this._lineIndex + 1}/${lines.length}`;
  }

  _showWaitPrompt() {
    this._waitingForInput = true;
    this._promptText.text = '[ TAP OR PRESS KEY ]';
    this._promptText.visible = true;
    this._promptText.alpha = 1;
  }

  _finishScene() {
    this.hide();
    if (this._onComplete) this._onComplete();
  }

  _getLines() {
    return this._type === 'ending' ? ENDING_LINES : OPENING_LINES;
  }

  // ── アニメーション ────────────────────────────────────────────

  _tick(delta) {
    if (!this.container.visible) return;
    this._animTime += delta * 0.05;

    if (this._type === 'title') {
      this._tickTitle();
    } else {
      this._tickStory(delta);
    }
  }

  _tickTitle() {
    this._promptText.alpha = 0.35 + Math.sin(this._animTime * 3.5) * 0.65;
    this._titleText.alpha = 0.82 + Math.sin(this._animTime * 1.8) * 0.18;
    this._subtitleText.alpha = 0.5 + Math.sin(this._animTime * 1.4 + 1) * 0.3;
  }

  _tickStory(delta) {
    if (this._waitingForInput) {
      this._promptText.alpha = 0.35 + Math.sin(this._animTime * 4.5) * 0.65;
      return;
    }
    this._typeTimer += delta;
    const TICKS_PER_CHAR = 1.6;
    if (this._typeTimer >= TICKS_PER_CHAR) {
      this._typeTimer = 0;
      if (this._charIndex < this._fullText.length) {
        this._charIndex++;
        this._storyText.text = this._fullText.substring(0, this._charIndex);
      } else {
        this._showWaitPrompt();
      }
    }
  }

  // ── 背景・装飾描画 ────────────────────────────────────────────

  _drawTitleBg() {
    this._bg.clear();

    // 宇宙背景
    this._bg.beginFill(0x010108);
    this._bg.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this._bg.endFill();

    // 星（シード固定で同じ配置）
    const rng = new SeededRandom(12345);
    for (let i = 0; i < 110; i++) {
      const x = rng.next() * SCREEN_WIDTH;
      const y = rng.next() * SCREEN_HEIGHT * 0.78;
      const r = rng.next() * 1.6 + 0.3;
      const a = rng.next() * 0.7 + 0.3;
      this._bg.beginFill(0xffffff, a);
      this._bg.drawCircle(x, y, r);
      this._bg.endFill();
    }

    // タイトル周辺の紫グロー
    this._bg.beginFill(0x1a0035, 0.85);
    this._bg.drawEllipse(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100, 350, 160);
    this._bg.endFill();

    // 地面
    this._bg.beginFill(0x020015);
    this._bg.drawRect(0, SCREEN_HEIGHT - 230, SCREEN_WIDTH, 230);
    this._bg.endFill();

    // お城のシルエット
    this._drawCastle();
  }

  _drawCastle() {
    const g = this._bg;
    const col = 0x04000e;
    const baseY = SCREEN_HEIGHT - 18;

    // 城本体
    g.beginFill(col);
    g.drawRect(270, baseY - 175, 260, 175);
    g.endFill();

    // 中央大塔
    g.beginFill(col);
    g.drawRect(355, baseY - 265, 90, 265);
    g.endFill();
    // 中央塔の先端（三角）
    g.beginFill(col);
    g.moveTo(355, baseY - 265);
    g.lineTo(400, baseY - 310);
    g.lineTo(445, baseY - 265);
    g.closePath();
    g.endFill();

    // 左塔
    g.beginFill(col);
    g.drawRect(175, baseY - 205, 65, 205);
    g.endFill();
    g.beginFill(col);
    g.moveTo(175, baseY - 205);
    g.lineTo(207, baseY - 240);
    g.lineTo(240, baseY - 205);
    g.closePath();
    g.endFill();

    // 右塔
    g.beginFill(col);
    g.drawRect(560, baseY - 205, 65, 205);
    g.endFill();
    g.beginFill(col);
    g.moveTo(560, baseY - 205);
    g.lineTo(592, baseY - 240);
    g.lineTo(625, baseY - 205);
    g.closePath();
    g.endFill();

    // 左小塔
    g.beginFill(col);
    g.drawRect(55, baseY - 135, 48, 135);
    g.endFill();

    // 右小塔
    g.beginFill(col);
    g.drawRect(697, baseY - 135, 48, 135);
    g.endFill();

    // 城本体の胸壁
    for (let x = 278; x < 520; x += 22) {
      g.beginFill(col);
      g.drawRect(x, baseY - 180, 13, 18);
      g.endFill();
    }

    // 中央塔の紫色に光る窓
    g.beginFill(0x3300aa, 0.9);
    g.drawRect(386, baseY - 238, 28, 35);
    g.endFill();
    g.beginFill(0x7700ff, 0.55);
    g.drawRect(390, baseY - 234, 20, 27);
    g.endFill();
  }

  _drawDecorLine() {
    const cx = SCREEN_WIDTH / 2;
    const y = SCREEN_HEIGHT / 2 - 40;
    this._decorLine.clear();
    this._decorLine.beginFill(0x5555aa, 0.55);
    this._decorLine.drawRect(cx - 180, y, 360, 2);
    this._decorLine.endFill();
    this._decorLine.beginFill(0x9999ff, 0.25);
    this._decorLine.drawRect(cx - 100, y + 2, 200, 1);
    this._decorLine.endFill();
  }

  _drawStoryBg(isEnding) {
    this._bg.clear();

    if (isEnding) {
      // エンディング：温かい金色の背景
      this._bg.beginFill(0x0d0800);
      this._bg.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      this._bg.endFill();

      // 放射状の光
      this._bg.beginFill(0x2a1200, 0.65);
      this._bg.drawEllipse(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 430, 320);
      this._bg.endFill();

      const rng = new SeededRandom(77777);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const aSeg = 0.15;
        this._bg.beginFill(0x3a1a00, 0.35);
        this._bg.moveTo(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        this._bg.lineTo(SCREEN_WIDTH / 2 + cos * 500, SCREEN_HEIGHT / 2 + sin * 500);
        this._bg.lineTo(
          SCREEN_WIDTH / 2 + Math.cos(angle + aSeg) * 500,
          SCREEN_HEIGHT / 2 + Math.sin(angle + aSeg) * 500
        );
        this._bg.closePath();
        this._bg.endFill();
      }

      // テキストパネル
      this._panel.clear();
      this._panel.beginFill(0x0a0600, 0.88);
      this._panel.drawRoundedRect(55, SCREEN_HEIGHT / 2 - 115, SCREEN_WIDTH - 110, 230, 12);
      this._panel.endFill();
      this._panel.lineStyle(2, 0xaa7700, 0.9);
      this._panel.drawRoundedRect(55, SCREEN_HEIGHT / 2 - 115, SCREEN_WIDTH - 110, 230, 12);
      this._panel.lineStyle(1, 0xaa7700, 0.3);
      this._panel.drawRoundedRect(60, SCREEN_HEIGHT / 2 - 110, SCREEN_WIDTH - 120, 220, 10);
      this._panel.lineStyle(0);

    } else {
      // オープニング：ダークな宇宙背景
      this._bg.beginFill(0x010510);
      this._bg.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      this._bg.endFill();

      const rng = new SeededRandom(54321);
      for (let i = 0; i < 65; i++) {
        const x = rng.next() * SCREEN_WIDTH;
        const y = rng.next() * SCREEN_HEIGHT;
        this._bg.beginFill(0xffffff, rng.next() * 0.45 + 0.1);
        this._bg.drawCircle(x, y, rng.next() * 0.9 + 0.3);
        this._bg.endFill();
      }

      // テキストパネル
      this._panel.clear();
      this._panel.beginFill(0x000811, 0.88);
      this._panel.drawRoundedRect(55, SCREEN_HEIGHT / 2 - 115, SCREEN_WIDTH - 110, 230, 12);
      this._panel.endFill();
      this._panel.lineStyle(2, 0x223366, 0.9);
      this._panel.drawRoundedRect(55, SCREEN_HEIGHT / 2 - 115, SCREEN_WIDTH - 110, 230, 12);
      this._panel.lineStyle(1, 0x223366, 0.3);
      this._panel.drawRoundedRect(60, SCREEN_HEIGHT / 2 - 110, SCREEN_WIDTH - 120, 220, 10);
      this._panel.lineStyle(0);
    }
  }
}
