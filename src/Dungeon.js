import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, TILE, COLOR } from './constants.js';

export class Dungeon {
  constructor(parent) {
    this.container = new Container();
    parent.addChild(this.container);
    this.map = [];
    this.rooms = [];
  }

  generate() {
    // Fill with walls
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

    // Ensure at least 2 rooms
    if (this.rooms.length < 2) {
      this.rooms = [];
      this._carveRoom({ x: 1, y: 1, w: 6, h: 6 });
      this.rooms.push({ x: 1, y: 1, w: 6, h: 6 });
      this._carveRoom({ x: 12, y: 7, w: 6, h: 6 });
      this._connectRooms(this.rooms[0], { x: 12, y: 7, w: 6, h: 6 });
      this.rooms.push({ x: 12, y: 7, w: 6, h: 6 });
    }

    this._render();
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

    // Horizontal first, then vertical
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
    const g = new Graphics();

    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;
        const tile = this.map[ty][tx];

        if (tile === TILE.WALL) {
          // Wall base
          g.beginFill(COLOR.WALL);
          g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
          g.endFill();
          // Wall top highlight
          g.beginFill(COLOR.WALL_TOP);
          g.drawRect(px, py, TILE_SIZE, 4);
          g.drawRect(px, py, 4, TILE_SIZE);
          g.endFill();
        } else {
          // Floor (checkerboard subtle effect)
          const floorColor = (tx + ty) % 2 === 0 ? COLOR.FLOOR : COLOR.FLOOR_ALT;
          g.beginFill(floorColor);
          g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
          g.endFill();
        }
      }
    }

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
  }
}
