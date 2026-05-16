/**
 * MenuScene — Romantic title screen with floating particles and start button.
 */
import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const config = this.registry.get('gameConfig');
    
    this.cameras.main.fadeIn(800, 10, 14, 39);

    // Starfield background
    for (let i = 0; i < 80; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(0.5, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.7)
      );
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: star.alpha * 0.3 },
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Floating hearts
    for (let i = 0; i < 12; i++) {
      const heart = this.add.image(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(50, height - 50),
        'heart'
      ).setAlpha(0.15).setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      
      this.tweens.add({
        targets: heart,
        y: heart.y - Phaser.Math.Between(20, 50),
        x: heart.x + Phaser.Math.Between(-20, 20),
        alpha: 0.05,
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Central glow effect
    const glow = this.add.circle(width / 2, height / 2 - 20, 120, 0xe8a87c, 0.05);
    this.tweens.add({
      targets: glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.02,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Title emoji
    const emoji = this.add.text(width / 2, height * 0.25, '💌', {
      fontSize: '56px',
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: emoji,
      y: emoji.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Title
    const title = config?.meta?.title || '记忆迷宫';
    this.add.text(width / 2, height * 0.42, title, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '32px',
      color: '#f1f0ff',
      align: 'center',
      wordWrap: { width: width * 0.8 },
    }).setOrigin(0.5);

    // Subtitle
    const receiverName = config?.characters?.receiver?.name || '你';
    this.add.text(width / 2, height * 0.52, `专属于 ${receiverName} 的解谜冒险`, {
      fontFamily: '"Inter", sans-serif',
      fontSize: '16px',
      color: '#e8a87c',
    }).setOrigin(0.5);

    // Decorative line
    const line = this.add.rectangle(width / 2, height * 0.58, 60, 1, 0xe8a87c, 0.4);

    // Start button
    const btnBg = this.add.rectangle(width / 2, height * 0.72, 220, 52, 0xe8a87c, 1)
      .setInteractive({ useHandCursor: true });
    
    // Rounded corners effect
    btnBg.setStrokeStyle(0);
    
    const btnText = this.add.text(width / 2, height * 0.72, '✨ 开始探索', {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '18px',
      color: '#0a0e27',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Button glow
    const btnGlow = this.add.rectangle(width / 2, height * 0.72, 230, 62, 0xe8a87c, 0.15);
    this.tweens.add({
      targets: btnGlow,
      scaleX: 1.1,
      scaleY: 1.2,
      alpha: 0.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Button hover
    btnBg.on('pointerover', () => {
      this.tweens.add({ targets: [btnBg, btnText, btnGlow], scaleX: 1.05, scaleY: 1.05, duration: 200, ease: 'Back.easeOut' });
    });
    btnBg.on('pointerout', () => {
      this.tweens.add({ targets: [btnBg, btnText, btnGlow], scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
    });

    // Button click
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(600, 10, 14, 39);
      this.time.delayedCall(600, () => {
        this.scene.start('LevelScene', { levelIndex: 0 });
      });
    });

    // Footer hint
    this.add.text(width / 2, height * 0.9, '点击画面中发光的物品来探索记忆', {
      fontFamily: '"Inter", sans-serif',
      fontSize: '12px',
      color: 'rgba(241, 240, 255, 0.3)',
    }).setOrigin(0.5);

    // Entry animation
    this.tweens.add({
      targets: [emoji, btnBg, btnText, btnGlow],
      alpha: { from: 0, to: 1 },
      y: '+=0',
      duration: 800,
      ease: 'Power2',
    });
  }
}
