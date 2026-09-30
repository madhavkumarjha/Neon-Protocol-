import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { WaveSystem } from '../systems/WaveSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { GameStateManager } from '../systems/GameStateManager';
import { EventBus } from '../systems/EventBus';
import { AudioService } from '../services/AudioService';

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
    this.physics.add.overlap(this.projectileGroup, this.enemyGroup, this.handleProjectileEnemyOverlap as any, undefined, this);
    this.physics.add.overlap(this.player, this.enemyGroup, this.handlePlayerEnemyOverlap as any, undefined, this);
    this.physics.add.overlap(this.player, this.xpGroup, this.handlePlayerXpOverlap as any, undefined, this);

    // Listeners
    EventBus.on('wave:cleared', this.onWaveCleared, this);
    EventBus.on('wave:advanced', this.onWaveAdvanced, this);
    EventBus.on('input:touchMove', (data: { x: number; y: number }) => {
      this.touchMoveVector = data;
    }, this);
    EventBus.on('input:touchDash', () => {
      if (this.player) {
        this.player.triggerDash(this.time.now, this.touchMoveVector);
      }
    }, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.offAll(this);
    });
  }

  private touchMoveVector: { x: number; y: number } = { x: 0, y: 0 };

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

    // Enemy AI Movement
    this.enemyGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const enemy = child as Enemy;
      if (enemy.active) {
        enemy.updateAI(this.player.x, this.player.y, enemy.speedMultiplier);
      }
      return true;
    });
  }

  private handleProjectileEnemyOverlap(projectileObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const proj = projectileObj as Projectile;
    const enemy = enemyObj as Enemy;

    if (!proj.active || !enemy.active) return;

    if (proj.isAoE) {
      // Trigger AoE shockwave explosion dealing damage to all enemies within radius
      const aoeRadius = proj.aoeRadius || 120;
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

      this.enemyGroup.children.each((child: Phaser.GameObjects.GameObject) => {
        const targetEnemy = child as Enemy;
        if (targetEnemy.active) {
          const dist = Phaser.Math.Distance.Between(proj.x, proj.y, targetEnemy.x, targetEnemy.y);
          if (dist <= aoeRadius) {
            const isKilled = targetEnemy.takeDamage(proj.damage);
            if (isKilled) {
              AudioService.playExplosion();
              this.waveSystem.onEnemyDefeated(targetEnemy.isBoss);
              this.spawnXpGem(targetEnemy.x, targetEnemy.y, targetEnemy.config.xpReward);
            }
          }
        }
        return true;
      });

      proj.despawn();
    } else {
      proj.registerHit();
      const isKilled = enemy.takeDamage(proj.damage);

      if (isKilled) {
        AudioService.playExplosion();
        this.waveSystem.onEnemyDefeated(enemy.isBoss);
        this.spawnXpGem(enemy.x, enemy.y, enemy.config.xpReward);
      }
    }
  }

  private handlePlayerEnemyOverlap(_playerObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const enemy = enemyObj as Enemy;
    if (enemy.active) {
      const tookHit = this.player.takeHit(enemy.config.damage);
      if (tookHit && enemy.body) {
        // Physics knockback impulse pushing enemy away from player
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        this.physics.velocityFromRotation(angle, 350, enemy.body.velocity);
      }
    }
  }

  private handlePlayerXpOverlap(_playerObj: Phaser.GameObjects.GameObject, xpObj: Phaser.GameObjects.GameObject): void {
    const xpGem = xpObj as Phaser.Physics.Arcade.Sprite;
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
    // Wave cleared prompt
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
