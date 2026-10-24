import { EventBus } from './EventBus';
import { GameStateManager } from './GameStateManager';
import { generateWaveConfig, WaveConfig } from '../config/waves.config';
import { WaveMutator } from '../config/weapons.fallback';
import { GroqService } from '../services/GroqService';

export class WaveSystem {
  private currentWaveConfig!: WaveConfig;
  private enemiesRemainingToSpawn: number = 0;
  private activeEnemiesCount: number = 0;
  private waveInProgress: boolean = false;
  private activeMutator: WaveMutator | null = null;

  constructor() {}

  public async startWave(waveNumber: number): Promise<void> {
    this.currentWaveConfig = generateWaveConfig(waveNumber);
    this.enemiesRemainingToSpawn = this.currentWaveConfig.totalEnemies;
    this.activeEnemiesCount = 0;
    this.waveInProgress = true;
    this.activeMutator = null;

    EventBus.emit('wave:started', this.currentWaveConfig);

    // Apply procedural wave mutators from Wave 2 onwards (Feature b)
    if (waveNumber >= 2) {
      try {
        const mutator = await GroqService.generateWaveMutator(waveNumber);
        this.activeMutator = mutator;
        EventBus.emit('wave:mutatorActive', mutator);
      } catch {
        this.activeMutator = null;
      }
    }
  }

  public getActiveMutator(): WaveMutator | null {
    return this.activeMutator;
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
      this.activeMutator = null;
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
