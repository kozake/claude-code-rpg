import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE } from './constants.js';

export class Enemy {
  constructor(parent, gridX, gridY, def) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.def = def;
    this.maxHp = def.maxHp;
    this.hp = def.maxHp;
    this.alive = true;

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

    switch (this.def.name) {
      case 'スライム':  this._drawSlime(g, cx, T);    break;
      case 'ゴブリン':  this._drawGoblin(g, cx, T);   break;
      default:          this._drawSkeleton(g, cx, T);
    }

    this.container.addChild(g);

    // HP bar
    this._hpBarBg   = new Graphics();
    this._hpBarFill = new Graphics();
    this.container.addChild(this._hpBarBg);
    this.container.addChild(this._hpBarFill);
    this._drawHpBar();
  }

  // ─── スライム ────────────────────────────────────────────
  _drawSlime(g, cx, T) {
    const c  = this.def.color;
    const cd = this.def.colorDark;

    // Shadow
    g.beginFill(0x000000, 0.28);
    g.drawEllipse(cx + 1, T - 2, 14, 3);
    g.endFill();

    // Drip (behind main body)
    g.beginFill(cd, 0.65);
    g.drawEllipse(cx + 6, T - 5, 4, 7);
    g.endFill();
    g.beginFill(c, 0.8);
    g.drawEllipse(cx + 5, T - 6, 3, 6);
    g.endFill();

    // Top bumps (outline)
    g.beginFill(cd);
    g.drawCircle(cx - 8, 17, 5);
    g.drawCircle(cx,     13, 8);
    g.drawCircle(cx + 8, 17, 5);
    g.endFill();
    // Top bumps (fill)
    g.beginFill(c);
    g.drawCircle(cx - 8, 16, 4);
    g.drawCircle(cx,     12, 7);
    g.drawCircle(cx + 8, 16, 4);
    g.endFill();
    // Bump highlights
    g.beginFill(0xffffff, 0.22);
    g.drawCircle(cx - 9, 13, 2);
    g.drawCircle(cx - 2, 10, 2);
    g.drawCircle(cx + 6, 14, 2);
    g.endFill();

    // Main body (outline)
    g.beginFill(cd);
    g.drawEllipse(cx, 27, 16, 12);
    g.endFill();
    // Main body (fill)
    g.beginFill(c);
    g.drawEllipse(cx, 26, 15, 11);
    g.endFill();
    // Body gloss
    g.beginFill(0xffffff, 0.22);
    g.drawEllipse(cx - 5, 20, 5, 4);
    g.endFill();

    // ── 3つの目 ──────────────────────────────────────────
    // 左目
    g.beginFill(0xffffff);
    g.drawCircle(cx - 7, 25, 5);
    g.endFill();
    g.beginFill(0x1a237e);
    g.drawCircle(cx - 6, 25, 3);
    g.endFill();
    g.beginFill(0x000000);
    g.drawCircle(cx - 6, 25, 2);
    g.endFill();
    g.beginFill(0xffffff);
    g.drawCircle(cx - 8, 23, 1);
    g.endFill();

    // 中央の目（最大）
    g.beginFill(0xffffff);
    g.drawCircle(cx, 23, 7);
    g.endFill();
    g.beginFill(0xb71c1c);
    g.drawCircle(cx + 1, 23, 5);
    g.endFill();
    g.beginFill(0x000000);
    g.drawCircle(cx + 1, 23, 3);
    g.endFill();
    g.beginFill(0xffffff);
    g.drawCircle(cx - 1, 21, 1.5);
    g.endFill();

    // 右目
    g.beginFill(0xffffff);
    g.drawCircle(cx + 8, 26, 4);
    g.endFill();
    g.beginFill(0x1b5e20);
    g.drawCircle(cx + 8, 26, 2.5);
    g.endFill();
    g.beginFill(0x000000);
    g.drawCircle(cx + 8, 26, 1.5);
    g.endFill();
    g.beginFill(0xffffff);
    g.drawCircle(cx + 7, 24, 1);
    g.endFill();

    // よだれ/口
    g.beginFill(cd, 0.65);
    g.drawEllipse(cx - 3, 33, 5, 2);
    g.endFill();
  }

  // ─── ゴブリン ────────────────────────────────────────────
  _drawGoblin(g, cx, T) {
    const c  = this.def.color;
    const cd = this.def.colorDark;

    // Shadow
    g.beginFill(0x000000, 0.28);
    g.drawEllipse(cx + 1, T - 2, 11, 3);
    g.endFill();

    // ── 耳（大きなとがった耳）────────────────────────────
    // 左耳（アウトライン）
    g.beginFill(cd);
    g.drawPolygon([cx-9, 12, cx-19, 5, cx-15, 19, cx-9, 18]);
    g.endFill();
    g.beginFill(c);
    g.drawPolygon([cx-10, 13, cx-18, 6, cx-14, 18, cx-10, 17]);
    g.endFill();
    g.beginFill(0xff8a80, 0.5);
    g.drawPolygon([cx-11, 14, cx-17, 8, cx-14, 17, cx-11, 16]);
    g.endFill();
    // 右耳
    g.beginFill(cd);
    g.drawPolygon([cx+9, 12, cx+19, 5, cx+15, 19, cx+9, 18]);
    g.endFill();
    g.beginFill(c);
    g.drawPolygon([cx+10, 13, cx+18, 6, cx+14, 18, cx+10, 17]);
    g.endFill();
    g.beginFill(0xff8a80, 0.5);
    g.drawPolygon([cx+11, 14, cx+17, 8, cx+14, 17, cx+11, 16]);
    g.endFill();

    // ── こん棒（右側）────────────────────────────────────
    // 柄
    g.beginFill(0x4e342e);
    g.drawRect(cx+12, 16, 3, 20);
    g.endFill();
    g.beginFill(0x6d4c41, 0.4);
    g.drawRect(cx+12, 17, 1, 18);
    g.endFill();
    // 棍棒頭
    g.beginFill(0x3e2723);
    g.drawCircle(cx+13, 15, 7);
    g.endFill();
    g.beginFill(0x4e342e);
    g.drawCircle(cx+13, 14, 6);
    g.endFill();
    g.beginFill(0x795548, 0.4);
    g.drawCircle(cx+11, 12, 3);
    g.endFill();
    // スパイク
    g.beginFill(0x78909c);
    g.drawCircle(cx+7,  12, 2);
    g.drawCircle(cx+18, 12, 2);
    g.drawCircle(cx+13, 8,  2);
    g.drawCircle(cx+12, 20, 2);
    g.endFill();

    // ── 脚 ───────────────────────────────────────────────
    g.beginFill(cd);
    g.drawRoundedRect(cx-9, 26, 7, 12, 2);
    g.drawRoundedRect(cx+2, 26, 7, 12, 2);
    g.endFill();
    // 足
    g.beginFill(0x3e2723);
    g.drawRoundedRect(cx-10, 32, 8, 6, 2);
    g.drawRoundedRect(cx+2, 32, 8, 6, 2);
    g.endFill();

    // ── 胴体 ─────────────────────────────────────────────
    g.beginFill(cd);
    g.drawRoundedRect(cx-9, 17, 18, 11, 3);
    g.endFill();
    g.beginFill(c);
    g.drawRoundedRect(cx-8, 18, 16, 9, 2);
    g.endFill();
    // ベルト
    g.beginFill(0x5d4037);
    g.drawRect(cx-8, 25, 16, 3);
    g.endFill();
    g.beginFill(0x8d6e63);
    g.drawRect(cx-2, 25, 4, 3);
    g.endFill();

    // ── 頭 ───────────────────────────────────────────────
    g.beginFill(cd);
    g.drawRoundedRect(cx-9, 7, 18, 13, 5);
    g.endFill();
    g.beginFill(c);
    g.drawRoundedRect(cx-8, 8, 16, 11, 4);
    g.endFill();
    // 額ハイライト
    g.beginFill(0xffffff, 0.12);
    g.drawEllipse(cx-2, 10, 5, 3);
    g.endFill();

    // 眉毛（怒り、ハの字）
    g.beginFill(cd);
    g.drawPolygon([cx-8, 12, cx-3, 11, cx-3, 13, cx-8, 14]);
    g.drawPolygon([cx+3, 11, cx+8, 12, cx+8, 14, cx+3, 13]);
    g.endFill();

    // 目（オレンジ色）
    g.beginFill(0xff8f00);
    g.drawCircle(cx-4, 14, 3);
    g.drawCircle(cx+4, 14, 3);
    g.endFill();
    g.beginFill(0xe65100);
    g.drawCircle(cx-4, 14, 2);
    g.drawCircle(cx+4, 14, 2);
    g.endFill();
    g.beginFill(0x000000);
    g.drawCircle(cx-4, 14, 1);
    g.drawCircle(cx+4, 14, 1);
    g.endFill();
    g.beginFill(0xffffff);
    g.drawCircle(cx-5, 13, 0.8);
    g.drawCircle(cx+3, 13, 0.8);
    g.endFill();

    // 鼻（大きい）
    g.beginFill(cd);
    g.drawCircle(cx, 17, 3);
    g.endFill();
    g.beginFill(c);
    g.drawCircle(cx-1, 16, 2);
    g.endFill();
    // 鼻の穴
    g.beginFill(cd);
    g.drawCircle(cx-1, 18, 1);
    g.drawCircle(cx+1, 18, 1);
    g.endFill();

    // 口（開けて、牙あり）
    g.beginFill(0x0d0d1e);
    g.drawRoundedRect(cx-5, 18, 10, 4, 2);
    g.endFill();
    // 牙
    g.beginFill(0xfafafa);
    g.drawPolygon([cx-4, 18, cx-2, 18, cx-3, 22]);
    g.drawPolygon([cx+2, 18, cx+4, 18, cx+3, 22]);
    g.endFill();
  }

  // ─── スケルトン ──────────────────────────────────────────
  _drawSkeleton(g, cx, T) {
    const c  = this.def.color;
    const cd = this.def.colorDark;

    // Shadow
    g.beginFill(0x000000, 0.28);
    g.drawEllipse(cx + 1, T - 2, 10, 3);
    g.endFill();

    // ── 鎌（左側）───────────────────────────────────────
    // 柄
    g.beginFill(0x4e342e);
    g.drawRect(cx-16, 4, 3, 30);
    g.endFill();
    g.beginFill(0x6d4c41, 0.35);
    g.drawRect(cx-15, 5, 1, 28);
    g.endFill();
    // 刃（曲刃）
    g.beginFill(0x546e7a);
    g.drawPolygon([
      cx-13, 4,  cx-2, 4,  cx, 7,
      cx-13, 9,  cx-16, 14, cx-16, 7,
    ]);
    g.endFill();
    g.beginFill(0x78909c);
    g.drawPolygon([
      cx-12, 4,  cx-3, 4,  cx-1, 6,
      cx-12, 8,  cx-15, 12, cx-15, 7,
    ]);
    g.endFill();
    // 刃のエッジ
    g.beginFill(0xb0bec5, 0.7);
    g.drawRect(cx-12, 4, 10, 1);
    g.endFill();

    // ── 足の骨 ───────────────────────────────────────────
    g.beginFill(c);
    g.drawRoundedRect(cx-8, 27, 5, 12, 2);
    g.drawRoundedRect(cx+3, 27, 5, 12, 2);
    g.endFill();
    // 膝関節
    g.beginFill(cd);
    g.drawCircle(cx-5, 30, 3);
    g.drawCircle(cx+5, 30, 3);
    g.endFill();
    g.beginFill(c);
    g.drawCircle(cx-5, 30, 2);
    g.drawCircle(cx+5, 30, 2);
    g.endFill();
    // 足
    g.beginFill(c);
    g.drawRoundedRect(cx-9, 36, 7, 3, 1);
    g.drawRoundedRect(cx+2, 36, 7, 3, 1);
    g.endFill();

    // ── 脊椎 ─────────────────────────────────────────────
    g.beginFill(cd);
    g.drawRect(cx-1, 18, 3, 11);
    g.endFill();
    g.beginFill(c);
    g.drawRect(cx-0.5, 19, 2, 9);
    g.endFill();

    // ── 肋骨 ─────────────────────────────────────────────
    g.beginFill(c);
    // 左
    g.drawRoundedRect(cx-9, 19, 9, 2, 1);
    g.drawRoundedRect(cx-8, 22, 8, 2, 1);
    g.drawRoundedRect(cx-7, 25, 7, 2, 1);
    // 右
    g.drawRoundedRect(cx+1, 19, 9, 2, 1);
    g.drawRoundedRect(cx+1, 22, 8, 2, 1);
    g.drawRoundedRect(cx+1, 25, 7, 2, 1);
    g.endFill();

    // 骨盤
    g.beginFill(c);
    g.drawRoundedRect(cx-8, 27, 17, 4, 2);
    g.endFill();
    g.beginFill(cd, 0.4);
    g.drawRoundedRect(cx-5, 28, 11, 2, 1);
    g.endFill();

    // ── 頭蓋骨 ───────────────────────────────────────────
    // アウトライン
    g.beginFill(cd);
    g.drawRoundedRect(cx-9, 5, 18, 14, 6);
    g.endFill();
    // メイン
    g.beginFill(c);
    g.drawRoundedRect(cx-8, 6, 16, 12, 5);
    g.endFill();
    // ハイライト
    g.beginFill(0xffffff, 0.38);
    g.drawEllipse(cx-3, 8, 4, 3);
    g.endFill();

    // 眼窩（空洞）
    g.beginFill(0x030308);
    g.drawCircle(cx-4, 13, 4);
    g.drawCircle(cx+4, 13, 4);
    g.endFill();
    // 紫の光（眼の発光）
    g.beginFill(0x7b1fa2, 0.55);
    g.drawCircle(cx-4, 13, 3);
    g.drawCircle(cx+4, 13, 3);
    g.endFill();
    g.beginFill(0xce93d8, 0.75);
    g.drawCircle(cx-4, 13, 1.5);
    g.drawCircle(cx+4, 13, 1.5);
    g.endFill();

    // 鼻腔
    g.beginFill(0x0a0008);
    g.drawPolygon([cx, 16, cx-2, 19, cx+2, 19]);
    g.endFill();

    // 顎
    g.beginFill(cd);
    g.drawRoundedRect(cx-7, 18, 14, 5, 3);
    g.endFill();
    g.beginFill(c);
    g.drawRoundedRect(cx-6, 19, 12, 3, 2);
    g.endFill();
    // 歯
    g.beginFill(cd, 0.45);
    g.drawRect(cx-5, 19, 2, 3);
    g.drawRect(cx-2, 19, 2, 3);
    g.drawRect(cx+1, 19, 2, 3);
    g.drawRect(cx+4, 19, 2, 3);
    g.endFill();
  }

  // ─── HP バー ──────────────────────────────────────────────
  _drawHpBar() {
    const barW = TILE_SIZE - 8;
    const barH = 5;
    const bx = 4, by = 1;

    this._hpBarBg.clear();
    this._hpBarBg.beginFill(0x000000, 0.65);
    this._hpBarBg.drawRoundedRect(bx, by, barW, barH, 2);
    this._hpBarBg.endFill();

    this._hpBarFill.clear();
    const pct = Math.max(0, this.hp / this.maxHp);
    const col = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;
    this._hpBarFill.beginFill(col);
    this._hpBarFill.drawRoundedRect(bx, by, Math.max(2, Math.floor(barW * pct)), barH, 2);
    this._hpBarFill.endFill();
  }

  /** ダメージを受けたときの白フラッシュ */
  flash() {
    this.container.tint = 0xff5555;
    setTimeout(() => {
      if (this.container && !this.container.destroyed) this.container.tint = 0xffffff;
    }, 160);
  }

  move(nx, ny) {
    this.gridX = nx;
    this.gridY = ny;
    this._updatePosition();
  }

  takeDamage(dmg) {
    this.hp = Math.max(0, this.hp - dmg);
    this._drawHpBar();
    this.flash();
    if (this.hp <= 0) {
      this.alive = false;
      this.destroy();
    }
  }

  _updatePosition() {
    this.container.x = this.gridX * TILE_SIZE;
    this.container.y = this.gridY * TILE_SIZE;
  }

  destroy() {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
