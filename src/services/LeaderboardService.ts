import { StorageService } from './StorageService';

export interface ScoreEntry {
  device_id: string;
  display_name: string;
  score: number;
  wave: number;
  kills: number;
}

export class LeaderboardService {
  private static mockScores: ScoreEntry[] = [
    { device_id: 'mock_1', display_name: 'NeonGhost', score: 98500, wave: 24, kills: 612 },
    { device_id: 'mock_2', display_name: 'CyberViper', score: 74200, wave: 19, kills: 489 },
    { device_id: 'mock_3', display_name: 'Overclocked', score: 51000, wave: 15, kills: 310 },
    { device_id: 'mock_4', display_name: 'SynthRunner', score: 32400, wave: 11, kills: 204 }
  ];

  public static async fetchTopScores(): Promise<ScoreEntry[]> {
    // Return sorted mock scores combined with local high score
    const localHighScore = StorageService.getHighScore();
    const scores = [...this.mockScores];
    if (localHighScore > 0) {
      scores.push({
        device_id: StorageService.getDeviceId(),
        display_name: 'You (Local)',
        score: localHighScore,
        wave: 1,
        kills: 0
      });
    }
    return scores.sort((a, b) => b.score - a.score);
  }

  public static async submitScore(name: string, score: number, wave: number, kills: number): Promise<boolean> {
    StorageService.saveHighScore(score);
    this.mockScores.push({
      device_id: StorageService.getDeviceId(),
      display_name: name || 'CyberSamurai',
      score,
      wave,
      kills
    });
    return true;
  }
}
