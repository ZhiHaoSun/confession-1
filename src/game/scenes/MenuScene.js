/**
 * MenuScene — Romantic title screen with floating particles and start button.
 */
import Phaser from 'phaser';
import { t } from '../../i18n/i18n.js';
import { GAME_THEME } from '../GameTheme.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const config = this.registry.get('gameConfig');
    
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfffaf6, 0xffe8e6, 0xfff4ed, 0xfbe0d7, 1, 1, 1, 1);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0xffffff, 0.28);
    bg.fillCircle(width * 0.2, height * 0.18, 150);
    bg.fillStyle(GAME_THEME.int.peach, 0.12);
    bg.fillCircle(width * 0.82, height * 0.76, 180);

    this.cameras.main.fadeIn(800, ...GAME_THEME.fade);

    // Starfield background
    for (let i = 0; i < 80; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(0.5, 2),
        Phaser.Math.Between(0, 1) > 0.5 ? GAME_THEME.int.gold : GAME_THEME.int.rose,
        Phaser.Math.FloatBetween(0.22, 0.55)
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
    const glow = this.add.circle(width / 2, height / 2 - 20, 140, GAME_THEME.int.accent, 0.08);
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
    const title = config?.meta?.title || t('game.menuTitle');
    this.add.text(width / 2, height * 0.42, title, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '32px',
      color: GAME_THEME.hex.ink,
      align: 'center',
      wordWrap: { width: width * 0.8 },
    }).setOrigin(0.5);

    // Subtitle
    const receiverName = config?.characters?.receiver?.name || t('generate.you');
    this.add.text(width / 2, height * 0.52, t('game.menuSubtitle', { name: receiverName }), {
      fontFamily: '"Inter", sans-serif',
      fontSize: '16px',
      color: GAME_THEME.hex.accent,
    }).setOrigin(0.5);

    // Decorative line
    const line = this.add.rectangle(width / 2, height * 0.58, 60, 1, GAME_THEME.int.accent, 0.45);

    // Start button
    const btnBg = this.add.rectangle(width / 2, height * 0.72, 220, 52, GAME_THEME.int.accent, 1)
      .setInteractive({ useHandCursor: true });
    
    // Rounded corners effect
    btnBg.setStrokeStyle(0);
    
    const btnText = this.add.text(width / 2, height * 0.72, t('game.menuStart'), {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '18px',
      color: GAME_THEME.hex.white,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Button glow
    const btnGlow = this.add.rectangle(width / 2, height * 0.72, 230, 62, GAME_THEME.int.accent, 0.18);
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
      this.cameras.main.fadeOut(600, ...GAME_THEME.fade);
      this.time.delayedCall(600, () => {
        this.scene.start('LevelScene', { levelIndex: 0 });
      });
    });

    const mazeId = config?.meta?.mazeId;
    const editButtonTargets = [];
    if (mazeId) {
      const editY = height * 0.81;
      const editBg = this.add.rectangle(width / 2, editY, 190, 38, GAME_THEME.int.cream, 0.78)
        .setStrokeStyle(1, GAME_THEME.int.accent, 0.38)
        .setInteractive({ useHandCursor: true });
      const editText = this.add.text(width / 2, editY, 'Edit puzzle', {
        fontFamily: '"Inter", sans-serif',
        fontSize: '14px',
        color: GAME_THEME.hex.ink,
      }).setOrigin(0.5);

      editButtonTargets.push(editBg, editText);
      editBg.on('pointerover', () => {
        this.tweens.add({ targets: editButtonTargets, scaleX: 1.04, scaleY: 1.04, duration: 160, ease: 'Sine.easeOut' });
      });
      editBg.on('pointerout', () => {
        this.tweens.add({ targets: editButtonTargets, scaleX: 1, scaleY: 1, duration: 160, ease: 'Sine.easeOut' });
      });
      editBg.on('pointerdown', () => {
        window.location.href = `/?edit=${encodeURIComponent(mazeId)}`;
      });
    }

    // Footer hint
    this.add.text(width / 2, height * 0.9, t('game.menuHint'), {
      fontFamily: '"Inter", sans-serif',
      fontSize: '12px',
      color: GAME_THEME.hex.mutedInk,
    }).setOrigin(0.5);

    // Entry animation
    this.tweens.add({
      targets: [emoji, btnBg, btnText, btnGlow, ...editButtonTargets],
      alpha: { from: 0, to: 1 },
      y: '+=0',
      duration: 800,
      ease: 'Power2',
    });
  }
}
