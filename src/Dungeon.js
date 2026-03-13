import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, TILE, COLOR } from './constants.js';

export class Dungeon {
  constructor(parent) {
    this.container = new Container();
    parent.addChild(this.container);
    this.map = [];
    this.rooms = [];
    this._torchGraphics = [];
    this._torchTime = 0;
  }

  generate() {
    this.map = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(TILE.WALL));
    this.rooms = [];
    const maxRooms = 10;

    for (let attempt = 0; attempt < 200 && this.rooms.length < maxRooms; attempt++) {
      const w = 4 + Math.floor(Math.random() * 4);
      const h = 4 + Math.floor(Math.random() * 4);
      const x = 1 + Math.floor(Math.random() * (MAP_COLS - w - 2));
      const y = 1 + Math.floor(Math.random() * (MAP_ROWS - h - 2));

      const newRoom = { x, y, w, h };
      const overlap = this.rooms.some(r =>
        newRoom.x < r.x + r.w + 1 &&
        newRoom.x + newRoom.w + 1 > r.x &&
        newRoom.y < r.y + r.h + 1 &&
        newRoom.y + newRoom.h + 1 > r.y
      );

      if (!overlap) {
        this._carveRoom(newRoom);
        if (this.rooms.length > 0) {
          this._connectRooms(this.rooms[this.rooms.length - 1], newRoom);
        }
        this.rooms.push(newRoom);
      }
    }

    if (this.rooms.length < 2) {
      this.rooms = [];
      this._carveRoom({ x: 1, y: 1, w: 6, h: 6 });
      this.rooms.push({ x: 1, y: 1, w: 6, h: 6 });
      this._carveRoom({ x: 12, y: 7, w: 6, h: 6 });
      this._connectRooms(this.rooms[0], { x: 12, y: 7, w: 6, h: 6 });
      this.rooms.push({ x: 12, y: 7, w: 6, h: 6 });
    }

    this._render();
    this._placeDecorations();
    return { map: this.map, rooms: this.rooms };
  }

  _carveRoom(room) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        this.map[y][x] = TILE.FLOOR;
      }
    }
  }

  _connectRooms(a, b) {
    const ax = Math.floor(a.x + a.w / 2);
    const ay = Math.floor(a.y + a.h / 2);
    const bx = Math.floor(b.x + b.w / 2);
    const by = Math.floor(b.y + b.h / 2);

    let x = ax;
    while (x !== bx) {
      this.map[ay][x] = TILE.FLOOR;
      x += x < bx ? 1 : -1;
    }
    let y = ay;
    while (y !== by) {
      this.map[y][bx] = TILE.FLOOR;
      y += y < by ? 1 : -1;
    }
  }

  _render() {
    this.container.removeChildren();
    this._torchGraphics = [];
    const g = new Graphics();

    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;
        const tile = this.map[ty][tx];

        if (tile === TILE.WALL) {
          // 壁ベース
          g.beginFill(COLOR.WALL);
          g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
          g.endFill();
          // 壁の上面ハイライト
          g.beginFill(COLOR.WALL_TOP);
          g.drawRect(px, py, TILE_SIZE, 4);
          g.drawRect(px, py, 4, TILE_SIZE);
          g.endFill();
          // 壁の角シャドウ
          g.beginFill(0x000000, 0.15);
          g.drawRect(px + TILE_SIZE - 3, py, 3, TILE_SIZE);
          g.drawRect(px, py + TILE_SIZE - 3, TILE_SIZE, 3);
          g.endFill();
        } else {
          // フロア（微妙なチェッカー）
          const floorColor = (tx + ty) % 2 === 0 ? COLOR.FLOOR : COLOR.FLOOR_ALT;
          g.beginFill(floorColor);
          g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
          g.endFill();
          // フロアタイルのラインを微かに
          g.beginFill(0x000000, 0.08);
          g.drawRect(px, py, TILE_SIZE, 1);
          g.drawRect(px, py, 1, TILE_SIZE);
          g.endFill();
        }
      }
    }

    this.container.addChild(g);
  }

  _placeDecorations() {
    // 各部屋に装飾を配置（スタート部屋以外）
    for (let ri = 1; ri < this.rooms.length; ri++) {
      const room = this.rooms[ri];
      // 松明を部屋の壁際に配置（各部屋に1〜2個）
      const torchCount = 1 + (Math.random() < 0.5 ? 1 : 0);
      for (let t = 0; t < torchCount; t++) {
        // 壁沿いのフロアタイルを選ぶ
        const side = Math.floor(Math.random() * 4);
        let tx, ty;
        if (side === 0) { tx = room.x + 1 + Math.floor(Math.random() * (room.w - 2)); ty = room.y; }
        else if (side === 1) { tx = room.x + room.w - 1; ty = room.y + 1 + Math.floor(Math.random() * (room.h - 2)); }
        else if (side === 2) { tx = room.x + 1 + Math.floor(Math.random() * (room.w - 2)); ty = room.y + room.h - 1; }
        else { tx = room.x; ty = room.y + 1 + Math.floor(Math.random() * (room.h - 2)); }

        if (this.map[ty] && this.map[ty][tx] === TILE.WALL) {
          this._drawTorch(tx, ty);
        }
      }

      // 骸骨/瓦礫の装飾（コーナー）
      if (Math.random() < 0.4) {
        const dx = Math.random() < 0.5 ? 0 : room.w - 1;
        const dy = Math.random() < 0.5 ? 0 : room.h - 1;
        const cx = room.x + dx;
        const cy = room.y + dy;
        if (this.map[cy] && this.map[cy][cx] === TILE.FLOOR) {
          this._drawSkullDecor(cx, cy);
        }
      }
    }
  }

  _drawTorch(tx, ty) {
    const g = new Graphics();
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;

    // 松明の柄
    g.beginFill(0x5d4037);
    g.drawRect(cx - 1, cy + 2, 3, 10);
    g.endFill();

    // 松明の頭
    g.beginFill(0x3e2723);
    g.drawRoundedRect(cx - 3, cy - 4, 7, 8, 2);
    g.endFill();
    g.beginFill(0x6d4c41);
    g.drawRoundedRect(cx - 2, cy - 3, 5, 6, 1);
    g.endFill();

    // 炎（ベース）
    g.beginFill(0xff6f00, 0.9);
    g.drawPolygon([cx - 4, cy - 4, cx + 4, cy - 4, cx + 2, cy - 14, cx, cy - 16, cx - 2, cy - 14]);
    g.endFill();
    // 炎（明るい中心）
    g.beginFill(0xffd54f, 0.85);
    g.drawPolygon([cx - 2, cy - 5, cx + 2, cy - 5, cx + 1, cy - 12, cx, cy - 14, cx - 1, cy - 12]);
    g.endFill();
    // 炎（白い芯）
    g.beginFill(0xffffff, 0.5);
    g.drawPolygon([cx - 1, cy - 6, cx + 1, cy - 6, cx, cy - 10]);
    g.endFill();

    // 光の輪（淡いオーレンジ）
    g.beginFill(0xff9800, 0.08);
    g.drawCircle(cx, cy - 8, 14);
    g.endFill();

    this.container.addChild(g);
    this._torchGraphics.push({ g, cx, cy, baseY: cy });
  }

  _drawSkullDecor(tx, ty) {
    const g = new Graphics();
    const px = tx * TILE_SIZE + TILE_SIZE / 2;
    const py = ty * TILE_SIZE + TILE_SIZE - 8;

    // 骸骨の頭（小さい）
    g.beginFill(0x9e9e9e);
    g.drawCircle(px, py - 4, 5);
    g.endFill();
    g.beginFill(0xbdbdbd);
    g.drawCircle(px - 1, py - 5, 4);
    g.endFill();
    // 目の穴
    g.beginFill(0x030308);
    g.drawCircle(px - 2, py - 5, 1.5);
    g.drawCircle(px + 2, py - 5, 1.5);
    g.endFill();
    // 骨（交差）
    g.beginFill(0x9e9e9e);
    g.drawPolygon([px - 7, py + 2, px - 5, py, px + 5, py + 4, px + 7, py + 2]);
    g.drawPolygon([px + 7, py, px + 5, py + 2, px - 5, py + 2, px - 7, py]);
    g.endFill();

    this.container.addChild(g);
  }

  drawStairs(tx, ty) {
    const g = new Graphics();
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;

    // Stairs glow background
    g.beginFill(COLOR.STAIRS_GLOW, 0.3);
    g.drawRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    g.endFill();

    // 光の輪
    g.beginFill(0xffd54f, 0.08);
    g.drawCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE * 0.9);
    g.endFill();

    // Stair steps
    g.beginFill(COLOR.STAIRS);
    const steps = 4;
    const stepH = Math.floor((TILE_SIZE - 8) / steps);
    for (let i = 0; i < steps; i++) {
      const sw = TILE_SIZE - 8 - i * 6;
      const sx = px + 4 + i * 3;
      const sy = py + 4 + i * stepH;
      g.drawRect(sx, sy, sw, stepH - 1);
    }
    g.endFill();

    this.container.addChild(g);
  }

  isWalkable(tx, ty) {
    if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) return false;
    return this.map[ty][tx] !== TILE.WALL;
  }

  clear() {
    this.container.removeChildren();
    this.map = [];
    this.rooms = [];
    this._torchGraphics = [];
  }
}
