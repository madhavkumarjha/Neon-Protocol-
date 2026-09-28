import Phaser from 'phaser';
import { GameStateManager } from '../systems/GameStateManager';
import { Weapon } from './Weapon';
import { WEAPON_CONFIGS } from '../config/weapons.config';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private baseSpeed: number = 280;
  private weapons: Map<string, Weapon> = new Map();
  private isDashing: boolean = false;
  private dashCooldown: number = 0;
  private isDashInvulnerable: boolean = false;
  private isHitInvulnerable: boolean = false;
  private dashAngle: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDisplaySize(32, 32);
    this.setTint(0x00f0ff); // Neon Cyan

    if (this.body) {
      this.body.setSize(28, 28);
    }

    // Default starting weapon
    this.addWeapon('plasma_pistol');
  }

  public get isInvulnerable(): boolean {
    return this.isDashInvulnerable || this.isHitInvulnerable;
  }

  public addWeapon(weaponId: string): void {
    if (!this.weapons.has(weaponId) && WEAPON_CONFIGS[weaponId]) {
      this.weapons.set(weaponId, new Weapon(WEAPON_CONFIGS[weaponId]));
    }
  }

  public handleInput(
    moveVector: { x: number; y: number },
    pointer: Phaser.Input.Pointer,
    time: number,
    projectileGroup: Phaser.Physics.Arcade.Group,
    enemyGroup?: Phaser.Physics.Arcade.Group
  ): void {
    if (!this.active || !this.body) return;

    const state = GameStateManager.getInstance().getRunState();
    const speedMult = state.statModifiers.moveSpeedMult;
    const finalSpeed = this.isDashing ? this.baseSpeed * 2.5 : this.baseSpeed * speedMult;

    // Movement
    if (this.isDashing) {
      this.scene.physics.velocityFromRotation(this.dashAngle, finalSpeed, this.body.velocity);
    } else if (moveVector.x !== 0 || moveVector.y !== 0) {
      const moveAngle = Math.atan2(moveVector.y, moveVector.x);
      this.scene.physics.velocityFromRotation(moveAngle, finalSpeed, this.body.velocity);
    } else {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }

    // Smart Aiming Priority:
    // 1. Nearest active enemy in range (Smart Auto-Aim)
    // 2. Mouse pointer override if active
    // 3. Movement direction fallback
    let aimAngle = this.rotation;

    let nearestEnemy: Phaser.Physics.Arcade.Sprite | null = null;
    let nearestDist = 320;

    if (enemyGroup) {
      enemyGroup.children.each((child: Phaser.GameObjects.GameObject) => {
        const enemy = child as Phaser.Physics.Arcade.Sprite;
        if (enemy.active) {
          const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestEnemy = enemy;
          }
        }
        return true;
      });
    }

    if (pointer.isDown) {
      aimAngle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    } else if (nearestEnemy) {
      aimAngle = Phaser.Math.Angle.Between(this.x, this.y, (nearestEnemy as Phaser.Physics.Arcade.Sprite).x, (nearestEnemy as Phaser.Physics.Arcade.Sprite).y);
    } else if (moveVector.x !== 0 || moveVector.y !== 0) {
      aimAngle = Math.atan2(moveVector.y, moveVector.x);
    }

    this.setRotation(aimAngle);

    // Auto-fire all equipped weapons (Decision #014)
    state.activeWeapons.forEach(wId => {
      this.addWeapon(wId);
      const weapon = this.weapons.get(wId);
      if (weapon && weapon.canFire(time, state.statModifiers.fireRateMult)) {
        weapon.fire(
          this.scene,
          this.x,
          this.y,
          aimAngle,
          projectileGroup,
          state.statModifiers.damageMult,
          time
        );
      }
    });
  }

  public triggerDash(time: number, moveVector?: { x: number; y: number }): boolean {
    if (this.isDashing || time < this.dashCooldown) return false;

    this.isDashing = true;
    this.isDashInvulnerable = true;
    this.dashCooldown = time + 2500; // 2.5s cooldown

    if (moveVector && (moveVector.x !== 0 || moveVector.y !== 0)) {
      this.dashAngle = Math.atan2(moveVector.y, moveVector.x);
    } else {
      this.dashAngle = this.rotation;
    }

    this.scene.time.delayedCall(200, () => {
      this.isDashing = false;
      this.isDashInvulnerable = false;
    });

    return true;
  }

  public takeHit(damage: number): boolean {
    if (this.isInvulnerable) return false;

    GameStateManager.getInstance().damagePlayer(damage);
    this.isHitInvulnerable = true;

    // Brief 0.5s invulnerability flash after getting hit
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.setAlpha(1.0);
        this.isHitInvulnerable = false;
      }
    });

    return true;
  }
}
