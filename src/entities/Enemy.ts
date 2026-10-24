import Phaser from 'phaser';
import { EnemyConfig } from '../config/enemies.config';
import { EventBus } from '../systems/EventBus';
import { AudioService } from '../services/AudioService';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public config!: EnemyConfig;
  public currentHp: number = 100;
  public maxHp: number = 100;
  public speedMultiplier: number = 1.0;
  public isBoss: boolean = false;
  private bossAttackTimer: number = 0;

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

    if (this.body) {
      this.body.enable = true;
    }

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

  public updateAI(targetX: number, targetY: number, speedMultiplier?: number): void {
    if (!this.active || !this.body) return;

    const currentSpeedMult = speedMultiplier !== undefined ? speedMultiplier : this.speedMultiplier;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const speed = this.config.speed * currentSpeedMult;

    this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
    this.setRotation(angle);

    // Cyber Overlord Boss attack patterns (Telegraphed Laser Sweep)
    if (this.isBoss && this.scene.time.now > this.bossAttackTimer) {
      this.bossAttackTimer = this.scene.time.now + 3500;
      this.triggerBossAttack(targetX, targetY);
    }
  }

  private triggerBossAttack(targetX: number, targetY: number): void {
    const beamAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const beamLength = 1200;
    const beamRadius = 24;
    const startX = this.x;
    const startY = this.y;

    const endX = startX + Math.cos(beamAngle) * beamLength;
    const endY = startY + Math.sin(beamAngle) * beamLength;

    // Phase 1: 0.5s Telegraph Warning Line
    const warningLine = this.scene.add.graphics();
    warningLine.lineStyle(2, 0xff007f, 0.45);
    warningLine.lineBetween(startX, startY, endX, endY);

    this.scene.tweens.add({
      targets: warningLine,
      alpha: 0.8,
      duration: 250,
      yoyo: true,
      repeat: 1
    });

    // Phase 2: After 0.5s warning, fire real damaging beam
    this.scene.time.delayedCall(500, () => {
      warningLine.destroy();
      if (!this.active) return;

      AudioService.playBossLaser();

      // Laser firing VFX
      const firingBeam = this.scene.add.graphics();
      firingBeam.lineStyle(10, 0xff007f, 0.95);
      firingBeam.lineBetween(startX, startY, endX, endY);

      // Core white laser beam
      firingBeam.lineStyle(4, 0xffffff, 1.0);
      firingBeam.lineBetween(startX, startY, endX, endY);

      this.scene.tweens.add({
        targets: firingBeam,
        alpha: 0,
        duration: 280,
        onComplete: () => firingBeam.destroy()
      });

      // Emit laser fired event with exact beam geometry for player damage check
      EventBus.emit('boss:laserFired', {
        origin: { x: startX, y: startY },
        angle: beamAngle,
        length: beamLength,
        radius: beamRadius,
        damage: this.config.damage
      });
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
      return true; // Killed
    }
    return false;
  }

  public die(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
  }
}
