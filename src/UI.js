import { Container, Graphics, Text } from 'pixi.js';
import {
  SCREEN_WIDTH, MAP_HEIGHT_PX, UI_HEIGHT, SCREEN_HEIGHT,
  COLOR, MAX_FLOORS, ITEM_DEFS
} from './constants.js';

const MAX_MESSAGES = 5;
const PIXEL_FONT = '"Press Start 2P", monospace';

export class UI {
  constructor(app) {
    this.container = new Container();
    this.container.y = MAP_HEIGHT_PX;
    app.stage.addChild(this.container);

    this.messages = [];
    this._buildLayout(app);
  }

  _buildLayout(app) {
    // ── 背景 ──────────────────────────────────────────────────
    const bg = new Graphics();
    // メイン背景
    bg.beginFill(0x0a0d1a);
    bg.drawRect(0, 0, SCREEN_WIDTH, UI_HEIGHT);
    bg.endFill();

    // 上部の装飾ライン（グラデーション風・多重ライン）
    bg.beginFill(0x4a5a8a, 0.9);
    bg.drawRect(0, 0, SCREEN_WIDTH, 3);
    bg.endFill();
    bg.beginFill(0x2a3a6a, 0.7);
    bg.drawRect(0, 3, SCREEN_WIDTH, 2);
    bg.endFill();

    // 内側のパネル背景（左）
    bg.beginFill(0x0c1020, 0.85);
    bg.drawRoundedRect(6, 8, 210, UI_HEIGHT - 14, 4);
    bg.endFill();
    // 内側のパネル背景（右）
    bg.beginFill(0x060810, 0.9);
    bg.drawRoundedRect(222, 8, SCREEN_WIDTH - 228, UI_HEIGHT - 14, 4);
    bg.endFill();

    // パネル枠線（左）
    bg.lineStyle(1, 0x2a3a6a, 0.8);
    bg.drawRoundedRect(6, 8, 210, UI_HEIGHT - 14, 4);
    bg.lineStyle(0);

    // パネル枠線（右）
    bg.lineStyle(1, 0x1e2d4a, 0.8);
    bg.drawRoundedRect(222, 8, SCREEN_WIDTH - 228, UI_HEIGHT - 14, 4);
    bg.lineStyle(0);

    // 区切り線
    bg.beginFill(0x2a3a6a, 0.6);
    bg.drawRect(218, 8, 2, UI_HEIGHT - 14);
    bg.endFill();

    this.container.addChild(bg);

    // ── Lv / Floor テキスト ──────────────────────────────────
    this._statsLine1 = new Text('', {
      fontFamily: PIXEL_FONT,
      fontSize: 8,
      fill: COLOR.YELLOW,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 1,
    });
    this._statsLine1.x = 14;
    this._statsLine1.y = 14;
    this.container.addChild(this._statsLine1);

    // ATK / DEF テキスト
    this._statsLine2 = new Text('', {
      fontFamily: PIXEL_FONT,
      fontSize: 8,
      fill: COLOR.CYAN,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 1,
    });
    this._statsLine2.x = 14;
    this._statsLine2.y = 28;
    this.container.addChild(this._statsLine2);

    // ── HP バー ───────────────────────────────────────────────
    this._drawBarLabel('HP', 0xf44336, 14, 43);
    this._hpBarBg = this._makeBarBg(14, 54, 200, 12);
    this._hpBarFill = new Graphics();
    this.container.addChild(this._hpBarFill);
    this._hpValueText = new Text('', {
      fontFamily: PIXEL_FONT, fontSize: 7, fill: 0xffffff,
      dropShadow: true, dropShadowColor: 0x000000, dropShadowDistance: 1,
    });
    this._hpValueText.x = 14;
    this._hpValueText.y = 68;
    this.container.addChild(this._hpValueText);

    // ── XP バー ───────────────────────────────────────────────
    this._drawBarLabel('XP', 0x9c27b0, 14, 82);
    this._xpBarBg = this._makeBarBg(14, 93, 200, 8);
    this._xpBarFill = new Graphics();
    this.container.addChild(this._xpBarFill);
    this._xpValueText = new Text('', {
      fontFamily: PIXEL_FONT, fontSize: 7, fill: 0xce93d8,
      dropShadow: true, dropShadowColor: 0x000000, dropShadowDistance: 1,
    });
    this._xpValueText.x = 14;
    this._xpValueText.y = 103;
    this.container.addChild(this._xpValueText);

    // ── DEPTH バー ────────────────────────────────────────────
    this._drawBarLabel('DEPTH', 0xe2c05a, 14, 117);
    this._floorBarBg = this._makeBarBg(14, 128, 200, 6);
    this._floorBarFill = new Graphics();
    this.container.addChild(this._floorBarFill);

    // ── SOUL ゲージ ───────────────────────────────────────────
    this._drawBarLabel('SOUL', 0xce93d8, 14, 138);
    this._soulBarBg = this._makeBarBg(14, 149, 200, 6);
    this._soulBarFill = new Graphics();
    this.container.addChild(this._soulBarFill);
    this._soulLabel = new Text('', {
      fontFamily: PIXEL_FONT, fontSize: 7, fill: 0xce93d8,
    });
    this._soulLabel.x = 100;
    this._soulLabel.y = 149;
    this.container.addChild(this._soulLabel);

    // ── アイテムバッグ ─────────────────────────────────────────
    this._drawBarLabel('ITEMS', 0x69f0ae, 14, 163);
    this._itemSlots = [];
    for (let i = 0; i < 2; i++) {
      const t = new Text('', {
        fontFamily: PIXEL_FONT,
        fontSize: 7,
        fill: 0x334455,
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowDistance: 1,
      });
      t.x = 14;
      t.y = 175 + i * 13;
      this.container.addChild(t);
      this._itemSlots.push(t);
    }

    // ── メッセージログ ────────────────────────────────────────
    this._msgTexts = [];
    for (let i = 0; i < MAX_MESSAGES; i++) {
      const t = new Text('', {
        fontFamily: PIXEL_FONT,
        fontSize: i === 0 ? 9 : 8,
        fill: COLOR.GRAY,
        wordWrap: true,
        wordWrapWidth: SCREEN_WIDTH - 240,
      });
      t.x = 230;
      t.y = 14 + i * 26;
      this.container.addChild(t);
      this._msgTexts.push(t);
    }

    // 操作ヒント
    const hint = new Text('WASD/Arrow=Move  Space=Soul  >=Stairs  1/2=アイテム使用', {
      fontFamily: PIXEL_FONT,
      fontSize: 6,
      fill: 0x334455,
    });
    hint.x = 230;
    hint.y = UI_HEIGHT - 14;
    this.container.addChild(hint);

    // ── オーバーレイ（ゲームオーバー/クリア） ────────────────
    this._overlay = new Graphics();
    this._overlay.visible = false;
    this._overlay.eventMode = 'static';
    this._overlay.cursor = 'pointer';
    this._overlay.on('pointerdown', () => window.location.reload());
    app.stage.addChild(this._overlay);

    this._overlayText = new Text('', {
      fontFamily: PIXEL_FONT,
      fontSize: 22,
      fill: COLOR.WHITE,
      align: 'center',
      lineHeight: 36,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 3,
    });
    this._overlayText.anchor.set(0.5);
    this._overlayText.x = SCREEN_WIDTH / 2;
    this._overlayText.y = SCREEN_HEIGHT / 2;
    this._overlayText.visible = false;
    app.stage.addChild(this._overlayText);
  }

  _drawBarLabel(label, color, x, y) {
    const t = new Text(label, {
      fontFamily: PIXEL_FONT,
      fontSize: 7,
      fill: color,
    });
    t.x = x;
    t.y = y;
    this.container.addChild(t);
  }

  _makeBarBg(x, y, w, h) {
    const g = new Graphics();
    // 外枠
    g.beginFill(0x000000, 0.7);
    g.drawRoundedRect(x - 1, y - 1, w + 2, h + 2, 3);
    g.endFill();
    // 内側背景
    g.beginFill(0x0d1525);
    g.drawRoundedRect(x, y, w, h, 2);
    g.endFill();
    this.container.addChild(g);
    return g;
  }

  _drawGradientBar(gfx, x, y, w, h, pct, colorHigh, colorMid, colorLow) {
    gfx.clear();
    if (pct <= 0) return;
    const col = pct > 0.5 ? colorHigh : pct > 0.25 ? colorMid : colorLow;
    const fillW = Math.max(2, Math.floor(w * pct));
    // メインバー
    gfx.beginFill(col, 0.9);
    gfx.drawRoundedRect(x, y, fillW, h, 2);
    gfx.endFill();
    // 上部ハイライト
    gfx.beginFill(0xffffff, 0.2);
    gfx.drawRoundedRect(x, y, fillW, Math.ceil(h * 0.4), 2);
    gfx.endFill();
  }

  update(player, floor) {
    this._statsLine1.text = `LV.${player.level}   FL.${floor}/${MAX_FLOORS}`;
    this._statsLine2.text = `ATK:${player.attack}  DEF:${player.defense}`;

    // HP バー
    const hpPct = Math.max(0, player.hp / player.maxHp);
    this._drawGradientBar(this._hpBarFill, 14, 54, 200, 12, hpPct,
      COLOR.HP_GREEN, COLOR.HP_YELLOW, COLOR.HP_RED);
    this._hpValueText.text = `${player.hp}/${player.maxHp}`;

    // XP バー
    const xpPct = Math.min(1, player.xp / player.xpToNext);
    this._drawGradientBar(this._xpBarFill, 14, 93, 200, 8, xpPct,
      COLOR.XP_BAR, 0xb266ff, 0x7c4dff);
    this._xpValueText.text = `${player.xp}/${player.xpToNext}`;

    // DEPTH バー
    const floorPct = Math.min(1, floor / MAX_FLOORS);
    this._floorBarFill.clear();
    this._floorBarFill.beginFill(COLOR.STAIRS, 0.85);
    this._floorBarFill.drawRoundedRect(14, 128, Math.max(2, Math.floor(200 * floorPct)), 6, 2);
    this._floorBarFill.endFill();

    // SOUL ゲージ
    const soulPct = Math.min(1, player.soul / player.maxSoul);
    const soulReady = player.soul >= player.maxSoul;
    const soulColor = soulReady ? 0xffd700 : 0xce93d8;
    this._soulBarFill.clear();
    this._soulBarFill.beginFill(soulColor, soulReady ? 1.0 : 0.8);
    this._soulBarFill.drawRoundedRect(14, 149, Math.max(2, Math.floor(200 * soulPct)), 6, 2);
    this._soulBarFill.endFill();
    if (soulReady) {
      // 発光エフェクト
      this._soulBarFill.beginFill(0xffffff, 0.3);
      this._soulBarFill.drawRoundedRect(14, 149, 200, 3, 2);
      this._soulBarFill.endFill();
    }
    this._soulLabel.text = soulReady ? 'READY!' : '';
    this._soulLabel.style.fill = 0xffd700;

    // アイテムバッグ
    const groups = this._groupInventory(player.inventory);
    for (let i = 0; i < this._itemSlots.length; i++) {
      if (i < groups.length) {
        const { key, count } = groups[i];
        const def = ITEM_DEFS[key];
        this._itemSlots[i].text = `[${i + 1}] ${def.name} x${count}`;
        this._itemSlots[i].style.fill = def.color;
      } else {
        this._itemSlots[i].text = `[${i + 1}] ---`;
        this._itemSlots[i].style.fill = 0x334455;
      }
    }
  }

  _groupInventory(inventory) {
    const groups = [];
    const indices = {};
    for (const key of inventory) {
      if (key in indices) {
        groups[indices[key]].count++;
      } else {
        indices[key] = groups.length;
        groups.push({ key, count: 1 });
      }
    }
    return groups;
  }

  addMessage(text, color = COLOR.GRAY) {
    this.messages.unshift({ text, color });
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.length = MAX_MESSAGES;
    }
    this._renderMessages();
  }

  _renderMessages() {
    for (let i = 0; i < MAX_MESSAGES; i++) {
      const msg = this.messages[i];
      if (msg) {
        this._msgTexts[i].text = msg.text;
        this._msgTexts[i].style.fill = msg.color;
        this._msgTexts[i].alpha = i === 0 ? 1 : 1 - i * 0.18;
      } else {
        this._msgTexts[i].text = '';
      }
    }
  }

  showMessage(text, color = COLOR.WHITE) {
    this._overlay.clear();
    // 半透明黒背景
    this._overlay.beginFill(0x000000, 0.78);
    this._overlay.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this._overlay.endFill();
    // 装飾枠
    this._overlay.lineStyle(3, 0x4a5a8a, 0.9);
    this._overlay.drawRoundedRect(SCREEN_WIDTH / 2 - 220, SCREEN_HEIGHT / 2 - 80, 440, 160, 8);
    this._overlay.lineStyle(0);
    this._overlay.visible = true;

    this._overlayText.text = text + '\n\nClick to Restart';
    this._overlayText.style.fill = color;
    this._overlayText.visible = true;
  }
}
