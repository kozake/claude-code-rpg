import { Container, Graphics, Text, Rectangle } from 'pixi.js';
import { MAP_HEIGHT_PX, SCREEN_WIDTH, ITEM_DEFS } from './constants.js';

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

const PIXEL_FONT = '"Press Start 2P", monospace';

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
    this._isTouch =
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    if (!this._isTouch) return;

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
    this._itemBtns = [];
    if (onUseItem) {
      // ボタン [2] → インデックス1、[1] → インデックス0（上から順に配置）
      for (let i = 0; i < 2; i++) {
        const btnY = sy - STEP * (2 - i);
        const itemBtn = this._makeItemButton(sx, btnY, i, () => {
          this.touched = true;
          onUseItem(i);
        });
        this._itemBtns.push(itemBtn);
      }
    }
  }

  /** アイテムボタンを生成（アイコン・個数を動的更新できるもの） */
  _makeItemButton(x, y, index, onClick) {
    const btn = new Container();
    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.hitArea = new Rectangle(0, 0, BTN, BTN);

    const gfx = new Graphics();  // ボタン背景
    const gItem = new Graphics(); // アイテムアイコン（更新可）

    const drawNormal = (color = COLOR_NORMAL_LINE) => {
      gfx.clear();
      gfx.lineStyle(2, color, 1);
      gfx.beginFill(COLOR_NORMAL_BG, 0.85);
      gfx.drawRoundedRect(0, 0, BTN, BTN, RADIUS);
      gfx.endFill();
    };

    const drawPressed = (color = COLOR_PRESS_LINE) => {
      gfx.clear();
      gfx.lineStyle(2, color, 1);
      gfx.beginFill(COLOR_PRESS_BG, 0.95);
      gfx.drawRoundedRect(0, 0, BTN, BTN, RADIUS);
      gfx.endFill();
    };

    drawNormal();
    btn.addChild(gfx);
    btn.addChild(gItem);

    // 個数テキスト
    const tCount = new Text('', {
      fontFamily: PIXEL_FONT,
      fontSize: 7,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 1,
    });
    tCount.anchor.set(1, 1);
    tCount.x = BTN - 4;
    tCount.y = BTN - 4;
    btn.addChild(tCount);

    // キー番号バッジ（左上）
    const tKey = new Text(`${index + 1}`, {
      fontFamily: PIXEL_FONT,
      fontSize: 7,
      fill: 0x4a5a8a,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 1,
    });
    tKey.x = 5;
    tKey.y = 5;
    btn.addChild(tKey);

    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      const lineColor = btn._itemColor ?? COLOR_PRESS_LINE;
      drawPressed(lineColor);
      onClick();
    });

    const release = () => {
      const lineColor = btn._itemColor ?? COLOR_NORMAL_LINE;
      drawNormal(lineColor);
    };
    btn.on('pointerup', release);
    btn.on('pointerupoutside', release);

    this.container.addChild(btn);
    return { btn, gfx, gItem, tCount, tKey, drawNormal };
  }

  /**
   * アイテムボタンの表示を更新する
   * @param {{ key: string, count: number }[]} groups
   */
  updateItems(groups) {
    if (!this._itemBtns) return;
    for (let i = 0; i < this._itemBtns.length; i++) {
      const { btn, gfx, gItem, tCount, tKey, drawNormal } = this._itemBtns[i];
      const group = i < groups.length ? groups[i] : null;
      gItem.clear();

      if (group) {
        const def = ITEM_DEFS[group.key];
        btn._itemColor = def.color;

        // ボタン背景を item カラーで着色
        gfx.clear();
        gfx.lineStyle(2, def.color, 0.8);
        gfx.beginFill(COLOR_NORMAL_BG, 0.85);
        gfx.drawRoundedRect(0, 0, BTN, BTN, RADIUS);
        gfx.endFill();
        // 内側グロー
        gfx.beginFill(def.color, 0.08);
        gfx.drawRoundedRect(2, 2, BTN - 4, BTN - 4, RADIUS - 2);
        gfx.endFill();

        // ポーションアイコン（ボタン中央上寄り）
        this._drawPotion(gItem, BTN / 2, BTN / 2 - 4, def);

        tCount.text = `x${group.count}`;
        tCount.style.fill = def.color;
        tKey.style.fill = def.color;
      } else {
        btn._itemColor = null;
        drawNormal(COLOR_NORMAL_LINE);
        tCount.text = '';
        tKey.style.fill = 0x4a5a8a;
      }
    }
  }

  /** ポーションアイコン描画（ボタン用・大きめ） */
  _drawPotion(g, cx, cy, def) {
    const c  = def.color;
    const cd = def.colorDark;
    const s  = 1.8; // スケール係数

    // ビンの胴体
    g.beginFill(cd, 0.85);
    g.drawEllipse(cx, cy + 5 * s, 5 * s, 6 * s);
    g.endFill();
    g.beginFill(c, 0.90);
    g.drawEllipse(cx, cy + 4 * s, 4 * s, 5 * s);
    g.endFill();

    // 液体ハイライト
    g.beginFill(0xffffff, 0.40);
    g.drawEllipse(cx - 1.5 * s, cy + 2 * s, 1.5 * s, 2.5 * s);
    g.endFill();

    // 首
    g.beginFill(cd);
    g.drawRoundedRect(cx - 2 * s, cy - 4 * s, 4 * s, 4 * s, 1);
    g.endFill();
    g.beginFill(c, 0.75);
    g.drawRoundedRect(cx - 1.5 * s, cy - 3.5 * s, 3 * s, 3 * s, 1);
    g.endFill();

    // コルク
    g.beginFill(0xd7b07a);
    g.drawRoundedRect(cx - 2 * s, cy - 8 * s, 4 * s, 5 * s, 1);
    g.endFill();
    g.beginFill(0xf5d9a0, 0.6);
    g.drawRect(cx - 1 * s, cy - 7 * s, 1.5 * s, 2.5 * s);
    g.endFill();

    // 光の粒
    g.beginFill(c, 0.65);
    g.drawCircle(cx + 4 * s, cy - 2 * s, 1.5);
    g.endFill();
  }

  /** ゲームプレイ中のみ表示する */
  show() {
    if (this._isTouch) this.container.visible = true;
  }

  /** ストーリー/タイトル画面中は非表示にする */
  hide() {
    this.container.visible = false;
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
