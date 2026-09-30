export class StorageService {
  private static DEVICE_ID_KEY = 'neon_protocol_device_id';
  private static HIGH_SCORE_KEY = 'neon_protocol_high_score';
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

  public static getSettings() {
    const settings = this.getItem(this.SETTINGS_KEY);
    return settings ? JSON.parse(settings) : { soundVolume: 0.8, sfxVolume: 1.0 };
  }

  public static saveSettings(settings: { soundVolume: number; sfxVolume: number }): void {
    this.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }
}
