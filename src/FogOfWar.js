import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from './constants.js';

const VISION_RADIUS = 5;    // 完全に見える範囲（タイル数）
const FADE_RADIUS   = 7;    // ここまでは薄く見える

export class FogOfWar {
  constructor(parent) {
    this.container = new Container();
    parent.addChild(this.container);

    // 「訪問済み」マップ
    this._visited = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(false));

    this._gfx = new Graphics();
    this.container.addChild(this._gfx);
  }

  /** プレイヤー位置が変わるたびに呼ぶ */
  update(playerGridX, playerGridY) {
    // 視野内のタイルを訪問済みにする
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const dist = Math.sqrt(
          (tx - playerGridX) ** 2 + (ty - playerGridY) ** 2
        );
        if (dist <= FADE_RADIUS) {
          this._visited[ty][tx] = true;
        }
      }
    }
    this._render(playerGridX, playerGridY);
  }

  _render(px, py) {
    this._gfx.clear();

    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const dist = Math.sqrt((tx - px) ** 2 + (ty - py) ** 2);
        let alpha;

        if (dist <= VISION_RADIUS) {
          // 完全に見える → 霧なし
          alpha = 0;
        } else if (dist <= FADE_RADIUS) {
          // フェード領域
          const t = (dist - VISION_RADIUS) / (FADE_RADIUS - VISION_RADIUS);
          alpha = t * 0.75;
        } else if (this._visited[ty][tx]) {
          // 訪問済みだが現在見えない → 薄い霧
          alpha = 0.78;
        } else {
          // 未訪問 → 真っ暗
          alpha = 0.97;
        }

        if (alpha <= 0) continue;

        this._gfx.beginFill(0x000000, alpha);
        this._gfx.drawRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this._gfx.endFill();
      }
    }
  }

  reset() {
    this._visited = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(false));
    this._gfx.clear();
  }
}
