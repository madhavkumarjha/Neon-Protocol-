import Phaser from 'phaser';
import { WeaponConfig } from '../config/weapons.config';
import { Projectile } from './Projectile';

export class Weapon {
  public config: WeaponConfig;
  private lastFiredTime: number = 0;

  constructor(config: WeaponConfig) {
    this.config = config;
  }

  public canFire(time: number, fireRateMultiplier: number = 1.0): boolean {
    const cooldownMs = (1000 / (this.config.fireRate * fireRateMultiplier));
    return time - this.lastFiredTime >= cooldownMs;
  }

  public fire(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetAngle: number,
    projectileGroup: Phaser.Physics.Arcade.Group,
    damageMultiplier: number = 1.0,
    time: number = 0
  ): void {
    this.lastFiredTime = time;
    const finalDamage = Math.round(this.config.damage * damageMultiplier);

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
      this.config.aoeRadius || 0
    );
  }
}
