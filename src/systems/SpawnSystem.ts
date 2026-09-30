import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { WaveSystem } from './WaveSystem';
import { ENEMY_CONFIGS } from '../config/enemies.config';

export class SpawnSystem {
  private scene: Phaser.Scene;
  private enemyGroup: Phaser.Physics.Arcade.Group;
  private waveSystem: WaveSystem;
  private spawnTimer: number = 0;

  constructor(scene: Phaser.Scene, enemyGroup: Phaser.Physics.Arcade.Group, waveSystem: WaveSystem) {
    this.scene = scene;
    this.enemyGroup = enemyGroup;
    this.waveSystem = waveSystem;
  }

  public update(time: number, player: Player): void {
    if (this.waveSystem.hasEnemiesToSpawn() && time > this.spawnTimer) {
      const waveNum = this.waveSystem.getWaveConfig().waveNumber;
      const spawnDelay = Math.max(300, 900 - (waveNum - 1) * 55);
      this.spawnTimer = time + spawnDelay;
      this.spawnEnemy(player);
    }
  }

  public spawnEnemy(player: Player): Enemy {
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
    const spawnX = player.x + Math.cos(spawnAngle) * spawnDist;
    const spawnY = player.y + Math.sin(spawnAngle) * spawnDist;

    let enemy = this.enemyGroup.getFirstDead(false) as Enemy;
    if (!enemy) {
      enemy = new Enemy(this.scene, spawnX, spawnY, 'enemy');
      this.scene.add.existing(enemy);
      this.scene.physics.add.existing(enemy);
      this.enemyGroup.add(enemy);
    }

    enemy.spawn(spawnX, spawnY, enemyConfig, waveConfig.healthMultiplier, waveConfig.speedMultiplier);
    this.waveSystem.onEnemySpawned();
    return enemy;
  }
}
