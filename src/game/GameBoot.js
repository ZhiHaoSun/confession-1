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

// Load game config from share id, browser storage, or demo fallback.
async function loadGameConfig() {
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
  return {
    meta: {
      title: 'Bob ❤ Alice 的记忆迷宫',
      createdAt: '2026-05-08',
      artStyle: 'anime',
      version: '1.0.0',
    },
    characters: {
      creator: { name: 'Bob' },
      receiver: { name: 'Alice' },
    },
    puzzleKeys: {
      birthday: '1108',
      anniversary: '0520',
    },
    levels: [
      {
        id: 1,
        title: '初遇 · 图书馆',
        background: '',
        description: '那年秋天，阳光透过图书馆的大窗户洒进来。你正低着头，认真地翻着一本书。我鼓起勇气走过去，假装问你借一本书。从那一刻起，我的世界里多了一个你。',
        date: '2024-09-15',
        interactives: [{
          type: 'trivia',
          icon: '📖',
          position: { x: 0.65, y: 0.45 },
          puzzle: {
            type: 'trivia',
            question: '你还记得那天借给我的第一本书叫什么名字吗？',
            answer: '小王子',
            hint: '一个住在B612小行星上的小男孩的故事...',
          },
          reward: { type: 'memory_shard', text: '✨ 你找到了第一片记忆碎片！\n\n那天你笑着把书递给我说："这本书你一定会喜欢的。"' },
        }],
      },
      {
        id: 2,
        title: '约会 · 摩天轮',
        background: '',
        description: '我们的第一次约会去了游乐园。你说你恐高，却因为我想坐摩天轮而默默地跟了上来。在最高处，你紧紧握住我的手，窗外是整个城市的灯火。',
        date: '2024-11-20',
        interactives: [{
          type: 'password',
          icon: '🔐',
          position: { x: 0.45, y: 0.5 },
          puzzle: {
            type: 'password',
            question: '请输入我们在一起的纪念日',
            answer: '0520',
            hint: '那是一个关于"我爱你"的日子...',
          },
          reward: { type: 'memory_shard', text: '✨ 第二片记忆碎片已解锁！\n\n在摩天轮的最高点，你靠在我的肩上轻声说了一句"谢谢你"。' },
        }],
      },
      {
        id: 3,
        title: '告白 · 星空下',
        background: '',
        description: '那天晚上我们躺在草地上看星星，微风很轻，星光很柔。我转头看你的侧脸，心想，如果时间能永远停在这一刻就好了。',
        date: '2025-05-20',
        interactives: [{
          type: 'hidden',
          icon: '🔍',
          position: { x: 0.35, y: 0.55 },
          puzzle: {
            type: 'hidden',
            question: '找到藏在星空中的发光宝箱',
            answer: '打开宝箱，里面是一颗用星光编织的心。上面写着：\n\n"每一颗星星，都是我想对你说的一句话。"',
            hint: '仔细看看，有什么东西在闪烁着不一样的光芒...',
          },
          reward: { type: 'memory_shard', text: '✨ 最后一片记忆碎片！所有回忆已完整拼合！\n\n是时候揭开最终的秘密了...' },
        }],
      },
    ],
    finale: {
      hasVideo: false,
      videoUrl: '',
      loveLetter: '亲爱的 Alice，\n\n从图书馆的那个午后开始，你就像一束光照进了我的生命。\n\n谢谢你陪我坐摩天轮，虽然你恐高；\n谢谢你为我做的每一顿饭，即使有时候会焦；\n谢谢你在每个深夜陪我聊天，即使你明天要早起。\n\n这个世界很大，但有你的地方，就是我的整个宇宙。\n\n我爱你，从过去到未来的每一天。\n\n—— 永远的 Bob ❤️',
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
    backgroundColor: '#0a0e27',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [PreloadScene, MenuScene, LevelScene, PuzzleScene, MemoryCardScene, ConfessionScene],
  };

  const game = new Phaser.Game(config);
  game.registry.set('gameConfig', gameConfig);
}

bootGame();
