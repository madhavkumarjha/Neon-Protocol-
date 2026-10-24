import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { WaveSystem } from '../systems/WaveSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { GameStateManager } from '../systems/GameStateManager';
import { EventBus } from '../systems/EventBus';
import { AudioService } from '../services/AudioService';
import { calculateEmpSelfDamage, isPointInLaserBeam } from '../utils/combatMath';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private projectileGroup!: Phaser.Physics.Arcade.Group;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private xpGroup!: Phaser.Physics.Arcade.Group;
  private waveSystem!: WaveSystem;
  private spawnSystem!: SpawnSystem;
  private moveKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private shiftKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('GameScene');
  }

  public create(): void {
    // Reset global state for new run
    GameStateManager.getInstance().resetRun();

    // Set world bounds (2000x2000 arena)
    this.physics.world.setBounds(0, 0, 2000, 2000);
    this.cameras.main.setBounds(0, 0, 2000, 2000);

    // Draw background arena grid
    this.drawArenaGrid();

    // Groups
    this.projectileGroup = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
    this.enemyGroup = this.physics.add.group({ classType: Enemy, runChildUpdate: false });
    this.xpGroup = this.physics.add.group();

    // Player
    this.player = new Player(this, 1000, 1000, 'player');
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Wave & Spawn Systems
    this.waveSystem = new WaveSystem();
    this.spawnSystem = new SpawnSystem(this, this.enemyGroup, this.waveSystem);
    this.waveSystem.startWave(1);

    // Synthesized Ambient Cyber BGM
    AudioService.startBgm();

    // Controls (WASD + Arrow Keys, SHIFT for Dash)
    this.moveKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Collisions
    this.physics.add.overlap(
      this.projectileGroup,
      this.enemyGroup,
      (p, e) => this.handleProjectileEnemyOverlap(p as Projectile, e as Enemy),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      (_p, e) => this.handlePlayerEnemyOverlap(_p as Player, e as Enemy),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.xpGroup,
      (_p, x) => this.handlePlayerXpOverlap(_p as Player, x as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    );

    // Listeners
    EventBus.on('wave:cleared', this.onWaveCleared, this);
    EventBus.on('wave:advanced', this.onWaveAdvanced, this);
    EventBus.on('projectile:explode', this.triggerAoEExplosion, this);
    EventBus.on('boss:laserFired', this.handleBossLaser, this);
    EventBus.on('enemy:killedByPlayer', this.handleEnemyDefeated, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      AudioService.stopBgm();
      EventBus.offAll(this);
    });
  }

  public update(time: number, _delta: number): void {
    const state = GameStateManager.getInstance().getRunState();
    if (state.isGameOver) return;

    // Player Movement Input Vector (WASD + Arrow Keys combined)
    const isRight = this.moveKeys.D.isDown || this.cursors.right.isDown;
    const isLeft = this.moveKeys.A.isDown || this.cursors.left.isDown;
    const isDown = this.moveKeys.S.isDown || this.cursors.down.isDown;
    const isUp = this.moveKeys.W.isDown || this.cursors.up.isDown;

    const moveX = (isRight ? 1 : 0) - (isLeft ? 1 : 0);
    const moveY = (isDown ? 1 : 0) - (isUp ? 1 : 0);
    const pointer = this.input.activePointer;

    this.player.handleInput({ x: moveX, y: moveY }, pointer, time, this.projectileGroup, this.enemyGroup);

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
      this.player.triggerDash(time, { x: moveX, y: moveY });
    }

    // Spawning Enemies via SpawnSystem
    this.spawnSystem.update(time, this.player);

    // Hacker Sentinel Slow Aura detection
    let isNearHacker = false;

    // Enemy AI Movement
    this.enemyGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const enemy = child as Enemy;
      if (enemy.active) {
        enemy.updateAI(this.player.x, this.player.y, enemy.speedMultiplier);

        if (enemy.config?.id === 'hacker_sentinel') {
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          if (dist <= 180) {
            isNearHacker = true;
          }
        }
      }
      return true;
    });

    this.player.setSlowed(isNearHacker);
  }

  public triggerAoEExplosion(proj: Projectile): void {
    if (!proj.active) return;

    const aoeRadius = proj.aoeRadius || 120;

    // Shockwave explosion effect
    const blastGfx = this.add.graphics();
    blastGfx.lineStyle(3, proj.tintTopLeft || 0xffd700, 1);
    blastGfx.strokeCircle(proj.x, proj.y, aoeRadius);
    this.tweens.add({
      targets: blastGfx,
      alpha: 0,
      scale: 1.2,
      duration: 250,
      onComplete: () => blastGfx.destroy()
    });

    AudioService.playExplosion();

    // EMP Self-Damage: if player is caught inside blast, apply capped 15% self damage
    const distToPlayer = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
    if (distToPlayer <= aoeRadius) {
      const selfDmg = calculateEmpSelfDamage(proj.damage, proj.selfDamagePercent);
      if (selfDmg > 0) {
        this.player.takeHit(selfDmg);
      }
    }

    // Damage all enemies within blast
    this.enemyGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const targetEnemy = child as Enemy;
      if (targetEnemy.active) {
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, targetEnemy.x, targetEnemy.y);
        if (dist <= aoeRadius) {
          const isKilled = targetEnemy.takeDamage(proj.damage);
          if (isKilled) {
            this.handleEnemyDefeated(targetEnemy);
          }
        }
      }
      return true;
    });

    proj.despawn();
  }

  private handleBossLaser(data: {
    origin: { x: number; y: number };
    angle: number;
    length: number;
    radius: number;
    damage: number;
  }): void {
    if (!this.player || !this.player.active) return;

    const playerHit = isPointInLaserBeam(
      { x: this.player.x, y: this.player.y },
      data.origin,
      data.angle,
      data.length,
      data.radius
    );

    if (playerHit) {
      this.player.takeHit(data.damage);
    }
  }

  public handleEnemyDefeated(enemy: Enemy): void {
    AudioService.playExplosion();
    this.waveSystem.onEnemyDefeated(enemy.isBoss);
    this.spawnXpGem(enemy.x, enemy.y, enemy.config.xpReward);
  }

  private handleProjectileEnemyOverlap(proj: Projectile, enemy: Enemy): void {
    if (!proj.active || !enemy.active) return;

    if (proj.isAoE) {
      this.triggerAoEExplosion(proj);
    } else {
      proj.registerHit();
      const isKilled = enemy.takeDamage(proj.damage);

      if (isKilled) {
        this.handleEnemyDefeated(enemy);
      }
    }
  }

  private handlePlayerEnemyOverlap(_player: Player, enemy: Enemy): void {
    if (enemy.active) {
      const tookHit = this.player.takeHit(enemy.config.damage);
      if (tookHit && enemy.body) {
        // Physics knockback impulse pushing enemy away from player
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        this.physics.velocityFromRotation(angle, 350, enemy.body.velocity);
      }
    }
  }

  private handlePlayerXpOverlap(_player: Player, xpGem: Phaser.Physics.Arcade.Sprite): void {
    if (xpGem.active) {
      const xpVal = xpGem.getData('xpValue') || 15;
      GameStateManager.getInstance().addXp(xpVal);
      xpGem.destroy();
    }
  }

  private spawnXpGem(x: number, y: number, amount: number): void {
    const gem = this.physics.add.sprite(x, y, 'xp_gem');
    gem.setData('xpValue', amount);
    this.xpGroup.add(gem);
  }

  private onWaveCleared(_data: { waveNumber: number }): void {
    EventBus.emit('ui:showUpgradeModal');
  }

  private onWaveAdvanced(data: { wave: number }): void {
    this.waveSystem.startWave(data.wave);
  }

  private drawArenaGrid(): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a1d2e, 0.8);
    for (let x = 0; x < 2000; x += 64) {
      grid.lineBetween(x, 0, x, 2000);
    }
    for (let y = 0; y < 2000; y += 64) {
      grid.lineBetween(0, y, 2000, y);
    }
  }
}
