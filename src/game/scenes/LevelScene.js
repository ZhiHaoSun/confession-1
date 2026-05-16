/**
 * LevelScene — Core gameplay scene with interactive exploration.
 * Dynamically built from config.json level data.
 */
import Phaser from 'phaser';

export class LevelScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelScene' });
    this.sceneAudio = null;
    this.musicPrompt = null;
    this.viewedInteractives = new Set();
    this.hotspotRefs = [];
    this.levelCompleteText = null;
    this.shardTextObj = null;
  }

  init(data) {
    this.levelIndex = data.levelIndex || 0;
    this.viewedInteractives = new Set();
    this.hotspotRefs = [];
    this.levelCompleteText = null;
    this.shardTextObj = null;
  }

  create() {
    const { width, height } = this.cameras.main;
    const config = this.registry.get('gameConfig');
    const levels = config.levels || [];
    
    if (this.levelIndex >= levels.length) {
      // All levels complete — go to confession
      this.scene.start('ConfessionScene');
      return;
    }

    const level = levels[this.levelIndex];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopSceneMusic());
    this.cameras.main.fadeIn(800, 10, 14, 39);

    // Draw procedural background based on art style
    this.drawBackground(config.meta.artStyle, level, width, height);
    this.drawMemoryPhoto(level, width, height);

    // Level title overlay (briefly shown)
    this.showLevelTitle(level, width, height);

    // Place interactive items
    this.placeInteractives(level, width, height);

    // HUD - top bar
    this.createHUD(level, levels.length, width);

    // Ambient particles
    this.createAmbientParticles(config.meta.artStyle, width, height);

    // Optional user-uploaded music attached to this memory scene
    this.playSceneMusic(level, width, height);
  }

  playSceneMusic(level, w, h) {
    const music = level.music || {};
    if (!music.url) return;

    this.stopSceneMusic();
    const audio = new Audio(music.url);
    audio.loop = true;
    audio.volume = 0.35;
    this.sceneAudio = audio;

    audio.play().catch(() => {
      this.showMusicPrompt(music.title || '场景音乐', w, h);
    });
  }

  showMusicPrompt(title, w, h) {
    if (this.musicPrompt) return;

    const bg = this.add.rectangle(w - 96, h - 34, 160, 40, 0x0a0e27, 0.78)
      .setStrokeStyle(1, 0xe8a87c, 0.35)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(w - 96, h - 34, `♪ 播放 ${title}`, {
      fontFamily: '"Inter", sans-serif',
      fontSize: '12px',
      color: '#e8a87c',
      wordWrap: { width: 136 },
      align: 'center',
    }).setOrigin(0.5);

    this.musicPrompt = [bg, label];
    bg.on('pointerdown', () => {
      this.sceneAudio?.play().catch(() => {});
      this.musicPrompt?.forEach(item => item.destroy());
      this.musicPrompt = null;
    });
  }

  stopSceneMusic() {
    if (this.sceneAudio) {
      this.sceneAudio.pause();
      this.sceneAudio.src = '';
      this.sceneAudio = null;
    }

    if (this.musicPrompt) {
      this.musicPrompt.forEach(item => item.destroy());
      this.musicPrompt = null;
    }
  }

  drawMemoryPhoto(level, w, h) {
    const textureKey = `memory-photo-${this.levelIndex}`;
    if (!this.textures.exists(textureKey)) return;

    const photo = this.add.image(w / 2, h / 2, textureKey).setAlpha(0.38);
    const scale = Math.max(w / photo.width, h / photo.height);
    photo.setScale(scale);

    this.add.rectangle(w / 2, h / 2, w, h, 0x0a0e27, 0.28);
  }

  drawBackground(artStyle, level, w, h) {
    const gfx = this.add.graphics();
    
    switch (artStyle) {
      case 'watercolor':
        this.drawWatercolorBg(gfx, level, w, h);
        break;
      case 'anime':
        this.drawAnimeBg(gfx, level, w, h);
        break;
      case 'isometric':
        this.drawIsometricBg(gfx, level, w, h);
        break;
      default:
        this.drawWatercolorBg(gfx, level, w, h);
    }
  }

  drawWatercolorBg(gfx, level, w, h) {
    // Soft pastel background
    gfx.fillGradientStyle(0xfce4ec, 0xf3e5f5, 0xe8eaf6, 0xfff3e0, 1, 1, 1, 1);
    gfx.fillRect(0, 0, w, h);

    // Watercolor blobs
    const colors = [0xf48fb1, 0xce93d8, 0x81d4fa, 0xffcc80, 0xa5d6a7];
    for (let i = 0; i < 12; i++) {
      const cx = Phaser.Math.Between(0, w);
      const cy = Phaser.Math.Between(0, h);
      const r = Phaser.Math.Between(40, 120);
      const color = colors[i % colors.length];
      
      gfx.fillStyle(color, 0.12);
      gfx.fillCircle(cx, cy, r);
      gfx.fillStyle(color, 0.08);
      gfx.fillCircle(cx + 10, cy - 10, r * 0.7);
    }

    // Level-specific decorations
    const idx = this.levelIndex;
    if (idx === 0) {
      // Library - bookshelves
      gfx.fillStyle(0x8d6e63, 0.3);
      gfx.fillRect(w * 0.05, h * 0.15, w * 0.15, h * 0.7);
      gfx.fillRect(w * 0.8, h * 0.15, w * 0.15, h * 0.7);
      // Shelves
      for (let y = h * 0.2; y < h * 0.8; y += h * 0.12) {
        gfx.fillStyle(0x6d4c41, 0.2);
        gfx.fillRect(w * 0.05, y, w * 0.15, 3);
        gfx.fillRect(w * 0.8, y, w * 0.15, 3);
        // Books
        for (let x = 0; x < 5; x++) {
          const bookColor = [0xef5350, 0x42a5f5, 0x66bb6a, 0xffa726, 0xab47bc][x];
          gfx.fillStyle(bookColor, 0.25);
          gfx.fillRect(w * 0.06 + x * 12, y - 20, 8, 18);
          gfx.fillRect(w * 0.81 + x * 12, y - 20, 8, 18);
        }
      }
      // Window with light
      gfx.fillStyle(0xfff9c4, 0.4);
      gfx.fillRect(w * 0.35, h * 0.08, w * 0.3, h * 0.35);
      gfx.fillStyle(0xffffff, 0.2);
      gfx.fillRect(w * 0.36, h * 0.09, w * 0.13, h * 0.16);
      gfx.fillRect(w * 0.51, h * 0.09, w * 0.13, h * 0.16);
    } else if (idx === 1) {
      // Amusement park - ferris wheel
      const fcx = w * 0.5, fcy = h * 0.35, fr = 100;
      gfx.lineStyle(3, 0x7986cb, 0.3);
      gfx.strokeCircle(fcx, fcy, fr);
      // Spokes
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        gfx.beginPath();
        gfx.moveTo(fcx, fcy);
        gfx.lineTo(fcx + Math.cos(a) * fr, fcy + Math.sin(a) * fr);
        gfx.strokePath();
        // Gondola
        gfx.fillStyle(0xffab91, 0.4);
        gfx.fillCircle(fcx + Math.cos(a) * fr, fcy + Math.sin(a) * fr, 10);
      }
      // Ground
      gfx.fillStyle(0x66bb6a, 0.15);
      gfx.fillRect(0, h * 0.75, w, h * 0.25);
      // Lights
      for (let x = 0; x < w; x += 30) {
        const lightColor = [0xffd54f, 0xff7043, 0x4fc3f7, 0xba68c8][Math.floor(x / 30) % 4];
        gfx.fillStyle(lightColor, 0.3);
        gfx.fillCircle(x, h * 0.74, 4);
      }
    } else {
      // Starry night
      gfx.fillGradientStyle(0x1a237e, 0x0d1b2a, 0x1b1b3a, 0x0d1b2a, 1, 1, 1, 1);
      gfx.fillRect(0, 0, w, h);
      // Stars
      for (let i = 0; i < 100; i++) {
        gfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
        gfx.fillCircle(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h * 0.7), Phaser.Math.FloatBetween(0.5, 2));
      }
      // Moon
      gfx.fillStyle(0xfff9c4, 0.3);
      gfx.fillCircle(w * 0.8, h * 0.15, 40);
      gfx.fillStyle(0xfff9c4, 0.5);
      gfx.fillCircle(w * 0.8, h * 0.15, 25);
      // Grass
      gfx.fillStyle(0x1b5e20, 0.2);
      gfx.fillRect(0, h * 0.78, w, h * 0.22);
    }
  }

  drawAnimeBg(gfx, level, w, h) {
    // Dramatic sunset sky
    const idx = this.levelIndex;
    
    if (idx === 0) {
      // Indoor warm light
      gfx.fillGradientStyle(0x1a237e, 0x283593, 0x3949ab, 0x1a237e, 1, 1, 1, 1);
      gfx.fillRect(0, 0, w, h);
      // Warm light through windows
      gfx.fillStyle(0xff8f00, 0.1);
      gfx.fillRect(w * 0.3, h * 0.05, w * 0.4, h * 0.4);
      // Library details
      gfx.fillStyle(0x3e2723, 0.6);
      gfx.fillRect(0, h * 0.1, w * 0.18, h * 0.8);
      gfx.fillRect(w * 0.82, h * 0.1, w * 0.18, h * 0.8);
      // Light rays
      gfx.fillStyle(0xffd54f, 0.03);
      gfx.fillTriangle(w * 0.35, h * 0.05, w * 0.2, h, w * 0.5, h);
      gfx.fillTriangle(w * 0.55, h * 0.05, w * 0.4, h, w * 0.7, h);
    } else if (idx === 1) {
      // Sunset sky
      gfx.fillGradientStyle(0x1a237e, 0xad1457, 0xff6f00, 0xff8f00, 1, 1, 1, 1);
      gfx.fillRect(0, 0, w, h);
      // Clouds
      gfx.fillStyle(0xffffff, 0.15);
      for (let i = 0; i < 6; i++) {
        const cx = Phaser.Math.Between(0, w);
        const cy = Phaser.Math.Between(h * 0.1, h * 0.35);
        for (let j = 0; j < 4; j++) {
          gfx.fillCircle(cx + j * 25 - 37, cy, 15 + Phaser.Math.Between(0, 10));
        }
      }
      // City silhouette
      gfx.fillStyle(0x0d1117, 0.9);
      gfx.fillRect(0, h * 0.65, w, h * 0.35);
      for (let i = 0; i < 15; i++) {
        const bx = i * (w / 15);
        const bh = Phaser.Math.Between(h * 0.05, h * 0.3);
        gfx.fillRect(bx, h * 0.65 - bh, w / 17, bh);
      }
      // Ferris wheel silhouette
      gfx.lineStyle(2, 0x0d1117, 0.9);
      gfx.strokeCircle(w * 0.65, h * 0.35, 80);
    } else {
      // Night sky with aurora
      gfx.fillGradientStyle(0x0d1b2a, 0x1b2838, 0x0d1b2a, 0x1b2838, 1, 1, 1, 1);
      gfx.fillRect(0, 0, w, h);
      // Stars
      for (let i = 0; i < 150; i++) {
        gfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 1));
        gfx.fillCircle(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h * 0.6), Phaser.Math.FloatBetween(0.5, 2.5));
      }
      // Aurora hints
      gfx.fillStyle(0x4fc3f7, 0.03);
      gfx.fillRect(w * 0.1, h * 0.05, w * 0.3, h * 0.3);
      gfx.fillStyle(0x7c4dff, 0.03);
      gfx.fillRect(w * 0.5, h * 0.08, w * 0.35, h * 0.25);
      // Grass field
      gfx.fillStyle(0x1b5e20, 0.3);
      gfx.fillRect(0, h * 0.75, w, h * 0.25);
    }

    // Lens flare (always)
    gfx.fillStyle(0xffffff, 0.05);
    gfx.fillCircle(w * 0.7, h * 0.2, 80);
    gfx.fillStyle(0xffffff, 0.08);
    gfx.fillCircle(w * 0.7, h * 0.2, 30);
  }

  drawIsometricBg(gfx, level, w, h) {
    // Dark background
    gfx.fillGradientStyle(0x2d3436, 0x2d3436, 0x636e72, 0x636e72, 1, 1, 1, 1);
    gfx.fillRect(0, 0, w, h);

    // Isometric floor tiles
    const tileSize = 35;
    const startX = w * 0.5;
    const startY = h * 0.15;
    const gridSize = 8;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = startX + (col - row) * tileSize;
        const y = startY + (col + row) * tileSize * 0.5;
        
        const isLight = (row + col) % 2 === 0;
        gfx.fillStyle(isLight ? 0xdfe6e9 : 0xb2bec3, 0.6);
        
        // Top face
        gfx.beginPath();
        gfx.moveTo(x, y - tileSize * 0.25);
        gfx.lineTo(x + tileSize, y + tileSize * 0.25);
        gfx.lineTo(x, y + tileSize * 0.75);
        gfx.lineTo(x - tileSize, y + tileSize * 0.25);
        gfx.closePath();
        gfx.fillPath();
        
        gfx.lineStyle(0.5, 0xffffff, 0.1);
        gfx.strokePath();
      }
    }

    // Some isometric furniture blocks
    const blocks = [
      { x: startX - tileSize * 2, y: startY + tileSize * 2, color: 0xfab1a0, h: 30 },
      { x: startX + tileSize, y: startY + tileSize * 1.5, color: 0x74b9ff, h: 20 },
      { x: startX - tileSize * 0.5, y: startY + tileSize * 3, color: 0xa29bfe, h: 25 },
    ];

    blocks.forEach(b => {
      // Top
      gfx.fillStyle(b.color, 0.8);
      gfx.beginPath();
      gfx.moveTo(b.x, b.y - b.h);
      gfx.lineTo(b.x + tileSize * 0.7, b.y + tileSize * 0.15 - b.h);
      gfx.lineTo(b.x, b.y + tileSize * 0.35 - b.h);
      gfx.lineTo(b.x - tileSize * 0.7, b.y + tileSize * 0.15 - b.h);
      gfx.closePath();
      gfx.fillPath();
      
      // Left
      gfx.fillStyle(b.color, 0.5);
      gfx.beginPath();
      gfx.moveTo(b.x - tileSize * 0.7, b.y + tileSize * 0.15 - b.h);
      gfx.lineTo(b.x, b.y + tileSize * 0.35 - b.h);
      gfx.lineTo(b.x, b.y + tileSize * 0.35);
      gfx.lineTo(b.x - tileSize * 0.7, b.y + tileSize * 0.15);
      gfx.closePath();
      gfx.fillPath();
      
      // Right
      gfx.fillStyle(b.color, 0.65);
      gfx.beginPath();
      gfx.moveTo(b.x + tileSize * 0.7, b.y + tileSize * 0.15 - b.h);
      gfx.lineTo(b.x, b.y + tileSize * 0.35 - b.h);
      gfx.lineTo(b.x, b.y + tileSize * 0.35);
      gfx.lineTo(b.x + tileSize * 0.7, b.y + tileSize * 0.15);
      gfx.closePath();
      gfx.fillPath();
    });
  }

  showLevelTitle(level, w, h) {
    // Dark overlay
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x0a0e27, 0.7);
    
    const chapterText = this.add.text(w / 2, h / 2 - 30, `第 ${level.id} 章`, {
      fontFamily: '"Inter", sans-serif',
      fontSize: '14px',
      color: '#e8a87c',
    }).setOrigin(0.5).setAlpha(0);

    const titleText = this.add.text(w / 2, h / 2 + 5, level.title, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '36px',
      color: '#f1f0ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // Animate in
    this.tweens.add({
      targets: [chapterText, titleText],
      alpha: 1,
      duration: 800,
      ease: 'Power2',
    });

    // Fade out after delay
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [overlay, chapterText, titleText],
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          overlay.destroy();
          chapterText.destroy();
          titleText.destroy();
        },
      });
    });
  }

  placeInteractives(level, w, h) {
    const interactives = level.interactives || [];

    interactives.forEach((item, idx) => {
      const x = (item.position?.x || 0.5) * w;
      const y = (item.position?.y || 0.5) * h;

      // Glow background
      const glow = this.add.image(x, y, 'glow').setScale(1.5).setAlpha(0.4);
      this.tweens.add({
        targets: glow,
        scaleX: 2,
        scaleY: 2,
        alpha: 0.15,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Icon
      const icon = this.add.text(x, y, item.icon || '✨', {
        fontSize: '36px',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      // Floating animation
      this.tweens.add({
        targets: icon,
        y: y - 6,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Hint label
      const hintText = this.add.text(x, y + 35, '点击探索', {
        fontFamily: '"Inter", sans-serif',
        fontSize: '11px',
        color: '#e8a87c',
        backgroundColor: 'rgba(10, 14, 39, 0.7)',
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5).setAlpha(0);

      icon.on('pointerover', () => {
        this.tweens.add({ targets: icon, scaleX: 1.2, scaleY: 1.2, duration: 200, ease: 'Back.easeOut' });
        this.tweens.add({ targets: hintText, alpha: 1, duration: 200 });
      });

      icon.on('pointerout', () => {
        this.tweens.add({ targets: icon, scaleX: 1, scaleY: 1, duration: 200 });
        this.tweens.add({ targets: hintText, alpha: 0, duration: 200 });
      });

      icon.on('pointerdown', () => {
        if (this.viewedInteractives.has(idx)) return;
        this.openInteractiveMemory(level, item, idx);
      });

      this.hotspotRefs[idx] = { glow, icon, hintText };
    });

    // Listen for puzzle completion
    this.events.on('resume', (scene, data) => {
      if (data?.solved) {
        const itemIndex = Number.isInteger(data.itemIndex) ? data.itemIndex : 0;
        const item = interactives[itemIndex] || interactives[0];
        this.showMemoryCardForInteractive(level, item, itemIndex, data.reward);
      }
    });
  }

  openInteractiveMemory(level, item, idx) {
    if (item.type === 'memory' || !item.puzzle) {
      this.showMemoryCardForInteractive(level, item, idx, item.reward);
      return;
    }

    this.scene.launch('PuzzleScene', {
      puzzle: item.puzzle,
      reward: item.reward,
      levelIndex: this.levelIndex,
      itemIndex: idx,
    });
    this.scene.pause();
  }

  showMemoryCardForInteractive(level, item, idx, reward) {
    const displayLevel = {
      ...level,
      title: item.title || level.title,
      description: item.memoryText || item.memory_text || level.description,
    };

    this.scene.launch('MemoryCardScene', {
      level: displayLevel,
      reward,
      onDone: () => {
        this.markInteractiveViewed(idx);
        if (this.viewedInteractives.size >= (level.interactives || []).length) {
          this.showLevelComplete();
        }
      },
    });
    this.scene.pause();
  }

  markInteractiveViewed(idx) {
    this.viewedInteractives.add(idx);
    const refs = this.hotspotRefs[idx];
    if (!refs) return;

    refs.icon.setAlpha(0.35).disableInteractive();
    refs.hintText.setText('已收集').setAlpha(0.75);
    refs.glow.setAlpha(0.1);

    if (this.shardTextObj) {
      const total = Math.max(1, this.hotspotRefs.length);
      this.shardTextObj.setText(`💎 本章碎片 ${this.viewedInteractives.size}/${total}`);
    }
  }

  showLevelComplete() {
    if (this.levelCompleteText) return;

    const { width, height } = this.cameras.main;
    const panel = this.add.rectangle(width / 2, height - 54, 300, 48, 0x0a0e27, 0.82)
      .setStrokeStyle(1, 0xe8a87c, 0.35)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(width / 2, height - 54, '✨ 本章记忆已收集，继续下一章', {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '15px',
      color: '#e8a87c',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.levelCompleteText = [panel, label];
    panel.on('pointerdown', () => this.goToNextLevel());
    this.tweens.add({
      targets: this.levelCompleteText,
      alpha: { from: 0, to: 1 },
      y: '-=6',
      duration: 400,
      ease: 'Back.easeOut',
    });
  }

  goToNextLevel() {
    this.cameras.main.fadeOut(600, 10, 14, 39);
    this.time.delayedCall(600, () => {
      this.scene.start('LevelScene', { levelIndex: this.levelIndex + 1 });
    });
  }

  createHUD(level, totalLevels, w) {
    // Top bar
    const hudBg = this.add.rectangle(w / 2, 0, w, 44, 0x0a0e27, 0.8).setOrigin(0.5, 0);

    // Level indicator
    this.add.text(16, 12, `${level.id} / ${totalLevels}`, {
      fontFamily: '"Inter", sans-serif',
      fontSize: '13px',
      color: '#e8a87c',
    });

    // Memory shards
    const totalHotspots = Math.max(1, (level.interactives || []).length);
    const shardText = `💎 本章碎片 0/${totalHotspots}`;
    this.shardTextObj = this.add.text(w - 16, 12, shardText, {
      fontFamily: '"Inter", sans-serif',
      fontSize: '13px',
      color: 'rgba(241, 240, 255, 0.6)',
    }).setOrigin(1, 0);
  }

  createAmbientParticles(artStyle, w, h) {
    // Floating particles based on style
    const count = artStyle === 'anime' ? 25 : 15;
    
    for (let i = 0; i < count; i++) {
      const texKey = artStyle === 'anime' ? 'star' : 'particle';
      const p = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        texKey
      ).setAlpha(Phaser.Math.FloatBetween(0.05, 0.2))
       .setScale(Phaser.Math.FloatBetween(0.3, 0.8));

      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(30, 80),
        x: p.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 8000),
        repeat: -1,
        onRepeat: () => {
          p.x = Phaser.Math.Between(0, w);
          p.y = Phaser.Math.Between(h * 0.5, h);
          p.alpha = Phaser.Math.FloatBetween(0.05, 0.2);
        },
      });
    }
  }
}
