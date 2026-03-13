import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE } from './constants.js';

export class Item {
  constructor(parent, gridX, gridY, def) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.def = def;

    this.container = new Container();
    parent.addChild(this.container);
    this._draw();
    this._updatePosition();
  }

  _draw() {
    const g = new Graphics();
    const T = TILE_SIZE; // 40
    const cx = T / 2;   // 20
    const cy = T / 2;   // 20

    // 光のオーラ（背景グロー）
    g.beginFill(this.def.color, 0.18);
    g.drawCircle(cx, cy, 17);
    g.endFill();
    g.beginFill(this.def.color, 0.10);
    g.drawCircle(cx, cy, 14);
    g.endFill();

    if (this.def.icon === 'potion') {
      this._drawPotion(g, cx, cy);
    } else if (this.def.icon === 'sword') {
      this._drawSword(g, cx, cy);
    } else if (this.def.icon === 'shield') {
      this._drawShield(g, cx, cy);
    }

    this.container.addChild(g);
  }

  _drawPotion(g, cx, cy) {
    const c  = this.def.color;
    const cd = this.def.colorDark;

    // ビンの下部（丸い胴体）
    g.beginFill(cd, 0.85);
    g.drawEllipse(cx, cy + 4, 9, 10);
    g.endFill();

    g.beginFill(c, 0.90);
    g.drawEllipse(cx, cy + 3, 8, 9);
    g.endFill();

    // 液体のハイライト
    g.beginFill(0xffffff, 0.40);
    g.drawEllipse(cx - 3, cy, 3, 4);
    g.endFill();

    // ビンの首
    g.beginFill(cd);
    g.drawRoundedRect(cx - 3, cy - 8, 6, 7, 1);
    g.endFill();
    g.beginFill(c, 0.75);
    g.drawRoundedRect(cx - 2, cy - 7, 4, 5, 1);
    g.endFill();

    // コルク栓
    g.beginFill(0xd7b07a);
    g.drawRoundedRect(cx - 3, cy - 13, 6, 6, 2);
    g.endFill();
    g.beginFill(0xf5d9a0, 0.6);
    g.drawRect(cx - 2, cy - 12, 2, 3);
    g.endFill();

    // 光の粒
    g.beginFill(c, 0.65);
    g.drawCircle(cx + 5, cy - 4, 1.5);
    g.drawCircle(cx - 6, cy + 2, 1.0);
    g.endFill();
  }

  _drawSword(g, cx, cy) {
    const c  = this.def.color;
    const cd = this.def.colorDark;

    // 刃先グロー
    g.beginFill(c, 0.60);
    g.drawCircle(cx, cy - 13, 3);
    g.endFill();

    // 刀身（斜め45°に傾けた剣）
    g.beginFill(0xb0bec5);
    g.drawPolygon([
      cx - 2, cy - 12,
      cx + 2, cy - 12,
      cx + 3, cy + 4,
      cx - 3, cy + 4,
    ]);
    g.endFill();

    // 刀身ハイライト
    g.beginFill(0xeceff1);
    g.drawRect(cx - 1, cy - 11, 1.5, 14);
    g.endFill();

    // 刃先の光
    g.beginFill(c, 0.50);
    g.drawRect(cx - 2, cy - 12, 4, 5);
    g.endFill();

    // ガード（鍔）
    g.beginFill(cd);
    g.drawRoundedRect(cx - 7, cy + 3, 14, 4, 2);
    g.endFill();
    g.beginFill(c, 0.55);
    g.drawRect(cx - 5, cy + 4, 9, 1.5);
    g.endFill();

    // グリップ
    g.beginFill(0x5d4037);
    g.drawRoundedRect(cx - 2, cy + 7, 4, 7, 1);
    g.endFill();
    g.beginFill(0x795548, 0.5);
    g.drawRect(cx - 1, cy + 8, 1.5, 5);
    g.endFill();

    // ポンメル
    g.beginFill(cd);
    g.drawCircle(cx, cy + 15, 3);
    g.endFill();
    g.beginFill(c, 0.5);
    g.drawCircle(cx - 1, cy + 14, 1.5);
    g.endFill();
  }

  _drawShield(g, cx, cy) {
    const c  = this.def.color;
    const cd = this.def.colorDark;

    // シールド外形（影）
    g.beginFill(cd, 0.85);
    g.drawPolygon([
      cx - 10, cy - 12,
      cx + 10, cy - 12,
      cx + 10, cy + 4,
      cx,      cy + 14,
      cx - 10, cy + 4,
    ]);
    g.endFill();

    // シールド本体
    g.beginFill(c, 0.90);
    g.drawPolygon([
      cx - 9,  cy - 11,
      cx + 9,  cy - 11,
      cx + 9,  cy + 3,
      cx,      cy + 12,
      cx - 9,  cy + 3,
    ]);
    g.endFill();

    // ハイライト
    g.beginFill(0xffffff, 0.35);
    g.drawPolygon([
      cx - 8, cy - 10,
      cx - 1, cy - 10,
      cx - 1, cy + 1,
      cx - 8, cy - 2,
    ]);
    g.endFill();

    // 中央の紋章（十字）
    g.beginFill(cd);
    g.drawRect(cx - 1.5, cy - 7, 3, 12);
    g.drawRect(cx - 6, cy - 3, 12, 3);
    g.endFill();
    g.beginFill(0xffffff, 0.40);
    g.drawRect(cx - 0.5, cy - 6, 1, 5);
    g.endFill();
  }

  _updatePosition() {
    this.container.x = this.gridX * TILE_SIZE;
    this.container.y = this.gridY * TILE_SIZE;
  }

  destroy() {
    this.container.parent?.removeChild(this.container);
    this.container.destroy();
  }
}
