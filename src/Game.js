import { Container } from 'pixi.js';
import { Dungeon } from './Dungeon.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Item } from './Item.js';
import { UI } from './UI.js';
import { AudioManager } from './Audio.js';
import { BattleEffects } from './BattleEffects.js';
import { FogOfWar } from './FogOfWar.js';
import {
  MAP_COLS, MAP_ROWS, TILE, TILE_SIZE, ENEMY_DEFS, BOSS_DEF, MAX_FLOORS, COLOR, ITEM_DEFS
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
    this.items = [];
    this.stairs = null;
    this.ui = new UI(app);
    this.audio = new AudioManager();
    this.fog = new FogOfWar(this.worldContainer);
    // ゲーム中に一度でも出現した武器/防具のキーを記録（重複出現防止）
    this._seenWeapons = new Set();

    this._initLevel();
    this._bindKeys();

    // バトルエフェクト（_initLevel後・fog後に追加してエフェクトが最前面に来るようにする）
    this.effects = new BattleEffects(this.worldContainer, app);

    // 初期 fog 更新
    if (this.player) this.fog.update(this.player.gridX, this.player.gridY);

    // 浮遊アニメーション＆カメラ
    this._animTime = 0;
    this._camX = 0;
    this._camY = 0;
    this._camTargetX = 0;
    this._camTargetY = 0;
    app.ticker.add((delta) => {
      this._animTime += delta * 0.03;
      this._tickAnimation(delta);
      this._tickCamera(delta);
    });
  }

  _tickCamera(delta) {
    // プレイヤー位置からカメラのマイクロオフセットを計算（最大±12px）
    if (this.player) {
      const MAP_CENTER_X = 400;
      const MAP_CENTER_Y = 320;
      const px = this.player.gridX * 40 + 20;
      const py = this.player.gridY * 40 + 20;
      const offX = (px - MAP_CENTER_X) / MAP_CENTER_X * -10;
      const offY = (py - MAP_CENTER_Y) / MAP_CENTER_Y * -8;
      this._camTargetX = offX;
      this._camTargetY = offY;
    }
    // スムーズに追従
    const speed = 0.07 * delta;
    this._camX += (this._camTargetX - this._camX) * speed;
    this._camY += (this._camTargetY - this._camY) * speed;

    // シェイク中は上書きしない
    if (this.effects && this.effects.shakeFrames > 0) return;
    this.worldContainer.x = Math.round(this._camX);
    this.worldContainer.y = Math.round(this._camY);
  }

  _tickAnimation(delta) {
    if (this.player) {
      this.player.updateTween(delta);
      const bob = Math.sin(this._animTime * 2.8) * 1.8;
      const baseY = this.player._tweenBaseY ?? this.player.gridY * TILE_SIZE;
      this.player.container.y = baseY + bob;
    }
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.updateTween(delta);
      const phase = enemy.gridX * 0.9 + enemy.gridY * 0.4;
      const bob = Math.sin(this._animTime * 2.2 + phase) * 1.4;
      const baseY = enemy._tweenBaseY ?? enemy.gridY * TILE_SIZE;
      enemy.container.y = baseY + bob;
    }
  }

  _initLevel() {
    this.dungeon.clear();
    this.enemies.forEach(e => { if (e.alive) e.destroy(); });
    this.enemies = [];
    this.items.forEach(item => item.destroy());
    this.items = [];
    this.fog.reset();

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

    this._placeItems(rooms);

    // fog 初期化（プレイヤー開始位置を可視化）
    if (this.player) this.fog.update(this.player.gridX, this.player.gridY);
  }

  _placeItems(rooms) {
    // 1フロアにつき1〜2個のアイテムを配置（ボス階は回復重視で2個）
    const isBossFloor = this.floor >= MAX_FLOORS;
    const itemCount = isBossFloor ? 2 : 1 + (Math.random() < 0.4 ? 1 : 0);

    // プールをキー配列で管理し、配置済み武器はその場で除外する
    const pool = this._buildItemPool();

    let placed = 0;
    const usedTiles = new Set();

    // 試行：ランダムな部屋（スタート部屋以外）に配置
    for (let attempt = 0; attempt < 60 && placed < itemCount; attempt++) {
      if (pool.length === 0) break;

      const roomIdx = 1 + Math.floor(Math.random() * Math.max(1, rooms.length - 1));
      const room = rooms[Math.min(roomIdx, rooms.length - 1)];
      const ix = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
      const iy = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));

      const tileKey = `${ix},${iy}`;
      if (usedTiles.has(tileKey)) continue;
      if (this.map[iy][ix] !== TILE.FLOOR) continue;
      if (this.enemies.some(e => e.alive && e.gridX === ix && e.gridY === iy)) continue;
      if (this.stairs && this.stairs.x === ix && this.stairs.y === iy) continue;

      const poolIdx = Math.floor(Math.random() * pool.length);
      const itemKey = pool[poolIdx];
      const def = ITEM_DEFS[itemKey];

      // 武器/防具（minFloor あり）はプールから取り除いて二度と出現させない
      if (def.minFloor !== undefined) {
        pool.splice(poolIdx, 1);
        this._seenWeapons.add(itemKey);
      }

      this.items.push(new Item(this.worldContainer, ix, iy, def));
      usedTiles.add(tileKey);
      placed++;
    }
  }

  _buildItemPool() {
    // フロアに応じた消耗品 + まだ出現していない武器/防具をキー配列で返す
    const floor = this.floor;
    const isBossFloor = floor >= MAX_FLOORS;

    // 消耗品（何度でも出現可）
    const pool = isBossFloor
      ? ['elixir', 'elixir', 'potion']
      : floor <= 2
        ? ['potion', 'potion']
        : ['potion', 'elixir'];

    // minFloor が現在階以下で、まだ未出現の武器/防具を追加
    for (const [key, def] of Object.entries(ITEM_DEFS)) {
      if (def.minFloor !== undefined && def.minFloor <= floor && !this._seenWeapons.has(key)) {
        pool.push(key);
      }
    }

    return pool;
  }

  _checkItemPickup(nx, ny) {
    const idx = this.items.findIndex(item => item.gridX === nx && item.gridY === ny);
    if (idx === -1) return;

    const item = this.items[idx];
    const def = item.def;
    this.items.splice(idx, 1);
    item.destroy();
    this.audio.playItemPickup();

    switch (def.effect) {
      case 'heal': {
        const before = this.player.hp;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.value);
        const gained = this.player.hp - before;
        this.ui.addMessage(`${def.name}を入手！ HP +${gained}`, COLOR.GREEN);
        break;
      }
      case 'healFull': {
        this.player.hp = this.player.maxHp;
        this.ui.addMessage(`${def.name}を入手！ HP 全回復！`, COLOR.GREEN);
        break;
      }
      case 'attack': {
        this.player.attack += def.value;
        this.ui.addMessage(`${def.name}を装備！ ATK +${def.value}`, COLOR.ORANGE);
        break;
      }
      case 'defense': {
        this.player.defense += def.value;
        this.ui.addMessage(`${def.name}を装備！ DEF +${def.value}`, COLOR.CYAN);
        break;
      }
      case 'defenseHp': {
        this.player.defense += def.value;
        this.player.maxHp  += def.hpValue;
        this.player.hp     += def.hpValue;
        this.ui.addMessage(`${def.name}を装備！ DEF +${def.value} / MaxHP +${def.hpValue}`, COLOR.CYAN);
        break;
      }
    }

    this.ui.update(this.player, this.floor);
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
        case ' ':
          e.preventDefault();
          this._trySpecialAttack();
          return;
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
      this.fog.update(nx, ny);

      if (this.map[ny][nx] === TILE.STAIRS) {
        this.audio.playStairs();
        this.floor++;
        this._initLevel();
        return;
      }

      this._checkItemPickup(nx, ny);
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

    // スラッシュ軌跡 → ヒットエフェクト＆ダメージ数値
    this.effects.spawnSlashEffect(this.player.gridX, this.player.gridY, enemy.gridX, enemy.gridY);
    this.effects.spawnHitEffect(enemy.gridX, enemy.gridY, enemy.def.color ?? 0x4fc3f7);
    this.effects.spawnDamageNumber(enemy.gridX, enemy.gridY, dmg, 0x4fc3f7);

    // フェーズ2：ボスのHP50%以下で激怒モード突入
    if (enemy.def.isBoss && !enemy.def.phase2 && enemy.hp <= Math.floor(enemy.maxHp / 2)) {
      enemy.def.phase2 = true;
      enemy.def.attack += 10;
      this.ui.addMessage(`💢 ダークロードが激怒した！`, COLOR.RED);
      this.ui.addMessage(`闇のオーラが膨れ上がる！`, COLOR.PURPLE);
      this.effects.screenShake(12, 20);
    }

    if (!enemy.alive) {
      const gainedXp = enemy.def.xp;
      const ex = enemy.gridX;
      const ey = enemy.gridY;
      this.enemies = this.enemies.filter(e => e !== enemy);
      this.player.xp += gainedXp;
      this.audio.playEnemyDie();
      this.ui.addMessage(`${enemy.def.name}を倒した！ XP +${gainedXp}`, COLOR.YELLOW);

      // ボス撃破 → ゲームクリア
      if (enemy.def.isBoss) {
        this.effects.spawnBossDeathEffect(ex, ey);
        this.effects.screenShake(10, 25);
        this.state = 'win';
        this.audio.stopBGM();
        this.audio.playWin();
        this.ui.showMessage('ダークロードを倒した！\nゲームクリア！', COLOR.GREEN);
        return;
      }

      // 通常敵の死亡エフェクト
      this.effects.spawnDeathEffect(ex, ey, enemy.def.color ?? 0xff8800);

      if (this.player.xp >= this.player.xpToNext) {
        this.player.levelUp();
        this.audio.playLevelUp();
        this.ui.addMessage(`レベルアップ！ Lv.${this.player.level}`, COLOR.PURPLE);
        this.effects.spawnLevelUpEffect(this.player.gridX, this.player.gridY);
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
        let dmg;
        let isSpecial = false;

        if (enemy.def.isBoss) {
          enemy.attackCount = (enemy.attackCount || 0) + 1;
          const specialInterval = enemy.def.phase2 ? 2 : 3;
          if (enemy.attackCount % specialInterval === 0) {
            isSpecial = true;
            // 呪いの一撃：防御の半分を無視し、1.5倍ダメージ
            dmg = Math.max(2, Math.floor((enemy.def.attack - Math.floor(this.player.defense / 2)) * 1.5));
          } else {
            dmg = Math.max(1, enemy.def.attack - this.player.defense);
          }
        } else {
          dmg = Math.max(1, enemy.def.attack - this.player.defense);
        }

        this.player.hp -= dmg;
        const wasReady = this.player.soul >= this.player.maxSoul;
        this.player.soul = Math.min(this.player.maxSoul, this.player.soul + dmg);
        if (!wasReady && this.player.soul >= this.player.maxSoul) {
          this.ui.addMessage('✨ 魂の一撃 ready！ [Space]で発動！', COLOR.YELLOW);
        }
        this.player.flash();
        this.audio.playHit();
        this.effects.spawnPlayerDamageNumber(this.player.gridX, this.player.gridY, dmg);

        if (isSpecial) {
          this.ui.addMessage(`💀 ダークロードの呪いの一撃！ ${dmg} ダメージ！！`, COLOR.PURPLE);
          this.effects.screenShake(15, 15);
        } else {
          this.ui.addMessage(`${enemy.def.name}の攻撃！ ${dmg} ダメージ`, COLOR.RED);
          const shakeStrength = enemy.def.isBoss ? 8 : 4;
          this.effects.screenShake(shakeStrength, 10);
        }
      } else if (!enemy.def.isBoss && dist <= 8) {
        this._moveEnemyToward(enemy, dx, dy);
      } else if (!enemy.def.isBoss) {
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

  _trySpecialAttack() {
    this.audio.start();
    this.audio.resume();

    if (this.state !== 'playing') return;

    if (this.player.soul < this.player.maxSoul) {
      this.ui.addMessage(`魂ゲージが足りない！ (${this.player.soul}/${this.player.maxSoul})`, COLOR.GRAY);
      return;
    }

    const adjacent = this.enemies.find(e =>
      e.alive &&
      Math.abs(e.gridX - this.player.gridX) + Math.abs(e.gridY - this.player.gridY) === 1
    );

    if (!adjacent) {
      this.ui.addMessage('隣に敵がいない！', COLOR.GRAY);
      return;
    }

    this._playerSpecialAttack(adjacent);
    this._enemyTurns();
    this.ui.update(this.player, this.floor);

    if (this.player.hp <= 0) {
      this.state = 'gameover';
      this.audio.stopBGM();
      this.audio.playGameOver();
      this.ui.showMessage('ゲームオーバー\n勇者は力尽きた…', COLOR.RED);
    }
  }

  _playerSpecialAttack(enemy) {
    const dmg = Math.max(1, this.player.attack * 3);
    this.player.soul = 0;

    enemy.takeDamage(dmg);
    this.audio.playSpecialAttack();
    this.ui.addMessage(`✨ 魂の一撃！ ${enemy.def.name}に ${dmg} ダメージ！！`, COLOR.YELLOW);
    this.effects.spawnSpecialAttackEffect(enemy.gridX, enemy.gridY);
    this.effects.spawnDamageNumber(enemy.gridX, enemy.gridY, dmg, 0xffd700);
    this.effects.screenShake(10, 15);

    if (enemy.def.isBoss && !enemy.def.phase2 && enemy.hp <= Math.floor(enemy.maxHp / 2)) {
      enemy.def.phase2 = true;
      enemy.def.attack += 10;
      this.ui.addMessage(`💢 ダークロードが激怒した！`, COLOR.RED);
      this.ui.addMessage(`闇のオーラが膨れ上がる！`, COLOR.PURPLE);
      this.effects.screenShake(12, 20);
    }

    if (!enemy.alive) {
      const gainedXp = enemy.def.xp;
      const ex = enemy.gridX;
      const ey = enemy.gridY;
      this.enemies = this.enemies.filter(e => e !== enemy);
      this.player.xp += gainedXp;
      this.audio.playEnemyDie();
      this.ui.addMessage(`${enemy.def.name}を倒した！ XP +${gainedXp}`, COLOR.YELLOW);

      if (enemy.def.isBoss) {
        this.effects.spawnBossDeathEffect(ex, ey);
        this.effects.screenShake(10, 25);
        this.state = 'win';
        this.audio.stopBGM();
        this.audio.playWin();
        this.ui.showMessage('ダークロードを倒した！\nゲームクリア！', COLOR.GREEN);
        return;
      }

      this.effects.spawnDeathEffect(ex, ey, enemy.def.color ?? 0xff8800);

      if (this.player.xp >= this.player.xpToNext) {
        this.player.levelUp();
        this.audio.playLevelUp();
        this.ui.addMessage(`レベルアップ！ Lv.${this.player.level}`, COLOR.PURPLE);
        this.effects.spawnLevelUpEffect(this.player.gridX, this.player.gridY);
      }
    }
  }
}
