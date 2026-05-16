/**
 * ConfigGenerator — Transforms wizard data into the game config.json schema.
 * When an OpenAI API key is provided, uses ChatGPT 5.5 to generate
 * rich scene narratives, puzzles, and emotional content.
 * Falls back to local generation when no key is available.
 */
import { AIService } from './AIService.js';

export class ConfigGenerator {
  constructor() {
    this.aiService = null;
    this.onProgress = null; // callback(step, total, message)
  }

  /**
   * Generate the complete game config.
   * @param {Object} wizardData - All wizard form data
   * @param {Function} onProgress - Optional progress callback(stepIndex, totalSteps, message)
   * @returns {Object} Game configuration JSON
   */
  async generate(wizardData, onProgress) {
    const d = wizardData;
    this.onProgress = onProgress || (() => {});
    const today = new Date().toISOString().split('T')[0];
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const useAI = !!apiKey;

    if (useAI) {
      this.aiService = new AIService(apiKey);
    }

    // Build puzzle keys from dates
    const puzzleKeys = {};
    if (d.herBirthday) {
      const bd = new Date(d.herBirthday);
      puzzleKeys.birthday = String(bd.getMonth() + 1).padStart(2, '0') + String(bd.getDate()).padStart(2, '0');
    }
    if (d.anniversary) {
      const an = new Date(d.anniversary);
      puzzleKeys.anniversary = String(an.getMonth() + 1).padStart(2, '0') + String(an.getDate()).padStart(2, '0');
    }

    const characters = {
      creator: { name: d.myName || '他' },
      receiver: { name: d.herName || '她' },
    };

    // Build levels from memories
    const memories = (d.memories || []).filter(m => m.title || m.description || (m.photos && m.photos.length > 0));
    const puzzles = d.puzzles || [];
    const totalSteps = memories.length + 2; // scenes + narrative + finalize

    let levels = [];

    if (memories.length === 0) {
      this.onProgress(0, 1, '使用示例场景...');
      levels = this.getDemoLevels(d);
    } else if (useAI) {
      // AI-powered generation
      levels = await this._generateWithAI(memories, puzzles, d, characters, totalSteps);
    } else {
      // Local generation (no AI)
      levels = this._generateLocal(memories, puzzles, d);
    }

    // Generate narrative / love letter
    let loveLetter = d.loveLetter || '';
    let openingText = '';

    if (useAI && memories.length > 0) {
      this.onProgress(memories.length, totalSteps, '正在为你写一封深情的告白信...');
      try {
        const narrative = await this.aiService.generateNarrative(
          memories, characters, d.loveLetter
        );
        loveLetter = narrative.love_letter || loveLetter;
        openingText = narrative.opening_text || '';
      } catch (err) {
        console.warn('AI narrative generation failed, using fallback:', err.message);
      }
    }

    if (!loveLetter) {
      loveLetter = `亲爱的${d.herName || '你'}，谢谢你出现在我的生命中。每一段记忆，都是我最珍贵的宝藏。`;
    }

    this.onProgress(totalSteps - 1, totalSteps, '正在组装游戏... ✨');
    await this._delay(300);

    return {
      meta: {
        title: `${d.myName || '他'} ❤ ${d.herName || '她'} 的记忆迷宫`,
        createdAt: today,
        artStyle: d.artStyle || 'watercolor',
        version: '1.0.0',
        openingText,
      },
      characters,
      puzzleKeys,
      levels,
      finale: {
        hasVideo: !!(d.confessionVideoUrl || d.confessionVideo),
        videoUrl: d.confessionVideoUrl || '',
        videoName: d.confessionVideoName || '',
        loveLetter,
        bgm: d.bgm || 'romantic-piano',
      },
    };
  }

  /**
   * AI-powered scene generation — calls ChatGPT 5.5 for each scene.
   */
  async _generateWithAI(memories, puzzles, d, characters, totalSteps) {
    const levels = [];

    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];
      const userPuzzle = puzzles[i];
      const sceneName = memory.title || `场景 ${i + 1}`;

      this.onProgress(i, totalSteps, `正在让 AI 分析「${sceneName}」...`);

      try {
        const aiResult = await this.aiService.generateScene(
          memory,
          d.artStyle || 'watercolor',
          characters,
          i,
          memories.length
        );

        // Merge AI result with user overrides
        const puzzle = this._mergeAIPuzzle(aiResult.puzzle, userPuzzle);
        const interactives = this.buildMultipleInteractives({
          aiInteractives: aiResult.interactives,
          memory,
          puzzle,
          sceneIndex: i,
        });

        levels.push({
          id: i + 1,
          title: aiResult.title || memory.title || `第 ${i + 1} 章`,
          background: (memory.photos && memory.photos[0]) || '',
          photos: memory.photos || [],
          music: this.buildSceneMusic(d),
          description: aiResult.narrative || memory.description || '',
          scene_description: aiResult.scene_description || '',
          date: memory.date || '',
          mood: aiResult.mood || '温馨',
          color_palette: aiResult.color_palette || [],
          interactives,
          memory_shard_text: aiResult.memory_shard_text || '✨ 你找到了一段珍贵的记忆碎片',
        });
      } catch (err) {
        console.warn(`AI generation failed for scene ${i + 1}, using fallback:`, err.message);
        // Fallback to local generation for this scene
        const puzzle = userPuzzle || { type: 'trivia', question: '', answer: '', hint: '' };
        levels.push({
          id: i + 1,
          title: memory.title || `第 ${i + 1} 章`,
          background: (memory.photos && memory.photos[0]) || '',
          photos: memory.photos || [],
          music: this.buildSceneMusic(d),
          description: this.enhanceDescription(memory.description, d.herName),
          date: memory.date || '',
          interactives: this.buildMultipleInteractives({ memory, puzzle, sceneIndex: i }),
        });
      }
    }

    return levels;
  }

  /**
   * Local generation — no AI, just structure the data.
   */
  _generateLocal(memories, puzzles, d) {
    return memories.map((memory, index) => {
      const puzzle = puzzles[index] || { type: 'trivia', question: '', answer: '', hint: '' };

      return {
        id: index + 1,
        title: memory.title || `第 ${index + 1} 章`,
        background: (memory.photos && memory.photos[0]) || '',
        photos: memory.photos || [],
        music: this.buildSceneMusic(d),
        description: this.enhanceDescription(memory.description, d.herName),
        date: memory.date || '',
        interactives: this.buildMultipleInteractives({ memory, puzzle, sceneIndex: index }),
      };
    });
  }

  /**
   * Merge AI-generated puzzle with user-defined overrides.
   * User's manual config takes priority over AI suggestions.
   */
  _mergeAIPuzzle(aiPuzzle, userPuzzle) {
    if (!aiPuzzle) return userPuzzle || { type: 'trivia', question: '', answer: '', hint: '' };
    if (!userPuzzle) return aiPuzzle;

    return {
      type: userPuzzle.type || aiPuzzle.type || 'trivia',
      question: userPuzzle.question || aiPuzzle.question || '',
      answer: userPuzzle.answer || aiPuzzle.answer || '',
      hint: userPuzzle.hint || aiPuzzle.hint || '',
    };
  }

  buildInteractive(puzzle, index) {
    const positions = [
      { x: 0.6, y: 0.5 },
      { x: 0.3, y: 0.6 },
      { x: 0.7, y: 0.4 },
      { x: 0.5, y: 0.55 },
      { x: 0.4, y: 0.45 },
    ];

    const pos = positions[index % positions.length];

    const icons = {
      trivia: '📖',
      password: '🔐',
      hidden: '🔍',
    };

    return {
      type: puzzle.type,
      icon: icons[puzzle.type] || '✨',
      position: pos,
      puzzle: {
        type: puzzle.type,
        question: puzzle.question || '你还记得吗？',
        answer: puzzle.answer || '',
        hint: puzzle.hint || '想想我们的回忆...',
      },
      reward: {
        type: 'memory_shard',
        text: puzzle.type === 'hidden' ? (puzzle.answer || '你找到了一段珍贵的记忆碎片') : '✨ 解锁成功！你找到了一段珍贵的记忆碎片',
      },
    };
  }

  buildMultipleInteractives({ aiInteractives, memory, puzzle, sceneIndex }) {
    const points = Array.isArray(aiInteractives) && aiInteractives.length > 0
      ? aiInteractives.slice(0, 5)
      : this.getLocalHotspots(memory);

    const interactives = points.map((point, idx) => this.buildMemoryInteractive(point, idx, sceneIndex, memory));

    if (puzzle?.question || puzzle?.answer || puzzle?.type === 'password') {
      const puzzleInteractive = this.buildInteractive(puzzle, sceneIndex);
      puzzleInteractive.id = `scene-${sceneIndex + 1}-puzzle`;
      puzzleInteractive.title = puzzle.type === 'password' ? '记忆密码' : '心动问题';
      puzzleInteractive.memoryText = memory.description || puzzle.reward?.text || '这道题的答案，藏在你们共同经历过的那一天里。';
      puzzleInteractive.reward = {
        ...puzzleInteractive.reward,
        text: puzzleInteractive.reward?.text || '✨ 你解开了一段重要记忆',
      };
      interactives.unshift(puzzleInteractive);
    }

    return interactives.slice(0, 5);
  }

  buildMemoryInteractive(point, idx, sceneIndex, memory) {
    const fallbackPositions = [
      { x: 0.32, y: 0.45 },
      { x: 0.62, y: 0.42 },
      { x: 0.48, y: 0.62 },
      { x: 0.72, y: 0.55 },
      { x: 0.25, y: 0.64 },
    ];
    const pos = this.normalizePosition(point?.position) || fallbackPositions[idx % fallbackPositions.length];
    const title = point?.title || ['细节一角', '熟悉物件', '那一瞬间', '藏起的话', '光里的回忆'][idx % 5];
    const memoryText = point?.memory_text || point?.memoryText || this.getFallbackMemoryText(memory, idx);

    return {
      id: `scene-${sceneIndex + 1}-memory-${idx + 1}`,
      type: 'memory',
      title,
      icon: point?.icon || ['✨', '💌', '🎞️', '🌙', '🎵'][idx % 5],
      position: pos,
      memoryText,
      reward: {
        type: 'memory_shard',
        text: point?.reward_text || point?.rewardText || `✨ 你发现了「${title}」里的记忆`,
      },
    };
  }

  normalizePosition(position) {
    if (!position) return null;
    const x = Number(position.x);
    const y = Number(position.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return {
      x: Math.min(0.85, Math.max(0.15, x)),
      y: Math.min(0.82, Math.max(0.2, y)),
    };
  }

  getLocalHotspots(memory) {
    const hotspots = [];
    if (memory.location) {
      hotspots.push({
        title: '熟悉的地点',
        icon: '📍',
        memory_text: `这里是${memory.location}。有些地方之所以特别，不是因为它多么耀眼，而是因为那天你在那里。`,
      });
    }
    if (memory.dialogue) {
      hotspots.push({
        title: '那句对白',
        icon: '💬',
        memory_text: `我一直记得那句话：${memory.dialogue}。后来想起它，还是会觉得那一刻很轻，也很珍贵。`,
      });
    }
    if (memory.soundtrack) {
      hotspots.push({
        title: '当时的歌',
        icon: '🎵',
        memory_text: `如果这段回忆有背景音乐，那一定是《${memory.soundtrack}》。旋律响起时，那天的画面好像又回来了。`,
      });
    }
    hotspots.push({
      title: memory.title || '这一幕',
      icon: '✨',
      memory_text: memory.description || '这是一段被小心保存下来的回忆，里面有当时的光、心跳，以及想再靠近一点的我。',
    });
    hotspots.push({
      title: '没说出口的话',
      icon: '💌',
      memory_text: '有些话当时没有说得完整，所以我把它藏进这个小游戏里。希望你点开的时候，能听见我心里的认真。',
    });
    return hotspots.slice(0, 4);
  }

  getFallbackMemoryText(memory, idx) {
    const fallbacks = this.getLocalHotspots(memory);
    return fallbacks[idx % fallbacks.length]?.memory_text || memory.description || '这是一段属于我们的珍贵回忆...';
  }

  buildSceneMusic(d) {
    return {
      title: d.globalSceneMusicTitle || '',
      url: d.globalSceneMusicUrl || '',
      fileName: d.globalSceneMusicName || '',
    };
  }

  enhanceDescription(desc, herName) {
    if (!desc) return '这是一段属于我们的珍贵回忆...';
    return desc;
  }

  getDemoLevels(d) {
    const name = d.herName || 'Alice';
    return [
      {
        id: 1,
        title: '初遇 · 图书馆',
        background: '',
        photos: [],
        description: `还记得那个午后吗？阳光从图书馆的大窗户洒进来，你正低头看书。那是我第一次见到你，${name}。`,
        date: '',
        interactives: [{
          type: 'trivia',
          icon: '📖',
          position: { x: 0.6, y: 0.5 },
          puzzle: {
            type: 'trivia',
            question: '你还记得那天我借给你的第一本书叫什么吗？',
            answer: '小王子',
            hint: '一个住在很小星球上的小男孩...',
          },
          reward: { type: 'memory_shard', text: '✨ 你找到了第一片记忆碎片！' },
        }],
      },
      {
        id: 2,
        title: '约会 · 游乐园',
        background: '',
        photos: [],
        description: '我们第一次约会去了游乐园。你说你恐高，却陪我坐了摩天轮。在最高处，整个城市的灯光在你眼里闪烁。',
        date: '',
        interactives: [{
          type: 'password',
          icon: '🔐',
          position: { x: 0.5, y: 0.55 },
          puzzle: {
            type: 'password',
            question: '输入我们的纪念日密码',
            answer: '0520',
            hint: '那个我们在一起的特别日子...',
          },
          reward: { type: 'memory_shard', text: '✨ 又一片记忆碎片被唤醒！' },
        }],
      },
      {
        id: 3,
        title: '日常 · 我们的厨房',
        background: '',
        photos: [],
        description: '你第一次为我做饭，煎蛋焦了，面条软了，但那是我吃过最好吃的一顿饭。因为满满的都是你的心意。',
        date: '',
        interactives: [{
          type: 'hidden',
          icon: '🔍',
          position: { x: 0.4, y: 0.45 },
          puzzle: {
            type: 'hidden',
            question: '找到藏在场景中的发光日记本',
            answer: '翻开日记本，里面夹着一张你写的便条：\"今天给你做了早餐，希望你喜欢 ❤️\"',
            hint: '仔细看看角落里是否有什么在闪光...',
          },
          reward: { type: 'memory_shard', text: '✨ 最后一片记忆碎片！所有回忆已完整拼合！' },
        }],
      },
    ];
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}
