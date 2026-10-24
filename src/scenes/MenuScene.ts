import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { LeaderboardService } from '../services/LeaderboardService';
import { AudioService } from '../services/AudioService';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  public create(): void {
    const { width, height } = this.scale;

    // Modern Background Ambience (Deep Slate Radial Grid)
    const bgGfx = this.add.graphics();
    bgGfx.lineStyle(1, 0x1e293b, 0.4);
    for (let x = 0; x < width; x += 48) {
      bgGfx.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 48) {
      bgGfx.lineBetween(0, y, width, y);
    }

    // Modern Pill Badge
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(0x0c2742, 0.9);
    badgeGfx.fillRoundedRect(width / 2 - 110, height / 3 - 75, 220, 26, 6);
    badgeGfx.lineStyle(1, 0x38bdf8, 0.8);
    badgeGfx.strokeRoundedRect(width / 2 - 110, height / 3 - 75, 220, 26, 6);

    this.add.text(width / 2, height / 3 - 62, 'PROTOCOL v2.0', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#38bdf8',
      fontStyle: 'bold',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    // Modern Sleek Title (Outfit)
    const title = this.add.text(width / 2, height / 3 - 10, 'NEON PROTOCOL', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '56px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(width / 2, height / 3 + 45, 'Cyberpunk Procedural Roguelike', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Personal Best Glass Chip
    const highScore = StorageService.getHighScore();
    const statGfx = this.add.graphics();
    statGfx.fillStyle(0x131a29, 0.9);
    statGfx.fillRoundedRect(width / 2 - 130, height / 3 + 80, 260, 36, 8);
    statGfx.lineStyle(1, 0xf59e0b, 0.6);
    statGfx.strokeRoundedRect(width / 2 - 130, height / 3 + 80, 260, 36, 8);

    this.add.text(width / 2, height / 3 + 98, `★ PERSONAL BEST: ${highScore.toLocaleString()}`, {
      fontFamily: 'Outfit, Inter, sans-serif',
      fontSize: '13px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Modern Play Button (Start Survival)
    const playBtnContainer = this.add.container(width / 2, height / 2 + 60);

    const playGfx = this.add.graphics();
    const pW = 320;
    const pH = 54;

    const drawPlay = (hover: boolean) => {
      playGfx.clear();
      if (hover) {
        playGfx.fillStyle(0x38bdf8, 0.25);
        playGfx.fillRoundedRect(-pW / 2 - 2, -pH / 2 - 2, pW + 4, pH + 4, 14);
      }
      playGfx.fillStyle(hover ? 0x38bdf8 : 0x0284c7, 1.0);
      playGfx.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, 10);
      playGfx.lineStyle(hover ? 2 : 1, 0x38bdf8, 1.0);
      playGfx.strokeRoundedRect(-pW / 2, -pH / 2, pW, pH, 10);
    };

    drawPlay(false);

    const playText = this.add.text(0, 0, 'START SURVIVAL', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);

    const playHitZone = this.add.zone(0, 0, pW, pH)
      .setInteractive({ useHandCursor: true });

    playBtnContainer.add([playGfx, playText, playHitZone]);

    playHitZone.on('pointerover', () => {
      AudioService.playUpgradeHover();
      drawPlay(true);
      playText.setColor('#0f172a');
      this.tweens.add({
        targets: playBtnContainer,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 120,
        ease: 'Cubic.easeOut'
      });
    });

    playHitZone.on('pointerout', () => {
      drawPlay(false);
      playText.setColor('#f8fafc');
      this.tweens.add({
        targets: playBtnContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
        ease: 'Cubic.easeOut'
      });
    });

    playHitZone.on('pointerdown', () => {
      AudioService.playGameStartJingle();
      playGfx.fillStyle(0xffffff, 1.0);
      playGfx.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, 10);

      this.time.delayedCall(150, () => {
        this.scene.start('GameScene');
        this.scene.start('UIScene');
      });
    });

    // Modern Leaderboard Button
    const leaderContainer = this.add.container(width / 2, height / 2 + 135);
    const lW = 220;
    const lH = 40;

    const leaderGfx = this.add.graphics();
    const drawLeader = (hover: boolean) => {
      leaderGfx.clear();
      leaderGfx.fillStyle(hover ? 0x1e293b : 0x0f172a, 0.95);
      leaderGfx.fillRoundedRect(-lW / 2, -lH / 2, lW, lH, 8);
      leaderGfx.lineStyle(1, hover ? 0x38bdf8 : 0x334155, 0.8);
      leaderGfx.strokeRoundedRect(-lW / 2, -lH / 2, lW, lH, 8);
    };

    drawLeader(false);

    const leaderText = this.add.text(0, 0, 'GLOBAL LEADERBOARD', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
      fontStyle: '600',
      letterSpacing: 1
    }).setOrigin(0.5);

    const leaderHitZone = this.add.zone(0, 0, lW, lH)
      .setInteractive({ useHandCursor: true });

    leaderContainer.add([leaderGfx, leaderText, leaderHitZone]);

    leaderHitZone.on('pointerover', () => {
      AudioService.playUpgradeHover();
      drawLeader(true);
      leaderText.setColor('#f8fafc');
    });

    leaderHitZone.on('pointerout', () => {
      drawLeader(false);
      leaderText.setColor('#94a3b8');
    });

    leaderHitZone.on('pointerdown', async () => {
      AudioService.playUpgradeHover();
      const topScores = await LeaderboardService.fetchTopScores();
      alert('GLOBAL HIGH SCORES:\n\n' + topScores.map((s, i) => `${i + 1}. ${s.display_name}: ${s.score} (Wave ${s.wave})`).join('\n'));
    });
  }
}
