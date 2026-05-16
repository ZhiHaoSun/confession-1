/**
 * ConfessionScene — The grand finale!
 * Displays love letter with typewriter effect, heart particle shower,
 * and optional confession video playback.
 */
import Phaser from 'phaser';

export class ConfessionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ConfessionScene' });
    this.letterPanel = null;
  }

  create() {
    const { width, height } = this.cameras.main;
    const config = this.registry.get('gameConfig');
    const finale = config.finale || {};
    const cx = width / 2;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyLetterPanel());

    this.cameras.main.fadeIn(1200, 10, 14, 39);

    // Starfield background
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x0a0e27, 0x0d1b2a, 0x1a1040, 0x2d1b69, 1, 1, 1, 1);
    gfx.fillRect(0, 0, width, height);

    // Stars
    for (let i = 0; i < 120; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(0.5, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8)
      );
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: star.alpha * 0.2 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Central glow
    const centerGlow = this.add.circle(cx, height * 0.4, 180, 0xe8a87c, 0.04);
    this.tweens.add({
      targets: centerGlow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.01,
      duration: 4000,
      yoyo: true,
      repeat: -1,
    });

    // "All memories collected" message
    const allCollectedText = this.add.text(cx, height * 0.12, '✨ 所有记忆碎片已收集完毕 ✨', {
      fontFamily: '"Inter", sans-serif',
      fontSize: '14px',
      color: '#e8a87c',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: allCollectedText,
      alpha: 1,
      duration: 1000,
      delay: 500,
    });

    // Heart burst delay
    this.time.delayedCall(1500, () => {
      this.heartBurst(cx, height * 0.3, width, height);
    });

    // Finale video, then love letter display
    this.time.delayedCall(2500, () => {
      if (finale.hasVideo && finale.videoUrl) {
        this.showConfessionVideo(finale.videoUrl, () => {
          this.showLoveLetter(finale.loveLetter, cx, width, height, config.characters);
        });
      } else {
        this.showLoveLetter(finale.loveLetter, cx, width, height, config.characters);
      }
    });
  }

  showConfessionVideo(videoUrl, onComplete) {
    const parent = this.game.canvas.parentElement;
    parent.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 20;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const video = document.createElement('video');
    video.src = videoUrl;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.cssText = 'width: 100%; height: 100%; object-fit: contain; background: #000;';

    const continueBtn = document.createElement('button');
    continueBtn.textContent = '继续查看告白信';
    continueBtn.style.cssText = `
      position: absolute;
      right: 18px;
      bottom: 18px;
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      background: #e8a87c;
      color: #0a0e27;
      font: 600 14px "Noto Serif SC", serif;
      cursor: pointer;
      box-shadow: 0 8px 30px rgba(0,0,0,0.35);
    `;

    const finish = () => {
      video.pause();
      overlay.remove();
      onComplete?.();
    };

    video.addEventListener('ended', finish, { once: true });
    continueBtn.addEventListener('click', finish);
    overlay.append(video, continueBtn);
    parent.appendChild(overlay);

    video.play().catch(() => {
      continueBtn.textContent = '播放视频 / 继续查看告白信';
    });
  }

  heartBurst(cx, cy, w, h) {
    for (let i = 0; i < 30; i++) {
      const heart = this.add.image(cx, cy, 'heart')
        .setScale(Phaser.Math.FloatBetween(0.3, 1.2))
        .setAlpha(0.8)
        .setTint(Phaser.Math.Between(0, 1) > 0.5 ? 0xe8a87c : 0xd4a5a5);

      const angle = (i / 30) * Math.PI * 2;
      const dist = Phaser.Math.Between(80, 250);

      this.tweens.add({
        targets: heart,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist - 30,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        rotation: Phaser.Math.FloatBetween(-1, 1),
        duration: Phaser.Math.Between(1500, 3000),
        ease: 'Power2',
        delay: i * 50,
      });
    }
  }

  showLoveLetter(letterText, cx, w, h, characters) {
    const text = letterText || '谢谢你出现在我的生命中。';
    const receiverName = characters?.receiver?.name || '你';
    const creatorName = characters?.creator?.name || '我';

    // Letter card background
    const cardW = Math.min(w * 0.85, 580);
    const letterY = h * 0.48;

    const cardGlow = this.add.rectangle(cx, letterY, cardW + 6, h * 0.6 + 6, 0xe8a87c, 0.15);
    const cardBg = this.add.rectangle(cx, letterY, cardW, h * 0.6, 0x111638, 0.95);
    cardBg.setStrokeStyle(1, 0xe8a87c, 0.2);

    // Entry animation
    this.tweens.add({
      targets: [cardBg, cardGlow],
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 800,
      ease: 'Back.easeOut',
    });

    // Letter header
    const headerEmoji = this.add.text(cx, letterY - h * 0.25, '💌', {
      fontSize: '36px',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: headerEmoji,
      alpha: 1,
      y: headerEmoji.y + 5,
      duration: 600,
      delay: 400,
      ease: 'Power2',
    });

    const headerText = this.add.text(cx, letterY - h * 0.19, `致 ${receiverName}`, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '18px',
      color: '#e8a87c',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: headerText,
      alpha: 1,
      duration: 600,
      delay: 600,
    });

    // Divider
    const divider = this.add.rectangle(cx, letterY - h * 0.14, cardW * 0.5, 1, 0xe8a87c, 0).setOrigin(0.5);
    this.tweens.add({ targets: divider, alpha: 0.3, duration: 600, delay: 800 });

    // Letter body. Use a scrollable DOM panel so long OpenAI-generated
    // confession text wraps correctly and stays inside the card.
    const maxTextWidth = cardW - 60;
    this.time.delayedCall(1000, () => {
      this.createLetterPanel(text, {
        x: cx - maxTextWidth / 2,
        y: letterY - h * 0.1,
        width: maxTextWidth,
        height: h * 0.28,
      });
    });

    // Signature appears after the scrollable letter has settled in.
    const signatureDelay = 2200;

    this.time.delayedCall(signatureDelay, () => {
      const signature = this.add.text(cx + cardW * 0.15, letterY + h * 0.2, `—— 永远的 ${creatorName} ❤️`, {
        fontFamily: '"Caveat", cursive',
        fontSize: '20px',
        color: '#e8a87c',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: signature,
        alpha: 1,
        duration: 800,
        ease: 'Power2',
      });

      // Continuous gentle heart rain after letter is done
      this.startHeartRain(w, h);
    });

    // Continuous floating particles
    for (let i = 0; i < 15; i++) {
      const p = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(h * 0.5, h),
        i % 2 === 0 ? 'heart' : 'star'
      ).setScale(Phaser.Math.FloatBetween(0.2, 0.5)).setAlpha(0.08);

      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(40, 100),
        x: p.x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: i * 400,
        onRepeat: () => {
          p.x = Phaser.Math.Between(0, w);
          p.y = h + 20;
          p.alpha = 0.08;
        },
      });
    }
  }

  createLetterPanel(text, rect) {
    this.destroyLetterPanel();

    const parent = this.game.canvas.parentElement;
    parent.style.position = 'relative';

    const panel = document.createElement('div');
    panel.textContent = text || '谢谢你出现在我的生命中。';
    panel.style.cssText = `
      position: absolute;
      z-index: 12;
      color: rgba(241, 240, 255, 0.88);
      font-family: "Noto Serif SC", "Inter", serif;
      font-size: 14px;
      line-height: 1.9;
      text-align: left;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
      overflow-y: auto;
      padding: 0 10px;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 300ms ease;
      scrollbar-width: thin;
      scrollbar-color: rgba(232, 168, 124, 0.6) rgba(255, 255, 255, 0.08);
      pointer-events: auto;
    `;

    parent.appendChild(panel);
    this.letterPanel = { el: panel, rect };
    this.positionLetterPanel();
    this.scale.on('resize', this.positionLetterPanel, this);

    requestAnimationFrame(() => {
      panel.style.opacity = '1';
    });
  }

  positionLetterPanel() {
    if (!this.letterPanel) return;

    const { el, rect } = this.letterPanel;
    const canvas = this.game.canvas;
    const parent = canvas.parentElement;
    const scaleX = canvas.clientWidth / this.cameras.main.width;
    const scaleY = canvas.clientHeight / this.cameras.main.height;
    const offsetX = (parent.clientWidth - canvas.clientWidth) / 2;
    const offsetY = (parent.clientHeight - canvas.clientHeight) / 2;

    el.style.left = `${offsetX + rect.x * scaleX}px`;
    el.style.top = `${offsetY + rect.y * scaleY}px`;
    el.style.width = `${rect.width * scaleX}px`;
    el.style.maxHeight = `${Math.max(110, rect.height * scaleY)}px`;
    el.style.fontSize = `${Math.max(12, 14 * scaleY)}px`;
  }

  destroyLetterPanel() {
    if (!this.letterPanel) return;
    this.scale.off('resize', this.positionLetterPanel, this);
    this.letterPanel.el.remove();
    this.letterPanel = null;
  }

  startHeartRain(w, h) {
    this.time.addEvent({
      delay: 300,
      repeat: -1,
      callback: () => {
        const heart = this.add.image(
          Phaser.Math.Between(0, w),
          -20,
          'heart'
        ).setScale(Phaser.Math.FloatBetween(0.2, 0.6))
         .setAlpha(Phaser.Math.FloatBetween(0.05, 0.2))
         .setRotation(Phaser.Math.FloatBetween(-0.5, 0.5));

        this.tweens.add({
          targets: heart,
          y: h + 30,
          x: heart.x + Phaser.Math.Between(-40, 40),
          rotation: heart.rotation + Phaser.Math.FloatBetween(-1, 1),
          duration: Phaser.Math.Between(4000, 8000),
          onComplete: () => heart.destroy(),
        });
      },
    });
  }
}
