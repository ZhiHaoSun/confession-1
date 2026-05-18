/**
 * GameBoot.js — Phaser 3 game bootstrap for the player-side experience.
 * Loads config.json and launches the romantic puzzle adventure.
 */
import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LevelScene } from './scenes/LevelScene.js';
import { PuzzleScene } from './scenes/PuzzleScene.js';
import { MemoryCardScene } from './scenes/MemoryCardScene.js';
import { ConfessionScene } from './scenes/ConfessionScene.js';
import { GAME_THEME } from './GameTheme.js';

import { initLocale, t } from '../i18n/i18n.js';

// Load game config from share id, browser storage, or demo fallback.
async function loadGameConfig() {
  initLocale();

  const params = new URLSearchParams(window.location.search);
  const mazeId = params.get('id');

  if (mazeId) {
    try {
      const response = await fetch(`/api/maze-config?id=${encodeURIComponent(mazeId)}`);
      if (!response.ok) throw new Error(`Failed to load maze ${mazeId}`);
      return await response.json();
    } catch (err) {
      console.warn('Failed to load maze config by id, falling back to local config:', err.message);
    }
  }

  try {
    const saved = sessionStorage.getItem('memorymaze_game_config') || localStorage.getItem('memorymaze_game_config');
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }

  // Demo fallback config
  return getDemoConfig();
}

function getDemoConfig() {
  const name = 'Alice';
  const myName = 'Bob';
  return {
    meta: {
      title: t('generate.mazeTitle', { myName, herName: name }),
      createdAt: '2026-05-08',
      artStyle: 'anime',
      version: '1.0.0',
    },
    characters: {
      creator: { name: myName },
      receiver: { name },
    },
    puzzleKeys: {
      birthday: '1108',
      anniversary: '0520',
    },
    levels: [
      {
        id: 1,
        title: t('generate.demo1Title'),
        background: '',
        description: t('generate.demo1Desc', { name }),
        date: '2024-09-15',
        interactives: [{
          type: 'trivia',
          icon: '📖',
          position: { x: 0.65, y: 0.45 },
          puzzle: {
            type: 'trivia',
            question: t('generate.demo1Q'),
            answer: t('generate.demo1A'),
            hint: t('generate.demo1Hint'),
          },
          reward: { type: 'memory_shard', text: t('generate.demo1Reward') },
        }],
      },
      {
        id: 2,
        title: t('generate.demo2Title'),
        background: '',
        description: t('generate.demo2Desc'),
        date: '2024-11-20',
        interactives: [{
          type: 'password',
          icon: '🔐',
          position: { x: 0.45, y: 0.5 },
          puzzle: {
            type: 'password',
            question: t('generate.demo2Q'),
            answer: t('generate.demo2A'),
            hint: t('generate.demo2Hint'),
          },
          reward: { type: 'memory_shard', text: t('generate.demo2Reward') },
        }],
      },
      {
        id: 3,
        title: t('generate.demo3Title'),
        background: '',
        description: t('generate.demo3Desc'),
        date: '2025-05-20',
        interactives: [{
          type: 'hidden',
          icon: '🔍',
          position: { x: 0.35, y: 0.55 },
          puzzle: {
            type: 'hidden',
            question: t('generate.demo3Q'),
            answer: t('generate.demo3A'),
            hint: t('generate.demo3Hint'),
          },
          reward: { type: 'memory_shard', text: t('generate.demo3Reward') },
        }],
      },
    ],
    finale: {
      hasVideo: false,
      videoUrl: '',
      loveLetter: t('generate.defaultLoveLetter', { name }),
      bgm: 'romantic-piano',
    },
  };
}

async function bootGame() {
  const gameConfig = await loadGameConfig();
  window.__MEMORYMAZE_GAME_CONFIG__ = gameConfig;

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 960,
    height: 540,
    backgroundColor: GAME_THEME.hex.pageBg,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [PreloadScene, MenuScene, LevelScene, PuzzleScene, MemoryCardScene, ConfessionScene],
  };

  const game = new Phaser.Game(config);
  game.registry.set('gameConfig', gameConfig);
  setupMobileRotation(game);
}

bootGame();

function setupMobileRotation(game) {
  const rotateBtn = document.getElementById('rotate-game-btn');
  const exitBtn = document.getElementById('exit-rotate-btn');
  const container = document.getElementById('game-container');
  if (!rotateBtn || !exitBtn || !container) return;

  const refreshScale = () => {
    window.setTimeout(() => {
      game.scale.refresh();
      window.dispatchEvent(new Event('resize'));
    }, 260);
  };

  const enterFallbackRotate = () => {
    document.body.classList.add('game-rotated');
    refreshScale();
  };

  const exitFallbackRotate = () => {
    document.body.classList.remove('game-rotated');
    refreshScale();
  };

  rotateBtn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement && container.requestFullscreen) {
        await container.requestFullscreen();
      }
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape');
        refreshScale();
        return;
      }
    } catch {
      // Some mobile browsers only allow visual rotation, so use the CSS fallback.
    }

    enterFallbackRotate();
  });

  exitBtn.addEventListener('click', async () => {
    exitFallbackRotate();
    try {
      if (screen.orientation?.unlock) screen.orientation.unlock();
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Leaving the visual fallback is enough for unsupported browsers.
    }
  });

  window.addEventListener('orientationchange', refreshScale);
  window.addEventListener('resize', () => {
    if (window.matchMedia('(orientation: landscape)').matches) {
      document.body.classList.remove('game-rotated');
    }
  });
}
