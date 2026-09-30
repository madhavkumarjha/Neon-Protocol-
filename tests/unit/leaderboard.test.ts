import { describe, it, expect } from 'vitest';
import { LeaderboardService } from '../../src/services/LeaderboardService';

describe('LeaderboardService Tests', () => {
  it('should generate deterministic score hash signatures', () => {
    const hash1 = LeaderboardService.generateScoreHash('dev_123', 5000, 10, 120);
    const hash2 = LeaderboardService.generateScoreHash('dev_123', 5000, 10, 120);
    const hash3 = LeaderboardService.generateScoreHash('dev_123', 5001, 10, 120);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toMatch(/^sig_/);
  });

  it('should submit score and return top scores array', async () => {
    const result = await LeaderboardService.submitScore('TestPlayer', 12000, 4, 35);
    expect(result).toBe(true);

    const scores = await LeaderboardService.fetchTopScores();
    expect(scores.length).toBeGreaterThan(0);
  });
});
