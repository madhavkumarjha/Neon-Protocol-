import Phaser from 'phaser';
import { WeaponConfig } from '../config/weapons.config';
import { Projectile } from './Projectile';
import { Enemy } from './Enemy';
import { EventBus } from '../systems/EventBus';
import { AudioService } from '../services/AudioService';
import { isWithinMeleeArc } from '../utils/combatMath';

export class Weapon {
  public config: WeaponConfig;
  private lastFiredTime: number = 0;

  constructor(config: WeaponConfig) {
    this.config = config;
  }

  public canFire(time: number, fireRateMultiplier: number = 1.0): boolean {
    const cooldownMs = 1000 / (this.config.fireRate * fireRateMultiplier);
    return time - this.lastFiredTime >= cooldownMs;
  }

  public fire(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetAngle: number,
    projectileGroup: Phaser.Physics.Arcade.Group,
    damageMultiplier: number = 1.0,
    time: number = 0,
    enemyGroup?: Phaser.Physics.Arcade.Group
  ): void {
    this.lastFiredTime = time;
    const finalDamage = Math.round(this.config.damage * damageMultiplier);

    // Pulse Blade: Melee Cleave Arc (no stuck projectile)
    if (this.config.type === 'blade') {
      this.executeMeleeCleave(scene, x, y, targetAngle, finalDamage, enemyGroup);
      return;
    }

    if (this.config.type === 'shotgun') {
      const pelletCount = this.config.pellets || 5;
      const spreadRad = Phaser.Math.DegToRad(this.config.spread || 30);
      const stepAngle = spreadRad / (pelletCount - 1);
      const startAngle = targetAngle - spreadRad / 2;

      for (let i = 0; i < pelletCount; i++) {
        const angle = startAngle + stepAngle * i;
        this.spawnProjectile(scene, x, y, angle, finalDamage, projectileGroup);
      }
    } else {
      this.spawnProjectile(scene, x, y, targetAngle, finalDamage, projectileGroup);
    }
  }

  private executeMeleeCleave(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetAngle: number,
    damage: number,
    enemyGroup?: Phaser.Physics.Arcade.Group
  ): void {
    const range = this.config.range || 120;
    const arcAngleRad = (2 * Math.PI) / 3; // 120 degree frontal arc

    AudioService.playSlash();

    // Visual melee cleave arc effect
    const arcGfx = scene.add.graphics();
    arcGfx.lineStyle(4, this.config.color || 0x00f0ff, 0.95);
    arcGfx.beginPath();
    arcGfx.arc(x, y, range, targetAngle - arcAngleRad / 2, targetAngle + arcAngleRad / 2, false);
    arcGfx.strokePath();

    // Bright inner blade trail
    arcGfx.lineStyle(2, 0xffffff, 1.0);
    arcGfx.beginPath();
    arcGfx.arc(x, y, range * 0.85, targetAngle - arcAngleRad / 2, targetAngle + arcAngleRad / 2, false);
    arcGfx.strokePath();

    scene.tweens.add({
      targets: arcGfx,
      alpha: 0,
      scale: 1.15,
      duration: 140,
      onComplete: () => arcGfx.destroy()
    });

    // Check hit against active enemies in front of player
    if (enemyGroup) {
      enemyGroup.children.each((child: Phaser.GameObjects.GameObject) => {
        const enemy = child as Enemy;
        if (enemy.active) {
          const hit = isWithinMeleeArc(
            { x, y },
            targetAngle,
            { x: enemy.x, y: enemy.y },
            range,
            arcAngleRad
          );

          if (hit) {
            const isKilled = enemy.takeDamage(damage);
            if (isKilled) {
              EventBus.emit('enemy:killedByPlayer', enemy);
            }
          }
        }
        return true;
      });
    }
  }

  private spawnProjectile(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    damage: number,
    group: Phaser.Physics.Arcade.Group
  ): void {
    let proj = group.getFirstDead(false) as Projectile;
    if (!proj) {
      proj = new Projectile(scene, x, y, 'bullet');
      scene.add.existing(proj);
      scene.physics.add.existing(proj);
      group.add(proj);
    }

    proj.fire(
      x,
      y,
      angle,
      this.config.speed,
      damage,
      this.config.color,
      this.config.pierce || 1,
      false,
      !!this.config.aoeRadius,
      this.config.aoeRadius || 0,
      this.config.range,
      this.config.selfDamagePercent ?? 0.15
    );
  }
}
