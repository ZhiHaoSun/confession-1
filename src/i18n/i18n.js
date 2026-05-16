/**
 * i18n — Lightweight internationalization module.
 * Stores all UI strings for Chinese (zh) and English (en).
 * Language preference is persisted in localStorage.
 */

const STORAGE_KEY = 'memorymaze_lang';
let currentLocale = 'zh';

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------
const translations = {
  zh: {
    // ── Step 1: Welcome ──
    welcome: {
      tagline: '将你们的记忆，编织成一场她专属的解谜冒险',
      feature1: '上传真实照片与回忆',
      feature2: 'AI 艺术风格转化',
      feature3: '自定义解谜关卡',
      cta: '✨ 开始创作',
      ctaHint: '只需几分钟，为她创造一份独一无二的数字礼物',
    },

    // ── Step 2: Core Data ──
    core: {
      title: '基础信息',
      subtitle: '这些信息将成为游戏中的解谜线索与密码',
      myName: '你的名字',
      myNamePlaceholder: '例如：Bob',
      herName: '她的名字 ❤️',
      herNamePlaceholder: '例如：Alice',
      herBirthday: '她的生日 🎂',
      anniversary: '你们的纪念日 💕',
      nickname: '你对她的专属昵称 💫',
      nicknamePlaceholder: '例如：小兔子、宝贝...',
      validationNames: '请至少填写你和她的名字',
    },

    // ── Step 3: Memories ──
    memories: {
      title: '记忆碎片',
      subtitle: '详细描述你们的珍贵瞬间——细节越丰富，AI 生成的游戏场景越动人',
      addMemory: '＋ 添加新的记忆场景',
      sceneNamePlaceholder: '场景名称（如：初遇咖啡厅）',
      deleteScene: '删除此场景',
      photoLabel: '📷 照片（最多 3 张，AI 将分析照片内容）',
      addPhoto: '添加照片',
      photoAlt: '记忆照片',
      removePhoto: '移除照片',
      dateLabel: '📅 日期',
      locationLabel: '📍 地点',
      locationPlaceholder: '如：星巴克 · 大学城店',
      descriptionLabel: '💭 情感描述',
      descriptionHint: '（越详细，AI 生成效果越好）',
      descriptionPlaceholder: '写下这段记忆中你最深刻的感受...\n\n例如：那天下着小雨，你撑着伞等在图书馆门口，笑着说「我猜你一定忘了带伞」...',
      moreDetails: '✨ 更多细节',
      moreDetailsHint: '（添加对话、人物、音乐可让 AI 生成更生动的场景）',
      peopleLabel: '👥 在场的人',
      peoplePlaceholder: '如：我、她、她的闺蜜小张',
      dialogueLabel: '💬 印象深刻的对话',
      dialoguePlaceholder: '如：\n她：「你怎么又迟到了？」\n我：「因为在路上给你买了这个。」',
      soundtrackLabel: '🎵 当时听的歌',
      soundtrackHint: '（只用于 AI 理解场景，不上传文件）',
      soundtrackPlaceholder: '如：周杰伦 - 晴天',
      validationMemory: '请至少填写一个场景的名称或描述',
      globalMusicTitle: '🎧 全局场景音乐',
      globalMusicDesc: '上传一首音乐，生成后的每个记忆场景都会循环播放这首歌。',
      musicNameLabel: '音乐名称',
      musicNameHint: '（可选）',
      musicNamePlaceholder: '如：我们的主题曲',
      musicUploaded: '已上传场景音乐',
      musicRemove: '移除',
      musicUploadBtn: '上传所有场景共用的音乐',
      musicSizeWarning: '全局场景音乐建议控制在 8MB 内，避免生成链接过大',
    },

    // ── Step 4: Art Style ──
    artStyle: {
      title: '艺术风格',
      subtitle: '选择一种视觉风格，让你们的记忆更加梦幻',
      watercolorName: '🌸 温馨水彩绘本风',
      watercolorDesc: '柔和低饱和度，像翻开一本温暖的绘本，适合日常温馨回忆',
      animeName: '✨ 唯美日系新海诚风',
      animeDesc: '强光影、高饱和度，营造电影般的浪漫感与命运感',
      isometricName: '🎁 复古微缩模型风',
      isometricDesc: '等距视角如精美八音盒，适合室内场景与特殊礼物',
    },

    // ── Step 5: Puzzles ──
    puzzles: {
      title: '解谜关卡设计',
      subtitle: '为每个记忆场景设置解谜机关，利用你们的共同记忆作为通关钥匙',
      sceneDefault: '场景',
      setupHint: '设置通关机关',
      selectType: '选择机关类型',
      trivia: '记忆问答',
      password: '密码锁',
      hidden: '隐藏物品',
      triviaQuestion: '❓ 问题',
      triviaQuestionPlaceholder: '例如：你还记得借给我的第一本书吗？',
      triviaAnswer: '✅ 答案',
      triviaAnswerPlaceholder: '例如：小王子',
      triviaHint: '💡 提示（可选）',
      triviaHintPlaceholder: '例如：法国作家写的童话...',
      passwordLabel: '🔢 密码（4-6位数字）',
      passwordPlaceholder: '例如：0520',
      passwordSuggestion: '💡 建议使用有意义的日期：',
      passwordHintLabel: '📜 密码提示文字',
      passwordHintPlaceholder: '例如：我们在一起的那个特别日子...',
      hiddenItemLabel: '🔍 隐藏物品名称',
      hiddenItemPlaceholder: '例如：发光的日记本、闪烁的星星...',
      hiddenFoundLabel: '📝 找到后显示的文字',
      hiddenFoundPlaceholder: '例如：打开日记本，里面写着你们第一次约会的故事...',
      herBirthday: '她的生日',
      anniversary: '纪念日',
    },

    // ── Step 6: Finale ──
    finale: {
      title: '终章告白',
      subtitle: '上传你的告白视频，选择背景音乐，写下最真挚的情书',
      videoTitle: '🎬 告白视频',
      videoUploadText: '点击上传告白视频',
      videoFormat: '支持 MP4、WebM 格式',
      videoHint: '这段视频将在她解开所有谜题后全屏播放 ✨',
      videoUploading: '正在上传告白视频到 Google Cloud...',
      videoUploadFail: '视频上传失败，请检查 Google Cloud 配置',
      bgmTitle: '🎵 背景音乐',
      romanticPiano: '浪漫钢琴曲',
      romanticPianoDesc: '温柔舒缓',
      acousticGuitar: '木吉他小品',
      acousticGuitarDesc: '清新自然',
      orchestral: '管弦乐叙事',
      orchestralDesc: '史诗感动',
      musicBox: '八音盒旋律',
      musicBoxDesc: '童话梦幻',
      letterTitle: '✉️ 告白情书',
      letterPlaceholder: '亲爱的{name}，\n\n从那天起，我的世界就多了一份色彩...\n\n（在这里写下你最想对她说的话）',
      nextGenerate: '下一步 — 生成游戏 ✨',
    },

    // ── Step 7: Generate ──
    generate: {
      aiGenerating: '正在让 AI 编织你们的记忆迷宫...',
      generating: '正在编织你们的记忆迷宫...',
      preparing: '准备中...',
      aiScene: 'AI 生成',
      processScene: '处理',
      genLetter: '生成告白信',
      assembleGame: '组装游戏',
      errorTitle: '生成遇到问题',
      retry: '🔄 重试',
      goBack: '← 返回修改',
      resultTitle: '的记忆迷宫已生成！',
      resultAI: '🤖 AI 已为你的每段记忆注入了灵魂',
      resultReady: '游戏已准备就绪',
      resultHint: '，你可以预览效果或下载配置文件',
      storageTitle: '预览存储空间不足',
      storageDesc: '你的照片/音乐/视频太大，浏览器无法保存完整预览数据。请下载 config.json，或返回压缩素材后重新生成。',
      previewBtn: '🎮 全屏预览游戏',
      downloadBtn: '📦 下载配置文件',
      viewConfig: '📋 查看生成的 config.json',
      restartBtn: '🔄 重新创作',
      saveOpenBtn: '🚀 保存并在新窗口打开游戏',
      storageFull: '当前素材太大，无法保存到浏览器预览。请下载 config.json，或压缩音频/视频/照片后再生成。',
      gamePreview: '游戏预览',
      you: '你',
      her: '她',
    },

    // ── Navigation ──
    nav: {
      prev: '← 上一步',
      next: '下一步 →',
    },

    // ── MediaUploader ──
    upload: {
      creatingLink: '正在创建云端上传链接...',
      linkError: '无法创建 Google Cloud 上传链接',
      linkMissing: '上传接口未返回 Google Cloud 链接。请使用 Vercel 部署或 vercel dev，并检查 GCS 环境变量。',
      uploading: '正在上传到 Google Cloud...',
      uploadFailed: 'Google Cloud 上传失败',
      uploadDone: '上传完成',
      photoUploading: '正在上传照片到 Google Cloud...',
      photoFailed: '照片上传失败，请检查 Google Cloud 配置',
      musicUploading: '正在上传全局音乐到 Google Cloud...',
      musicFailed: '音乐上传失败，请检查 Google Cloud 配置',
    },

    // ── Game Scenes ──
    game: {
      menuTitle: '记忆迷宫',
      menuSubtitle: '专属于 {name} 的解谜冒险',
      menuStart: '✨ 开始探索',
      menuHint: '点击画面中发光的物品来探索记忆',
      chapter: '第 {n} 章',
      explore: '点击探索',
      collected: '已收集',
      shards: '💎 本章碎片 {current}/{total}',
      levelComplete: '✨ 本章记忆已收集，继续下一章',
      playMusic: '♪ 播放 {title}',
      allCollected: '✨ 所有记忆碎片已收集完毕 ✨',
      toLetter: '致 {name}',
      foreverSigned: '—— 永远的 {name} ❤️',
      continueToLetter: '继续查看告白信',
      playOrContinue: '播放视频 / 继续查看告白信',
      defaultLetter: '谢谢你出现在我的生命中。',
      inputAnswer: '输入答案...',
      submitAnswer: '确认答案',
      unlocked: '✨ 解锁成功！',
      tryAgain: '再想想吧... 💭',
      foundIt: '✨ 我找到了！',
      findHidden: '找到藏在场景中的神秘物品',
      hintPrefix: '💡 提示: ',
    },

    // ── Language Switcher ──
    langSwitch: {
      label: 'EN',
      tooltip: 'Switch to English',
    },
  },

  en: {
    // ── Step 1: Welcome ──
    welcome: {
      tagline: 'Weave your memories into a puzzle adventure made just for her',
      feature1: 'Upload real photos & memories',
      feature2: 'AI art style transformation',
      feature3: 'Custom puzzle levels',
      cta: '✨ Start Creating',
      ctaHint: 'Just a few minutes to create a one-of-a-kind digital gift for her',
    },

    // ── Step 2: Core Data ──
    core: {
      title: 'Basic Info',
      subtitle: 'This info will become puzzle clues and passwords in the game',
      myName: 'Your Name',
      myNamePlaceholder: 'e.g. Bob',
      herName: 'Her Name ❤️',
      herNamePlaceholder: 'e.g. Alice',
      herBirthday: 'Her Birthday 🎂',
      anniversary: 'Your Anniversary 💕',
      nickname: 'Your Nickname for Her 💫',
      nicknamePlaceholder: 'e.g. Bunny, Babe...',
      validationNames: 'Please fill in at least your name and her name',
    },

    // ── Step 3: Memories ──
    memories: {
      title: 'Memory Fragments',
      subtitle: 'Describe your precious moments in detail — the richer the details, the more vivid the AI-generated scenes',
      addMemory: '＋ Add new memory scene',
      sceneNamePlaceholder: 'Scene name (e.g. First Coffee Date)',
      deleteScene: 'Delete this scene',
      photoLabel: '📷 Photos (up to 3, AI will analyze photo content)',
      addPhoto: 'Add photo',
      photoAlt: 'Memory photo',
      removePhoto: 'Remove photo',
      dateLabel: '📅 Date',
      locationLabel: '📍 Location',
      locationPlaceholder: 'e.g. Starbucks · Downtown',
      descriptionLabel: '💭 Emotional Description',
      descriptionHint: '(the more detail, the better the AI result)',
      descriptionPlaceholder: 'Write down your deepest feelings about this memory...\n\ne.g. It was drizzling that day, and you were waiting under an umbrella at the library door, smiling and saying "I knew you\'d forget your umbrella"...',
      moreDetails: '✨ More Details',
      moreDetailsHint: '(adding dialogue, people, music helps AI create richer scenes)',
      peopleLabel: '👥 People Present',
      peoplePlaceholder: 'e.g. Me, her, her best friend Sarah',
      dialogueLabel: '💬 Memorable Dialogue',
      dialoguePlaceholder: 'e.g.\nHer: "Why are you late again?"\nMe: "Because I stopped to buy you this."',
      soundtrackLabel: '🎵 Song Playing at the Time',
      soundtrackHint: '(only used for AI context, no file upload)',
      soundtrackPlaceholder: 'e.g. Ed Sheeran - Perfect',
      validationMemory: 'Please fill in at least one scene name or description',
      globalMusicTitle: '🎧 Global Scene Music',
      globalMusicDesc: 'Upload a song that will loop in every memory scene after generation.',
      musicNameLabel: 'Music Name',
      musicNameHint: '(optional)',
      musicNamePlaceholder: 'e.g. Our theme song',
      musicUploaded: 'Scene music uploaded',
      musicRemove: 'Remove',
      musicUploadBtn: 'Upload shared scene music',
      musicSizeWarning: 'Scene music should be under 8MB to avoid oversized links',
    },

    // ── Step 4: Art Style ──
    artStyle: {
      title: 'Art Style',
      subtitle: 'Choose a visual style to make your memories more dreamlike',
      watercolorName: '🌸 Warm Watercolor Storybook',
      watercolorDesc: 'Soft, low saturation — like opening a warm picture book. Perfect for cozy everyday memories',
      animeName: '✨ Beautiful Anime (Shinkai Style)',
      animeDesc: 'Strong lighting, high saturation — cinematic romance and a sense of destiny',
      isometricName: '🎁 Retro Miniature Diorama',
      isometricDesc: 'Isometric view like a fine music box. Great for indoor scenes and special gifts',
    },

    // ── Step 5: Puzzles ──
    puzzles: {
      title: 'Puzzle Level Design',
      subtitle: 'Set up puzzle mechanics for each memory scene, using your shared memories as the key',
      sceneDefault: 'Scene',
      setupHint: 'Set up puzzle mechanic',
      selectType: 'Select puzzle type',
      trivia: 'Memory Quiz',
      password: 'Password Lock',
      hidden: 'Hidden Object',
      triviaQuestion: '❓ Question',
      triviaQuestionPlaceholder: 'e.g. Do you remember the first book you lent me?',
      triviaAnswer: '✅ Answer',
      triviaAnswerPlaceholder: 'e.g. The Little Prince',
      triviaHint: '💡 Hint (optional)',
      triviaHintPlaceholder: 'e.g. A fairy tale by a French author...',
      passwordLabel: '🔢 Password (4-6 digits)',
      passwordPlaceholder: 'e.g. 0520',
      passwordSuggestion: '💡 Try using a meaningful date: ',
      passwordHintLabel: '📜 Password Hint Text',
      passwordHintPlaceholder: 'e.g. The special day we got together...',
      hiddenItemLabel: '🔍 Hidden Item Name',
      hiddenItemPlaceholder: 'e.g. A glowing diary, twinkling stars...',
      hiddenFoundLabel: '📝 Text Shown When Found',
      hiddenFoundPlaceholder: 'e.g. You open the diary to find the story of your first date...',
      herBirthday: 'her birthday',
      anniversary: 'anniversary',
    },

    // ── Step 6: Finale ──
    finale: {
      title: 'The Grand Finale',
      subtitle: 'Upload your confession video, pick background music, and write your heartfelt letter',
      videoTitle: '🎬 Confession Video',
      videoUploadText: 'Click to upload confession video',
      videoFormat: 'Supports MP4 and WebM',
      videoHint: 'This video will play full-screen after she solves all puzzles ✨',
      videoUploading: 'Uploading confession video to Google Cloud...',
      videoUploadFail: 'Video upload failed. Please check Google Cloud settings',
      bgmTitle: '🎵 Background Music',
      romanticPiano: 'Romantic Piano',
      romanticPianoDesc: 'Gentle & soothing',
      acousticGuitar: 'Acoustic Guitar',
      acousticGuitarDesc: 'Fresh & natural',
      orchestral: 'Orchestral Narrative',
      orchestralDesc: 'Epic & moving',
      musicBox: 'Music Box Melody',
      musicBoxDesc: 'Fairy-tale dreamy',
      letterTitle: '✉️ Love Letter',
      letterPlaceholder: 'Dear {name},\n\nSince that day, my world gained a new color...\n\n(Write what you most want to say to her)',
      nextGenerate: 'Next — Generate Game ✨',
    },

    // ── Step 7: Generate ──
    generate: {
      aiGenerating: 'AI is weaving your memory maze...',
      generating: 'Weaving your memory maze...',
      preparing: 'Preparing...',
      aiScene: 'AI generating',
      processScene: 'Processing',
      genLetter: 'Generating love letter',
      assembleGame: 'Assembling game',
      errorTitle: 'Generation Error',
      retry: '🔄 Retry',
      goBack: '← Go Back to Edit',
      resultTitle: "'s Memory Maze is Ready!",
      resultAI: '🤖 AI has infused soul into every memory',
      resultReady: 'Game is ready',
      resultHint: '. You can preview it or download the config file',
      storageTitle: 'Preview Storage Insufficient',
      storageDesc: 'Your photos/music/video are too large for browser preview storage. Please download config.json, or go back and compress your media.',
      previewBtn: '🎮 Full-Screen Preview',
      downloadBtn: '📦 Download Config File',
      viewConfig: '📋 View generated config.json',
      restartBtn: '🔄 Start Over',
      saveOpenBtn: '🚀 Save & Open Game in New Tab',
      storageFull: 'Media too large for browser preview. Download config.json, or compress audio/video/photos and regenerate.',
      gamePreview: 'Game Preview',
      you: 'You',
      her: 'Her',
    },

    // ── Navigation ──
    nav: {
      prev: '← Previous',
      next: 'Next →',
    },

    // ── MediaUploader ──
    upload: {
      creatingLink: 'Creating cloud upload link...',
      linkError: 'Unable to create Google Cloud upload link',
      linkMissing: 'Upload API did not return a Google Cloud link. Please deploy to Vercel or use vercel dev, and check GCS env variables.',
      uploading: 'Uploading to Google Cloud...',
      uploadFailed: 'Google Cloud upload failed',
      uploadDone: 'Upload complete',
      photoUploading: 'Uploading photo to Google Cloud...',
      photoFailed: 'Photo upload failed. Please check Google Cloud settings',
      musicUploading: 'Uploading global music to Google Cloud...',
      musicFailed: 'Music upload failed. Please check Google Cloud settings',
    },

    // ── Game Scenes ──
    game: {
      menuTitle: 'MemoryMaze',
      menuSubtitle: "A puzzle adventure made for {name}",
      menuStart: '✨ Start Exploring',
      menuHint: 'Click on glowing objects to explore memories',
      chapter: 'Chapter {n}',
      explore: 'Click to explore',
      collected: 'Collected',
      shards: '💎 Shards {current}/{total}',
      levelComplete: '✨ All memories collected, continue to next chapter',
      playMusic: '♪ Play {title}',
      allCollected: '✨ All memory shards have been collected ✨',
      toLetter: 'Dear {name}',
      foreverSigned: '—— Forever yours, {name} ❤️',
      continueToLetter: 'Continue to Love Letter',
      playOrContinue: 'Play Video / Continue to Love Letter',
      defaultLetter: 'Thank you for being in my life.',
      inputAnswer: 'Type your answer...',
      submitAnswer: 'Submit Answer',
      unlocked: '✨ Unlocked!',
      tryAgain: 'Try again... 💭',
      foundIt: '✨ I found it!',
      findHidden: 'Find the hidden object in the scene',
      hintPrefix: '💡 Hint: ',
    },

    // ── Language Switcher ──
    langSwitch: {
      label: '中文',
      tooltip: '切换到中文',
    },
  },
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Initialize locale from localStorage or browser preference.
 */
export function initLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) {
      currentLocale = saved;
    }
  } catch { /* ignore */ }
}

/**
 * Get current locale code.
 */
export function getLocale() {
  return currentLocale;
}

/**
 * Set locale and persist.
 * @param {'zh' | 'en'} lang
 */
export function setLocale(lang) {
  if (translations[lang]) {
    currentLocale = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch { /* ignore */ }
  }
}

/**
 * Translate a dot-path key. Supports {placeholder} substitution.
 * @param {string} key - Dot-separated path, e.g. 'welcome.tagline'
 * @param {Object} [params] - Placeholder replacements, e.g. { name: 'Alice' }
 * @returns {string}
 */
export function t(key, params) {
  const parts = key.split('.');
  let value = translations[currentLocale];
  for (const part of parts) {
    if (value == null) break;
    value = value[part];
  }
  if (typeof value !== 'string') {
    // Fallback to Chinese
    value = translations.zh;
    for (const part of parts) {
      if (value == null) break;
      value = value[part];
    }
  }
  if (typeof value !== 'string') return key;

  // Substitute {placeholders}
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return value;
}
