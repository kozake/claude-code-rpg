import { Container } from 'pixi.js';
import { Dungeon } from './Dungeon.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { UI } from './UI.js';
import { AudioManager } from './Audio.js';
import {
  MAP_COLS, MAP_ROWS, TILE, TILE_SIZE, ENEMY_DEFS, BOSS_DEF, MAX_FLOORS, COLOR
} from './constants.js';

export class Game {
  constructor(app) {
    this.app = app;
    this.state = 'playing'; // 'playing' | 'gameover' | 'win'
    this.floor = 1;

    this.worldContainer = new Container();
    app.stage.addChild(this.worldContainer);

    this.dungeon = new Dungeon(this.worldContainer);
    this.player = null;
    this.enemies = [];
    this.stairs = null;
    this.ui = new UI(app);
    this.audio = new AudioManager();

    this._initLevel();
    this._bindKeys();

    // 浮遊アニメーション
    this._animTime = 0;
    app.ticker.add((delta) => {
      this._animTime += delta * 0.03;
      this._tickAnimation();
    });
  }

  _tickAnimation() {
    if (this.player) {
      const bob = Math.sin(this._animTime * 2.8) * 1.8;
      this.player.container.y = this.player.gridY * TILE_SIZE + bob;
    }
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const phase = enemy.gridX * 0.9 + enemy.gridY * 0.4;
      const bob = Math.sin(this._animTime * 2.2 + phase) * 1.4;
      enemy.container.y = enemy.gridY * TILE_SIZE + bob;
    }
  }

  _initLevel() {
    this.dungeon.clear();
    this.enemies.forEach(e => { if (e.alive) e.destroy(); });
    this.enemies = [];

    const { map, rooms } = this.dungeon.generate();
    this.map = map;

    const startRoom = rooms[0];
    const px = Math.floor(startRoom.x + startRoom.w / 2);
    const py = Math.floor(startRoom.y + startRoom.h / 2);

    if (!this.player) {
      this.player = new Player(this.worldContainer, px, py);
    } else {
      this.player.setPosition(px, py);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.floor(this.player.maxHp * 0.3));
    }

    const isBossFloor = this.floor >= MAX_FLOORS;
    // ボス階は最終部屋をボス用に空けておく
    const spawnRooms = isBossFloor ? rooms.length - 1 : rooms.length;
    const enemyCountBase = 2 + Math.floor(this.floor / 2);

    for (let i = 1; i < spawnRooms; i++) {
      const room = rooms[i];
      const count = enemyCountBase + Math.floor(Math.random() * 3);
      for (let j = 0; j < count; j++) {
        const defKey = this._pickEnemyType();
        const scaledDef = this._scaleEnemy(ENEMY_DEFS[defKey]);
        const ex = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
        const ey = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
        if (ex === px && ey === py) continue;
        this.enemies.push(new Enemy(this.worldContainer, ex, ey, scaledDef));
      }
    }

    if (isBossFloor) {
      // ボスを最終部屋の中央に配置
      const bossRoom = rooms[rooms.length - 1];
      const bx = Math.floor(bossRoom.x + bossRoom.w / 2);
      const by = Math.floor(bossRoom.y + bossRoom.h / 2);
      this.enemies.push(new Enemy(this.worldContainer, bx, by, { ...BOSS_DEF }));
      this.ui.update(this.player, this.floor);
      this.ui.addMessage(`⚠ 最終階！ダークロードが待ち構えている！`, COLOR.RED);
    } else {
      const lastRoom = rooms[rooms.length - 1];
      const sx = Math.floor(lastRoom.x + lastRoom.w / 2);
      const sy = Math.floor(lastRoom.y + lastRoom.h / 2);
      this.stairs = { x: sx, y: sy };
      this.map[sy][sx] = TILE.STAIRS;
      this.dungeon.drawStairs(sx, sy);
      this.ui.update(this.player, this.floor);
      this.ui.addMessage(`${this.floor}階へようこそ！`, COLOR.YELLOW);
    }
  }

  _pickEnemyType() {
    const r = Math.random();
    if (this.floor <= 2) return r < 0.65 ? 'slime' : 'goblin';
    if (this.floor <= 4) return r < 0.25 ? 'slime' : r < 0.6 ? 'goblin' : r < 0.85 ? 'skeleton' : 'orc';
    if (this.floor <= 6) return r < 0.15 ? 'goblin' : r < 0.45 ? 'skeleton' : r < 0.8 ? 'orc' : 'darkKnight';
    if (this.floor <= 8) return r < 0.2 ? 'skeleton' : r < 0.55 ? 'orc' : 'darkKnight';
    // floor 9（ボス前）: ダークナイト中心
    return r < 0.3 ? 'orc' : 'darkKnight';
  }

  _scaleEnemy(def) {
    // 10階構成なので係数を0.12に抑えてバランス調整
    const scale = 1 + (this.floor - 1) * 0.12;
    return {
      ...def,
      maxHp:  Math.floor(def.maxHp  * scale),
      attack: Math.floor(def.attack * scale),
      xp:     Math.floor(def.xp     * scale),
    };
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      // ミュート切替
      if (e.key === 'm' || e.key === 'M') {
        const muted = this.audio.toggleMute();
        this.ui.addMessage(muted ? '🔇 ミュート' : '🔊 サウンドON', COLOR.GRAY);
        return;
      }

      if (this.state !== 'playing') return;

      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': dy = -1; break;
        case 'ArrowDown':  case 's': case 'S': dy =  1; break;
        case 'ArrowLeft':  case 'a': case 'A': dx = -1; break;
        case 'ArrowRight': case 'd': case 'D': dx =  1; break;
        default: return;
      }
      e.preventDefault();
      this.move(dx, dy);
    });
  }

  move(dx, dy) {
    // 初回入力でオーディオを起動（ブラウザ自動再生ポリシー対策）
    this.audio.start();
    this.audio.resume();

    if (this.state !== 'playing') return;

    const nx = this.player.gridX + dx;
    const ny = this.player.gridY + dy;

    if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) return;
    if (this.map[ny][nx] === TILE.WALL) return;

    const enemy = this.enemies.find(e => e.alive && e.gridX === nx && e.gridY === ny);
    if (enemy) {
      this._playerAttack(enemy);
    } else {
      this.player.move(nx, ny);

      if (this.map[ny][nx] === TILE.STAIRS) {
        this.audio.playStairs();
        this.floor++;
        this._initLevel();
        return;
      }
    }

    this._enemyTurns();
    this.ui.update(this.player, this.floor);

    if (this.player.hp <= 0) {
      this.state = 'gameover';
      this.audio.stopBGM();
      this.audio.playGameOver();
      this.ui.showMessage('ゲームオーバー\n勇者は力尽きた…', COLOR.RED);
    }
  }

  _playerAttack(enemy) {
    const dmg = Math.max(1, this.player.attack - enemy.def.defense);
    enemy.takeDamage(dmg);
    this.audio.playAttack();
    this.ui.addMessage(`${enemy.def.name}に ${dmg} ダメージ！`, COLOR.CYAN);

    if (!enemy.alive) {
      const gainedXp = enemy.def.xp;
      this.enemies = this.enemies.filter(e => e !== enemy);
      this.player.xp += gainedXp;
      this.audio.playEnemyDie();
      this.ui.addMessage(`${enemy.def.name}を倒した！ XP +${gainedXp}`, COLOR.YELLOW);

      // ボス撃破 → ゲームクリア
      if (enemy.def.isBoss) {
        this.state = 'win';
        this.audio.stopBGM();
        this.audio.playWin();
        this.ui.showMessage('ダークロードを倒した！\nゲームクリア！', COLOR.GREEN);
        return;
      }

      if (this.player.xp >= this.player.xpToNext) {
        this.player.levelUp();
        this.audio.playLevelUp();
        this.ui.addMessage(`レベルアップ！ Lv.${this.player.level}`, COLOR.PURPLE);
      }
    }
  }

  _enemyTurns() {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const dx   = this.player.gridX - enemy.gridX;
      const dy   = this.player.gridY - enemy.gridY;
      const dist = Math.abs(dx) + Math.abs(dy);

      if (dist === 1) {
        const dmg = Math.max(1, enemy.def.attack - this.player.defense);
        this.player.hp -= dmg;
        this.player.flash();
        this.audio.playHit();
        this.ui.addMessage(`${enemy.def.name}の攻撃！ ${dmg} ダメージ`, COLOR.RED);
      } else if (dist <= 8) {
        this._moveEnemyToward(enemy, dx, dy);
      } else {
        this._moveEnemyRandom(enemy);
      }
    }
  }

  _moveEnemyToward(enemy, dx, dy) {
    const moves = Math.abs(dx) >= Math.abs(dy)
      ? [{ dx: Math.sign(dx), dy: 0 }, { dx: 0, dy: Math.sign(dy) }]
      : [{ dx: 0, dy: Math.sign(dy) }, { dx: Math.sign(dx), dy: 0 }];
    moves.push({ dx: -Math.sign(dx), dy: 0 }, { dx: 0, dy: -Math.sign(dy) });
    for (const m of moves) if (this._tryMoveEnemy(enemy, m.dx, m.dy)) break;
  }

  _moveEnemyRandom(enemy) {
    const dirs = [{ dx:0,dy:-1 },{ dx:0,dy:1 },{ dx:-1,dy:0 },{ dx:1,dy:0 }];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const d of dirs) if (this._tryMoveEnemy(enemy, d.dx, d.dy)) break;
  }

  _tryMoveEnemy(enemy, dx, dy) {
    const nx = enemy.gridX + dx;
    const ny = enemy.gridY + dy;
    if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) return false;
    if (this.map[ny][nx] === TILE.WALL) return false;
    if (this.player.gridX === nx && this.player.gridY === ny) return false;
    if (this.enemies.some(e => e !== enemy && e.alive && e.gridX === nx && e.gridY === ny)) return false;
    enemy.move(nx, ny);
    return true;
  }
}
