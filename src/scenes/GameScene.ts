import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { WaveSystem } from '../systems/WaveSystem';
import { GameStateManager } from '../systems/GameStateManager';
import { EventBus } from '../systems/EventBus';
import { ENEMY_CONFIGS } from '../config/enemies.config';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private projectileGroup!: Phaser.Physics.Arcade.Group;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private xpGroup!: Phaser.Physics.Arcade.Group;
  private waveSystem!: WaveSystem;
  private moveKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private shiftKey!: Phaser.Input.Keyboard.Key;

  private spawnTimer: number = 0;

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

    // Wave System
    this.waveSystem = new WaveSystem();
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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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

    // Spawning Enemies with escalating wave spawn rates
    if (this.waveSystem.hasEnemiesToSpawn() && time > this.spawnTimer) {
      const waveNum = this.waveSystem.getWaveConfig().waveNumber;
      const spawnDelay = Math.max(300, 900 - (waveNum - 1) * 55);
      this.spawnTimer = time + spawnDelay;
      this.spawnEnemy();
    }

    // Enemy AI Movement
    this.enemyGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const enemy = child as Enemy;
      if (enemy.active) {
        enemy.updateAI(this.player.x, this.player.y, enemy.speedMultiplier);
      }
      return true;
    });
  }

  private spawnEnemy(): void {
    const waveConfig = this.waveSystem.getWaveConfig();
    let enemyTypeKey = 'scout_drone';

    if (waveConfig.bossWave) {
      enemyTypeKey = 'cyber_overlord';
    } else if (waveConfig.waveNumber === 1) {
      // Wave 1: 90% Scout Drones, 10% Sentinels
      enemyTypeKey = Math.random() < 0.9 ? 'scout_drone' : 'hacker_sentinel';
    } else if (waveConfig.waveNumber === 2) {
      // Wave 2: 70% Scouts, 20% Sentinels, 10% Enforcers
      const rand = Math.random();
      if (rand < 0.7) enemyTypeKey = 'scout_drone';
      else if (rand < 0.9) enemyTypeKey = 'hacker_sentinel';
      else enemyTypeKey = 'enforcer_mech';
    } else {
      // Wave 3+: Dynamic pool distribution
      const rand = Math.random();
      if (rand < 0.5) enemyTypeKey = 'scout_drone';
      else if (rand < 0.75) enemyTypeKey = 'hacker_sentinel';
      else if (rand < 0.90) enemyTypeKey = 'enforcer_mech';
      else enemyTypeKey = 'hunter_drone';
    }

    const enemyConfig = ENEMY_CONFIGS[enemyTypeKey];
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 700;
    const spawnX = this.player.x + Math.cos(spawnAngle) * spawnDist;
    const spawnY = this.player.y + Math.sin(spawnAngle) * spawnDist;

    let enemy = this.enemyGroup.getFirstDead(false) as Enemy;
    if (!enemy) {
      enemy = new Enemy(this, spawnX, spawnY, 'enemy');
      this.add.existing(enemy);
      this.physics.add.existing(enemy);
      this.enemyGroup.add(enemy);
    }

    enemy.spawn(spawnX, spawnY, enemyConfig, waveConfig.healthMultiplier, waveConfig.speedMultiplier);
    this.waveSystem.onEnemySpawned();
  }

  private handleProjectileEnemyOverlap(projectileObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const proj = projectileObj as Projectile;
    const enemy = enemyObj as Enemy;

    if (!proj.active || !enemy.active) return;

    proj.registerHit();
    const isKilled = enemy.takeDamage(proj.damage);

    if (isKilled) {
      this.waveSystem.onEnemyDefeated(enemy.isBoss);
      this.spawnXpGem(enemy.x, enemy.y, enemy.config.xpReward);
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
