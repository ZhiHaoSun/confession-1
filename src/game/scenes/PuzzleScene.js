/**
 * PuzzleScene — Overlay scene for puzzle interactions.
 * Supports trivia questions, password locks, and hidden object hints.
 */
import Phaser from 'phaser';

export class PuzzleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PuzzleScene' });
  }

  init(data) {
    this.puzzleData = data.puzzle;
    this.rewardData = data.reward;
    this.levelIndex = data.levelIndex;
    this.itemIndex = data.itemIndex;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Dark overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0e27, 0.85)
      .setInteractive();

    // Puzzle container position
    const cx = width / 2;
    const cy = height / 2;

    switch (this.puzzleData.type) {
      case 'trivia':
        this.createTriviaPuzzle(cx, cy, width);
        break;
      case 'password':
        this.createPasswordPuzzle(cx, cy, width);
        break;
      case 'hidden':
        this.createHiddenPuzzle(cx, cy, width);
        break;
      default:
        this.createTriviaPuzzle(cx, cy, width);
    }

    // Close button
    const closeBtn = this.add.text(width - 40, 20, '✕', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0.5);

    closeBtn.on('pointerover', () => closeBtn.setAlpha(1));
    closeBtn.on('pointerout', () => closeBtn.setAlpha(0.5));
    closeBtn.on('pointerdown', () => this.closePuzzle(false));

    // Fade in
    this.cameras.main.fadeIn(300, 10, 14, 39);
  }

  createTriviaPuzzle(cx, cy, w) {
    const puzzle = this.puzzleData;

    // Card background
    const card = this.add.rectangle(cx, cy, Math.min(w * 0.75, 500), 320, 0x1a1f4e, 0.95);
    card.setStrokeStyle(1, 0xe8a87c, 0.3);

    // Question icon
    this.add.text(cx, cy - 120, '❓', { fontSize: '36px' }).setOrigin(0.5);

    // Question text
    this.add.text(cx, cy - 70, puzzle.question, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '18px',
      color: '#f1f0ff',
      wordWrap: { width: Math.min(w * 0.65, 420) },
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Hint
    if (puzzle.hint) {
      this.add.text(cx, cy - 15, `💡 提示: ${puzzle.hint}`, {
        fontFamily: '"Inter", sans-serif',
        fontSize: '13px',
        color: '#e8a87c',
        wordWrap: { width: Math.min(w * 0.6, 400) },
        align: 'center',
      }).setOrigin(0.5);
    }

    // Native HTML input for Chinese IME support
    // Phaser's keyboard system cannot handle IME composition,
    // so we overlay a real <input> on the canvas.
    const inputBg = this.add.rectangle(cx, cy + 40, 300, 44, 0x111638, 1)
      .setStrokeStyle(1, 0x333870);

    const htmlInput = document.createElement('input');
    htmlInput.type = 'text';
    htmlInput.placeholder = '输入答案...';
    htmlInput.style.cssText = `
      position: absolute;
      background: rgba(17, 22, 56, 0.95);
      border: 1px solid #333870;
      color: #f1f0ff;
      font-family: "Inter", "Noto Serif SC", sans-serif;
      font-size: 16px;
      text-align: center;
      outline: none;
      border-radius: 6px;
      padding: 0 12px;
      caret-color: #e8a87c;
      z-index: 10;
      box-sizing: border-box;
    `;
    htmlInput.addEventListener('focus', () => {
      htmlInput.style.borderColor = '#e8a87c';
    });
    htmlInput.addEventListener('blur', () => {
      htmlInput.style.borderColor = '#333870';
    });
    htmlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.checkAnswer(htmlInput.value, puzzle.answer);
      }
      e.stopPropagation(); // Prevent Phaser from intercepting keys
    });

    // Position the HTML input to align with the Phaser rectangle
    const gameContainer = this.game.canvas.parentElement;
    gameContainer.style.position = 'relative';
    gameContainer.appendChild(htmlInput);
    this._htmlInput = htmlInput;

    // Sync position with Phaser's scale manager
    const positionInput = () => {
      const canvas = this.game.canvas;
      const scaleX = canvas.clientWidth / this.cameras.main.width;
      const scaleY = canvas.clientHeight / this.cameras.main.height;
      const offsetX = (canvas.parentElement.clientWidth - canvas.clientWidth) / 2;
      const offsetY = (canvas.parentElement.clientHeight - canvas.clientHeight) / 2;
      const inputW = 300 * scaleX;
      const inputH = 44 * scaleY;
      htmlInput.style.width = `${inputW}px`;
      htmlInput.style.height = `${inputH}px`;
      htmlInput.style.left = `${offsetX + (cx - 150) * scaleX}px`;
      htmlInput.style.top = `${offsetY + (cy + 40 - 22) * scaleY}px`;
      htmlInput.style.fontSize = `${Math.max(12, 16 * scaleY)}px`;
    };
    positionInput();
    this.scale.on('resize', positionInput);

    // Auto-focus after a short delay so the player can type immediately
    this.time.delayedCall(400, () => htmlInput.focus());

    // Submit button
    const submitBg = this.add.rectangle(cx, cy + 100, 160, 44, 0xe8a87c, 1)
      .setInteractive({ useHandCursor: true });

    const submitText = this.add.text(cx, cy + 100, '确认答案', {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '16px',
      color: '#0a0e27',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    submitBg.on('pointerover', () => {
      this.tweens.add({ targets: [submitBg, submitText], scaleX: 1.05, scaleY: 1.05, duration: 150 });
    });
    submitBg.on('pointerout', () => {
      this.tweens.add({ targets: [submitBg, submitText], scaleX: 1, scaleY: 1, duration: 150 });
    });
    submitBg.on('pointerdown', () => {
      this.checkAnswer(htmlInput.value, puzzle.answer);
    });

    // Store refs
    this.inputBg = inputBg;
  }

  createPasswordPuzzle(cx, cy, w) {
    const puzzle = this.puzzleData;

    // Card background
    const card = this.add.rectangle(cx, cy, Math.min(w * 0.7, 420), 400, 0x1a1f4e, 0.95);
    card.setStrokeStyle(1, 0xe8a87c, 0.3);

    // Lock icon
    this.add.text(cx, cy - 160, '🔐', { fontSize: '40px' }).setOrigin(0.5);

    // Prompt
    this.add.text(cx, cy - 110, puzzle.question, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '16px',
      color: '#f1f0ff',
      wordWrap: { width: Math.min(w * 0.6, 360) },
      align: 'center',
    }).setOrigin(0.5);

    // Hint
    if (puzzle.hint) {
      this.add.text(cx, cy - 75, `💡 ${puzzle.hint}`, {
        fontFamily: '"Inter", sans-serif',
        fontSize: '12px',
        color: '#e8a87c',
        wordWrap: { width: Math.min(w * 0.55, 340) },
        align: 'center',
      }).setOrigin(0.5);
    }

    // Password display
    const maxLen = (puzzle.answer || '').length || 4;
    let password = '';
    const dots = [];
    const dotStartX = cx - (maxLen - 1) * 22;

    for (let i = 0; i < maxLen; i++) {
      const dotBg = this.add.rectangle(dotStartX + i * 44, cy - 35, 36, 44, 0x111638, 1)
        .setStrokeStyle(1, 0x333870);

      const dotText = this.add.text(dotStartX + i * 44, cy - 35, '', {
        fontFamily: '"Inter", sans-serif',
        fontSize: '24px',
        color: '#f1f0ff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      dots.push({ bg: dotBg, text: dotText });
    }

    // Number pad
    const padStartX = cx - 55;
    const padStartY = cy + 20;
    const padSize = 44;
    const padGap = 8;

    const numbers = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [null, 0, '⌫'],
    ];

    numbers.forEach((row, ri) => {
      row.forEach((num, ci) => {
        if (num === null) return;

        const bx = padStartX + ci * (padSize + padGap);
        const by = padStartY + ri * (padSize + padGap);

        const bg = this.add.rectangle(bx, by, padSize, padSize, 0x111638, 1)
          .setStrokeStyle(1, 0x333870)
          .setInteractive({ useHandCursor: true });

        const label = this.add.text(bx, by, String(num), {
          fontFamily: '"Inter", sans-serif',
          fontSize: num === '⌫' ? '18px' : '20px',
          color: '#f1f0ff',
        }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setFillStyle(0x2a2f6e));
        bg.on('pointerout', () => bg.setFillStyle(0x111638));

        bg.on('pointerdown', () => {
          if (num === '⌫') {
            password = password.slice(0, -1);
          } else if (password.length < maxLen) {
            password += String(num);
          }

          // Update dots
          dots.forEach((dot, di) => {
            dot.text.setText(password[di] || '');
            dot.bg.setStrokeStyle(1, di < password.length ? 0xe8a87c : 0x333870);
          });

          // Auto-check when full
          if (password.length === maxLen) {
            this.time.delayedCall(300, () => {
              this.checkAnswer(password, puzzle.answer);
              if (password !== puzzle.answer.toLowerCase()) {
                password = '';
                dots.forEach(dot => {
                  dot.text.setText('');
                  dot.bg.setStrokeStyle(1, 0x333870);
                });
              }
            });
          }
        });
      });
    });
  }

  createHiddenPuzzle(cx, cy, w) {
    const puzzle = this.puzzleData;

    // Card background
    const card = this.add.rectangle(cx, cy, Math.min(w * 0.7, 450), 280, 0x1a1f4e, 0.95);
    card.setStrokeStyle(1, 0xe8a87c, 0.3);

    // Icon
    this.add.text(cx, cy - 100, '🔍', { fontSize: '40px' }).setOrigin(0.5);

    // Description
    this.add.text(cx, cy - 45, puzzle.question || '找到藏在场景中的神秘物品', {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '17px',
      color: '#f1f0ff',
      wordWrap: { width: Math.min(w * 0.6, 380) },
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // Hint
    if (puzzle.hint) {
      this.add.text(cx, cy + 15, `💡 ${puzzle.hint}`, {
        fontFamily: '"Inter", sans-serif',
        fontSize: '13px',
        color: '#e8a87c',
        wordWrap: { width: Math.min(w * 0.55, 360) },
        align: 'center',
      }).setOrigin(0.5);
    }

    // "Found it!" button (simplified for MVP)
    const foundBg = this.add.rectangle(cx, cy + 75, 200, 48, 0xe8a87c, 1)
      .setInteractive({ useHandCursor: true });

    const foundText = this.add.text(cx, cy + 75, '✨ 我找到了！', {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '16px',
      color: '#0a0e27',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Sparkle particles around button
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkle = this.add.image(
        cx + Math.cos(angle) * 120,
        cy + 75 + Math.sin(angle) * 40,
        'star'
      ).setScale(0.4).setAlpha(0.2);

      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.1, to: 0.4 },
        scale: { from: 0.3, to: 0.6 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        delay: i * 200,
      });
    }

    foundBg.on('pointerover', () => {
      this.tweens.add({ targets: [foundBg, foundText], scaleX: 1.05, scaleY: 1.05, duration: 150 });
    });
    foundBg.on('pointerout', () => {
      this.tweens.add({ targets: [foundBg, foundText], scaleX: 1, scaleY: 1, duration: 150 });
    });

    foundBg.on('pointerdown', () => {
      this.showSuccess();
    });
  }

  checkAnswer(input, correctAnswer) {
    const normalizedInput = input.toString().toLowerCase().trim();
    const normalizedAnswer = correctAnswer.toString().toLowerCase().trim();

    if (normalizedInput === normalizedAnswer) {
      this.showSuccess();
    } else {
      this.showError();
    }
  }

  showSuccess() {
    const { width, height } = this.cameras.main;

    // Flash green
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0x4caf50, 0.2);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 800,
    });

    // Success particles
    for (let i = 0; i < 20; i++) {
      const p = this.add.image(width / 2, height / 2, 'star')
        .setScale(Phaser.Math.FloatBetween(0.3, 0.8))
        .setAlpha(0.8);

      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-200, 200),
        y: p.y + Phaser.Math.Between(-200, 200),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(600, 1200),
        ease: 'Power2',
      });
    }

    // Success text
    const successText = this.add.text(width / 2, height / 2, '✨ 解锁成功！', {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '28px',
      color: '#f0c27f',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: successText,
      alpha: 1,
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(1200, () => {
      this.closePuzzle(true);
    });
  }

  showError() {
    const { width, height } = this.cameras.main;

    // Shake effect
    this.cameras.main.shake(300, 0.01);

    // Flash red
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xf44336, 0.15);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
    });

    // Error hint
    const errorText = this.add.text(width / 2, height * 0.88, '再想想吧... 💭', {
      fontFamily: '"Inter", sans-serif',
      fontSize: '14px',
      color: '#f48fb1',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: errorText,
      alpha: 1,
      duration: 300,
    });

    this.time.delayedCall(2000, () => {
      this.tweens.add({ targets: errorText, alpha: 0, duration: 300 });
    });
  }

  closePuzzle(solved) {
    // Remove the native HTML input if it exists
    if (this._htmlInput && this._htmlInput.parentElement) {
      this._htmlInput.remove();
      this._htmlInput = null;
    }
    this.cameras.main.fadeOut(300, 10, 14, 39);
    this.time.delayedCall(300, () => {
      this.scene.resume('LevelScene', {
        solved,
        reward: this.rewardData,
        itemIndex: this.itemIndex,
      });
      this.scene.stop();
    });
  }
}
