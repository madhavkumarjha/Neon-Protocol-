import Phaser from 'phaser';
import { GameStateManager } from '../systems/GameStateManager';
import { EventBus } from '../systems/EventBus';
import { UpgradeSystem, UpgradeOption } from '../systems/UpgradeSystem';
import { LeaderboardService } from '../services/LeaderboardService';
import { StorageService } from '../services/StorageService';
import { AudioService } from '../services/AudioService';
import { WaveMutator, NemesisBossMutator } from '../config/weapons.fallback';

export class UIScene extends Phaser.Scene {
  private hudCardGfx!: Phaser.GameObjects.Graphics;
  private hpBarGfx!: Phaser.GameObjects.Graphics;
  private xpBarGfx!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private xpText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private levelValText!: Phaser.GameObjects.Text;
  private upgradeModalContainer?: Phaser.GameObjects.Container;
  private gameOverContainer?: Phaser.GameObjects.Container;
  private pauseModalContainer?: Phaser.GameObjects.Container;

  constructor() {
    super('UIScene');
  }

  public create(): void {
    const { width } = this.scale;

    // Pilot Status Card Background (316x60 glass panel with 10px rounded corners)
    this.hudCardGfx = this.add.graphics();
    this.hpBarGfx = this.add.graphics();
    this.xpBarGfx = this.add.graphics();

    this.hudCardGfx.fillStyle(0x0a0f1d, 0.85);
    this.hudCardGfx.fillRoundedRect(16, 14, 316, 60, 10);
    this.hudCardGfx.lineStyle(1, 0x1e293b, 1.0);
    this.hudCardGfx.strokeRoundedRect(16, 14, 316, 60, 10);

    // Pilot Level Badge (Left side)
    this.hudCardGfx.fillStyle(0x0c2540, 0.95);
    this.hudCardGfx.fillRoundedRect(26, 23, 40, 42, 6);
    this.hudCardGfx.lineStyle(1, 0x0284c7, 0.8);
    this.hudCardGfx.strokeRoundedRect(26, 23, 40, 42, 6);

    this.add.text(46, 31, 'LVL', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '9px',
      color: '#38bdf8',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);

    this.levelValText = this.add.text(46, 49, '1', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Health Row (Spacious & Clean)
    this.add.text(78, 24, 'HEALTH', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      color: '#94a3b8',
      fontStyle: '600',
      letterSpacing: 0.8
    }).setOrigin(0, 0.5);

    this.hpText = this.add.text(320, 24, '100 / 100', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    // EXP Row (Spacious & Clean)
    this.add.text(78, 48, 'EXP', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '9px',
      color: '#64748b',
      fontStyle: '600',
      letterSpacing: 0.8
    }).setOrigin(0, 0.5);

    this.xpText = this.add.text(320, 48, '0 / 30', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      color: '#94a3b8',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    this.scoreText = this.add.text(width - 18, 16, 'SCORE: 0', {
      fontFamily: 'Outfit, Inter, sans-serif',
      fontSize: '18px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    this.waveText = this.add.text(width / 2, 16, 'WAVE 1', {
      fontFamily: 'Outfit, Inter, sans-serif',
      fontSize: '20px',
      color: '#c084fc',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Modern Pause HUD Button (Glass pill)
    const pauseHUD = this.add.text(width - 18, 46, 'PAUSE [ESC]', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#38bdf8',
      backgroundColor: '#0f172a',
      padding: { x: 12, y: 6 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    pauseHUD.on('pointerdown', () => this.togglePause());
    pauseHUD.on('pointerover', () => {
      pauseHUD.setStyle({ color: '#f8fafc', backgroundColor: '#0284c7' });
      AudioService.playUpgradeHover();
    });
    pauseHUD.on('pointerout', () => pauseHUD.setStyle({ color: '#38bdf8', backgroundColor: '#0f172a' }));

    // Keyboard shortcuts for Pause (ESC / SPACE)
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', this.onEscKey, this);
      this.input.keyboard.on('keydown-SPACE', this.onSpaceKey, this);
    }

    this.updateHUD();

    // Event Listeners
    EventBus.on('score:updated', this.onScoreUpdated, this);
    EventBus.on('player:hpChanged', this.updateHUD, this);
    EventBus.on('xp:updated', this.updateHUD, this);
    EventBus.on('player:leveledUp', this.onLevelUp, this);
    EventBus.on('ui:showUpgradeModal', this.showUpgradeModal, this);
    EventBus.on('player:died', this.showGameOverModal, this);
    EventBus.on('wave:mutatorActive', this.showMutatorBanner, this);
    EventBus.on('boss:nemesisSpawned', this.showNemesisBanner, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.offAll(this);
      if (this.input.keyboard) {
        this.input.keyboard.off('keydown-ESC', this.onEscKey, this);
        this.input.keyboard.off('keydown-SPACE', this.onSpaceKey, this);
      }
    });
  }

  private onEscKey(): void {
    this.togglePause();
  }

  private onSpaceKey(): void {
    this.togglePause();
  }

  private togglePause(): void {
    const state = GameStateManager.getInstance().getRunState();
    if (state.isGameOver) return;
    if (this.upgradeModalContainer && this.upgradeModalContainer.active) return;

    if (GameStateManager.getInstance().isPaused()) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  /* -------------------------------------------------------------
   * MODERN BUTTON BUILDER HELPER
   * ------------------------------------------------------------- */
  private createModernButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    colorScheme: { bg: number; hoverBg: number; stroke: number; text: string; hoverText: string },
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const gfx = this.add.graphics();

    const draw = (hover: boolean) => {
      gfx.clear();
      // Drop glow shadow on hover
      if (hover) {
        gfx.fillStyle(colorScheme.stroke, 0.2);
        gfx.fillRoundedRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, 12);
      }
      gfx.fillStyle(hover ? colorScheme.hoverBg : colorScheme.bg, 1.0);
      gfx.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      gfx.lineStyle(hover ? 1.5 : 1.0, colorScheme.stroke, hover ? 1.0 : 0.6);
      gfx.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    };

    draw(false);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Outfit, Inter, sans-serif',
      fontSize: height >= 46 ? '15px' : '13px',
      color: colorScheme.text,
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);

    const hitZone = this.add.zone(0, 0, width, height)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      AudioService.playUpgradeHover();
      draw(true);
      label.setColor(colorScheme.hoverText);
      this.tweens.add({
        targets: container,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 100,
        ease: 'Cubic.easeOut'
      });
    });

    hitZone.on('pointerout', () => {
      draw(false);
      label.setColor(colorScheme.text);
      this.tweens.add({
        targets: container,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 100,
        ease: 'Cubic.easeOut'
      });
    });

    hitZone.on('pointerdown', () => {
      onClick();
    });

    container.add([gfx, label, hitZone]);
    return container;
  }

  /* -------------------------------------------------------------
   * MODERN TACTICAL PAUSE MODAL
   * ------------------------------------------------------------- */
  private pauseGame(): void {
    if (GameStateManager.getInstance().isPaused()) return;

    GameStateManager.getInstance().setPaused(true);
    this.scene.pause('GameScene');

    const { width, height } = this.scale;
    if (this.pauseModalContainer) {
      this.pauseModalContainer.destroy();
    }

    this.pauseModalContainer = this.add.container(0, 0);
    this.pauseModalContainer.setDepth(1000);

    // Deep modern backdrop
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x050813, 0.94);

    // Rounded Modern Modal Chassis (620 x 470, radius 16)
    const chassisGfx = this.add.graphics();
    const cx = width / 2;
    const cy = height / 2;
    const mWidth = 620;
    const mHeight = 470;

    // Outer subtle card glow & solid dark glass body
    chassisGfx.fillStyle(0x0a0f1d, 0.99);
    chassisGfx.fillRoundedRect(cx - mWidth / 2, cy - mHeight / 2, mWidth, mHeight, 16);
    chassisGfx.lineStyle(1, 0x1e293b, 1.0);
    chassisGfx.strokeRoundedRect(cx - mWidth / 2, cy - mHeight / 2, mWidth, mHeight, 16);

    // Top accent line
    chassisGfx.lineStyle(2, 0x38bdf8, 0.7);
    chassisGfx.strokeLineShape(new Phaser.Geom.Line(cx - 80, cy - mHeight / 2, cx + 80, cy - mHeight / 2));

    // Modern Header Pill Badge (Spacious 210px pill, generous padding)
    const badgeW = 210;
    const badgeH = 26;
    const badgeY = cy - 192;
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(0x0c2742, 0.95);
    badgeGfx.fillRoundedRect(cx - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 13);
    badgeGfx.lineStyle(1, 0x38bdf8, 0.85);
    badgeGfx.strokeRoundedRect(cx - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 13);

    const headerBadge = this.add.text(cx, badgeY, 'SIMULATION PAUSED', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      color: '#38bdf8',
      fontStyle: 'bold',
      letterSpacing: 1.3
    }).setOrigin(0.5);

    const title = this.add.text(cx, cy - 150, 'Tactical Overview', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '28px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const hint = this.add.text(cx, cy - 116, 'Press ESC or SPACE to return to combat', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const state = GameStateManager.getInstance().getRunState();

    // Spacious 2x2 Telemetry Grid (Generous 255px tiles)
    const telemetryContainer = this.add.container(cx, cy - 25);
    const cardData = [
      { label: 'CURRENT WAVE', value: `WAVE ${state.wave}`, color: '#c084fc', border: 0x3b2450 },
      { label: 'PILOT LEVEL', value: `LEVEL ${state.level}`, color: '#38bdf8', border: 0x143452 },
      { label: 'TOTAL SCORE', value: state.score.toLocaleString(), color: '#f59e0b', border: 0x3d2b0e },
      { label: 'PURGED HOSTILES', value: `${state.kills} KILLS`, color: '#34d399', border: 0x133827 }
    ];

    const tileW = 255;
    const tileH = 64;
    const gapX = 14;
    const gapY = 12;

    const positions = [
      { x: -tileW / 2 - gapX / 2, y: -tileH / 2 - gapY / 2 },
      { x: tileW / 2 + gapX / 2, y: -tileH / 2 - gapY / 2 },
      { x: -tileW / 2 - gapX / 2, y: tileH / 2 + gapY / 2 },
      { x: tileW / 2 + gapX / 2, y: tileH / 2 + gapY / 2 }
    ];

    cardData.forEach((item, idx) => {
      const pos = positions[idx];
      const tileGfx = this.add.graphics();
      tileGfx.fillStyle(0x0f172a, 0.95);
      tileGfx.fillRoundedRect(pos.x - tileW / 2, pos.y - tileH / 2, tileW, tileH, 10);
      tileGfx.lineStyle(1, item.border, 1.0);
      tileGfx.strokeRoundedRect(pos.x - tileW / 2, pos.y - tileH / 2, tileW, tileH, 10);

      const label = this.add.text(pos.x - tileW / 2 + 18, pos.y - 12, item.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#94a3b8',
        fontStyle: '600',
        letterSpacing: 1
      }).setOrigin(0, 0.5);

      const val = this.add.text(pos.x - tileW / 2 + 18, pos.y + 12, item.value, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '18px',
        color: item.color,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      telemetryContainer.add([tileGfx, label, val]);
    });

    // Primary Action Button (Resume)
    const resumeBtn = this.createModernButton(
      cx,
      cy + 85,
      360,
      48,
      'RESUME COMBAT',
      {
        bg: 0x0284c7,
        hoverBg: 0x38bdf8,
        stroke: 0x38bdf8,
        text: '#f8fafc',
        hoverText: '#0f172a'
      },
      () => this.resumeGame()
    );

    // Secondary Action Buttons Row
    const restartBtn = this.createModernButton(
      cx - 100,
      cy + 150,
      175,
      40,
      'RESTART RUN',
      {
        bg: 0x171e2e,
        hoverBg: 0xf59e0b,
        stroke: 0x334155,
        text: '#f59e0b',
        hoverText: '#0f172a'
      },
      () => {
        this.pauseModalContainer?.destroy();
        GameStateManager.getInstance().setPaused(false);
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('GameScene');
        this.scene.start('UIScene');
      }
    );

    const menuBtn = this.createModernButton(
      cx + 100,
      cy + 155,
      170,
      38,
      'MAIN MENU',
      {
        bg: 0x171e2e,
        hoverBg: 0x334155,
        stroke: 0x334155,
        text: '#94a3b8',
        hoverText: '#f8fafc'
      },
      () => {
        this.pauseModalContainer?.destroy();
        GameStateManager.getInstance().setPaused(false);
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      }
    );

    this.pauseModalContainer.add([
      overlay,
      chassisGfx,
      badgeGfx,
      headerBadge,
      title,
      hint,
      telemetryContainer,
      resumeBtn,
      restartBtn,
      menuBtn
    ]);
  }

  private resumeGame(): void {
    if (!GameStateManager.getInstance().isPaused()) return;

    GameStateManager.getInstance().setPaused(false);
    if (this.pauseModalContainer) {
      this.pauseModalContainer.destroy();
      this.pauseModalContainer = undefined;
    }
    this.scene.resume('GameScene');
  }

  private updateHUD(): void {
    const state = GameStateManager.getInstance().getRunState();

    this.levelValText.setText(`${state.level}`);
    this.scoreText.setText(`SCORE: ${state.score.toLocaleString()}`);
    this.waveText.setText(`WAVE ${state.wave}`);
    this.hpText.setText(`${Math.max(0, Math.floor(state.playerHp))} / ${state.maxPlayerHp}`);
    this.xpText.setText(`${state.currentXp} / ${state.requiredXp}`);

    // Modern Rounded Health Bar (x: 78, y: 33, width: 242, height: 6)
    this.hpBarGfx.clear();
    this.hpBarGfx.fillStyle(0x1e293b, 0.95);
    this.hpBarGfx.fillRoundedRect(78, 33, 242, 6, 3);

    const hpRatio = Math.max(0, Math.min(1, state.playerHp / state.maxPlayerHp));
    if (hpRatio > 0) {
      this.hpBarGfx.fillStyle(0xf43f5e, 1.0);
      this.hpBarGfx.fillRoundedRect(78, 33, Math.max(4, 242 * hpRatio), 6, 3);
    }

    // Modern Rounded XP Bar (x: 78, y: 57, width: 242, height: 4)
    this.xpBarGfx.clear();
    this.xpBarGfx.fillStyle(0x141b2b, 0.95);
    this.xpBarGfx.fillRoundedRect(78, 57, 242, 4, 2);

    const xpRatio = Math.max(0, Math.min(1, state.currentXp / state.requiredXp));
    if (xpRatio > 0) {
      this.xpBarGfx.fillStyle(0x38bdf8, 1.0);
      this.xpBarGfx.fillRoundedRect(78, 57, Math.max(3, 242 * xpRatio), 4, 2);
    }
  }

  private onScoreUpdated(data: { score: number }): void {
    this.scoreText.setText(`SCORE: ${data.score}`);
  }

  private onLevelUp(_data: { level: number }): void {
    AudioService.playLevelUp();
    this.updateHUD();
  }

  /* -------------------------------------------------------------
   * MODERN UPGRADE TERMINAL MODAL
   * ------------------------------------------------------------- */
  private async showUpgradeModal(): Promise<void> {
    const { width, height } = this.scale;
    this.scene.pause('GameScene');

    AudioService.playWaveClear();

    if (this.upgradeModalContainer) {
      this.upgradeModalContainer.destroy();
    }

    this.upgradeModalContainer = this.add.container(0, 0);
    this.upgradeModalContainer.setDepth(1000);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x050813, 0.94);

    const cx = width / 2;
    const cy = height / 2;
    const mWidth = 680;
    const mHeight = 520;

    // Rounded Modern Modal Chassis (16px radius)
    const chassisGfx = this.add.graphics();
    chassisGfx.fillStyle(0x0a0f1d, 0.99);
    chassisGfx.fillRoundedRect(cx - mWidth / 2, cy - mHeight / 2, mWidth, mHeight, 16);
    chassisGfx.lineStyle(1, 0x1e293b, 1.0);
    chassisGfx.strokeRoundedRect(cx - mWidth / 2, cy - mHeight / 2, mWidth, mHeight, 16);

    // Top accent line
    chassisGfx.lineStyle(2, 0x38bdf8, 0.7);
    chassisGfx.strokeLineShape(new Phaser.Geom.Line(cx - 90, cy - mHeight / 2, cx + 90, cy - mHeight / 2));

    // Header Pill Badge (Spacious 230px wide pill, generous padding)
    const badgeW = 230;
    const badgeH = 26;
    const badgeY = cy - 212;
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(0x0c2742, 0.95);
    badgeGfx.fillRoundedRect(cx - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 13);
    badgeGfx.lineStyle(1, 0x38bdf8, 0.85);
    badgeGfx.strokeRoundedRect(cx - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 13);

    const topBadge = this.add.text(cx, badgeY, 'NEURAL UPGRADE MATRIX', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      color: '#38bdf8',
      fontStyle: 'bold',
      letterSpacing: 1.3
    }).setOrigin(0.5);

    const title = this.add.text(cx, cy - 168, 'Choose System Upgrade', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '28px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const subtitle = this.add.text(cx, cy - 134, 'Select 1 hardware or algorithmic protocol to integrate.', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.upgradeModalContainer.add([overlay, chassisGfx, badgeGfx, topBadge, title, subtitle]);

    const choices: UpgradeOption[] = await UpgradeSystem.generateUpgradeChoices();

    choices.forEach((choice, index) => {
      const cardY = cy - 54 + index * 104;
      const isAI = choice.isAiGenerated;
      const isArsenal = !isAI && (choice.id.startsWith('weapon_') || choice.title.startsWith('Arsenal:'));

      let cardStroke = 0x1e293b;
      let badgeBg = 0x261b09;
      let badgeStroke = 0xf59e0b;
      let badgeText = 'CORE OVERCLOCK';
      let badgeColor = '#f59e0b';

      if (isAI) {
        cardStroke = 0x143452;
        badgeBg = 0x0c2742;
        badgeStroke = 0x38bdf8;
        badgeText = 'NEURAL CORE // AI';
        badgeColor = '#38bdf8';
      } else if (isArsenal) {
        cardStroke = 0x3b2450;
        badgeBg = 0x271438;
        badgeStroke = 0xc084fc;
        badgeText = 'WEAPON PROTOCOL';
        badgeColor = '#c084fc';
      }

      const cardContainer = this.add.container(cx, cardY);
      const cardW = 620;
      const cardH = 92;

      const cardGfx = this.add.graphics();
      const drawCard = (hover: boolean) => {
        cardGfx.clear();
        if (hover) {
          cardGfx.fillStyle(badgeStroke, 0.15);
          cardGfx.fillRoundedRect(-cardW / 2 - 2, -cardH / 2 - 2, cardW + 4, cardH + 4, 14);
        }
        cardGfx.fillStyle(hover ? 0x131d33 : 0x0f172a, 1.0);
        cardGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
        cardGfx.lineStyle(hover ? 1.5 : 1.0, hover ? badgeStroke : cardStroke, 1.0);
        cardGfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);

        // Badge pill (Spacious 145px width with generous text padding)
        cardGfx.fillStyle(badgeBg, 0.95);
        cardGfx.fillRoundedRect(-cardW / 2 + 16, -cardH / 2 + 12, 145, 22, 6);
        cardGfx.lineStyle(1, badgeStroke, 0.8);
        cardGfx.strokeRoundedRect(-cardW / 2 + 16, -cardH / 2 + 12, 145, 22, 6);
      };

      drawCard(false);

      const badge = this.add.text(-cardW / 2 + 88, -cardH / 2 + 23, badgeText, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px',
        color: badgeColor,
        fontStyle: 'bold',
        letterSpacing: 0.8
      }).setOrigin(0.5);

      let cleanTitle = choice.title.replace(/^\[AI\]\s*/i, '').replace(/^Arsenal:\s*/i, '');
      const titleObj = this.add.text(-cardW / 2 + 172, -cardH / 2 + 23, cleanTitle, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '16px',
        color: '#f8fafc',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const statMatch = choice.description.match(/\(([^)]+)\)$/);
      let loreText = choice.description;
      let statPillText = '';

      if (statMatch) {
        statPillText = statMatch[1];
        loreText = choice.description.replace(/\s*\([^)]+\)$/, '').trim();
      }

      const descObj = this.add.text(-cardW / 2 + 18, 14, loreText, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
        wordWrap: { width: statPillText ? 430 : 580 }
      }).setOrigin(0, 0.5);

      cardContainer.add([cardGfx, badge, titleObj, descObj]);

      // Stat pill on right side if applicable
      if (statPillText) {
        const pillGfx = this.add.graphics();
        pillGfx.fillStyle(0x0a101f, 0.95);
        pillGfx.fillRoundedRect(cardW / 2 - 150, -16, 134, 32, 6);
        pillGfx.lineStyle(1, badgeStroke, 0.6);
        pillGfx.strokeRoundedRect(cardW / 2 - 150, -16, 134, 32, 6);

        const pillTextObj = this.add.text(cardW / 2 - 83, 0, statPillText, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: badgeColor,
          fontStyle: 'bold'
        }).setOrigin(0.5);

        cardContainer.add([pillGfx, pillTextObj]);
      }

      const hitZone = this.add.zone(0, 0, cardW, cardH)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerover', () => {
        AudioService.playUpgradeHover();
        drawCard(true);
        this.tweens.add({
          targets: cardContainer,
          scaleX: 1.015,
          scaleY: 1.015,
          duration: 100,
          ease: 'Cubic.easeOut'
        });
      });

      hitZone.on('pointerout', () => {
        drawCard(false);
        this.tweens.add({
          targets: cardContainer,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 100,
          ease: 'Cubic.easeOut'
        });
      });

      hitZone.on('pointerdown', () => {
        AudioService.playUpgradeSelect();
        cardGfx.fillStyle(0xffffff, 0.9);
        cardGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);

        this.time.delayedCall(150, () => {
          choice.apply();
          this.upgradeModalContainer?.destroy();
          GameStateManager.getInstance().advanceWave();
          this.scene.resume('GameScene');
        });
      });

      cardContainer.add(hitZone);
      this.upgradeModalContainer!.add(cardContainer);
    });
  }

  /* -------------------------------------------------------------
   * MODERN MUTATOR & NEMESIS FLOATING PILL BANNERS
   * ------------------------------------------------------------- */
  private showMutatorBanner(mutator: WaveMutator): void {
    const { width } = this.scale;
    const bannerContainer = this.add.container(width / 2, 68);
    bannerContainer.setDepth(50);

    const bW = 620;
    const bH = 42;
    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x0f172a, 0.98);
    bgGfx.fillRoundedRect(-bW / 2, -bH / 2, bW, bH, 8);
    bgGfx.lineStyle(1, 0xf59e0b, 0.8);
    bgGfx.strokeRoundedRect(-bW / 2, -bH / 2, bW, bH, 8);

    const tag = this.add.text(-bW / 2 + 16, 0, '[ WAVE MUTATOR ]', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const text = this.add.text(-bW / 2 + 130, 0, `${mutator.title}: ${mutator.description}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#f8fafc',
      wordWrap: { width: 470 }
    }).setOrigin(0, 0.5);

    bannerContainer.add([bgGfx, tag, text]);
    bannerContainer.setAlpha(0);

    this.tweens.add({
      targets: bannerContainer,
      alpha: 1,
      duration: 250,
      hold: 4200,
      yoyo: true,
      onComplete: () => bannerContainer.destroy()
    });
  }

  private showNemesisBanner(nemesis: NemesisBossMutator): void {
    const { width } = this.scale;
    const bannerContainer = this.add.container(width / 2, 68);
    bannerContainer.setDepth(50);

    const bW = 640;
    const bH = 46;
    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x180d1e, 0.98);
    bgGfx.fillRoundedRect(-bW / 2, -bH / 2, bW, bH, 8);
    bgGfx.lineStyle(1, 0xf43f5e, 0.9);
    bgGfx.strokeRoundedRect(-bW / 2, -bH / 2, bW, bH, 8);

    const tag = this.add.text(-bW / 2 + 16, 0, '[ ⚠ NEMESIS BOSS ]', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#f43f5e',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const text = this.add.text(
      -bW / 2 + 140,
      0,
      `${nemesis.bossTitle} — ${nemesis.lore} (+${Math.round((nemesis.bossHealthMultiplier - 1) * 100)}% Health)`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#f8fafc',
        wordWrap: { width: 480 }
      }
    ).setOrigin(0, 0.5);

    bannerContainer.add([bgGfx, tag, text]);
    bannerContainer.setAlpha(0);

    this.tweens.add({
      targets: bannerContainer,
      alpha: 1,
      duration: 300,
      hold: 5000,
      yoyo: true,
      onComplete: () => bannerContainer.destroy()
    });
  }

  /* -------------------------------------------------------------
   * MODERN MISSION DEBRIEFING / SYSTEM DEFEAT MODAL
   * ------------------------------------------------------------- */
  private showGameOverModal(data: { score: number; wave: number; kills: number }): void {
    const { width, height } = this.scale;
    this.scene.pause('GameScene');

    AudioService.stopBgm();
    AudioService.playGameOverJingle();

    if (this.gameOverContainer) {
      this.gameOverContainer.destroy();
    }

    this.gameOverContainer = this.add.container(0, 0);
    this.gameOverContainer.setDepth(1000);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x050813, 0.95);

    const cx = width / 2;
    const cy = height / 2;
    const mWidth = 620;
    const mHeight = 490;

    // Rounded Modern Modal Chassis (16px radius)
    const chassisGfx = this.add.graphics();
    chassisGfx.fillStyle(0x0c0b16, 0.99);
    chassisGfx.fillRoundedRect(cx - mWidth / 2, cy - mHeight / 2, mWidth, mHeight, 16);
    chassisGfx.lineStyle(1, 0x271929, 1.0);
    chassisGfx.strokeRoundedRect(cx - mWidth / 2, cy - mHeight / 2, mWidth, mHeight, 16);

    // Top subtle rose accent line
    chassisGfx.lineStyle(2, 0xf43f5e, 0.7);
    chassisGfx.strokeLineShape(new Phaser.Geom.Line(cx - 80, cy - mHeight / 2, cx + 80, cy - mHeight / 2));

    // Modern Header Pill Badge (Spacious 200px pill with proper text padding)
    const badgeW = 200;
    const badgeH = 26;
    const badgeY = cy - 200;
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(0x38121d, 0.95);
    badgeGfx.fillRoundedRect(cx - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 13);
    badgeGfx.lineStyle(1, 0xf43f5e, 0.85);
    badgeGfx.strokeRoundedRect(cx - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 13);

    const sub = this.add.text(cx, badgeY, 'RUN TERMINATED', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      color: '#f43f5e',
      fontStyle: 'bold',
      letterSpacing: 1.3
    }).setOrigin(0.5);

    const title = this.add.text(cx, cy - 158, 'System Defeat', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '28px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const subtitle = this.add.text(cx, cy - 124, 'Chassis integrity failed. Mission debriefing archived.', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const personalBest = StorageService.getHighScore();
    const isNewRecord = data.score >= personalBest && data.score > 0;

    // Spacious 2x2 Telemetry Grid (255px width each tile, generous breathing room)
    const telemetryContainer = this.add.container(cx, cy - 30);
    const cardData = [
      { label: 'FINAL SCORE', value: data.score.toLocaleString(), color: '#38bdf8', border: 0x143452 },
      {
        label: isNewRecord ? '★ NEW RECORD!' : 'PERSONAL BEST',
        value: Math.max(data.score, personalBest).toLocaleString(),
        color: '#f59e0b',
        border: 0x3d2b0e
      },
      { label: 'WAVES CLEARED', value: `${data.wave}`, color: '#c084fc', border: 0x3b2450 },
      { label: 'ENEMIES PURGED', value: `${data.kills}`, color: '#34d399', border: 0x133827 }
    ];

    const tileW = 255;
    const tileH = 64;
    const gapX = 14;
    const gapY = 12;

    const positions = [
      { x: -tileW / 2 - gapX / 2, y: -tileH / 2 - gapY / 2 },
      { x: tileW / 2 + gapX / 2, y: -tileH / 2 - gapY / 2 },
      { x: -tileW / 2 - gapX / 2, y: tileH / 2 + gapY / 2 },
      { x: tileW / 2 + gapX / 2, y: tileH / 2 + gapY / 2 }
    ];

    cardData.forEach((item, idx) => {
      const pos = positions[idx];
      const tileGfx = this.add.graphics();
      tileGfx.fillStyle(0x131322, 0.95);
      tileGfx.fillRoundedRect(pos.x - tileW / 2, pos.y - tileH / 2, tileW, tileH, 10);
      tileGfx.lineStyle(1, item.border, 1.0);
      tileGfx.strokeRoundedRect(pos.x - tileW / 2, pos.y - tileH / 2, tileW, tileH, 10);

      const label = this.add.text(pos.x - tileW / 2 + 18, pos.y - 12, item.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#94a3b8',
        fontStyle: '600',
        letterSpacing: 1
      }).setOrigin(0, 0.5);

      const val = this.add.text(pos.x - tileW / 2 + 18, pos.y + 12, item.value, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '18px',
        color: item.color,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      telemetryContainer.add([tileGfx, label, val]);
    });

    // Primary Action Button (Deploy Again)
    const restartBtn = this.createModernButton(
      cx,
      cy + 85,
      360,
      48,
      'DEPLOY AGAIN',
      {
        bg: 0x0284c7,
        hoverBg: 0x38bdf8,
        stroke: 0x38bdf8,
        text: '#f8fafc',
        hoverText: '#0f172a'
      },
      () => {
        LeaderboardService.submitScore('CyberSamurai', data.score, data.wave, data.kills);
        this.gameOverContainer?.destroy();
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('GameScene');
        this.scene.start('UIScene');
      }
    );

    // Secondary Action Button (Main Menu)
    const menuBtn = this.createModernButton(
      cx,
      cy + 150,
      240,
      40,
      'RETURN TO MAIN MENU',
      {
        bg: 0x171e2e,
        hoverBg: 0x334155,
        stroke: 0x334155,
        text: '#94a3b8',
        hoverText: '#f8fafc'
      },
      () => {
        LeaderboardService.submitScore('CyberSamurai', data.score, data.wave, data.kills);
        this.gameOverContainer?.destroy();
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      }
    );

    this.gameOverContainer.add([
      overlay,
      chassisGfx,
      badgeGfx,
      sub,
      title,
      subtitle,
      telemetryContainer,
      restartBtn,
      menuBtn
    ]);
  }
}
