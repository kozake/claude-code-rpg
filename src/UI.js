import { Container, Graphics, Text } from 'pixi.js';
import {
  SCREEN_WIDTH, MAP_HEIGHT_PX, UI_HEIGHT, SCREEN_HEIGHT,
  COLOR
} from './constants.js';

const MAX_MESSAGES = 4;

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

    // Left panel: HP / XP bars
    this._statsText = new Text('', {
      fontFamily: 'monospace',
      fontSize: 13,
      fill: COLOR.WHITE,
    });
    this._statsText.x = 10;
    this._statsText.y = 6;
    this.container.addChild(this._statsText);

    // HP bar BG
    this._hpBarBg = new Graphics();
    this._hpBarBg.beginFill(COLOR.HP_BG);
    this._hpBarBg.drawRect(10, 28, 200, 12);
    this._hpBarBg.endFill();
    this.container.addChild(this._hpBarBg);

    this._hpBarFill = new Graphics();
    this.container.addChild(this._hpBarFill);

    // XP bar BG
    this._xpBarBg = new Graphics();
    this._xpBarBg.beginFill(COLOR.HP_BG);
    this._xpBarBg.drawRect(10, 46, 200, 8);
    this._xpBarBg.endFill();
    this.container.addChild(this._xpBarBg);

    this._xpBarFill = new Graphics();
    this.container.addChild(this._xpBarFill);

    this._barLabels = new Text('HP          XP', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: COLOR.GRAY,
    });
    this._barLabels.x = 10;
    this._barLabels.y = 57;
    this.container.addChild(this._barLabels);

    // Right panel: message log
    const msgBg = new Graphics();
    msgBg.beginFill(0x060610);
    msgBg.drawRect(220, 4, SCREEN_WIDTH - 224, UI_HEIGHT - 8);
    msgBg.endFill();
    this.container.addChild(msgBg);

    this._msgTexts = [];
    for (let i = 0; i < MAX_MESSAGES; i++) {
      const t = new Text('', {
        fontFamily: 'monospace',
        fontSize: 12,
        fill: COLOR.GRAY,
      });
      t.x = 228;
      t.y = 8 + i * 26;
      this.container.addChild(t);
      this._msgTexts.push(t);
    }

    // Controls hint
    const hint = new Text('移動: 矢印キー / WASD / スワイプ  |  敵にぶつかって攻撃  |  ＞ = 階段', {
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0x445566,
    });
    hint.x = 228;
    hint.y = UI_HEIGHT - 16;
    this.container.addChild(hint);

    // Overlay for game over / win (タップ/クリックでリスタート)
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
    // Stats text
    this._statsText.text =
      `Lv.${player.level}   Floor ${floor}   ATK:${player.attack}  DEF:${player.defense}`;

    // HP bar
    const hpPct = Math.max(0, player.hp / player.maxHp);
    const hpColor = hpPct > 0.5 ? COLOR.HP_GREEN : hpPct > 0.25 ? COLOR.HP_YELLOW : COLOR.HP_RED;
    this._hpBarFill.clear();
    this._hpBarFill.beginFill(hpColor);
    this._hpBarFill.drawRect(10, 28, Math.floor(200 * hpPct), 12);
    this._hpBarFill.endFill();

    // XP bar
    const xpPct = Math.min(1, player.xp / player.xpToNext);
    this._xpBarFill.clear();
    this._xpBarFill.beginFill(COLOR.XP_BAR);
    this._xpBarFill.drawRect(10, 46, Math.floor(200 * xpPct), 8);
    this._xpBarFill.endFill();

    this._barLabels.text =
      `HP ${player.hp}/${player.maxHp}    XP ${player.xp}/${player.xpToNext}`;
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
        this._msgTexts[i].alpha = 1 - i * 0.2;
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
