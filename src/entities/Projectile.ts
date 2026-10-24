import Phaser from 'phaser';
import { EventBus } from '../systems/EventBus';
import { calculateProjectileLifespan } from '../utils/combatMath';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 0;
  public pierce: number = 1;
  public hitsLeft: number = 1;
  public isEnemyProjectile: boolean = false;
  public isAoE: boolean = false;
  public aoeRadius: number = 0;
  public selfDamagePercent: number = 0.15;
  private lifespan: number = 2000;
  private spawnTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
  }

  public fire(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    tint: number,
    pierce: number = 1,
    isEnemy: boolean = false,
    isAoE: boolean = false,
    aoeRadius: number = 0,
    range: number = 600,
    selfDamagePercent: number = 0.15
  ): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setTint(tint);

    if (this.body) {
      this.body.enable = true;
    }

    this.damage = damage;
    this.pierce = pierce;
    this.hitsLeft = pierce;
    this.isEnemyProjectile = isEnemy;
    this.isAoE = isAoE;
    this.aoeRadius = aoeRadius;
    this.selfDamagePercent = selfDamagePercent;

    // Lifespan is dynamically calculated from range / speed per weapon
    const calculatedLifespan = calculateProjectileLifespan(range, speed);
    this.lifespan = calculatedLifespan > 0 ? calculatedLifespan : 2000;
    this.spawnTime = this.scene.time.now;

    this.scene.physics.velocityFromRotation(angle, speed, this.body!.velocity);
    this.setRotation(angle);
  }

  public update(time: number): void {
    if (!this.active) return;
    if (time - this.spawnTime > this.lifespan) {
      if (this.isAoE) {
        EventBus.emit('projectile:explode', this);
      } else {
        this.despawn();
      }
    }
  }

  public registerHit(): void {
    this.hitsLeft--;
    if (this.hitsLeft <= 0) {
      this.despawn();
    }
  }

  public despawn(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
  }
}
