import Phaser from 'phaser';
import { GameStateManager } from '../systems/GameStateManager';
import { EventBus } from '../systems/EventBus';
import { UpgradeSystem, UpgradeOption } from '../systems/UpgradeSystem';
import { LeaderboardService } from '../services/LeaderboardService';

export class UIScene extends Phaser.Scene {
  private hpBarGfx!: Phaser.GameObjects.Graphics;
  private xpBarGfx!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private upgradeModalContainer?: Phaser.GameObjects.Container;
  private gameOverContainer?: Phaser.GameObjects.Container;
  private pauseModalContainer?: Phaser.GameObjects.Container;

  constructor() {
    super('UIScene');
  }

  public create(): void {
    const { width } = this.scale;

    // HUD Graphics
    this.hpBarGfx = this.add.graphics();
    this.xpBarGfx = this.add.graphics();

    // HUD Texts
    this.levelText = this.add.text(16, 16, 'LVL 1', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '18px',
      color: '#00F0FF',
      fontStyle: 'bold'
    });

    this.scoreText = this.add.text(width - 16, 16, 'SCORE: 0', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    this.waveText = this.add.text(width / 2, 16, 'WAVE 1', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '22px',
      color: '#FF007F',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Pause HUD Button
    const pauseHUD = this.add.text(width - 16, 48, 'PAUSE [ESC/SPACE]', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '12px',
      color: '#00F0FF',
      backgroundColor: '#1A1D2E',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    pauseHUD.on('pointerdown', () => this.togglePause());
    pauseHUD.on('pointerover', () => pauseHUD.setStyle({ color: '#FF007F' }));
    pauseHUD.on('pointerout', () => pauseHUD.setStyle({ color: '#00F0FF' }));

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

  private pauseGame(): void {
    if (GameStateManager.getInstance().isPaused()) return;

    GameStateManager.getInstance().setPaused(true);
    this.scene.pause('GameScene');

    const { width, height } = this.scale;
    if (this.pauseModalContainer) {
      this.pauseModalContainer.destroy();
    }

    this.pauseModalContainer = this.add.container(0, 0);

    // Dark semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0d0f18, 0.85);

    // Pause card container
    const cardBg = this.add.rectangle(width / 2, height / 2, 480, 340, 0x1a1d2e, 0.95);
    cardBg.setStrokeStyle(2, 0x00f0ff);

    const title = this.add.text(width / 2, height / 2 - 120, 'GAME PAUSED', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '32px',
      color: '#00F0FF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const state = GameStateManager.getInstance().getRunState();

    const statsText = this.add.text(width / 2, height / 2 - 45,
      `WAVE ${state.wave}  •  LEVEL ${state.level}\nSCORE: ${state.score}  •  KILLS: ${state.kills}`, {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '16px',
      color: '#FFD700',
      align: 'center'
    }).setOrigin(0.5);

    const hintText = this.add.text(width / 2, height / 2 + 15, 'Press ESC or SPACE to Resume', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#F0F4F8',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Resume button
    const resumeBtn = this.add.text(width / 2, height / 2 + 70, 'RESUME GAME', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '20px',
      color: '#00F0FF',
      backgroundColor: '#0D0F18',
      padding: { x: 24, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerover', () => resumeBtn.setStyle({ color: '#FF007F', backgroundColor: '#2A2F4A' }));
    resumeBtn.on('pointerout', () => resumeBtn.setStyle({ color: '#00F0FF', backgroundColor: '#0D0F18' }));
    resumeBtn.on('pointerdown', () => this.resumeGame());

    // Restart button
    const restartBtn = this.add.text(width / 2 - 90, height / 2 + 130, 'RESTART', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#FFD700',
      backgroundColor: '#0D0F18',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setStyle({ color: '#FFFFFF', backgroundColor: '#2A2F4A' }));
    restartBtn.on('pointerout', () => restartBtn.setStyle({ color: '#FFD700', backgroundColor: '#0D0F18' }));
    restartBtn.on('pointerdown', () => {
      this.pauseModalContainer?.destroy();
      GameStateManager.getInstance().setPaused(false);
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });

    // Main menu button
    const menuBtn = this.add.text(width / 2 + 90, height / 2 + 130, 'MAIN MENU', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#FF007F',
      backgroundColor: '#0D0F18',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setStyle({ color: '#FFFFFF', backgroundColor: '#2A2F4A' }));
    menuBtn.on('pointerout', () => menuBtn.setStyle({ color: '#FF007F', backgroundColor: '#0D0F18' }));
    menuBtn.on('pointerdown', () => {
      this.pauseModalContainer?.destroy();
      GameStateManager.getInstance().setPaused(false);
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });

    this.pauseModalContainer.add([overlay, cardBg, title, statsText, hintText, resumeBtn, restartBtn, menuBtn]);
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

    this.levelText.setText(`LVL ${state.level}`);
    this.scoreText.setText(`SCORE: ${state.score}`);
    this.waveText.setText(`WAVE ${state.wave}`);

    // Health Bar (Neon Magenta)
    this.hpBarGfx.clear();
    this.hpBarGfx.fillStyle(0x1a1d2e, 0.8);
    this.hpBarGfx.fillRect(90, 16, 200, 16);
    const hpRatio = state.playerHp / state.maxPlayerHp;
    this.hpBarGfx.fillStyle(0xff007f, 1);
    this.hpBarGfx.fillRect(90, 16, 200 * hpRatio, 16);

    // XP Bar (Neon Cyan)
    this.xpBarGfx.clear();
    this.xpBarGfx.fillStyle(0x1a1d2e, 0.8);
    this.xpBarGfx.fillRect(90, 36, 200, 8);
    const xpRatio = state.currentXp / state.requiredXp;
    this.xpBarGfx.fillStyle(0x00f0ff, 1);
    this.xpBarGfx.fillRect(90, 36, 200 * xpRatio, 8);
  }

  private onScoreUpdated(data: { score: number }): void {
    this.scoreText.setText(`SCORE: ${data.score}`);
  }

  private onLevelUp(_data: { level: number }): void {
    this.updateHUD();
  }

  private showUpgradeModal(): void {
    const { width, height } = this.scale;
    this.scene.pause('GameScene');

    if (this.upgradeModalContainer) {
      this.upgradeModalContainer.destroy();
    }

    this.upgradeModalContainer = this.add.container(0, 0);

    // Overlay
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0d0f18, 0.85);
    const title = this.add.text(width / 2, height / 4, 'CHOOSE UPGRADE', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '36px',
      color: '#00F0FF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.upgradeModalContainer.add([bg, title]);

    const choices: UpgradeOption[] = UpgradeSystem.generateUpgradeChoices();
    choices.forEach((choice, index) => {
      const cardY = height / 2 + (index - 1) * 90;
      const cardBg = this.add.rectangle(width / 2, cardY, 450, 70, 0x1a1d2e, 1.0)
        .setInteractive({ useHandCursor: true });

      const cardTitle = this.add.text(width / 2, cardY - 14, choice.title, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#FFD700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const cardDesc = this.add.text(width / 2, cardY + 14, choice.description, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#F0F4F8'
      }).setOrigin(0.5);

      cardBg.on('pointerover', () => cardBg.setFillStyle(0x2a2f4a));
      cardBg.on('pointerout', () => cardBg.setFillStyle(0x1a1d2e));
      cardBg.on('pointerdown', () => {
        choice.apply();
        this.upgradeModalContainer?.destroy();
        GameStateManager.getInstance().advanceWave();
        this.scene.resume('GameScene');
      });

      this.upgradeModalContainer!.add([cardBg, cardTitle, cardDesc]);
    });
  }

  private showGameOverModal(data: { score: number; wave: number; kills: number }): void {
    const { width, height } = this.scale;
    this.scene.pause('GameScene');

    if (this.gameOverContainer) {
      this.gameOverContainer.destroy();
    }

    this.gameOverContainer = this.add.container(0, 0);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0d0f18, 0.95);
    const title = this.add.text(width / 2, height / 4, 'SYSTEM OVERRIDE — GAME OVER', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '36px',
      color: '#FF007F',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const stats = this.add.text(width / 2, height / 2 - 20, 
      `FINAL SCORE: ${data.score}\nWAVES SURVIVED: ${data.wave}\nKILLS: ${data.kills}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#00F0FF',
      align: 'center'
    }).setOrigin(0.5);

    const restartBtn = this.add.text(width / 2, height / 2 + 100, 'RESTART RUN', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      color: '#00F0FF',
      backgroundColor: '#1A1D2E',
      padding: { x: 30, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => {
      LeaderboardService.submitScore('CyberSamurai', data.score, data.wave, data.kills);
      this.gameOverContainer?.destroy();
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });

    this.gameOverContainer.add([bg, title, stats, restartBtn]);
  }
}
