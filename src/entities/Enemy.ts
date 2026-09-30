import Phaser from 'phaser';
import { EnemyConfig } from '../config/enemies.config';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public config!: EnemyConfig;
  public currentHp: number = 100;
  public maxHp: number = 100;
  public speedMultiplier: number = 1.0;
  public isBoss: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
  }

  public spawn(
    x: number,
    y: number,
    config: EnemyConfig,
    healthMultiplier: number = 1.0,
    speedMultiplier: number = 1.0
  ): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    this.config = config;
    this.maxHp = Math.round(config.health * healthMultiplier);
    this.currentHp = this.maxHp;
    this.speedMultiplier = speedMultiplier;
    this.isBoss = !!config.isBoss;

    this.setTint(config.color);
    this.setDisplaySize(config.size, config.size);

    if (this.body) {
      this.body.setSize(config.size, config.size);
    }
  }

  private bossAttackTimer: number = 0;

  public updateAI(targetX: number, targetY: number, speedMultiplier?: number): void {
    if (!this.active || !this.body) return;

    const currentSpeedMult = speedMultiplier !== undefined ? speedMultiplier : this.speedMultiplier;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const speed = this.config.speed * currentSpeedMult;

    this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
    this.setRotation(angle);

    // Cyber Overlord Boss attack patterns (Laser Sweep / Heavy Pulse)
    if (this.isBoss && this.scene.time.now > this.bossAttackTimer) {
      this.bossAttackTimer = this.scene.time.now + 3000;
      this.triggerBossAttack(targetX, targetY);
    }
  }

  private triggerBossAttack(targetX: number, targetY: number): void {
    // Telegraphed boss visual sweep beam effect
    const beam = this.scene.add.graphics();
    beam.lineStyle(4, 0xff007f, 0.9);
    beam.lineBetween(this.x, this.y, targetX, targetY);

    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 500,
      onComplete: () => beam.destroy()
    });
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
