import Phaser from 'phaser';
import { t } from '../../i18n/i18n.js';
import { GAME_THEME } from '../GameTheme.js';

export class LevelScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelScene' });
    this.sceneAudio = null;
    this.sceneMusicVolume = 0.35;
    this.musicPrompt = null;
    this.viewedInteractives = new Set();
    this.hotspotRefs = [];
    this.levelCompleteText = null;
    this.shardTextObj = null;
    this.currentLevel = null;
    this.jigsawPieces = [];
    this.jigsawPlacedCount = 0;
    this.jigsawSolved = false;
  }

  init(data) {
    this.levelIndex = data.levelIndex || 0;
    this.viewedInteractives = new Set();
    this.hotspotRefs = [];
    this.levelCompleteText = null;
    this.shardTextObj = null;
    this.currentLevel = null;
    this.jigsawPieces = [];
    this.jigsawPlacedCount = 0;
    this.jigsawSolved = false;
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
    this.currentLevel = level;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopSceneMusic());
    this.cameras.main.fadeIn(800, 10, 14, 39);

    if (this.isJigsawLevel(level)) {
      this.drawJigsawBackground(width, height);
    } else {
      // Draw procedural background based on art style
      this.drawBackground(config.meta.artStyle, level, width, height);
      this.drawMemoryPhoto(level, width, height);
    }

    // Level title overlay (briefly shown)
    this.showLevelTitle(level, width, height);

    if (this.isJigsawLevel(level)) {
      this.createJigsawChallenge(level, width, height);
    } else {
      // Place interactive items
      this.placeInteractives(level, width, height);
    }

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
    audio.volume = this.sceneMusicVolume;
    this.sceneAudio = audio;

    audio.play().catch(() => {
      this.showMusicPrompt(music.title || t('memories.musicUploaded'), w, h);
    });
  }

  showMusicPrompt(title, w, h) {
    if (this.musicPrompt) return;

    const bg = this.add.rectangle(w - 96, h - 34, 160, 40, GAME_THEME.int.panel, 0.9)
      .setStrokeStyle(1, GAME_THEME.int.accent, 0.32)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(w - 96, h - 34, t('game.playMusic', { title: title }), {
      fontFamily: '"Inter", sans-serif',
      fontSize: '12px',
      color: GAME_THEME.hex.accent,
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

  setNarrationDucking(active) {
    if (!this.sceneAudio) return;
    this.sceneAudio.volume = active ? 0.06 : this.sceneMusicVolume;
  }

  drawMemoryPhoto(level, w, h) {
    const textureKey = `memory-photo-${this.levelIndex}`;
    if (!this.textures.exists(textureKey)) return;

    const isGeneratedArtwork = level.artwork?.status === 'generated';
    const photo = this.add.image(w / 2, h / 2, textureKey).setAlpha(isGeneratedArtwork ? 0.96 : 0.38);
    const scale = Math.max(w / photo.width, h / photo.height);
    photo.setScale(scale);

    this.add.rectangle(w / 2, h / 2, w, h, 0xfff4ed, isGeneratedArtwork ? 0.08 : 0.2);
  }

  drawBackground(artStyle, level, w, h) {
    const gfx = this.add.graphics();
    
    switch (artStyle) {
      case 'romantic-manga':
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

  drawJigsawBackground(w, h) {
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0xfffaf6, 0xfff4ed, 0xffeee9, 0xffe8e6, 1, 1, 1, 1);
    gfx.fillRect(0, 0, w, h);

    gfx.fillStyle(GAME_THEME.int.blush, 0.18);
    gfx.fillCircle(w * 0.18, h * 0.22, Math.min(w, h) * 0.22);
    gfx.fillStyle(GAME_THEME.int.peach, 0.12);
    gfx.fillCircle(w * 0.84, h * 0.34, Math.min(w, h) * 0.26);
    gfx.fillStyle(0xeaf6ef, 0.2);
    gfx.fillCircle(w * 0.52, h * 0.88, Math.min(w, h) * 0.24);
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
      gfx.fillGradientStyle(0x4a2330, 0x7d4150, 0xf2a77a, 0xffe8e6, 1, 1, 1, 1);
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
      gfx.fillStyle(0x7aa874, 0.24);
      gfx.fillRect(0, h * 0.78, w, h * 0.22);
    }
  }

  drawAnimeBg(gfx, level, w, h) {
    // Dramatic sunset sky
    const idx = this.levelIndex;
    
    if (idx === 0) {
      // Indoor warm light
      gfx.fillGradientStyle(0xfff4ed, 0xffe8e6, 0xfbe0d7, 0xfffaf6, 1, 1, 1, 1);
      gfx.fillRect(0, 0, w, h);
      // Warm light through windows
      gfx.fillStyle(0xf2a77a, 0.16);
      gfx.fillRect(w * 0.3, h * 0.05, w * 0.4, h * 0.4);
      // Library details
      gfx.fillStyle(0x7d5a50, 0.28);
      gfx.fillRect(0, h * 0.1, w * 0.18, h * 0.8);
      gfx.fillRect(w * 0.82, h * 0.1, w * 0.18, h * 0.8);
      // Light rays
      gfx.fillStyle(0xd9983f, 0.06);
      gfx.fillTriangle(w * 0.35, h * 0.05, w * 0.2, h, w * 0.5, h);
      gfx.fillTriangle(w * 0.55, h * 0.05, w * 0.4, h, w * 0.7, h);
    } else if (idx === 1) {
      // Sunset sky
      gfx.fillGradientStyle(0xffe8e6, 0xffc9bd, 0xf2a77a, 0xfff4ed, 1, 1, 1, 1);
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
      gfx.fillStyle(0x7d4150, 0.42);
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
      gfx.fillGradientStyle(0x4a2330, 0x7d4150, 0xb86b73, 0xf2a77a, 1, 1, 1, 1);
      gfx.fillRect(0, 0, w, h);
      // Stars
      for (let i = 0; i < 150; i++) {
        gfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 1));
        gfx.fillCircle(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h * 0.6), Phaser.Math.FloatBetween(0.5, 2.5));
      }
      // Aurora hints
      gfx.fillStyle(0xffe8e6, 0.06);
      gfx.fillRect(w * 0.1, h * 0.05, w * 0.3, h * 0.3);
      gfx.fillStyle(0xf2a77a, 0.06);
      gfx.fillRect(w * 0.5, h * 0.08, w * 0.35, h * 0.25);
      // Grass field
      gfx.fillStyle(0x7aa874, 0.28);
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
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, GAME_THEME.int.cream, 0.82);
    
    const chapterText = this.add.text(w / 2, h / 2 - 30, t('game.chapter', { n: level.id }), {
      fontFamily: '"Inter", sans-serif',
      fontSize: '14px',
      color: GAME_THEME.hex.accent,
    }).setOrigin(0.5).setAlpha(0);

    const titleText = this.add.text(w / 2, h / 2 + 5, level.title, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '36px',
      color: GAME_THEME.hex.ink,
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

  isJigsawLevel(level) {
    return level?.challenge?.type === 'jigsaw';
  }

  getJigsawPieceTotal(level) {
    const rows = Math.max(1, Number(level?.challenge?.rows) || 2);
    const cols = Math.max(1, Number(level?.challenge?.cols) || 2);
    return Math.min(4, rows * cols);
  }

  createJigsawChallenge(level, w, h) {
    const rows = 2;
    const cols = 2;
    const textureKey = this.ensureJigsawTexture(level, w, h);
    const texture = this.textures.get(textureKey);
    const source = texture.getSourceImage();
    const sourceW = source?.width || 1536;
    const sourceH = source?.height || 864;
    const cropSize = Math.min(sourceW, sourceH);
    const cropOffsetX = (sourceW - cropSize) / 2;
    const cropOffsetY = (sourceH - cropSize) / 2;
    const aspect = 1;

    const isShortLandscape = h < 500 && w > h;
    const promptCenterY = isShortLandscape ? 52 : 66;
    const promptTextY = isShortLandscape ? 47 : 58;
    const instructionY = isShortLandscape ? 69 : 80;
    const promptH = isShortLandscape ? 38 : 46;
    const boardTop = isShortLandscape ? 82 : 100;
    const trayH = isShortLandscape
      ? Math.min(128, Math.max(96, h * 0.3))
      : Math.min(280, Math.max(178, h * 0.34));
    const trayTop = h - trayH - 8;
    const maxBoardW = Math.min(w * 0.86, 980);
    const maxBoardH = Math.max(96, trayTop - boardTop - 14);
    let boardW = maxBoardW;
    let boardH = boardW / aspect;
    if (boardH > maxBoardH) {
      boardH = maxBoardH;
      boardW = boardH * aspect;
    }

    const boardX = (w - boardW) / 2;
    const boardY = boardTop + Math.max(0, (maxBoardH - boardH) / 2);
    const pieceW = boardW / cols;
    const pieceH = boardH / rows;
    const cropW = cropSize / cols;
    const cropH = cropSize / rows;
    const snapDistance = Math.max(26, Math.min(pieceW, pieceH) * 0.22);

    const prompt = level.challenge?.prompt || t('game.jigsawPrompt');
    this.add.rectangle(w / 2, promptCenterY, Math.min(w - 32, 560), promptH, GAME_THEME.int.panel, 0.9)
      .setStrokeStyle(1, GAME_THEME.int.accent, 0.24);
    this.add.text(w / 2, promptTextY, prompt, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: isShortLandscape ? '14px' : '17px',
      color: GAME_THEME.hex.ink,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: Math.min(w - 64, 520) },
    }).setOrigin(0.5);
    this.add.text(w / 2, instructionY, t('game.jigsawInstruction'), {
      fontFamily: '"Inter", sans-serif',
      fontSize: isShortLandscape ? '10px' : '11px',
      color: GAME_THEME.hex.softInk,
      align: 'center',
    }).setOrigin(0.5);

    this.add.rectangle(w / 2 + 4, boardY + boardH / 2 + 8, boardW + 16, boardH + 16, 0x7d4150, 0.12);
    this.add.rectangle(w / 2, boardY + boardH / 2, boardW + 14, boardH + 14, GAME_THEME.int.panel, 0.9)
      .setStrokeStyle(1, GAME_THEME.int.accent, 0.2);

    const targetPositions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = boardX + col * pieceW + pieceW / 2;
        const y = boardY + row * pieceH + pieceH / 2;
        targetPositions.push({ row, col, x, y });
        this.add.rectangle(x, y, pieceW - 5, pieceH - 5, 0xfffaf6, 0.56)
          .setStrokeStyle(1, GAME_THEME.int.accent, 0.18);
      }
    }

    this.add.rectangle(w / 2, h - trayH / 2 - 4, w - 24, trayH, GAME_THEME.int.panel, 0.92)
      .setStrokeStyle(1, GAME_THEME.int.accent, 0.24)
      .setDepth(15);
    this.add.text(24, h - trayH + 10, t('game.jigsawTray'), {
      fontFamily: '"Inter", sans-serif',
      fontSize: '11px',
      color: GAME_THEME.hex.softInk,
    }).setDepth(16);

    const optionGap = Math.min(isShortLandscape ? 8 : 10, Math.max(4, w * 0.008));
    const trayPaddingX = isShortLandscape ? 18 : 30;
    const trayLabelH = isShortLandscape ? 24 : 30;
    const traySlots = 4;
    const optionSize = Math.min(
      (w - trayPaddingX * 2 - optionGap * (traySlots - 1)) / traySlots,
      trayH - trayLabelH - 18
    );
    const optionW = optionSize;
    const optionH = optionSize;
    const trayGridW = optionW * traySlots + optionGap * (traySlots - 1);
    const trayGridH = optionH;
    const trayGridX = w / 2 - trayGridW / 2;
    const trayGridY = h - trayH + trayLabelH + Math.max(8, (trayH - trayLabelH - trayGridH) / 2);
    const trayOrder = [2, 0, 3, 1];

    targetPositions.forEach((target, index) => {
      const traySlot = Math.max(0, trayOrder.indexOf(index));
      const start = {
        x: trayGridX + traySlot * (optionW + optionGap) + optionW / 2,
        y: trayGridY + optionH / 2,
      };
      const pieceTextureKey = this.createJigsawPieceTexture(
        textureKey,
        index,
        cropOffsetX + target.col * cropW,
        cropOffsetY + target.row * cropH,
        cropW,
        cropH
      );
      const piece = this.add.image(start.x, start.y, pieceTextureKey)
        .setOrigin(0.5)
        .setDisplaySize(optionW, optionH)
        .setDepth(20 + index)
        .setInteractive({ useHandCursor: true });

      piece.jigsawTarget = target;
      piece.jigsawPlaced = false;
      piece.jigsawHome = { x: start.x, y: start.y };
      piece.jigsawTargetSize = { width: pieceW, height: pieceH };
      piece.jigsawOptionSize = { width: optionW, height: optionH };
      this.input.setDraggable(piece);

      const border = this.add.rectangle(piece.x, piece.y, optionW, optionH, 0xffffff, 0)
        .setStrokeStyle(1, 0xffffff, 0.65)
        .setDepth(piece.depth + 0.1);
      piece.jigsawBorder = border;

      piece.on('dragstart', () => {
        if (piece.jigsawPlaced || this.jigsawSolved) return;
        piece.setDepth(80);
        border.setDepth(81);
        piece.setDisplaySize(pieceW, pieceH);
        border.setDisplaySize(pieceW, pieceH);
        piece.setAlpha(0.96);
      });

      piece.on('drag', (pointer, dragX, dragY) => {
        if (piece.jigsawPlaced || this.jigsawSolved) return;
        piece.setPosition(dragX, dragY);
        border.setPosition(dragX, dragY);
      });

      piece.on('dragend', () => {
        if (piece.jigsawPlaced || this.jigsawSolved) return;
        this.handleJigsawDrop(piece, border, snapDistance, level);
      });

      this.jigsawPieces.push(piece);
    });
  }

  createJigsawPieceTexture(textureKey, pieceIndex, sx, sy, sw, sh) {
    const pieceKey = `jigsaw-piece-${this.levelIndex}-${pieceIndex}`;
    if (this.textures.exists(pieceKey)) return pieceKey;

    const source = this.textures.get(textureKey).getSourceImage();
    const size = 384;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, size, size);

    // Add a subtle edge directly into the tile texture so each tray option
    // reads as a complete square piece instead of a crop of a larger frame.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, size - 8, size - 8);
    ctx.strokeStyle = 'rgba(74, 35, 48, 0.22)';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, size - 16, size - 16);

    this.textures.addCanvas(pieceKey, canvas);
    return pieceKey;
  }

  ensureJigsawTexture(level, w, h) {
    const textureKey = `memory-photo-${this.levelIndex}`;
    if (this.textures.exists(textureKey)) return textureKey;

    const fallbackKey = `jigsaw-fallback-${this.levelIndex}`;
    if (this.textures.exists(fallbackKey)) return fallbackKey;

    const texW = 1024;
    const texH = 1024;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillGradientStyle(0xfffaf6, 0xffe8e6, 0xfff4ed, 0xeaf6ef, 1, 1, 1, 1);
    gfx.fillRect(0, 0, texW, texH);
    gfx.fillStyle(GAME_THEME.int.blush, 0.24);
    gfx.fillCircle(texW * 0.25, texH * 0.35, 180);
    gfx.fillStyle(GAME_THEME.int.peach, 0.18);
    gfx.fillCircle(texW * 0.72, texH * 0.42, 220);
    gfx.fillStyle(0xeaf6ef, 0.16);
    gfx.fillRoundedRect(texW * 0.2, texH * 0.62, texW * 0.6, 90, 28);
    gfx.lineStyle(8, GAME_THEME.int.accent, 0.32);
    gfx.strokeRoundedRect(texW * 0.22, texH * 0.18, texW * 0.56, texH * 0.52, 36);
    gfx.generateTexture(fallbackKey, texW, texH);
    gfx.destroy();

    return fallbackKey;
  }

  handleJigsawDrop(piece, border, snapDistance, level) {
    const target = piece.jigsawTarget;
    const distance = Phaser.Math.Distance.Between(piece.x, piece.y, target.x, target.y);

    if (distance <= snapDistance) {
      piece.jigsawPlaced = true;
      piece.disableInteractive();
      piece.setAlpha(1);
      this.tweens.add({
        targets: [piece, border],
        x: target.x,
        y: target.y,
        duration: 180,
        ease: 'Back.easeOut',
      });
      border.setStrokeStyle(1, GAME_THEME.int.accent, 0.42);
      this.jigsawPlacedCount += 1;
      this.updateJigsawProgress(level);

      if (this.jigsawPlacedCount >= this.getJigsawPieceTotal(level)) {
        this.completeJigsaw(level);
      }
      return;
    }

    piece.setAlpha(1);
    piece.setDisplaySize(piece.jigsawOptionSize.width, piece.jigsawOptionSize.height);
    border.setDisplaySize(piece.jigsawOptionSize.width, piece.jigsawOptionSize.height);

    this.tweens.add({
      targets: [piece, border],
      x: piece.jigsawHome.x,
      y: piece.jigsawHome.y,
      duration: 140,
      ease: 'Sine.easeOut',
      onComplete: () => {
        piece.setDisplaySize(piece.jigsawOptionSize.width, piece.jigsawOptionSize.height);
        border.setDisplaySize(piece.jigsawOptionSize.width, piece.jigsawOptionSize.height);
      },
    });
  }

  updateJigsawProgress(level) {
    if (!this.shardTextObj) return;
    this.shardTextObj.setText(t('game.jigsawProgress', {
      current: this.jigsawPlacedCount,
      total: this.getJigsawPieceTotal(level),
    }));
  }

  completeJigsaw(level) {
    if (this.jigsawSolved) return;
    this.jigsawSolved = true;
    this.updateJigsawProgress(level);

    const { width, height } = this.cameras.main;
    const banner = this.add.rectangle(width / 2, height - 88, 320, 46, GAME_THEME.int.panel, 0.94)
      .setStrokeStyle(1, GAME_THEME.int.accent, 0.34)
      .setDepth(120);
    const label = this.add.text(width / 2, height - 88, t('game.jigsawComplete'), {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '16px',
      color: GAME_THEME.hex.accent,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(121);

    this.tweens.add({
      targets: [banner, label],
      y: '-=8',
      alpha: { from: 0, to: 1 },
      duration: 420,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(900, () => this.showMemoryCardForJigsaw(level));
  }

  showMemoryCardForJigsaw(level) {
    this.scene.launch('MemoryCardScene', {
      level: {
        ...level,
        description: level.challenge?.completionText || level.description,
      },
      reward: {
        type: 'memory_shard',
        text: level.memory_shard_text || level.challenge?.completionText || t('generate.foundShard'),
      },
      onDone: () => {
        this.showLevelComplete();
      },
    });
    this.scene.pause();
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
      const hintText = this.add.text(x, y + 35, t('game.explore'), {
        fontFamily: '"Inter", sans-serif',
        fontSize: '11px',
        color: GAME_THEME.hex.accent,
        backgroundColor: 'rgba(255, 250, 246, 0.86)',
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
    refs.hintText.setText(t('game.collected')).setAlpha(0.75);
    refs.glow.setAlpha(0.1);

    if (this.shardTextObj) {
      const total = Math.max(1, this.hotspotRefs.length);
      this.shardTextObj.setText(t('game.shards', { current: this.viewedInteractives.size, total: total }));
    }
  }

  showLevelComplete() {
    if (this.levelCompleteText) return;

    const { width, height } = this.cameras.main;
    const panel = this.add.rectangle(width / 2, height - 54, 300, 48, GAME_THEME.int.panel, 0.92)
      .setStrokeStyle(1, GAME_THEME.int.accent, 0.32)
      .setInteractive({ useHandCursor: true });
    const labelText = this.isJigsawLevel(this.currentLevel) ? t('game.jigsawComplete') : t('game.levelComplete');
    const label = this.add.text(width / 2, height - 54, labelText, {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '15px',
      color: GAME_THEME.hex.accent,
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
    this.cameras.main.fadeOut(600, ...GAME_THEME.fade);
    this.time.delayedCall(600, () => {
      this.scene.start('LevelScene', { levelIndex: this.levelIndex + 1 });
    });
  }

  createHUD(level, totalLevels, w) {
    // Top bar
    const hudBg = this.add.rectangle(w / 2, 0, w, 44, GAME_THEME.int.panel, 0.88).setOrigin(0.5, 0);

    // Level indicator
    this.add.text(16, 12, `${level.id} / ${totalLevels}`, {
      fontFamily: '"Inter", sans-serif',
      fontSize: '13px',
      color: GAME_THEME.hex.accent,
    });

    // Memory shards
    const totalHotspots = this.isJigsawLevel(level)
      ? this.getJigsawPieceTotal(level)
      : Math.max(1, (level.interactives || []).length);
    const shardText = this.isJigsawLevel(level)
      ? t('game.jigsawProgress', { current: this.jigsawPlacedCount, total: totalHotspots })
      : t('game.shards', { current: 0, total: totalHotspots });
    this.shardTextObj = this.add.text(w - 16, 12, shardText, {
      fontFamily: '"Inter", sans-serif',
      fontSize: '13px',
      color: GAME_THEME.hex.softInk,
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
