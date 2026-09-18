import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { LeaderboardService } from '../services/LeaderboardService';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  public create(): void {
    const { width, height } = this.scale;

    // Background title styling
    this.add.text(width / 2, height / 3, 'NEON PROTOCOL', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '56px',
      color: '#00F0FF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 3 + 60, 'CYBERPUNK ENDLESS SURVIVAL', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#FF007F'
    }).setOrigin(0.5);

    const highScore = StorageService.getHighScore();
    this.add.text(width / 2, height / 3 + 100, `PERSONAL BEST: ${highScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#FFD700'
    }).setOrigin(0.5);

    // Play Button
    const playBtn = this.add.text(width / 2, height / 2 + 50, 'START SURVIVAL', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#00F0FF',
      backgroundColor: '#1A1D2E',
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ color: '#FF007F' }));
    playBtn.on('pointerout', () => playBtn.setStyle({ color: '#00F0FF' }));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });

    // Leaderboard Button
    const leaderBtn = this.add.text(width / 2, height / 2 + 130, 'LEADERBOARD', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#F0F4F8',
      backgroundColor: '#1A1D2E',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    leaderBtn.on('pointerdown', async () => {
      const topScores = await LeaderboardService.fetchTopScores();
      alert('GLOBAL HIGH SCORES:\n' + topScores.map((s, i) => `${i+1}. ${s.display_name}: ${s.score}`).join('\n'));
    });
  }
}
