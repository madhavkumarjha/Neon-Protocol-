import Phaser from 'phaser';
import { StorageService } from '../services/StorageService';
import { LeaderboardService, ScoreEntry } from '../services/LeaderboardService';
import { AudioService } from '../services/AudioService';
import { THEME_CONFIGS, ArenaTheme } from '../config/theme.config';

export class MenuScene extends Phaser.Scene {
  private activeThemeId!: ArenaTheme['id'];
  private themeBtnContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private leaderboardContainer?: Phaser.GameObjects.Container;

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    const { width, height } = this.scale;
    this.activeThemeId = StorageService.getSelectedTheme();

    // Create atmospheric background based on active theme (NO grid lines / box lines)
    this.createAtmosphericBackground(width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Header Pill Badge
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(0x0c2742, 0.9);
    badgeGfx.fillRoundedRect(cx - 90, cy - 225, 180, 26, 6);
    badgeGfx.lineStyle(1, 0x38bdf8, 0.8);
    badgeGfx.strokeRoundedRect(cx - 90, cy - 225, 180, 26, 6);

    this.add.text(cx, cy - 212, 'PROTOCOL v2.0', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#38bdf8',
      fontStyle: 'bold',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    // Modern Sleek Title (Outfit)
    const title = this.add.text(cx, cy - 168, 'NEON PROTOCOL', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '54px',
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

    this.add.text(cx, cy - 120, 'Cyberpunk Procedural Roguelike', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '15px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Personal Best Glass Chip
    const highScore = StorageService.getHighScore();
    const statGfx = this.add.graphics();
    statGfx.fillStyle(0x131a29, 0.9);
    statGfx.fillRoundedRect(cx - 130, cy - 88, 260, 32, 8);
    statGfx.lineStyle(1, 0xf59e0b, 0.6);
    statGfx.strokeRoundedRect(cx - 130, cy - 88, 260, 32, 8);

    this.add.text(cx, cy - 72, `★ PERSONAL BEST: ${highScore.toLocaleString()}`, {
      fontFamily: 'Outfit, Inter, sans-serif',
      fontSize: '13px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Modern Environment Theme Selector
    this.createThemeSelector(cx, cy - 10);

    // Modern Play Button (Start Survival)
    const playBtnContainer = this.add.container(cx, cy + 60);
    const pW = 320;
    const pH = 52;
    const playGfx = this.add.graphics();

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
    const leaderContainer = this.add.container(cx, cy + 130);
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
      this.showLeaderboardModal(topScores);
    });
  }

  /* -------------------------------------------------------------
   * ATMOSPHERIC BACKGROUND (NO GRID BOXES / LINES)
   * ------------------------------------------------------------- */
  private createAtmosphericBackground(width: number, height: number): void {
    const theme = THEME_CONFIGS[this.activeThemeId] || THEME_CONFIGS.galaxy;

    // Solid theme background fill
    const bg = this.add.rectangle(width / 2, height / 2, width, height, theme.backgroundColor);
    bg.setDepth(-10);

    // Soft organic ambient aura spots (no sharp lines)
    const auraGfx = this.add.graphics();
    auraGfx.setDepth(-8);
    auraGfx.fillStyle(theme.groundAccentColor, 0.45);
    auraGfx.fillCircle(width * 0.25, height * 0.3, 200);
    auraGfx.fillCircle(width * 0.75, height * 0.7, 260);
    auraGfx.fillCircle(width * 0.5, height * 0.5, 300);

    // Floating atmospheric particles
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      const px = Phaser.Math.Between(0, width);
      const py = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(1.5, 3.5);

      const dot = this.add.circle(px, py, size, theme.particleColor, 0.6);
      dot.setDepth(-5);

      this.tweens.add({
        targets: dot,
        alpha: { from: 0.2, to: 0.9 },
        y: py + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(2000, 4500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /* -------------------------------------------------------------
   * ENVIRONMENT THEME SELECTOR
   * ------------------------------------------------------------- */
  private createThemeSelector(cx: number, cy: number): void {
    this.add.text(cx, cy - 24, 'ARENA ENVIRONMENT', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      color: '#64748b',
      fontStyle: 'bold',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    const themes: ArenaTheme['id'][] = ['galaxy', 'grassland', 'underwater', 'underground'];
    const chipW = 110;
    const chipH = 34;
    const spacing = 120;
    const startX = cx - ((themes.length - 1) * spacing) / 2;

    themes.forEach((tId, idx) => {
      const cfg = THEME_CONFIGS[tId];
      const posX = startX + idx * spacing;
      const chipContainer = this.add.container(posX, cy + 8);
      const chipGfx = this.add.graphics();

      const renderChip = (active: boolean, hover: boolean) => {
        chipGfx.clear();
        if (active) {
          chipGfx.fillStyle(cfg.borderColor, 0.18);
          chipGfx.fillRoundedRect(-chipW / 2 - 2, -chipH / 2 - 2, chipW + 4, chipH + 4, 8);
        }
        chipGfx.fillStyle(active ? 0x0f1f38 : (hover ? 0x172338 : 0x0c1322), 0.95);
        chipGfx.fillRoundedRect(-chipW / 2, -chipH / 2, chipW, chipH, 6);
        chipGfx.lineStyle(active ? 1.5 : 1, active ? cfg.borderColor : (hover ? 0x475569 : 0x1e293b), 1);
        chipGfx.strokeRoundedRect(-chipW / 2, -chipH / 2, chipW, chipH, 6);
      };

      const isActive = this.activeThemeId === tId;
      renderChip(isActive, false);

      const label = this.add.text(0, 0, `${cfg.icon} ${cfg.name}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
        color: isActive ? '#f8fafc' : '#94a3b8',
        fontStyle: isActive ? 'bold' : '500'
      }).setOrigin(0.5);

      const hit = this.add.zone(0, 0, chipW, chipH).setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => {
        AudioService.playUpgradeHover();
        if (this.activeThemeId !== tId) {
          renderChip(false, true);
          label.setColor('#f8fafc');
        }
      });

      hit.on('pointerout', () => {
        const isCurrent = this.activeThemeId === tId;
        renderChip(isCurrent, false);
        label.setColor(isCurrent ? '#f8fafc' : '#94a3b8');
      });

      hit.on('pointerdown', () => {
        AudioService.playUpgradeHover();
        this.activeThemeId = tId;
        StorageService.setSelectedTheme(tId);

        // Re-render all chips
        themes.forEach(otherId => {
          const container = this.themeBtnContainers.get(otherId);
          if (container) {
            const isNowActive = otherId === tId;
            const otherCfg = THEME_CONFIGS[otherId];
            const gfx = container.getAt(0) as Phaser.GameObjects.Graphics;
            const txt = container.getAt(1) as Phaser.GameObjects.Text;

            gfx.clear();
            if (isNowActive) {
              gfx.fillStyle(otherCfg.borderColor, 0.18);
              gfx.fillRoundedRect(-chipW / 2 - 2, -chipH / 2 - 2, chipW + 4, chipH + 4, 8);
            }
            gfx.fillStyle(isNowActive ? 0x0f1f38 : 0x0c1322, 0.95);
            gfx.fillRoundedRect(-chipW / 2, -chipH / 2, chipW, chipH, 6);
            gfx.lineStyle(isNowActive ? 1.5 : 1, isNowActive ? otherCfg.borderColor : 0x1e293b, 1);
            gfx.strokeRoundedRect(-chipW / 2, -chipH / 2, chipW, chipH, 6);

            txt.setColor(isNowActive ? '#f8fafc' : '#94a3b8');
            txt.setStyle({ fontStyle: isNowActive ? 'bold' : '500' });
          }
        });
      });

      chipContainer.add([chipGfx, label, hit]);
      this.themeBtnContainers.set(tId, chipContainer);
    });
  }

  /* -------------------------------------------------------------
   * GLOBAL LEADERBOARD MODAL (REPLACES BROWSER ALERT)
   * ------------------------------------------------------------- */
  private showLeaderboardModal(scores: ScoreEntry[]): void {
    if (this.leaderboardContainer) {
      this.leaderboardContainer.destroy();
    }

    const { width, height } = this.scale;
    this.leaderboardContainer = this.add.container(0, 0);
    this.leaderboardContainer.setDepth(1000);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x050813, 0.94);
    overlay.setInteractive(); // Blocks clicks to background

    const cx = width / 2;
    const cy = height / 2;
    const mW = 620;
    const mH = 490;

    // Rounded Modal Chassis (16px radius)
    const chassisGfx = this.add.graphics();
    chassisGfx.fillStyle(0x0a0f1d, 0.99);
    chassisGfx.fillRoundedRect(cx - mW / 2, cy - mH / 2, mW, mH, 16);
    chassisGfx.lineStyle(1, 0x1e293b, 1.0);
    chassisGfx.strokeRoundedRect(cx - mW / 2, cy - mH / 2, mW, mH, 16);

    // Accent Line
    chassisGfx.lineStyle(2, 0x38bdf8, 0.8);
    chassisGfx.strokeLineShape(new Phaser.Geom.Line(cx - 90, cy - mH / 2, cx + 90, cy - mH / 2));

    // Header Badge
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(0x0c2742, 0.9);
    badgeGfx.fillRoundedRect(cx - 95, cy - 215, 190, 24, 6);
    badgeGfx.lineStyle(1, 0x38bdf8, 0.8);
    badgeGfx.strokeRoundedRect(cx - 95, cy - 215, 190, 24, 6);

    const badgeText = this.add.text(cx, cy - 203, 'GLOBAL ARCHIVES // NETWORK', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      color: '#38bdf8',
      fontStyle: 'bold',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    const title = this.add.text(cx, cy - 168, 'Hall of Fame', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '28px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const subtitle = this.add.text(cx, cy - 138, 'Top surviving pilots across the planetary network', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.leaderboardContainer.add([overlay, chassisGfx, badgeGfx, badgeText, title, subtitle]);

    // Rows Container
    const rowsY = cy - 90;
    const rowH = 46;
    const rowW = 540;

    const medals = ['👑 #1', '🥈 #2', '🥉 #3', '  #4', '  #5'];
    const medalColors = ['#f59e0b', '#cbd5e1', '#d97706', '#94a3b8', '#94a3b8'];

    scores.slice(0, 5).forEach((entry, idx) => {
      const curY = rowsY + idx * (rowH + 8);
      const rowGfx = this.add.graphics();
      rowGfx.fillStyle(idx === 0 ? 0x161c2e : 0x0f172a, 0.95);
      rowGfx.fillRoundedRect(cx - rowW / 2, curY, rowW, rowH, 8);
      rowGfx.lineStyle(1, idx === 0 ? 0x38bdf8 : 0x1e293b, idx === 0 ? 0.7 : 0.5);
      rowGfx.strokeRoundedRect(cx - rowW / 2, curY, rowW, rowH, 8);

      const rankText = this.add.text(cx - rowW / 2 + 18, curY + rowH / 2, medals[idx] || `  #${idx + 1}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        color: medalColors[idx] || '#94a3b8',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const nameText = this.add.text(cx - rowW / 2 + 85, curY + rowH / 2, entry.display_name, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '15px',
        color: '#f8fafc',
        fontStyle: '600'
      }).setOrigin(0, 0.5);

      const scoreText = this.add.text(cx + 80, curY + rowH / 2, entry.score.toLocaleString(), {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '16px',
        color: '#38bdf8',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);

      const waveText = this.add.text(cx + rowW / 2 - 18, curY + rowH / 2, `Wave ${entry.wave} • ${entry.kills} kills`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#94a3b8'
      }).setOrigin(1, 0.5);

      this.leaderboardContainer!.add([rowGfx, rankText, nameText, scoreText, waveText]);
    });

    // Close Button
    const closeBtnY = cy + 195;
    const btnW = 200;
    const btnH = 40;
    const btnGfx = this.add.graphics();

    const drawBtn = (hover: boolean) => {
      btnGfx.clear();
      btnGfx.fillStyle(hover ? 0x0284c7 : 0x171e2e, 1.0);
      btnGfx.fillRoundedRect(cx - btnW / 2, closeBtnY - btnH / 2, btnW, btnH, 8);
      btnGfx.lineStyle(1, hover ? 0x38bdf8 : 0x334155, 0.8);
      btnGfx.strokeRoundedRect(cx - btnW / 2, closeBtnY - btnH / 2, btnW, btnH, 8);
    };

    drawBtn(false);

    const btnLabel = this.add.text(cx, closeBtnY, 'CLOSE ARCHIVES', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#f8fafc',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);

    const hit = this.add.zone(cx, closeBtnY, btnW, btnH).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      AudioService.playUpgradeHover();
      drawBtn(true);
    });
    hit.on('pointerout', () => drawBtn(false));
    hit.on('pointerdown', () => {
      AudioService.playUpgradeHover();
      this.leaderboardContainer?.destroy();
      this.leaderboardContainer = undefined;
    });

    this.leaderboardContainer.add([btnGfx, btnLabel, hit]);
  }
}
