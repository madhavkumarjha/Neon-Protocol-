export interface WaveConfig {
  waveNumber: number;
  totalEnemies: number;
  healthMultiplier: number;
  speedMultiplier: number;
  bossWave: boolean;
}

export function calculateRequiredXp(level: number): number {
  return Math.floor(100 * Math.pow(1.35, level - 1));
}

export function generateWaveConfig(waveNumber: number): WaveConfig {
  const isBossWave = waveNumber % 5 === 0;
  const baseEnemies = 8 + waveNumber * 3;
  
  return {
    waveNumber,
    totalEnemies: isBossWave ? 1 : baseEnemies,
    healthMultiplier: 1 + Math.pow(waveNumber - 1, 1.25) * 0.15,
    speedMultiplier: 0.8 + (waveNumber - 1) * 0.08,
    bossWave: isBossWave
  };
}
