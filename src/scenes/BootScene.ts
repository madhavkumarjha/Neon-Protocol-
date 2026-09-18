import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // Generate programmatic textures for graphics (No missing asset errors)
    this.createPlaceholderTextures();
  }

  public create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40, 'NEON PROTOCOL', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '48px',
      color: '#00F0FF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const prompt = this.add.text(width / 2, height / 2 + 40, '[ CLICK / TOUCH TO START ]', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#FF007F'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.input.once('pointerdown', () => {
      // Audio context unlock on first touch/click
      if (this.sound.locked) {
        this.sound.unlock();
      }
      this.scene.start('MenuScene');
    });
  }

  private createPlaceholderTextures(): void {
    // Player texture (Cyan triangle/ship)
    const playerGfx = this.make.graphics({ x: 0, y: 0 });
    playerGfx.fillStyle(0x00f0ff, 1);
    playerGfx.fillTriangle(32, 16, 0, 0, 0, 32);
    playerGfx.generateTexture('player', 32, 32);

    // Enemy texture (Red/Magenta circle)
    const enemyGfx = this.make.graphics({ x: 0, y: 0 });
    enemyGfx.fillStyle(0xff007f, 1);
    enemyGfx.fillCircle(16, 16, 16);
    enemyGfx.generateTexture('enemy', 32, 32);

    // Projectile texture (Small Cyan rectangle)
    const bulletGfx = this.make.graphics({ x: 0, y: 0 });
    bulletGfx.fillStyle(0x00f0ff, 1);
    bulletGfx.fillRect(0, 0, 12, 4);
    bulletGfx.generateTexture('bullet', 12, 4);

    // XP Gem texture (Small Gold Diamond)
    const xpGfx = this.make.graphics({ x: 0, y: 0 });
    xpGfx.fillStyle(0xffd700, 1);
    xpGfx.fillTriangle(8, 0, 0, 8, 8, 16);
    xpGfx.fillTriangle(8, 0, 16, 8, 8, 16);
    xpGfx.generateTexture('xp_gem', 16, 16);
  }
}
