/**
 * ConfigGenerator — Transforms wizard data into the game config.json schema.
 * When an OpenAI API key is provided, uses ChatGPT 5.5 to generate
 * rich scene narratives, puzzles, and emotional content.
 * Falls back to local generation when no key is available.
 */
import { AIService } from './AIService.js';
import { t } from '../i18n/i18n.js';

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
    const isEditMode = !!(d.editMode && d.existingConfig);
    const useAI = !!apiKey && !isEditMode;

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
      creator: {
        name: d.myName || t('generate.he'),
        portraitUrl: d.creatorPortraitUrl || '',
        portraitName: d.creatorPortraitName || '',
      },
      receiver: {
        name: d.herName || t('generate.she'),
        portraitUrl: d.receiverPortraitUrl || '',
        portraitName: d.receiverPortraitName || '',
      },
    };

    // Build levels from memories
    const memories = (d.memories || []).filter(m => m.title || m.description || (m.photos && m.photos.length > 0));
    const puzzles = d.puzzles || [];
    const totalSteps = memories.length + 2; // scenes + narrative + finalize

    let levels = [];

    if (isEditMode) {
      this.onProgress(0, Math.max(1, totalSteps), t('generate.updateConfig'));
      const editedConfig = this._generateEditedConfig(d, {
        today,
        characters,
        puzzleKeys,
        memories,
        puzzles,
      });
      this.onProgress(Math.max(0, totalSteps - 1), Math.max(1, totalSteps), t('generate.saveConfig'));
      await this._delay(200);
      return editedConfig;
    }

    if (memories.length === 0) {
      this.onProgress(0, 1, t('generate.useDemo'));
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
      this.onProgress(memories.length, totalSteps, t('generate.aiWriteLetter'));
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
      loveLetter = t('generate.defaultLoveLetter', { name: d.herName || t('generate.you') });
    }

    this.onProgress(totalSteps - 1, totalSteps, t('generate.assembleGameProgress'));
    await this._delay(300);

    return {
      meta: {
        title: t('generate.mazeTitle', { myName: d.myName || t('generate.he'), herName: d.herName || t('generate.she') }),
        createdAt: today,
        artStyle: d.artStyle || 'romantic-manga',
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
      narration: this.buildNarrationSettings(d),
    };
  }

  /**
   * Edit flow — reuse the stored config and wizard edits without calling the LLM.
   * Existing multi-hotspot content is preserved unless a new scene needs local defaults.
   */
  _generateEditedConfig(d, { today, characters, puzzleKeys, memories, puzzles }) {
    const existing = this._cloneConfig(d.existingConfig || {});
    const existingLevels = Array.isArray(existing.levels) ? existing.levels : [];
    const music = this.buildSceneMusic(d);

    const levels = memories.map((memory, index) => {
      const existingLevel = memory.existingLevel || existingLevels[index] || {};
      const puzzle = puzzles[index] || { type: 'trivia', question: '', answer: '', hint: '' };
      const interactives = this._mergeEditedInteractives(existingLevel, memory, puzzle, index);
      const challenge = this.buildLevelChallenge(memory, puzzle, index, existingLevel.challenge);

      return {
        ...existingLevel,
        id: index + 1,
        title: memory.title || existingLevel.title || t('game.chapter', { n: index + 1 }),
        background: existingLevel.artwork?.status === 'generated'
          ? (existingLevel.background || existingLevel.artwork.url || '')
          : ((memory.photos && memory.photos[0]) || existingLevel.background || ''),
        photos: memory.photos || existingLevel.photos || [],
        music,
        description: memory.description || existingLevel.description || '',
        date: memory.date || existingLevel.date || '',
        location: memory.location || existingLevel.location || '',
        people: memory.people || existingLevel.people || '',
        dialogue: memory.dialogue || existingLevel.dialogue || '',
        soundtrack: memory.soundtrack || existingLevel.soundtrack || '',
        challenge,
        interactives,
      };
    });

    const mazeId = d.editMazeId || existing.meta?.mazeId || '';
    const previousFinale = existing.finale || {};
    const loveLetter = d.loveLetter || previousFinale.loveLetter || t('generate.defaultLoveLetter', { name: d.herName || t('generate.you') });

    return {
      ...existing,
      meta: {
        ...(existing.meta || {}),
        title: t('generate.mazeTitle', { myName: d.myName || t('generate.he'), herName: d.herName || t('generate.she') }),
        createdAt: existing.meta?.createdAt || today,
        updatedAt: today,
        artStyle: d.artStyle || existing.meta?.artStyle || 'romantic-manga',
        version: existing.meta?.version || '1.0.0',
        mazeId,
      },
      characters,
      puzzleKeys,
      levels,
      finale: {
        ...previousFinale,
        hasVideo: !!(d.confessionVideoUrl || d.confessionVideo),
        videoUrl: d.confessionVideoUrl || '',
        videoName: d.confessionVideoName || '',
        loveLetter,
        bgm: d.bgm || previousFinale.bgm || 'romantic-piano',
      },
      narration: {
        ...(existing.narration || {}),
        ...this.buildNarrationSettings(d),
      },
    };
  }

  _mergeEditedInteractives(existingLevel, memory, puzzle, sceneIndex) {
    const existingInteractives = Array.isArray(existingLevel?.interactives)
      ? existingLevel.interactives
      : [];

    if (this.isJigsawPuzzle(puzzle)) {
      return [];
    }

    if (existingInteractives.length === 0) {
      return this.buildMultipleInteractives({ memory, puzzle, sceneIndex });
    }

    let puzzleUpdated = false;
    const updated = existingInteractives.map((item, index) => {
      if (item?.puzzle && !puzzleUpdated) {
        puzzleUpdated = true;
        return this._updatePuzzleInteractive(item, puzzle, sceneIndex);
      }

      if (item?.type === 'memory') {
        return {
          ...item,
          memoryText: item.memoryText || item.memory_text || this.getFallbackMemoryText(memory, index),
        };
      }

      return item;
    });

    if (!puzzleUpdated && (puzzle?.question || puzzle?.answer || puzzle?.type === 'password')) {
      updated.unshift(this._updatePuzzleInteractive(this.buildInteractive(puzzle, sceneIndex), puzzle, sceneIndex));
    }

    return updated.slice(0, 5);
  }

  _updatePuzzleInteractive(item, puzzle, sceneIndex) {
    const nextType = puzzle.type || item?.puzzle?.type || item?.type || 'trivia';
    const icons = {
      trivia: '❓',
      password: '🔐',
      hidden: '🔍',
      jigsaw: '🧩',
    };

    return {
      ...item,
      id: item.id || `scene-${sceneIndex + 1}-puzzle`,
      type: nextType,
      icon: item.icon || icons[nextType] || '✨',
      puzzle: {
        ...(item.puzzle || {}),
        type: nextType,
        question: puzzle.question || item?.puzzle?.question || '',
        answer: puzzle.answer || item?.puzzle?.answer || '',
        hint: puzzle.hint || item?.puzzle?.hint || '',
      },
    };
  }

  _cloneConfig(config) {
    if (typeof structuredClone === 'function') {
      return structuredClone(config);
    }
    return JSON.parse(JSON.stringify(config));
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

      this.onProgress(i, totalSteps, t('generate.aiAnalyzeScene', { sceneName }));

      try {
        const aiResult = await this.aiService.generateScene(
          memory,
          d.artStyle || 'romantic-manga',
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
        const challenge = this.buildLevelChallenge(memory, puzzle, i);

        levels.push({
          id: i + 1,
          title: aiResult.title || memory.title || t('game.chapter', { n: i + 1 }),
          background: (memory.photos && memory.photos[0]) || '',
          photos: memory.photos || [],
          music: this.buildSceneMusic(d),
          description: aiResult.narrative || memory.description || '',
          scene_description: aiResult.scene_description || '',
          date: memory.date || '',
          location: memory.location || '',
          people: memory.people || '',
          dialogue: memory.dialogue || '',
          soundtrack: memory.soundtrack || '',
          mood: aiResult.mood || '温馨',
          color_palette: aiResult.color_palette || [],
          challenge,
          interactives,
          memory_shard_text: aiResult.memory_shard_text || t('generate.foundShard'),
        });
      } catch (err) {
        console.warn(`AI generation failed for scene ${i + 1}, using fallback:`, err.message);
        // Fallback to local generation for this scene
        const puzzle = userPuzzle || { type: 'trivia', question: '', answer: '', hint: '' };
        levels.push({
          id: i + 1,
          title: memory.title || t('game.chapter', { n: i + 1 }),
          background: (memory.photos && memory.photos[0]) || '',
          photos: memory.photos || [],
          music: this.buildSceneMusic(d),
          description: this.enhanceDescription(memory.description, d.herName),
          date: memory.date || '',
          location: memory.location || '',
          people: memory.people || '',
          dialogue: memory.dialogue || '',
          soundtrack: memory.soundtrack || '',
          challenge: this.buildLevelChallenge(memory, puzzle, i),
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
        title: memory.title || t('game.chapter', { n: index + 1 }),
        background: (memory.photos && memory.photos[0]) || '',
        photos: memory.photos || [],
        music: this.buildSceneMusic(d),
        description: this.enhanceDescription(memory.description, d.herName),
        date: memory.date || '',
        location: memory.location || '',
        people: memory.people || '',
        dialogue: memory.dialogue || '',
        soundtrack: memory.soundtrack || '',
        challenge: this.buildLevelChallenge(memory, puzzle, index),
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
      jigsaw: '🧩',
    };

    return {
      type: puzzle.type,
      icon: icons[puzzle.type] || '✨',
      position: pos,
      puzzle: {
        type: puzzle.type,
        question: puzzle.question || t('generate.remember'),
        answer: puzzle.answer || '',
        hint: puzzle.hint || t('generate.thinkMemory'),
      },
      reward: {
        type: 'memory_shard',
        text: puzzle.type === 'hidden' ? (puzzle.answer || t('generate.foundShardHidden')) : t('generate.unlockedShard'),
      },
    };
  }

  buildMultipleInteractives({ aiInteractives, memory, puzzle, sceneIndex }) {
    if (this.isJigsawPuzzle(puzzle)) {
      return [];
    }

    const points = Array.isArray(aiInteractives) && aiInteractives.length > 0
      ? aiInteractives.slice(0, 5)
      : this.getLocalHotspots(memory);

    const interactives = points.map((point, idx) => this.buildMemoryInteractive(point, idx, sceneIndex, memory));

    if (puzzle?.question || puzzle?.answer || puzzle?.type === 'password') {
      const puzzleInteractive = this.buildInteractive(puzzle, sceneIndex);
      puzzleInteractive.id = `scene-${sceneIndex + 1}-puzzle`;
      puzzleInteractive.title = puzzle.type === 'password' ? t('generate.passwordTitle') : t('generate.questionTitle');
      puzzleInteractive.memoryText = memory.description || puzzle.reward?.text || t('generate.puzzleDesc');
      puzzleInteractive.reward = {
        ...puzzleInteractive.reward,
        text: puzzleInteractive.reward?.text || t('generate.unlockedImportant'),
      };
      interactives.unshift(puzzleInteractive);
    }

    return interactives.slice(0, 5);
  }

  isJigsawPuzzle(puzzle) {
    return puzzle?.type === 'jigsaw';
  }

  buildLevelChallenge(memory, puzzle, sceneIndex, existingChallenge = null) {
    if (!this.isJigsawPuzzle(puzzle)) return null;

    return {
      ...(existingChallenge || {}),
      type: 'jigsaw',
      rows: 2,
      cols: 2,
      pieces: 4,
      source: 'background',
      prompt: puzzle.question || existingChallenge?.prompt || t('game.jigsawPrompt'),
      completionText: memory.description || existingChallenge?.completionText || t('generate.foundShard'),
      id: existingChallenge?.id || `scene-${sceneIndex + 1}-jigsaw`,
    };
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
    const title = point?.title || [t('generate.hotspotTitle0'), t('generate.hotspotTitle1'), t('generate.hotspotTitle2'), t('generate.hotspotTitle3'), t('generate.hotspotTitle4')][idx % 5];
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
        text: point?.reward_text || point?.rewardText || t('generate.foundHotspot', { title }),
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
        title: t('generate.hotspotLocationTitle'),
        icon: '📍',
        memory_text: t('generate.hotspotLocationText', { location: memory.location }),
      });
    }
    if (memory.dialogue) {
      hotspots.push({
        title: t('generate.hotspotDialogueTitle'),
        icon: '💬',
        memory_text: t('generate.hotspotDialogueText', { dialogue: memory.dialogue }),
      });
    }
    if (memory.soundtrack) {
      hotspots.push({
        title: t('generate.hotspotMusicTitle'),
        icon: '🎵',
        memory_text: t('generate.hotspotMusicText', { soundtrack: memory.soundtrack }),
      });
    }
    hotspots.push({
      title: memory.title || t('generate.hotspotSceneTitle'),
      icon: '✨',
      memory_text: memory.description || t('generate.hotspotSceneText'),
    });
    hotspots.push({
      title: t('generate.hotspotUnsaidTitle'),
      icon: '💌',
      memory_text: t('generate.hotspotUnsaidText'),
    });
    return hotspots.slice(0, 4);
  }

  getFallbackMemoryText(memory, idx) {
    const fallbacks = this.getLocalHotspots(memory);
    return fallbacks[idx % fallbacks.length]?.memory_text || memory.description || t('generate.preciousMemory');
  }

  buildSceneMusic(d) {
    return {
      title: d.globalSceneMusicTitle || '',
      url: d.globalSceneMusicUrl || '',
      fileName: d.globalSceneMusicName || '',
    };
  }

  buildNarrationSettings(d) {
    return {
      enabled: !!d.voiceNarrationEnabled,
      voiceSampleUrl: d.creatorVoiceSampleUrl || '',
      voiceSampleName: d.creatorVoiceSampleName || '',
      provider: 'openai',
      model: 'gpt-4o-mini-tts',
      disclosureRequired: true,
    };
  }

  enhanceDescription(desc, herName) {
    if (!desc) return t('generate.preciousMemory');
    return desc;
  }

  getDemoLevels(d) {
    const name = d.herName || 'Alice';
    return [
      {
        id: 1,
        title: t('generate.demo1Title'),
        background: '',
        photos: [],
        description: t('generate.demo1Desc', { name }),
        date: '',
        interactives: [{
          type: 'trivia',
          icon: '📖',
          position: { x: 0.6, y: 0.5 },
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
        photos: [],
        description: t('generate.demo2Desc'),
        date: '',
        interactives: [{
          type: 'password',
          icon: '🔐',
          position: { x: 0.5, y: 0.55 },
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
        photos: [],
        description: t('generate.demo3Desc'),
        date: '',
        interactives: [{
          type: 'hidden',
          icon: '🔍',
          position: { x: 0.4, y: 0.45 },
          puzzle: {
            type: 'hidden',
            question: t('generate.demo3Q'),
            answer: t('generate.demo3A'),
            hint: t('generate.demo3Hint'),
          },
          reward: { type: 'memory_shard', text: t('generate.demo3Reward') },
        }],
      },
    ];
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}
