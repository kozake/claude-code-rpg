import { Container, Graphics, Text } from 'pixi.js';
import {
  SCREEN_WIDTH, MAP_HEIGHT_PX, UI_HEIGHT, SCREEN_HEIGHT,
  COLOR, MAX_FLOORS
} from './constants.js';

const MAX_MESSAGES = 5;

export class UI {
  constructor(app) {
    this.container = new Container();
    this.container.y = MAP_HEIGHT_PX;
    app.stage.addChild(this.container);

    this.messages = [];
    this._buildLayout(app);
  }

  _buildLayout(app) {
    // Background
    const bg = new Graphics();
    bg.beginFill(COLOR.UI_BG);
    bg.drawRect(0, 0, SCREEN_WIDTH, UI_HEIGHT);
    bg.endFill();

    // Divider
    bg.beginFill(COLOR.WALL_TOP || 0x5c5c8a);
    bg.drawRect(0, 0, SCREEN_WIDTH, 2);
    bg.endFill();

    this.container.addChild(bg);

    // ── Left panel ─────────────────────────────
    // Stats text line 1: Lv / Floor
    this._statsLine1 = new Text('', {
      fontFamily: 'monospace',
      fontSize: 13,
      fill: COLOR.WHITE,
    });
    this._statsLine1.x = 10;
    this._statsLine1.y = 6;
    this.container.addChild(this._statsLine1);

    // Stats text line 2: ATK / DEF
    this._statsLine2 = new Text('', {
      fontFamily: 'monospace',
      fontSize: 13,
      fill: COLOR.CYAN,
    });
    this._statsLine2.x = 10;
    this._statsLine2.y = 22;
    this.container.addChild(this._statsLine2);

    // HP bar BG
    this._hpBarBg = new Graphics();
    this._hpBarBg.beginFill(COLOR.HP_BG);
    this._hpBarBg.drawRect(10, 42, 200, 14);
    this._hpBarBg.endFill();
    this.container.addChild(this._hpBarBg);

    this._hpBarFill = new Graphics();
    this.container.addChild(this._hpBarFill);

    this._hpLabel = new Text('HP', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: COLOR.GRAY,
    });
    this._hpLabel.x = 10;
    this._hpLabel.y = 59;
    this.container.addChild(this._hpLabel);

    // XP bar BG
    this._xpBarBg = new Graphics();
    this._xpBarBg.beginFill(COLOR.HP_BG);
    this._xpBarBg.drawRect(10, 78, 200, 10);
    this._xpBarBg.endFill();
    this.container.addChild(this._xpBarBg);

    this._xpBarFill = new Graphics();
    this.container.addChild(this._xpBarFill);

    this._xpLabel = new Text('XP', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: COLOR.GRAY,
    });
    this._xpLabel.x = 10;
    this._xpLabel.y = 91;
    this.container.addChild(this._xpLabel);

    // Floor progress bar BG
    this._floorBarBg = new Graphics();
    this._floorBarBg.beginFill(COLOR.HP_BG);
    this._floorBarBg.drawRect(10, 112, 200, 8);
    this._floorBarBg.endFill();
    this.container.addChild(this._floorBarBg);

    this._floorBarFill = new Graphics();
    this.container.addChild(this._floorBarFill);

    this._floorLabel = new Text('', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0x7a8fa8,
    });
    this._floorLabel.x = 10;
    this._floorLabel.y = 123;
    this.container.addChild(this._floorLabel);

    // Soul gauge BG
    this._soulBarBg = new Graphics();
    this._soulBarBg.beginFill(COLOR.HP_BG);
    this._soulBarBg.drawRect(10, 136, 200, 8);
    this._soulBarBg.endFill();
    this.container.addChild(this._soulBarBg);

    this._soulBarFill = new Graphics();
    this.container.addChild(this._soulBarFill);

    this._soulLabel = new Text('SOUL', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xce93d8,
    });
    this._soulLabel.x = 10;
    this._soulLabel.y = 147;
    this.container.addChild(this._soulLabel);

    // Vertical separator between left and right panels
    const sep = new Graphics();
    sep.beginFill(0x2a3a55);
    sep.drawRect(218, 4, 2, UI_HEIGHT - 8);
    sep.endFill();
    this.container.addChild(sep);

    // ── Right panel: message log ────────────────
    const msgBg = new Graphics();
    msgBg.beginFill(0x060610);
    msgBg.drawRect(222, 4, SCREEN_WIDTH - 226, UI_HEIGHT - 8);
    msgBg.endFill();
    this.container.addChild(msgBg);

    this._msgTexts = [];
    for (let i = 0; i < MAX_MESSAGES; i++) {
      const t = new Text('', {
        fontFamily: 'monospace',
        fontSize: 12,
        fill: COLOR.GRAY,
      });
      t.x = 230;
      t.y = 8 + i * 26;
      this.container.addChild(t);
      this._msgTexts.push(t);
    }

    // Controls hint
    const hint = new Text('移動: 矢印キー / WASD / スワイプ  |  敵にぶつかって攻撃  |  Space = 魂の一撃  |  ＞ = 階段', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0x445566,
    });
    hint.x = 230;
    hint.y = UI_HEIGHT - 16;
    this.container.addChild(hint);

    // Overlay for game over / win
    this._overlay = new Graphics();
    this._overlay.visible = false;
    this._overlay.eventMode = 'static';
    this._overlay.cursor = 'pointer';
    this._overlay.on('pointerdown', () => window.location.reload());
    app.stage.addChild(this._overlay);

    this._overlayText = new Text('', {
      fontFamily: 'monospace',
      fontSize: 32,
      fill: COLOR.WHITE,
      align: 'center',
    });
    this._overlayText.anchor.set(0.5);
    this._overlayText.x = SCREEN_WIDTH / 2;
    this._overlayText.y = SCREEN_HEIGHT / 2;
    this._overlayText.visible = false;
    app.stage.addChild(this._overlayText);
  }

  update(player, floor) {
    // Stats lines
    this._statsLine1.text = `Lv.${player.level}   Floor ${floor} / ${MAX_FLOORS}`;
    this._statsLine2.text = `ATK: ${player.attack}   DEF: ${player.defense}`;

    // HP bar
    const hpPct = Math.max(0, player.hp / player.maxHp);
    const hpColor = hpPct > 0.5 ? COLOR.HP_GREEN : hpPct > 0.25 ? COLOR.HP_YELLOW : COLOR.HP_RED;
    this._hpBarFill.clear();
    this._hpBarFill.beginFill(hpColor);
    this._hpBarFill.drawRect(10, 42, Math.floor(200 * hpPct), 14);
    this._hpBarFill.endFill();
    this._hpLabel.text = `HP  ${player.hp} / ${player.maxHp}`;

    // XP bar
    const xpPct = Math.min(1, player.xp / player.xpToNext);
    this._xpBarFill.clear();
    this._xpBarFill.beginFill(COLOR.XP_BAR);
    this._xpBarFill.drawRect(10, 78, Math.floor(200 * xpPct), 10);
    this._xpBarFill.endFill();
    this._xpLabel.text = `XP  ${player.xp} / ${player.xpToNext}`;

    // Floor progress bar (gold color)
    const floorPct = Math.min(1, floor / MAX_FLOORS);
    this._floorBarFill.clear();
    this._floorBarFill.beginFill(COLOR.STAIRS);
    this._floorBarFill.drawRect(10, 112, Math.floor(200 * floorPct), 8);
    this._floorBarFill.endFill();
    this._floorLabel.text = `DEPTH  ${floor} / ${MAX_FLOORS}`;

    // Soul gauge (purple when charging, gold when ready)
    const soulPct = Math.min(1, player.soul / player.maxSoul);
    const soulReady = player.soul >= player.maxSoul;
    const soulColor = soulReady ? COLOR.YELLOW : COLOR.XP_BAR;
    this._soulBarFill.clear();
    this._soulBarFill.beginFill(soulColor);
    this._soulBarFill.drawRect(10, 136, Math.floor(200 * soulPct), 8);
    this._soulBarFill.endFill();
    this._soulLabel.text = soulReady
      ? `SOUL  ✨ READY! [Space]`
      : `SOUL  ${player.soul} / ${player.maxSoul}`;
    this._soulLabel.style.fill = soulReady ? COLOR.YELLOW : 0xce93d8;
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
        this._msgTexts[i].alpha = 1 - i * 0.15;
      } else {
        this._msgTexts[i].text = '';
      }
    }
  }

  showMessage(text, color = COLOR.WHITE) {
    this._overlay.clear();
    this._overlay.beginFill(0x000000, 0.7);
    this._overlay.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this._overlay.endFill();
    this._overlay.visible = true;

    this._overlayText.text = text + '\n\nタップ / クリックでリスタート';
    this._overlayText.style.fill = color;
    this._overlayText.visible = true;
  }
}
