export class StorageService {
  private static DEVICE_ID_KEY = 'neon_protocol_device_id';
  private static HIGH_SCORE_KEY = 'neon_protocol_high_score';
  private static SETTINGS_KEY = 'neon_protocol_settings';

  public static getDeviceId(): string {
    let id = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem(this.DEVICE_ID_KEY, id);
    }
    return id;
  }

  public static getHighScore(): number {
    const score = localStorage.getItem(this.HIGH_SCORE_KEY);
    return score ? parseInt(score, 10) : 0;
  }

  public static saveHighScore(score: number): void {
    const current = this.getHighScore();
    if (score > current) {
      localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
    }
  }

  public static getSettings() {
    const settings = localStorage.getItem(this.SETTINGS_KEY);
    return settings ? JSON.parse(settings) : { soundVolume: 0.8, sfxVolume: 1.0 };
  }

  public static saveSettings(settings: { soundVolume: number; sfxVolume: number }): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }
}
