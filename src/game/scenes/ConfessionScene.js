import Phaser from 'phaser';
import { t } from '../../i18n/i18n.js';
import { GAME_THEME } from '../GameTheme.js';

export class ConfessionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ConfessionScene' });
    this.letterPanel = null;
    this.letterAudio = null;
    this.letterNarrationStatus = null;
  }

  create() {
    const { width, height } = this.cameras.main;
    const config = this.registry.get('gameConfig');
    const finale = config.finale || {};
    const cx = width / 2;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroyLetterPanel();
      this.stopLetterNarration();
    });

    this.cameras.main.fadeIn(1200, ...GAME_THEME.fade);

    // Starfield background
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0xfffaf6, 0xffe8e6, 0xfff4ed, 0xfbe0d7, 1, 1, 1, 1);
    gfx.fillRect(0, 0, width, height);
    gfx.fillStyle(0xffffff, 0.28);
    gfx.fillCircle(width * 0.22, height * 0.2, 150);
    gfx.fillStyle(GAME_THEME.int.peach, 0.12);
    gfx.fillCircle(width * 0.78, height * 0.76, 190);

    // Stars
    for (let i = 0; i < 120; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(0.5, 2),
        Phaser.Math.Between(0, 1) > 0.5 ? GAME_THEME.int.gold : GAME_THEME.int.rose,
        Phaser.Math.FloatBetween(0.18, 0.5)
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
    const centerGlow = this.add.circle(cx, height * 0.4, 180, GAME_THEME.int.accent, 0.06);
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
    const allCollectedText = this.add.text(cx, height * 0.12, t('game.allCollected'), {
      fontFamily: '"Inter", sans-serif',
      fontSize: '14px',
      color: GAME_THEME.hex.accent,
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
          this.showLoveLetter(finale.loveLetter, cx, width, height, config.characters, finale.narrationUrl);
        });
      } else {
        this.showLoveLetter(finale.loveLetter, cx, width, height, config.characters, finale.narrationUrl);
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
    continueBtn.textContent = t('game.continueToLetter');
    continueBtn.style.cssText = `
      position: absolute;
      right: 18px;
      bottom: 18px;
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      background: #d85c72;
      color: #ffffff;
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
      continueBtn.textContent = t('game.playOrContinue');
    });
  }

  heartBurst(cx, cy, w, h) {
    for (let i = 0; i < 30; i++) {
      const heart = this.add.image(cx, cy, 'heart')
        .setScale(Phaser.Math.FloatBetween(0.3, 1.2))
        .setAlpha(0.8)
        .setTint(Phaser.Math.Between(0, 1) > 0.5 ? GAME_THEME.int.accent : GAME_THEME.int.rose);

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

  showLoveLetter(letterText, cx, w, h, characters, narrationUrl) {
    const text = letterText || t('game.defaultLetter');
    const receiverName = characters?.receiver?.name || t('generate.you');
    const creatorName = characters?.creator?.name || t('generate.me');

    // Letter card background
    const cardW = Math.min(w * 0.85, 580);
    const letterY = h * 0.48;

    const cardGlow = this.add.rectangle(cx, letterY, cardW + 6, h * 0.6 + 6, GAME_THEME.int.accent, 0.14);
    const cardBg = this.add.rectangle(cx, letterY, cardW, h * 0.6, GAME_THEME.int.panel, 0.96);
    cardBg.setStrokeStyle(1, GAME_THEME.int.accent, 0.22);

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

    const headerText = this.add.text(cx, letterY - h * 0.19, t('game.toLetter', { name: receiverName }), {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '18px',
      color: GAME_THEME.hex.accent,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: headerText,
      alpha: 1,
      duration: 600,
      delay: 600,
    });

    // Divider
    const divider = this.add.rectangle(cx, letterY - h * 0.14, cardW * 0.5, 1, GAME_THEME.int.accent, 0).setOrigin(0.5);
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
      this.createLetterNarrationControls(narrationUrl, cx - cardW * 0.18, letterY + h * 0.22);
    });

    // Signature appears after the scrollable letter has settled in.
    const signatureDelay = 2200;

    this.time.delayedCall(signatureDelay, () => {
      const signature = this.add.text(cx + cardW * 0.15, letterY + h * 0.2, t('game.foreverSigned', { name: creatorName }), {
        fontFamily: '"Caveat", cursive',
        fontSize: '20px',
        color: GAME_THEME.hex.accent,
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
    panel.textContent = text || t('game.defaultLetter');
    panel.style.cssText = `
      position: absolute;
      z-index: 12;
      color: rgba(74, 35, 48, 0.84);
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
      scrollbar-color: rgba(216, 92, 114, 0.55) rgba(216, 92, 114, 0.08);
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

  createLetterNarrationControls(url, x, y) {
    if (!url) return;

    const btn = this.add.rectangle(x, y, 170, 38, GAME_THEME.int.accent, 1)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, `▶ ${t('game.playLoveLetter')}`, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '13px',
      color: GAME_THEME.hex.white,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.letterNarrationStatus = this.add.text(x, y + 29, t('game.tapToHearLoveLetter'), {
      fontFamily: '"Inter", sans-serif',
      fontSize: '10px',
      color: GAME_THEME.hex.mutedInk,
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      if (this.letterAudio && !this.letterAudio.paused) {
        this.stopLetterNarration();
        label.setText(`▶ ${t('game.playLoveLetter')}`);
        this.letterNarrationStatus.setText(t('game.tapToHearLoveLetter'));
        return;
      }

      this.playLetterNarration(url, label);
    });
  }

  playLetterNarration(url, label) {
    this.stopLetterNarration();
    this.letterAudio = new Audio(url);
    this.letterAudio.volume = 1;
    label.setText(`⏸ ${t('game.stopLoveLetter')}`);
    this.letterAudio.addEventListener('ended', () => {
      label.setText(`▶ ${t('game.playLoveLetter')}`);
      this.letterNarrationStatus?.setText(t('game.tapToHearLoveLetter'));
      this.stopLetterNarration();
    }, { once: true });
    this.letterAudio.play().then(() => {
      this.letterNarrationStatus?.setText(t('game.aiNarrationDisclosure'));
    }).catch(() => {
      label.setText(`▶ ${t('game.playLoveLetter')}`);
      this.stopLetterNarration();
      this.letterNarrationStatus?.setText(t('game.narrationPlayFailed'));
    });
  }

  stopLetterNarration() {
    if (!this.letterAudio) return;
    this.letterAudio.pause();
    this.letterAudio.src = '';
    this.letterAudio = null;
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
