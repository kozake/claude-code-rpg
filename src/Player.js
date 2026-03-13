import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE } from './constants.js';

export class Player {
  constructor(parent, gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.maxHp = 30;
    this.hp = 30;
    this.attack = 6;
    this.defense = 2;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 20;
    this.soul = 0;
    this.maxSoul = 100;
    this.inventory = []; // 回復アイテムのキー配列 e.g. ['potion', 'elixir']

    this.container = new Container();
    parent.addChild(this.container);
    this._draw();
    this._updatePosition();
  }

  _draw() {
    this.container.removeChildren();
    const g = new Graphics();
    const T = TILE_SIZE; // 40
    const cx = T / 2;   // 20

    // ── Ground shadow ──────────────────────────────────────
    g.beginFill(0x000000, 0.28);
    g.drawEllipse(cx + 1, T - 2, 13, 3);
    g.endFill();

    // ── Cape (back layer) ─ 赤マント ──────────────────────
    g.beginFill(0xb71c1c);
    g.drawPolygon([cx-7, 17, cx-12, T-3, cx-1, T-8, cx+9, T-4, cx+8, 17]);
    g.endFill();
    g.beginFill(0xd32f2f, 0.45);
    g.drawPolygon([cx-4, 18, cx-7, T-6, cx, T-10, cx+2, 18]);
    g.endFill();

    // ── Sword (right side) ─────────────────────────────────
    // Tip glow
    g.beginFill(0x80deea, 0.55);
    g.drawCircle(cx + 15, 3, 2);
    g.endFill();
    // Blade
    g.beginFill(0xb0bec5);
    g.drawPolygon([cx+13, 4, cx+17, 5, cx+16, 26, cx+12, 26]);
    g.endFill();
    g.beginFill(0xeceff1);
    g.drawRect(cx+13, 5, 1, 18);
    g.endFill();
    g.beginFill(0x80deea, 0.35);
    g.drawRect(cx+13, 4, 4, 6);
    g.endFill();
    // Guard
    g.beginFill(0xf9a825);
    g.drawRoundedRect(cx+9, 25, 11, 3, 1);
    g.endFill();
    g.beginFill(0xfdd835, 0.5);
    g.drawRect(cx+10, 25, 8, 1);
    g.endFill();
    // Grip
    g.beginFill(0x5d4037);
    g.drawRect(cx+12, 28, 3, 5);
    g.endFill();
    g.beginFill(0x795548, 0.4);
    g.drawRect(cx+12, 29, 1, 4);
    g.endFill();
    // Pommel
    g.beginFill(0xf9a825);
    g.drawCircle(cx+13, 33, 2);
    g.endFill();

    // ── Boots （ダークブラウン）───────────────────────────
    g.beginFill(0x3e2723);
    g.drawRoundedRect(cx-11, 29, 9, 10, 2);
    g.drawRoundedRect(cx+2, 29, 9, 10, 2);
    g.endFill();
    g.beginFill(0x6d4c41);
    g.drawRect(cx-10, 30, 5, 2);
    g.drawRect(cx+3, 30, 5, 2);
    g.endFill();

    // ── Leg armor （白）──────────────────────────────────
    g.beginFill(0xcfd8dc);
    g.drawRoundedRect(cx-10, 23, 8, 8, 2);
    g.drawRoundedRect(cx+2, 23, 8, 8, 2);
    g.endFill();
    g.beginFill(0xffffff);
    g.drawRect(cx-9, 24, 4, 2);
    g.drawRect(cx+3, 24, 4, 2);
    g.endFill();

    // ── Body/Torso （白鎧）──────────────────────────────
    g.beginFill(0xcfd8dc);
    g.drawRoundedRect(cx-9, 15, 18, 10, 3);
    g.endFill();
    g.beginFill(0xeceff1);
    g.drawRoundedRect(cx-7, 16, 14, 8, 2);
    g.endFill();
    // 胸のハイライト
    g.beginFill(0xffffff, 0.7);
    g.drawRect(cx-5, 17, 5, 2);
    g.endFill();
    // Chest emblem (glowing diamond)
    g.beginFill(0x0288d1);
    g.drawPolygon([cx, 17, cx+4, 21, cx, 25, cx-4, 21]);
    g.endFill();
    g.beginFill(0x4fc3f7, 0.75);
    g.drawPolygon([cx-1, 18, cx+2, 21, cx-1, 24, cx-3, 21]);
    g.endFill();
    // Belt（ゴールド）
    g.beginFill(0xf9a825);
    g.drawRect(cx-9, 23, 18, 3);
    g.endFill();
    g.beginFill(0xfdd835);
    g.drawRect(cx-2, 23, 4, 3);
    g.endFill();

    // ── Pauldrons left （白）────────────────────────────
    g.beginFill(0xb0bec5);
    g.drawRoundedRect(cx-16, 13, 9, 8, 2);
    g.endFill();
    g.beginFill(0xeceff1);
    g.drawRoundedRect(cx-15, 14, 7, 6, 1);
    g.endFill();
    g.beginFill(0xffffff, 0.7);
    g.drawRect(cx-14, 15, 4, 2);
    g.endFill();

    // ── Pauldrons right （白）───────────────────────────
    g.beginFill(0xb0bec5);
    g.drawRoundedRect(cx+7, 13, 9, 8, 2);
    g.endFill();
    g.beginFill(0xeceff1);
    g.drawRoundedRect(cx+8, 14, 7, 6, 1);
    g.endFill();
    g.beginFill(0xffffff, 0.7);
    g.drawRect(cx+10, 15, 4, 2);
    g.endFill();

    // ── Shield （白 + 金の十字）──────────────────────────
    g.beginFill(0xb0bec5);
    g.drawPolygon([cx-19, 16, cx-11, 16, cx-11, 26, cx-15, 30, cx-19, 26]);
    g.endFill();
    g.beginFill(0xeceff1);
    g.drawPolygon([cx-18, 17, cx-12, 17, cx-12, 25, cx-15, 28, cx-18, 25]);
    g.endFill();
    // 金の十字紋章
    g.beginFill(0xf9a825);
    g.drawRect(cx-16, 18, 2, 8);
    g.drawRect(cx-18, 21, 6, 2);
    g.endFill();
    g.beginFill(0xffffff, 0.5);
    g.drawRect(cx-18, 17, 2, 4);
    g.endFill();

    // ── HEAD: 金髪 + 顔 ─────────────────────────────────
    // 後ろ髪（影色）
    g.beginFill(0xe65100);
    g.drawRoundedRect(cx-9, 5, 18, 14, 5);
    g.endFill();

    // 主髪（ゴールデンイエロー）
    g.beginFill(0xfdd835);
    g.drawRoundedRect(cx-8, 6, 16, 12, 4);
    g.endFill();

    // 髪のスパイク（上向き）
    g.beginFill(0xfdd835);
    g.drawPolygon([cx-7, 8,  cx-3, 8,  cx-5, 1]);  // 左
    g.drawPolygon([cx-2, 6,  cx+2, 6,  cx,   0]);   // 中央
    g.drawPolygon([cx+3, 8,  cx+7, 8,  cx+5, 2]);   // 右
    g.endFill();

    // 髪のハイライト
    g.beginFill(0xfff9c4, 0.55);
    g.drawPolygon([cx-6, 7, cx-1, 6, cx-2, 9, cx-6, 9]);
    g.endFill();

    // 顔（肌色）
    g.beginFill(0xffcc80);
    g.drawRoundedRect(cx-6, 9, 12, 11, 4);
    g.endFill();

    // 顔のハイライト
    g.beginFill(0xffffff, 0.28);
    g.drawEllipse(cx-2, 11, 3, 2);
    g.endFill();

    // 眉毛（意志の強い表情）
    g.beginFill(0xbf360c);
    g.drawPolygon([cx-6, 12, cx-2, 11, cx-2, 12.5, cx-6, 13]);
    g.drawPolygon([cx+2, 11, cx+6, 12, cx+6, 13,   cx+2, 12.5]);
    g.endFill();

    // 目（ブルー）
    g.beginFill(0x1565c0);
    g.drawCircle(cx-3, 14, 2);
    g.drawCircle(cx+3, 14, 2);
    g.endFill();
    g.beginFill(0x0d47a1);
    g.drawCircle(cx-3, 14, 1.2);
    g.drawCircle(cx+3, 14, 1.2);
    g.endFill();
    g.beginFill(0xffffff);
    g.drawCircle(cx-4, 13, 0.7);
    g.drawCircle(cx+2, 13, 0.7);
    g.endFill();

    // 鼻（控えめ）
    g.beginFill(0xffa726, 0.45);
    g.drawCircle(cx, 16, 1.2);
    g.endFill();

    // 口（きりっとした笑み）
    g.beginFill(0xe57373, 0.8);
    g.drawRect(cx-3, 18, 6, 1.5);
    g.endFill();

    // 首・カラー（頭と体をつなぐ白いカラー）
    g.beginFill(0xcfd8dc);
    g.drawRoundedRect(cx-5, 18, 10, 4, 2);
    g.endFill();
    g.beginFill(0xffffff, 0.6);
    g.drawRect(cx-4, 19, 7, 1);
    g.endFill();

    this.container.addChild(g);
  }

  /** ダメージを受けたときの赤フラッシュ */
  flash() {
    this.container.tint = 0xff3333;
    setTimeout(() => { this.container.tint = 0xffffff; }, 180);
  }

  _updatePosition() {
    this.container.x = this.gridX * TILE_SIZE;
    this.container.y = this.gridY * TILE_SIZE;
    this._tweenFromX = this.container.x;
    this._tweenFromY = this.container.y;
    this._tweenProgress = 1;
    this._tweenBaseY = this.container.y;
  }

  move(nx, ny) {
    // スムーズ移動: 現在の描画位置からtween
    this._tweenFromX = this.container.x;
    this._tweenFromY = this.container.y;
    this._tweenProgress = 0;
    this.gridX = nx;
    this.gridY = ny;
  }

  /** tweenを毎フレーム進める。Game._tickAnimationから呼ぶ */
  updateTween(delta) {
    if (this._tweenProgress >= 1) return;
    this._tweenProgress = Math.min(1, this._tweenProgress + delta * 0.28);
    const ease = 1 - Math.pow(1 - this._tweenProgress, 3);
    this.container.x = this._tweenFromX + (this.gridX * TILE_SIZE - this._tweenFromX) * ease;
    // Y は bob アニメが上書きするため gridY 位置のみ計算
    this._tweenBaseY = this._tweenFromY + (this.gridY * TILE_SIZE - this._tweenFromY) * ease;
  }

  setPosition(nx, ny) {
    this.gridX = nx;
    this.gridY = ny;
    this._updatePosition();
  }

  levelUp() {
    this.level++;
    this.xp -= this.xpToNext;
    this.xpToNext = Math.floor(this.xpToNext * 1.5);
    this.maxHp += 5;
    this.hp = this.maxHp;
    this.attack += 2;
    this.defense += 1;
  }

  get hpPercent()   { return this.hp / this.maxHp; }
  get xpPercent()   { return this.xp / this.xpToNext; }
  get soulPercent() { return this.soul / this.maxSoul; }
}
