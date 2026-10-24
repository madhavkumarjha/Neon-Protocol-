export interface BestRunData {
  score: number;
  wave: number;
  kills: number;
}

export class StorageService {
  private static DEVICE_ID_KEY = 'neon_protocol_device_id';
  private static HIGH_SCORE_KEY = 'neon_protocol_high_score';
  private static BEST_RUN_KEY = 'neon_protocol_best_run';
  private static SETTINGS_KEY = 'neon_protocol_settings';
  private static inMemoryStore: Record<string, string> = {};

  private static getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return this.inMemoryStore[key] || null;
  }

  private static setItem(key: string, val: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
    } else {
      this.inMemoryStore[key] = val;
    }
  }

  public static getDeviceId(): string {
    let id = this.getItem(this.DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      this.setItem(this.DEVICE_ID_KEY, id);
    }
    return id;
  }

  public static getHighScore(): number {
    const score = this.getItem(this.HIGH_SCORE_KEY);
    return score ? parseInt(score, 10) : 0;
  }

  public static saveHighScore(score: number): void {
    const current = this.getHighScore();
    if (score > current) {
      this.setItem(this.HIGH_SCORE_KEY, score.toString());
    }
  }

  public static getBestRun(): BestRunData {
    const data = this.getItem(this.BEST_RUN_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (typeof parsed.score === 'number') {
          return {
            score: parsed.score,
            wave: parsed.wave || 1,
            kills: parsed.kills || 0
          };
        }
      } catch {
        // Fallback to high score
      }
    }
    const highScore = this.getHighScore();
    return { score: highScore, wave: 1, kills: 0 };
  }

  public static saveBestRun(score: number, wave: number, kills: number): void {
    const current = this.getBestRun();
    if (score >= current.score) {
      this.setItem(this.BEST_RUN_KEY, JSON.stringify({ score, wave, kills }));
      this.saveHighScore(score);
    }
  }

  private static THEME_KEY = 'neon_protocol_theme';

  public static getSelectedTheme(): 'galaxy' | 'grassland' | 'underwater' | 'underground' {
    const val = this.getItem(this.THEME_KEY);
    if (val === 'grassland' || val === 'underwater' || val === 'underground') {
      return val;
    }
    return 'galaxy';
  }

  public static setSelectedTheme(theme: string): void {
    this.setItem(this.THEME_KEY, theme);
  }

  public static getSettings(): { soundVolume: number; sfxVolume: number } {
    const settings = this.getItem(this.SETTINGS_KEY);
    return settings ? JSON.parse(settings) : { soundVolume: 0.8, sfxVolume: 1.0 };
  }

  public static saveSettings(settings: { soundVolume: number; sfxVolume: number }): void {
    this.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }
}
