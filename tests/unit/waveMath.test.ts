import { describe, it, expect } from 'vitest';
import { generateWaveConfig, calculateRequiredXp } from '../../src/config/waves.config';

describe('Wave & XP Scaling Math Tests', () => {
  it('should calculate exponential XP curve correctly', () => {
    expect(calculateRequiredXp(1)).toBe(100);
    expect(calculateRequiredXp(2)).toBe(135);
    expect(calculateRequiredXp(3)).toBe(182);
  });

  it('should generate standard wave configuration', () => {
    const wave1 = generateWaveConfig(1);
    expect(wave1.waveNumber).toBe(1);
    expect(wave1.totalEnemies).toBe(11); // 8 + 1*3
    expect(wave1.bossWave).toBe(false);

    const wave2 = generateWaveConfig(2);
    expect(wave2.totalEnemies).toBe(14); // 8 + 2*3
  });

  it('should trigger boss wave every 5th wave', () => {
    const wave5 = generateWaveConfig(5);
    expect(wave5.bossWave).toBe(true);
    expect(wave5.totalEnemies).toBe(1);

    const wave10 = generateWaveConfig(10);
    expect(wave10.bossWave).toBe(true);
  });
});
