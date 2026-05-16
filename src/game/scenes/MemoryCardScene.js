/**
 * MemoryCardScene — Overlay showing memory text card with photo and description.
 * Displayed after solving a puzzle to reveal the memory.
 */
import Phaser from 'phaser';

export class MemoryCardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MemoryCardScene' });
  }

  init(data) {
    this.levelData = data.level;
    this.rewardData = data.reward;
    this.onDoneCallback = data.onDone;
    this.descriptionPanel = null;
  }

  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyDescriptionPanel());

    // Dark overlay
    const overlay = this.add.rectangle(cx, height / 2, width, height, 0x0a0e27, 0.9)
      .setInteractive();

    this.cameras.main.fadeIn(400, 10, 14, 39);

    // Card container
    const cardW = Math.min(width * 0.8, 520);
    const cardH = Math.min(height * 0.82, 420);
    const cardY = height / 2;

    // Card background with glow
    const glow = this.add.rectangle(cx, cardY, cardW + 4, cardH + 4, 0xe8a87c, 0.2);
    const card = this.add.rectangle(cx, cardY, cardW, cardH, 0x111638, 0.98);
    card.setStrokeStyle(1, 0xe8a87c, 0.3);

    // Memory shard icon
    this.add.text(cx, cardY - cardH / 2 + 35, '💎', {
      fontSize: '32px',
    }).setOrigin(0.5);

    // Reward text
    const rewardText = this.rewardData?.text || '你找到了一段珍贵的记忆碎片';
    this.add.text(cx, cardY - cardH / 2 + 72, '记忆碎片已解锁', {
      fontFamily: '"Inter", sans-serif',
      fontSize: '12px',
      color: '#e8a87c',
      fontStyle: 'bold',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Divider
    this.add.rectangle(cx, cardY - cardH / 2 + 95, cardW * 0.6, 1, 0xe8a87c, 0.2);

    // Level title
    this.add.text(cx, cardY - cardH / 2 + 120, this.levelData.title, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '22px',
      color: '#f1f0ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Description text. Use a real DOM panel so long AI responses wrap and scroll
    // cleanly inside the card instead of overflowing the Phaser canvas text box.
    const descText = this.levelData.description || '';
    this.createDescriptionPanel(descText, {
      x: cx - cardW / 2 + 32,
      y: cardY - cardH / 2 + 152,
      width: cardW - 64,
      height: cardH - 255,
    });

    // Reward text at bottom
    const rewardLines = rewardText.split('\n');
    this.add.text(cx, cardY + cardH / 2 - 70, rewardLines[rewardLines.length - 1] || rewardText, {
      fontFamily: '"Inter", sans-serif',
      fontSize: '13px',
      color: '#f0c27f',
      wordWrap: { width: cardW - 60 },
      align: 'center',
    }).setOrigin(0.5);

    // Continue button
    const btnY = cardY + cardH / 2 - 25;
    const btnBg = this.add.rectangle(cx, btnY, 180, 40, 0xe8a87c, 1)
      .setInteractive({ useHandCursor: true });
    
    const btnText = this.add.text(cx, btnY, '继续探索 →', {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '15px',
      color: '#0a0e27',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      this.tweens.add({ targets: [btnBg, btnText], scaleX: 1.05, scaleY: 1.05, duration: 150 });
    });
    btnBg.on('pointerout', () => {
      this.tweens.add({ targets: [btnBg, btnText], scaleX: 1, scaleY: 1, duration: 150 });
    });

    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 10, 14, 39);
      this.time.delayedCall(400, () => {
        if (this.onDoneCallback) {
          this.scene.resume('LevelScene');
          this.onDoneCallback();
        }
        this.scene.stop();
      });
    });

    // Floating particles
    for (let i = 0; i < 12; i++) {
      const p = this.add.image(
        Phaser.Math.Between(cx - cardW / 2, cx + cardW / 2),
        Phaser.Math.Between(cardY - cardH / 2, cardY + cardH / 2),
        'star'
      ).setScale(0.3).setAlpha(0.1);
      
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(30, 60),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        delay: i * 300,
        onRepeat: () => {
          p.x = Phaser.Math.Between(cx - cardW / 2, cx + cardW / 2);
          p.y = Phaser.Math.Between(cardY, cardY + cardH / 2);
          p.alpha = 0.1;
        },
      });
    }

    // Entrance animation
    this.tweens.add({
      targets: [card, glow],
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });
  }

  createDescriptionPanel(text, rect) {
    const parent = this.game.canvas.parentElement;
    const panel = document.createElement('div');
    panel.textContent = text || '这是一段属于我们的珍贵回忆...';
    panel.style.cssText = `
      position: absolute;
      z-index: 12;
      color: rgba(241, 240, 255, 0.88);
      font-family: "Noto Serif SC", "Inter", serif;
      font-size: 15px;
      line-height: 1.85;
      text-align: left;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
      overflow-y: auto;
      padding: 2px 10px;
      box-sizing: border-box;
      scrollbar-width: thin;
      scrollbar-color: rgba(232, 168, 124, 0.6) rgba(255, 255, 255, 0.08);
      pointer-events: auto;
    `;

    parent.style.position = 'relative';
    parent.appendChild(panel);
    this.descriptionPanel = { el: panel, rect };

    this.positionDescriptionPanel();
    this.scale.on('resize', this.positionDescriptionPanel, this);
  }

  positionDescriptionPanel() {
    if (!this.descriptionPanel) return;

    const { el, rect } = this.descriptionPanel;
    const canvas = this.game.canvas;
    const parent = canvas.parentElement;
    const scaleX = canvas.clientWidth / this.cameras.main.width;
    const scaleY = canvas.clientHeight / this.cameras.main.height;
    const offsetX = (parent.clientWidth - canvas.clientWidth) / 2;
    const offsetY = (parent.clientHeight - canvas.clientHeight) / 2;

    el.style.left = `${offsetX + rect.x * scaleX}px`;
    el.style.top = `${offsetY + rect.y * scaleY}px`;
    el.style.width = `${rect.width * scaleX}px`;
    el.style.maxHeight = `${Math.max(88, rect.height * scaleY)}px`;
    el.style.fontSize = `${Math.max(12, 15 * scaleY)}px`;
  }

  destroyDescriptionPanel() {
    if (!this.descriptionPanel) return;
    this.scale.off('resize', this.positionDescriptionPanel, this);
    this.descriptionPanel.el.remove();
    this.descriptionPanel = null;
  }
}
