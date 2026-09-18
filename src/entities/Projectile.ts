import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 0;
  public pierce: number = 1;
  public hitsLeft: number = 1;
  public isEnemyProjectile: boolean = false;
  public isAoE: boolean = false;
  public aoeRadius: number = 0;
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
    aoeRadius: number = 0
  ): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setTint(tint);

    this.damage = damage;
    this.pierce = pierce;
    this.hitsLeft = pierce;
    this.isEnemyProjectile = isEnemy;
    this.isAoE = isAoE;
    this.aoeRadius = aoeRadius;
    this.spawnTime = this.scene.time.now;

    this.scene.physics.velocityFromRotation(angle, speed, this.body!.velocity);
    this.setRotation(angle);
  }

  public update(time: number): void {
    if (time - this.spawnTime > this.lifespan) {
      this.despawn();
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
    }
  }
}
