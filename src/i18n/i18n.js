/**
 * i18n — Lightweight internationalization module.
 * Stores all UI strings for Chinese (zh) and English (en).
 * Language preference is persisted in localStorage.
 */

const STORAGE_KEY = 'memorymaze_lang_v2';
const DEFAULT_LOCALE = 'en';
let currentLocale = DEFAULT_LOCALE;

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
      portraitTitle: '📷 角色形象参考（可选）',
      portraitDesc: '可选上传你和她各自的一张清晰照片，AI 会在恋爱漫画场景中参考你们的外貌特征。不上传也可以正常生成游戏。',
      myPortrait: '你的照片',
      herPortrait: '她的照片',
      uploadPortrait: '上传照片',
      portraitUploaded: '照片已上传',
      removePortrait: '移除照片',
      portraitHint: '建议使用正脸清晰、光线自然的单人照片；跳过此项时，AI 会根据记忆内容创作角色。',
      portraitUploading: '正在上传角色参考照片...',
      portraitUploadFail: '角色照片上传失败，请检查 Google Cloud 配置',
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
      subtitle: '将真实回忆绘成轻柔明亮的恋爱漫画故事',
      romanticMangaName: '💗 浪漫漫画日记风',
      romanticMangaDesc: '柔和线稿与粉彩日光，像一页页温暖的青春恋爱图像小说',
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
      jigsaw: '拼图回忆',
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
      jigsawPromptLabel: '🧩 拼图提示文案',
      jigsawPromptPlaceholder: '例如：把这一天重新拼回完整的样子',
      jigsawDesc: '这一幕会变成 3×3 的九宫格拖拽拼图，不会显示发光点击点；她拼对全部 9 块后即可通关。',
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
      voiceTitle: '🎙️ 你的声音旁白',
      voiceDesc: '上传一段你的语音参考素材，为谜题提示和终章情书生成温柔朗读音频。',
      voiceUploadText: '上传你的语音录音',
      voiceUploaded: '已上传声音参考',
      voiceRemove: '移除',
      voiceHint: '建议 20-60 秒、声音清晰的 MP3 / WAV / M4A。配置专属声音后会使用你的音色，否则使用温柔男声旁白。',
      voiceToggle: '为谜题提示和最终告白信生成语音旁白',
      voiceUploading: '正在上传声音参考到 Google Cloud...',
      voiceUploadFail: '声音参考上传失败，请检查 Google Cloud 配置',
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
      updateConfig: '正在用已保存配置更新迷宫...',
      saveConfig: '正在保存修改后的迷宫... ✨',
      useDemo: '使用示例场景...',
      aiWriteLetter: '正在为你写一封深情的告白信...',
      assembleGameProgress: '正在组装游戏... ✨',
      aiAnalyzeScene: '正在让 AI 分析「{sceneName}」...',
      uploadingCloud: '正在把迷宫配置上传到 Google Cloud...',
      uploadCloudDone: '迷宫配置已上传',
      uploadCloudFail: '云端配置上传失败，仍可下载本地 config.json',
      narrationPreparing: '正在生成你的告白语音旁白...',
      narrationFinale: '正在生成终章告白语音...',
      narrationHint: '正在生成第 {n} 章提示语音...',
      narrationUnavailable: '旁白生成不可用，游戏仍可正常游玩',
      narrationTitle: '告白语音旁白',
      narrationReady: '终章情书和 {count} 段提示语音已准备好，可在游戏预览中试听。',
      narrationMissing: '尚未生成可播放的旁白音频，请重新生成后再分享链接。',
      narrationFailed: '旁白生成失败：{error}',
      narrationRegenerate: '重新生成语音旁白',
      narrationWorking: '正在重新生成语音...',
      narrationOff: '本次创作未开启语音旁白。返回终章步骤即可开启。',
      illustrateScenes: '绘制浪漫漫画场景',
      artworkScene: '正在绘制第 {n} 幕「{title}」...',
      artworkUnavailable: '插画生成暂不可用，将保留原始场景背景',
      artworkTitle: '插画记忆场景',
      artworkDesc: '每一幕都已绘成轻柔的漫画回忆。分享前可以单独重新生成。',
      artworkGenerated: '漫画插画已生成',
      artworkFallback: '使用原始背景',
      artworkEmpty: '等待插画生成',
      artworkRegenerate: '重新生成插画',
      artworkRegenerating: '正在重新绘制「{title}」...',
      artworkWorking: '生成中...',
      mazeTitle: '{myName} ❤ {herName} 的记忆迷宫',
      defaultLoveLetter: '亲爱的{name}，谢谢你出现在我的生命中。每一段记忆，都是我最珍贵的宝藏。',
      he: '他',
      she: '她',
      foundShard: '✨ 你找到了一段珍贵的记忆碎片',
      passwordTitle: '记忆密码',
      questionTitle: '心动问题',
      puzzleDesc: '这道题的答案，藏在你们共同经历过的那一天里。',
      unlockedImportant: '✨ 你解开了一段重要记忆',
      foundShardHidden: '你找到了一段珍贵的记忆碎片',
      unlockedShard: '✨ 解锁成功！你找到了一段珍贵的记忆碎片',
      remember: '你还记得吗？',
      thinkMemory: '想想我们的回忆...',
      hotspotTitle0: '细节一角',
      hotspotTitle1: '熟悉物件',
      hotspotTitle2: '那一瞬间',
      hotspotTitle3: '藏起的话',
      hotspotTitle4: '光里的回忆',
      foundHotspot: '✨ 你发现了「{title}」里的记忆',
      preciousMemory: '这是一段属于我们的珍贵回忆...',
      hotspotLocationTitle: '熟悉的地点',
      hotspotLocationText: '这里是{location}。有些地方之所以特别，不是因为它多么耀眼，而是因为那天你在那里。',
      hotspotDialogueTitle: '那句对白',
      hotspotDialogueText: '我一直记得那句话：{dialogue}。后来想起它，还是会觉得那一刻很轻，也很珍贵。',
      hotspotMusicTitle: '当时的歌',
      hotspotMusicText: '如果这段回忆有背景音乐，那一定是《{soundtrack}》。旋律响起时，那天的画面好像又回来了。',
      hotspotSceneTitle: '这一幕',
      hotspotSceneText: '这是一段被小心保存下来的回忆，里面有当时的光、心跳，以及想再靠近一点的我。',
      hotspotUnsaidTitle: '没说出口的话',
      hotspotUnsaidText: '有些话当时没有说得完整，所以我把它藏进这个小游戏里。希望你点开的时候，能听见我心里的认真。',
      demo1Title: '初遇 · 图书馆',
      demo1Desc: '还记得那个午后吗？阳光从图书馆的大窗户洒进来，你正低头看书。那是我第一次见到你，{name}。',
      demo1Q: '你还记得那天我借给你的第一本书叫什么吗？',
      demo1A: '小王子',
      demo1Hint: '一个住在很小星球上的小男孩...',
      demo1Reward: '✨ 你找到了第一片记忆碎片！',
      demo2Title: '约会 · 游乐园',
      demo2Desc: '我们第一次约会去了游乐园。你说你恐高，却陪我坐了摩天轮。在最高处，整个城市的灯光在你眼里闪烁。',
      demo2Q: '输入我们的纪念日密码',
      demo2A: '0520',
      demo2Hint: '那个我们在一起的特别日子...',
      demo2Reward: '✨ 又一片记忆碎片被唤醒！',
      demo3Title: '日常 · 我们的厨房',
      demo3Desc: '你第一次为我做饭，煎蛋焦了，面条软了，但那是我吃过最好吃的一顿饭。因为满满的都是你的心意。',
      demo3Q: '找到藏在场景中的发光日记本',
      demo3A: '翻开日记本，里面夹着一张你写的便条："今天给你做了早餐，希望你喜欢 ❤️"',
      demo3Hint: '仔细看看角落里是否有什么在闪光...',
      demo3Reward: '✨ 最后一片记忆碎片！所有回忆已完整拼合！',
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
      jigsawProgress: '🧩 拼图 {current}/{total}',
      jigsawPrompt: '把这段回忆拼回完整的样子',
      jigsawInstruction: '拖动 9 块拼图到正确位置',
      jigsawTray: '从这里拖动拼图块',
      jigsawComplete: '✨ 回忆已拼合完成',
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
      loading: '加载中...',
      shardUnlocked: '记忆碎片已解锁',
      continueExplore: '继续探索 →',
      rotateMobile: '横屏游玩',
      exitRotateMobile: '退出横屏',
      playVoiceHint: '播放语音提示',
      stopVoiceHint: '停止语音提示',
      playLoveLetter: '听他的告白',
      stopLoveLetter: '停止播放',
      tapToHearLoveLetter: '轻触按钮播放温柔朗读',
      aiNarrationDisclosure: 'AI 生成语音旁白',
      aiNarrationShort: 'AI 旁白',
      narrationPlayFailed: '语音无法播放',
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
      portraitTitle: '📷 Character Appearance References (Optional)',
      portraitDesc: 'Optionally upload one clear photo of each of you so AI can reflect your appearance in the romantic manga scenes. The game can be generated without them.',
      myPortrait: 'Your photo',
      herPortrait: 'Her photo',
      uploadPortrait: 'Upload photo',
      portraitUploaded: 'Photo uploaded',
      removePortrait: 'Remove photo',
      portraitHint: 'A clear, naturally lit solo portrait works best; when skipped, AI illustrates characters from the memory context.',
      portraitUploading: 'Uploading character reference photo...',
      portraitUploadFail: 'Character photo upload failed. Please check Google Cloud settings',
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
      subtitle: 'Turn your real memories into a soft, luminous manga love story',
      romanticMangaName: '💗 Romantic Manga Diary',
      romanticMangaDesc: 'Gentle linework and pastel daylight, like pages from a warm youthful romance graphic novel',
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
      jigsaw: 'Jigsaw Memory',
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
      jigsawPromptLabel: '🧩 Jigsaw prompt',
      jigsawPromptPlaceholder: 'e.g. Put this day back together',
      jigsawDesc: 'This scene becomes a 3×3 draggable jigsaw puzzle with no glowing hotspots. She passes the chapter after all 9 pieces are placed correctly.',
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
      voiceTitle: '🎙️ Your Voice Narration',
      voiceDesc: 'Upload a sample of your voice to add gentle spoken audio to puzzle hints and the final letter.',
      voiceUploadText: 'Upload your voice recording',
      voiceUploaded: 'Voice reference uploaded',
      voiceRemove: 'Remove',
      voiceHint: 'Use a clear 20-60 second MP3 / WAV / M4A. A configured custom voice uses your timbre; otherwise narration uses a gentle, warm male-style built-in voice.',
      voiceToggle: 'Generate spoken narration for puzzle hints and the final confession letter',
      voiceUploading: 'Uploading voice reference to Google Cloud...',
      voiceUploadFail: 'Voice reference upload failed. Please check Google Cloud settings',
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
      updateConfig: 'Updating maze with saved configuration...',
      saveConfig: 'Saving modified maze... ✨',
      useDemo: 'Using demo scenes...',
      aiWriteLetter: 'Writing a heartfelt love letter for you...',
      assembleGameProgress: 'Assembling game... ✨',
      aiAnalyzeScene: 'AI is analyzing "{sceneName}"...',
      uploadingCloud: 'Uploading maze configuration to Google Cloud...',
      uploadCloudDone: 'Maze configuration uploaded',
      uploadCloudFail: 'Cloud configuration upload failed, you can still download local config.json',
      narrationPreparing: 'Generating your confession narration...',
      narrationFinale: 'Generating final love-letter narration...',
      narrationHint: 'Generating voice hint for chapter {n}...',
      narrationUnavailable: 'Narration is unavailable; the game remains playable',
      narrationTitle: 'Spoken Confession',
      narrationReady: 'The final letter and {count} spoken hints are ready to hear in the game preview.',
      narrationMissing: 'No playable narration audio was generated yet. Regenerate it before sharing.',
      narrationFailed: 'Narration generation failed: {error}',
      narrationRegenerate: 'Regenerate narration',
      narrationWorking: 'Regenerating voice audio...',
      narrationOff: 'Voice narration is off for this creation. Return to the finale step to enable it.',
      illustrateScenes: 'Illustrating romantic manga scenes',
      artworkScene: 'Illustrating scene {n}, "{title}"...',
      artworkUnavailable: 'Illustration generation is unavailable; keeping the original scene background',
      artworkTitle: 'Illustrated Memories',
      artworkDesc: 'Each moment is painted as a gentle manga memory. Regenerate any scene before sharing.',
      artworkGenerated: 'Manga illustration ready',
      artworkFallback: 'Using original background',
      artworkEmpty: 'Awaiting illustration',
      artworkRegenerate: 'Regenerate artwork',
      artworkRegenerating: 'Redrawing "{title}"...',
      artworkWorking: 'Generating...',
      mazeTitle: "{myName} ❤ {herName}'s Memory Maze",
      defaultLoveLetter: "Dear {name}, thank you for being in my life. Every memory with you is my most precious treasure.",
      he: 'He',
      she: 'She',
      foundShard: '✨ You found a precious memory fragment',
      passwordTitle: 'Memory Password',
      questionTitle: 'Heartbeat Question',
      puzzleDesc: 'The answer to this question is hidden in that day we shared together.',
      unlockedImportant: '✨ You unlocked an important memory',
      foundShardHidden: 'You found a precious memory fragment',
      unlockedShard: '✨ Unlocked successfully! You found a precious memory fragment',
      remember: 'Do you remember?',
      thinkMemory: 'Think about our memories...',
      hotspotTitle0: 'A Corner of Detail',
      hotspotTitle1: 'Familiar Object',
      hotspotTitle2: 'That Moment',
      hotspotTitle3: 'Hidden Words',
      hotspotTitle4: 'Memories in the Light',
      foundHotspot: '✨ You discovered the memory in "{title}"',
      preciousMemory: 'This is a precious memory of ours...',
      hotspotLocationTitle: 'Familiar Place',
      hotspotLocationText: 'This is {location}. Some places are special not because they are dazzling, but because you were there that day.',
      hotspotDialogueTitle: 'That Dialogue',
      hotspotDialogueText: 'I always remember that line: {dialogue}. Thinking back, that moment still feels so light and precious.',
      hotspotMusicTitle: 'The Song Then',
      hotspotMusicText: 'If this memory had a background track, it would definitely be "{soundtrack}". When the melody plays, the scenes from that day come rushing back.',
      hotspotSceneTitle: 'This Scene',
      hotspotSceneText: 'This is a carefully preserved memory, containing the light, the heartbeat, and the me who wanted to get just a little closer.',
      hotspotUnsaidTitle: 'Unsaid Words',
      hotspotUnsaidText: 'Some words weren\'t fully spoken back then, so I hid them in this little game. I hope when you click it, you can hear my sincerity.',
      demo1Title: 'First Meeting · Library',
      demo1Desc: 'Remember that afternoon? Sunlight poured through the large library windows, and you were looking down at a book. That was the first time I saw you, {name}.',
      demo1Q: 'Do you remember the name of the first book I lent you that day?',
      demo1A: 'The Little Prince',
      demo1Hint: 'A little boy living on a very small planet...',
      demo1Reward: '✨ You found the first memory fragment!',
      demo2Title: 'Date · Amusement Park',
      demo2Desc: 'Our first date was at the amusement park. You said you were afraid of heights, but you rode the Ferris wheel with me anyway. At the top, the whole city\'s lights twinkled in your eyes.',
      demo2Q: 'Enter our anniversary password',
      demo2A: '0520',
      demo2Hint: 'That special day we got together...',
      demo2Reward: '✨ Another memory fragment awakened!',
      demo3Title: 'Everyday · Our Kitchen',
      demo3Desc: 'The first time you cooked for me, the eggs were burnt and the noodles were soggy, but it was the best meal I\'ve ever had. Because it was full of your heart.',
      demo3Q: 'Find the glowing diary hidden in the scene',
      demo3A: 'You open the diary and find a note you wrote: "Made you breakfast today, hope you like it ❤️"',
      demo3Hint: 'Look closely in the corners to see if anything is sparkling...',
      demo3Reward: '✨ The final memory fragment! All memories are fully assembled!',
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
      jigsawProgress: '🧩 Puzzle {current}/{total}',
      jigsawPrompt: 'Put this memory back together',
      jigsawInstruction: 'Drag all 9 pieces into the right places',
      jigsawTray: 'Drag pieces from here',
      jigsawComplete: '✨ Memory reassembled',
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
      loading: 'Loading...',
      shardUnlocked: 'Memory Shard Unlocked',
      continueExplore: 'Continue Exploring →',
      rotateMobile: 'Play Landscape',
      exitRotateMobile: 'Exit Landscape',
      playVoiceHint: 'Play voice hint',
      stopVoiceHint: 'Stop voice hint',
      playLoveLetter: 'Hear his confession',
      stopLoveLetter: 'Stop playback',
      tapToHearLoveLetter: 'Tap the button to hear the letter',
      aiNarrationDisclosure: 'AI-generated voice narration',
      aiNarrationShort: 'AI narration',
      narrationPlayFailed: 'Unable to play voice',
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
  currentLocale = DEFAULT_LOCALE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) {
      currentLocale = saved;
    }
  } catch { /* ignore */ }
  syncDocumentLanguage();
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
    syncDocumentLanguage();
  }
}

function syncDocumentLanguage() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : 'en';
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
