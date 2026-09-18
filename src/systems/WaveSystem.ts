import { EventBus } from './EventBus';
import { GameStateManager } from './GameStateManager';
import { generateWaveConfig, WaveConfig } from '../config/waves.config';

export class WaveSystem {
  private currentWaveConfig!: WaveConfig;
  private enemiesRemainingToSpawn: number = 0;
  private activeEnemiesCount: number = 0;
  private waveInProgress: boolean = false;

  constructor() {}

  public startWave(waveNumber: number): void {
    this.currentWaveConfig = generateWaveConfig(waveNumber);
    this.enemiesRemainingToSpawn = this.currentWaveConfig.totalEnemies;
    this.activeEnemiesCount = 0;
    this.waveInProgress = true;

    EventBus.emit('wave:started', this.currentWaveConfig);
  }

  public onEnemySpawned(): void {
    if (this.enemiesRemainingToSpawn > 0) {
      this.enemiesRemainingToSpawn--;
      this.activeEnemiesCount++;
    }
  }

  public onEnemyDefeated(isBoss: boolean = false): void {
    this.activeEnemiesCount = Math.max(0, this.activeEnemiesCount - 1);
    GameStateManager.getInstance().addKill();

    // Decision #011: Boss death triggers wave completion immediately
    if (isBoss || (this.enemiesRemainingToSpawn === 0 && this.activeEnemiesCount === 0)) {
      this.waveInProgress = false;
      EventBus.emit('wave:cleared', { waveNumber: this.currentWaveConfig.waveNumber });
    }
  }

  public hasEnemiesToSpawn(): boolean {
    return this.enemiesRemainingToSpawn > 0;
  }

  public getWaveConfig(): WaveConfig {
    return this.currentWaveConfig;
  }

  public isWaveInProgress(): boolean {
    return this.waveInProgress;
  }
}
