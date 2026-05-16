/**
 * PreloadScene — Beautiful loading screen with progress bar.
 */
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Background
    this.cameras.main.setBackgroundColor('#0a0e27');

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 60, '💌', {
      fontSize: '48px',
    }).setOrigin(0.5);

    // Floating animation for emoji
    this.tweens.add({
      targets: loadingText,
      y: loadingText.y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const title = this.add.text(width / 2, height / 2, '记忆迷宫', {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '28px',
      color: '#f1f0ff',
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 + 40, '加载中...', {
      fontFamily: '"Inter", sans-serif',
      fontSize: '14px',
      color: '#e8a87c',
    }).setOrigin(0.5);

    // Progress bar background
    const barBg = this.add.rectangle(width / 2, height / 2 + 80, 300, 4, 0x1a1f4e).setOrigin(0.5);
    const barFill = this.add.rectangle(width / 2 - 150, height / 2 + 80, 0, 4, 0xe8a87c).setOrigin(0, 0.5);

    // Simulate loading progress
    this.load.on('progress', (value) => {
      barFill.width = 300 * value;
    });

    // Generate placeholder textures
    this.createPlaceholderAssets();

    // Load user-provided memory photos so scenes can use them as backgrounds.
    const config = window.__MEMORYMAZE_GAME_CONFIG__;
    const levels = config?.levels || [];
    levels.forEach((level, index) => {
      const background = level.background || level.photos?.[0];
      if (background && /^(data:image|https?:\/\/)/.test(background)) {
        this.load.setCORS('anonymous');
        this.load.image(`memory-photo-${index}`, background);
      }
    });
  }

  createPlaceholderAssets() {
    // Generate textures programmatically since we don't have actual image files
    
    // Particle texture - small glowing circle
    const particleGfx = this.make.graphics({ x: 0, y: 0, add: false });
    particleGfx.fillStyle(0xffffff, 1);
    particleGfx.fillCircle(8, 8, 8);
    particleGfx.generateTexture('particle', 16, 16);
    particleGfx.destroy();

    // Heart particle
    const heartGfx = this.make.graphics({ x: 0, y: 0, add: false });
    heartGfx.fillStyle(0xe8a87c, 1);
    heartGfx.fillCircle(6, 5, 5);
    heartGfx.fillCircle(14, 5, 5);
    heartGfx.fillTriangle(1, 8, 19, 8, 10, 18);
    heartGfx.generateTexture('heart', 20, 20);
    heartGfx.destroy();

    // Star particle
    const starGfx = this.make.graphics({ x: 0, y: 0, add: false });
    starGfx.fillStyle(0xf0c27f, 1);
    const cx = 10, cy = 10, spikes = 5, outerR = 10, innerR = 4;
    starGfx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) starGfx.moveTo(px, py);
      else starGfx.lineTo(px, py);
    }
    starGfx.closePath();
    starGfx.fillPath();
    starGfx.generateTexture('star', 20, 20);
    starGfx.destroy();

    // Glow circle for interactive items
    const glowGfx = this.make.graphics({ x: 0, y: 0, add: false });
    glowGfx.fillStyle(0xe8a87c, 0.3);
    glowGfx.fillCircle(32, 32, 32);
    glowGfx.fillStyle(0xe8a87c, 0.6);
    glowGfx.fillCircle(32, 32, 16);
    glowGfx.fillStyle(0xffffff, 0.8);
    glowGfx.fillCircle(32, 32, 6);
    glowGfx.generateTexture('glow', 64, 64);
    glowGfx.destroy();

    // Button texture
    const btnGfx = this.make.graphics({ x: 0, y: 0, add: false });
    btnGfx.fillStyle(0xe8a87c, 1);
    btnGfx.fillRoundedRect(0, 0, 200, 50, 25);
    btnGfx.generateTexture('button', 200, 50);
    btnGfx.destroy();

    // Dark overlay
    const overlayGfx = this.make.graphics({ x: 0, y: 0, add: false });
    overlayGfx.fillStyle(0x000000, 0.7);
    overlayGfx.fillRect(0, 0, 4, 4);
    overlayGfx.generateTexture('overlay', 4, 4);
    overlayGfx.destroy();
  }

  create() {
    // Short delay then go to menu
    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(500, 10, 14, 39);
      this.time.delayedCall(500, () => {
        this.scene.start('MenuScene');
      });
    });
  }
}
