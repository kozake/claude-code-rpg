export const TILE_SIZE = 40;
export const MAP_COLS = 20;
export const MAP_ROWS = 16;
export const SCREEN_WIDTH = MAP_COLS * TILE_SIZE;   // 800
export const MAP_HEIGHT_PX = MAP_ROWS * TILE_SIZE;  // 640
export const UI_HEIGHT = 160;
export const SCREEN_HEIGHT = MAP_HEIGHT_PX + UI_HEIGHT; // 800

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
  orc: {
    name: 'オーク',
    color: 0x8bc34a,
    colorDark: 0x558b2f,
    maxHp: 30,
    attack: 9,
    defense: 3,
    xp: 22,
  },
  darkKnight: {
    name: 'ダークナイト',
    color: 0xab47bc,
    colorDark: 0x6a1b9a,
    maxHp: 45,
    attack: 14,
    defense: 5,
    xp: 38,
  },
};

export const ENEMY_KEYS = Object.keys(ENEMY_DEFS);

/** ボス専用定義（ランダムスポーンには含まない） */
export const BOSS_DEF = {
  name: 'ダークロード',
  color: 0xef5350,
  colorDark: 0x7f0000,
  maxHp: 200,
  attack: 24,
  defense: 8,
  xp: 500,
  isBoss: true,
};

export const MAX_FLOORS = 10;

/** アイテム定義
 * minFloor が設定された武器・防具はゲーム中1回しか出現しない（重複なし）。
 * minFloor = その武器が出現し始める最低階層。
 */
export const ITEM_DEFS = {
  potion: {
    name: 'ポーション',
    icon: 'potion',
    color: 0x69f0ae,
    colorDark: 0x00c853,
    effect: 'heal',
    value: 20,
    desc: 'HP +20 回復',
  },
  elixir: {
    name: 'エリクサー',
    icon: 'potion',
    color: 0x40c4ff,
    colorDark: 0x0091ea,
    effect: 'healFull',
    value: 0,
    desc: 'HP 全回復',
  },

  // ── 攻撃武器（tier 1→3） ─────────────────────────────────
  ironSword: {
    name: '鉄の剣',
    icon: 'sword',
    color: 0xffb74d,
    colorDark: 0xe65100,
    effect: 'attack',
    value: 4,
    desc: 'ATK +4',
    minFloor: 1,   // 1階〜
  },
  flameSword: {
    name: '炎の剣',
    icon: 'sword',
    color: 0xff5722,
    colorDark: 0xb71c1c,
    effect: 'attack',
    value: 8,
    desc: 'ATK +8',
    minFloor: 3,   // 3階〜
  },
  dragonSword: {
    name: '龍牙の剣',
    icon: 'sword',
    color: 0xea80fc,
    colorDark: 0x6a0080,
    effect: 'attack',
    value: 15,
    desc: 'ATK +15',
    minFloor: 6,   // 6階〜
  },

  // ── 防御装備（tier 1→3） ─────────────────────────────────
  steelShield: {
    name: '鋼の盾',
    icon: 'shield',
    color: 0xb0bec5,
    colorDark: 0x546e7a,
    effect: 'defense',
    value: 3,
    desc: 'DEF +3',
    minFloor: 1,   // 1階〜
  },
  mithrilArmor: {
    name: 'ミスリルの鎧',
    icon: 'shield',
    color: 0x64b5f6,
    colorDark: 0x1565c0,
    effect: 'defenseHp',
    value: 5,
    hpValue: 15,
    desc: 'DEF +5 / MaxHP +15',
    minFloor: 4,   // 4階〜
  },
  crystalArmor: {
    name: 'クリスタルの鎧',
    icon: 'shield',
    color: 0x80deea,
    colorDark: 0x00838f,
    effect: 'defenseHp',
    value: 8,
    hpValue: 20,
    desc: 'DEF +8 / MaxHP +20',
    minFloor: 7,   // 7階〜
  },
};
