import { Container, Graphics, Text } from 'pixi.js';
import { TILE_SIZE } from './constants.js';

class Particle {
  constructor(container, x, y, vx, vy, color, size, life, gravity = 0.15) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.gravity = gravity;

    this.gfx = new Graphics();
    this.gfx.beginFill(color);
    this.gfx.drawCircle(0, 0, size);
    this.gfx.endFill();
    this.gfx.x = x;
    this.gfx.y = y;
    container.addChild(this.gfx);
  }

  update(delta) {
    this.life -= delta;
    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.vy += this.gravity * delta;

    const ratio = Math.max(0, this.life / this.maxLife);
    this.gfx.alpha = ratio;
    this.gfx.x = this.x;
    this.gfx.y = this.y;
    return this.life > 0;
  }

  destroy() {
    this.gfx.destroy();
  }
}

class DamageNumber {
  constructor(container, x, y, label, color) {
    this.life = 55;
    this.maxLife = 55;
    this.x = x;
    this.y = y;
    this.vy = -1.8;

    this.text = new Text(label, {
      fontSize: 15,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fill: color,
      stroke: 0x000000,
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 2,
    });
    this.text.anchor.set(0.5, 0.5);
    this.text.x = x;
    this.text.y = y;
    container.addChild(this.text);
  }

  update(delta) {
    this.life -= delta;
    this.y += this.vy * delta;
    this.vy *= 0.96;

    const ratio = Math.max(0, this.life / this.maxLife);
    this.text.alpha = ratio < 0.4 ? ratio / 0.4 * ratio : 1;
    this.text.x = this.x;
    this.text.y = this.y;
    return this.life > 0;
  }

  destroy() {
    this.text.destroy();
  }
}

export class BattleEffects {
  constructor(worldContainer, app) {
    this.worldContainer = worldContainer;
    this.effectContainer = new Container();
    worldContainer.addChild(this.effectContainer);

    this.particles = [];
    this.damageNumbers = [];
    this.shakeFrames = 0;
    this.shakeIntensity = 0;

    app.ticker.add((delta) => this._tick(delta));
  }

  /** プレイヤーが敵を攻撃したときのヒットエフェクト */
  spawnHitEffect(gridX, gridY, color = 0x4fc3f7) {
    const cx = gridX * TILE_SIZE + TILE_SIZE / 2;
    const cy = gridY * TILE_SIZE + TILE_SIZE / 2;
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push(new Particle(
        this.effectContainer,
        cx, cy,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        i % 2 === 0 ? color : 0xffffff,
        1.5 + Math.random() * 2,
        25 + Math.random() * 15,
        0.1,
      ));
    }
    // 中心フラッシュ
    this._spawnFlash(cx, cy, color, 10, 18);
  }

  /** 敵が死亡したときの爆発エフェクト */
  spawnDeathEffect(gridX, gridY, color = 0xff8800) {
    const cx = gridX * TILE_SIZE + TILE_SIZE / 2;
    const cy = gridY * TILE_SIZE + TILE_SIZE / 2;
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push(new Particle(
        this.effectContainer,
        cx + (Math.random() - 0.5) * 8,
        cy + (Math.random() - 0.5) * 8,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        i % 3 === 0 ? color : i % 3 === 1 ? 0xffffff : 0xffdd44,
        2 + Math.random() * 3,
        40 + Math.random() * 30,
        0.18,
      ));
    }
    // 大きなフラッシュ
    this._spawnFlash(cx, cy, color, 18, 14);
    this._spawnFlash(cx, cy, 0xffffff, 10, 10);
  }

  /** ダメージ数値ポップアップ（敵へのダメージ） */
  spawnDamageNumber(gridX, gridY, dmg, color = 0x4fc3f7) {
    const cx = gridX * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 14;
    const cy = gridY * TILE_SIZE - 2;
    this.damageNumbers.push(new DamageNumber(this.effectContainer, cx, cy, `${dmg}`, color));
  }

  /** プレイヤーがダメージを受けたときの数値（赤） */
  spawnPlayerDamageNumber(gridX, gridY, dmg) {
    const cx = gridX * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 10;
    const cy = gridY * TILE_SIZE - 4;
    const num = new DamageNumber(this.effectContainer, cx, cy, `-${dmg}`, 0xff5252);
    num.text.style.fontSize = 17;
    this.damageNumbers.push(num);
  }

  /** レベルアップエフェクト */
  spawnLevelUpEffect(gridX, gridY) {
    const cx = gridX * TILE_SIZE + TILE_SIZE / 2;
    const cy = gridY * TILE_SIZE + TILE_SIZE / 2;

    // 上昇するキラキラ
    for (let i = 0; i < 18; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
      const speed = 1.5 + Math.random() * 3;
      const col = i % 3 === 0 ? 0xffd700 : i % 3 === 1 ? 0xffffff : 0xce93d8;
      this.particles.push(new Particle(
        this.effectContainer,
        cx + (Math.random() - 0.5) * 24,
        cy + (Math.random() - 0.5) * 10,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        col,
        2 + Math.random() * 2.5,
        55 + Math.random() * 30,
        -0.05, // 重力逆（上昇）
      ));
    }

    // 放射パーティクル
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const speed = 2.5 + Math.random() * 2;
      this.particles.push(new Particle(
        this.effectContainer,
        cx, cy,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0xffd700,
        2.5,
        45,
        0.05,
      ));
    }

    // 大フラッシュ
    this._spawnFlash(cx, cy, 0xffd700, 28, 20);
    this._spawnFlash(cx, cy, 0xffffff, 16, 14);

    // "LV UP!" テキスト
    const lvText = new DamageNumber(this.effectContainer, cx, cy - 24, 'LV UP!', 0xffd700);
    lvText.text.style.fontSize = 18;
    lvText.life = 80;
    lvText.maxLife = 80;
    lvText.vy = -1.2;
    this.damageNumbers.push(lvText);
  }

  /** ボス撃破エフェクト */
  spawnBossDeathEffect(gridX, gridY) {
    const cx = gridX * TILE_SIZE + TILE_SIZE / 2;
    const cy = gridY * TILE_SIZE + TILE_SIZE / 2;
    const count = 50;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 6;
      const cols = [0xef5350, 0xff8800, 0xffd700, 0xffffff, 0xce93d8];
      this.particles.push(new Particle(
        this.effectContainer,
        cx + (Math.random() - 0.5) * 20,
        cy + (Math.random() - 0.5) * 20,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        cols[Math.floor(Math.random() * cols.length)],
        2 + Math.random() * 4,
        60 + Math.random() * 50,
        0.12,
      ));
    }
    this._spawnFlash(cx, cy, 0xef5350, 40, 25);
    this._spawnFlash(cx, cy, 0xffffff, 26, 18);
    this._spawnFlash(cx, cy, 0xffd700, 16, 14);
  }

  /** 画面シェイク */
  screenShake(intensity = 5, frames = 12) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeFrames = Math.max(this.shakeFrames, frames);
  }

  // ── 内部メソッド ────────────────────────────────────────

  _spawnFlash(cx, cy, color, size, life) {
    const gfx = new Graphics();
    gfx.beginFill(color, 0.85);
    gfx.drawCircle(0, 0, size);
    gfx.endFill();
    gfx.x = cx;
    gfx.y = cy;
    this.effectContainer.addChild(gfx);

    let remaining = life;
    const maxLife = life;
    const update = (delta) => {
      remaining -= delta;
      if (remaining <= 0) {
        gfx.destroy();
        return;
      }
      gfx.alpha = (remaining / maxLife) * 0.9;
      gfx.scale.set(1 + (1 - remaining / maxLife) * 0.6);
    };
    // 一時的なtickerコールバックを登録しておき、flashが終わったら自動削除
    const wrappedUpdate = (delta) => {
      update(delta);
      if (remaining <= 0) {
        // PixiJS v7: ticker.remove でコールバック削除
        this._flashCallbacks = this._flashCallbacks.filter(cb => cb !== wrappedUpdate);
      }
    };
    if (!this._flashCallbacks) this._flashCallbacks = [];
    this._flashCallbacks.push(wrappedUpdate);
  }

  _tick(delta) {
    // フラッシュ更新
    if (this._flashCallbacks) {
      for (const cb of [...this._flashCallbacks]) cb(delta);
    }

    // パーティクル更新
    this.particles = this.particles.filter(p => {
      const alive = p.update(delta);
      if (!alive) p.destroy();
      return alive;
    });

    // ダメージ数字更新
    this.damageNumbers = this.damageNumbers.filter(d => {
      const alive = d.update(delta);
      if (!alive) d.destroy();
      return alive;
    });

    // 画面シェイク
    if (this.shakeFrames > 0) {
      this.shakeFrames -= delta;
      const ratio = Math.max(0, this.shakeFrames / 12);
      const s = this.shakeIntensity * ratio;
      this.worldContainer.x = (Math.random() - 0.5) * s * 2;
      this.worldContainer.y = (Math.random() - 0.5) * s * 2;
      if (this.shakeFrames <= 0) {
        this.worldContainer.x = 0;
        this.worldContainer.y = 0;
        this.shakeIntensity = 0;
      }
    }
  }
}
