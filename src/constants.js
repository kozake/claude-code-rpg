export const TILE_SIZE = 40;
export const MAP_COLS = 20;
export const MAP_ROWS = 14;
export const SCREEN_WIDTH = MAP_COLS * TILE_SIZE;   // 800
export const MAP_HEIGHT_PX = MAP_ROWS * TILE_SIZE;  // 560
export const UI_HEIGHT = 120;
export const SCREEN_HEIGHT = MAP_HEIGHT_PX + UI_HEIGHT; // 680

export const TILE = {
  FLOOR: 0,
  WALL: 1,
  STAIRS: 2,
};

export const COLOR = {
  BG: 0x0a0a1a,
  WALL: 0x3d3d5c,
  WALL_TOP: 0x5c5c8a,
  FLOOR: 0x1a1a2e,
  FLOOR_ALT: 0x16213e,
  STAIRS: 0xe2c05a,
  STAIRS_GLOW: 0xffd54f,
  PLAYER: 0x4fc3f7,
  PLAYER_DARK: 0x0288d1,
  UI_BG: 0x0d0d1a,
  HP_BG: 0x222233,
  HP_GREEN: 0x4caf50,
  HP_YELLOW: 0xffeb3b,
  HP_RED: 0xf44336,
  XP_BAR: 0x7c4dff,
  WHITE: 0xffffff,
  GRAY: 0xb0bec5,
  YELLOW: 0xffd54f,
  CYAN: 0x4fc3f7,
  GREEN: 0x69f0ae,
  RED: 0xff5252,
  PURPLE: 0xce93d8,
  ORANGE: 0xffb74d,
};

export const ENEMY_DEFS = {
  slime: {
    name: 'スライム',
    color: 0x66bb6a,
    colorDark: 0x388e3c,
    maxHp: 8,
    attack: 3,
    defense: 0,
    xp: 5,
  },
  goblin: {
    name: 'ゴブリン',
    color: 0xffb74d,
    colorDark: 0xe65100,
    maxHp: 14,
    attack: 5,
    defense: 1,
    xp: 10,
  },
  skeleton: {
    name: 'スケルトン',
    color: 0xeeeeee,
    colorDark: 0x9e9e9e,
    maxHp: 20,
    attack: 7,
    defense: 2,
    xp: 15,
  },
};

export const ENEMY_KEYS = Object.keys(ENEMY_DEFS);

export const MAX_FLOORS = 5;
