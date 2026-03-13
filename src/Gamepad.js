import { Container, Graphics, Text, Rectangle } from 'pixi.js';
import { MAP_HEIGHT_PX, SCREEN_WIDTH } from './constants.js';

const BTN = 70;          // ボタンサイズ (px)
const GAP = 6;           // ボタン間隔
const STEP = BTN + GAP;  // 76
const MARGIN = 12;       // 端からの余白
const RADIUS = 16;       // 角丸

const COLOR_NORMAL_BG   = 0x1a2035;
const COLOR_NORMAL_LINE = 0x3d4f6b;
const COLOR_PRESS_BG    = 0x243050;
const COLOR_PRESS_LINE  = 0x4fc3f7;
const COLOR_LABEL       = 0xc8d6e8;
const COLOR_LABEL_PRESS = 0x4fc3f7;

export class Gamepad {
  /** @type {boolean} ボタン押下中フラグ（スワイプ誤検知防止用） */
  touched = false;

  /**
   * @param {import('pixi.js').Application} app
   * @param {(dx: number, dy: number) => void} onMove
   * @param {() => void} onSpecial
   * @param {(index: number) => void} onUseItem
   */
  constructor(app, onMove, onSpecial, onUseItem) {
    this.container = new Container();
    this.container.visible = false;
    app.stage.addChild(this.container);

    // タッチデバイス以外では非表示のまま
    const isTouch =
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) return;

    this.container.visible = true;

    // D-pad の左上座標
    // 十字全体: 幅 = STEP*2 + BTN = 222, 高さ = 222
    const baseX = MARGIN;
    const baseY = MAP_HEIGHT_PX - MARGIN - STEP * 2 - BTN;

    // 半透明の背景パネル
    const bg = new Graphics();
    bg.beginFill(0x000000, 0.35);
    bg.drawRoundedRect(baseX - 6, baseY - 6, STEP * 2 + BTN + 12, STEP * 2 + BTN + 12, 14);
    bg.endFill();
    this.container.addChild(bg);

    // 十字方向ボタン
    const dirs = [
      { col: 1, row: 0, dx:  0, dy: -1, label: '▲' },
      { col: 0, row: 1, dx: -1, dy:  0, label: '◀' },
      { col: 2, row: 1, dx:  1, dy:  0, label: '▶' },
      { col: 1, row: 2, dx:  0, dy:  1, label: '▼' },
    ];

    for (const { col, row, dx, dy, label } of dirs) {
      this._makeButton(
        baseX + col * STEP,
        baseY + row * STEP,
        label,
        () => {
          this.touched = true;
          onMove(dx, dy);
        }
      );
    }

    // 必殺技ボタン（右下）
    const sx = SCREEN_WIDTH - MARGIN - BTN;
    const sy = MAP_HEIGHT_PX - MARGIN - BTN;
    if (onSpecial) {
      this._makeButton(sx, sy, '✨', () => {
        this.touched = true;
        onSpecial();
      }, true);
    }

    // アイテム使用ボタン（必殺技ボタンの上に積む）
    if (onUseItem) {
      this._makeButton(sx, sy - STEP, '[2]', () => {
        this.touched = true;
        onUseItem(1);
      });
      this._makeButton(sx, sy - STEP * 2, '[1]', () => {
        this.touched = true;
        onUseItem(0);
      });
    }
  }

  _makeButton(x, y, label, onClick, isSpecial = false) {
    const btn = new Container();
    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.hitArea = new Rectangle(0, 0, BTN, BTN);

    const gfx = new Graphics();

    const normalLine  = isSpecial ? 0x9c27b0 : COLOR_NORMAL_LINE;
    const pressedLine = isSpecial ? 0xffd700 : COLOR_PRESS_LINE;

    const drawNormal = () => {
      gfx.clear();
      gfx.lineStyle(2, normalLine, 1);
      gfx.beginFill(COLOR_NORMAL_BG, 0.85);
      gfx.drawRoundedRect(0, 0, BTN, BTN, RADIUS);
      gfx.endFill();
    };

    const drawPressed = () => {
      gfx.clear();
      gfx.lineStyle(2, pressedLine, 1);
      gfx.beginFill(COLOR_PRESS_BG, 0.95);
      gfx.drawRoundedRect(0, 0, BTN, BTN, RADIUS);
      gfx.endFill();
    };

    drawNormal();
    btn.addChild(gfx);

    const txt = new Text(label, {
      fontFamily: 'monospace',
      fontSize: 26,
      fill: COLOR_LABEL,
    });
    txt.anchor.set(0.5);
    txt.x = BTN / 2;
    txt.y = BTN / 2;
    btn.addChild(txt);

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      drawPressed();
      txt.style.fill = COLOR_LABEL_PRESS;
      onClick();
    });

    const release = () => {
      drawNormal();
      txt.style.fill = COLOR_LABEL;
    };
    btn.on('pointerup', release);
    btn.on('pointerupoutside', release);

    this.container.addChild(btn);
  }
}
