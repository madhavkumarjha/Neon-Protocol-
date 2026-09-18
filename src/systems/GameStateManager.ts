import { EventBus } from './EventBus';
import { calculateRequiredXp } from '../config/waves.config';

export interface StatModifiers {
  damageMult: number;
  fireRateMult: number;
  moveSpeedMult: number;
  maxHpBonus: number;
  armor: number;
}

export class GameStateManager {
  private static instance: GameStateManager;

  private score: number = 0;
  private wave: number = 1;
  private level: number = 1;
  private currentXp: number = 0;
  private requiredXp: number = 100;
  private kills: number = 0;
  private playerHp: number = 100;
  private maxPlayerHp: number = 100;
  private _isPaused: boolean = false;
  private isGameOver: boolean = false;

  private activeWeapons: string[] = ['plasma_pistol'];
  private statModifiers: StatModifiers = {
    damageMult: 1.0,
    fireRateMult: 1.0,
    moveSpeedMult: 1.0,
    maxHpBonus: 0,
    armor: 0
  };

  private constructor() {}

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  public resetRun(): void {
    this.score = 0;
    this.wave = 1;
    this.level = 1;
    this.currentXp = 0;
    this.requiredXp = calculateRequiredXp(1);
    this.kills = 0;
    this.maxPlayerHp = 100;
    this.playerHp = 100;
    this._isPaused = false;
    this.isGameOver = false;
    this.activeWeapons = ['plasma_pistol'];
    this.statModifiers = {
      damageMult: 1.0,
      fireRateMult: 1.0,
      moveSpeedMult: 1.0,
      maxHpBonus: 0,
      armor: 0
    };

    EventBus.emit('state:updated', this.getRunState());
  }

  public isPaused(): boolean {
    return this._isPaused;
  }

  public setPaused(paused: boolean): void {
    this._isPaused = paused;
  }

  public addScore(points: number): void {
    this.score += points;
    EventBus.emit('score:updated', { score: this.score });
  }

  public addKill(): void {
    this.kills++;
    this.addScore(100);
  }

  public addXp(amount: number): void {
    this.currentXp += amount;
    if (this.currentXp >= this.requiredXp) {
      this.currentXp -= this.requiredXp;
      this.level++;
      this.requiredXp = calculateRequiredXp(this.level);
      EventBus.emit('player:leveledUp', { level: this.level });
    }
    EventBus.emit('xp:updated', { currentXp: this.currentXp, requiredXp: this.requiredXp, level: this.level });
  }

  public setPlayerHp(hp: number): void {
    this.playerHp = Math.max(0, Math.min(this.maxPlayerHp, hp));
    EventBus.emit('player:hpChanged', { currentHp: this.playerHp, maxHp: this.maxPlayerHp });
    
    if (this.playerHp <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      EventBus.emit('player:died', { score: this.score, wave: this.wave, kills: this.kills });
    }
  }

  public damagePlayer(dmg: number): void {
    const effectiveDmg = Math.max(1, dmg - this.statModifiers.armor);
    this.setPlayerHp(this.playerHp - effectiveDmg);
  }

  public healPlayer(amount: number): void {
    this.setPlayerHp(this.playerHp + amount);
  }

  public advanceWave(): void {
    this.wave++;
    EventBus.emit('wave:advanced', { wave: this.wave });
  }

  public applyModifier(key: keyof StatModifiers, addValue: number): void {
    this.statModifiers[key] += addValue;
    if (key === 'maxHpBonus') {
      this.maxPlayerHp = 100 + this.statModifiers.maxHpBonus;
      this.healPlayer(addValue);
    }
  }

  public addWeapon(weaponId: string): void {
    if (!this.activeWeapons.includes(weaponId)) {
      this.activeWeapons.push(weaponId);
    }
  }

  public getRunState() {
    return {
      score: this.score,
      wave: this.wave,
      level: this.level,
      currentXp: this.currentXp,
      requiredXp: this.requiredXp,
      kills: this.kills,
      playerHp: this.playerHp,
      maxPlayerHp: this.maxPlayerHp,
      activeWeapons: [...this.activeWeapons],
      statModifiers: { ...this.statModifiers },
      isGameOver: this.isGameOver
    };
  }
}
