import Phaser from 'phaser';
import { EnemyConfig } from '../config/enemies.config';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public config!: EnemyConfig;
  public currentHp: number = 100;
  public maxHp: number = 100;
  public isBoss: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
  }

  public spawn(
    x: number,
    y: number,
    config: EnemyConfig,
    healthMultiplier: number = 1.0,
    _speedMultiplier: number = 1.0
  ): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    this.config = config;
    this.maxHp = Math.round(config.health * healthMultiplier);
    this.currentHp = this.maxHp;
    this.isBoss = !!config.isBoss;

    this.setTint(config.color);
    this.setDisplaySize(config.size, config.size);

    if (this.body) {
      this.body.setSize(config.size, config.size);
    }
  }

  public updateAI(targetX: number, targetY: number, speedMultiplier: number = 1.0): void {
    if (!this.active || !this.body) return;

    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const speed = this.config.speed * speedMultiplier;

    this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
    this.setRotation(angle);
  }

  public takeDamage(amount: number): boolean {
    this.currentHp -= amount;

    // Hit flash tint effect
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) {
        this.setTint(this.config.color);
      }
    });

    if (this.currentHp <= 0) {
      this.die();
      return true; // Killedd
    }
    return false;
  }

  public die(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.stop();
    }
  }
}
