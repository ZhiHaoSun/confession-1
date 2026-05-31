/**
 * AIService — ChatGPT 5.5 integration for scene generation.
 * Sends user-provided memory details (text + photos) to OpenAI's API
 * and returns structured game scene configurations.
 */
import { getLocale } from '../i18n/i18n.js';

export class AIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.5';
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    this.maxRetries = 2;
  }

  /**
   * Test if the API key is valid.
   */
  async testConnection() {
    try {
      const res = await this._callAPI([
        { role: 'system', content: 'Reply with exactly: {"status":"ok"}' },
        { role: 'user', content: 'ping' },
      ], 50);
      return res && res.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Generate a complete scene config from rich memory data.
   */
  async generateScene(memory, artStyle, characters, sceneIndex, totalScenes) {
    const isEn = getLocale() === 'en';

    const styleStr = isEn
      ? 'Romantic Manga Diary: soft pastel slice-of-life graphic novel illustration, light and affectionate'
      : '浪漫漫画日记风：轻柔粉彩、生活感图像小说插画、明亮而深情';

    const systemPromptZh = `你是一个浪漫解谜游戏的创意总监。你需要根据用户提供的真实记忆细节，生成一个游戏关卡的完整配置。

游戏类型：2D 浪漫解谜点击冒险
艺术风格：${styleStr}
创作者：${characters.creator.name}
接收者（玩家）：${characters.receiver.name}
当前关卡：第 ${sceneIndex + 1} / ${totalScenes} 关

请根据提供的记忆信息，返回一个 JSON 对象，包含以下字段：
{
  "title": "关卡标题（诗意化，8字以内）",
  "narrative": "场景叙事文字（80-150字，第二人称，温柔深情，引导玩家回忆这段记忆）",
  "scene_description": "场景视觉描述（用于未来AI绘图，50-80字英文）",
  "mood": "场景情绪（如：温馨、浪漫、怀旧、甜蜜、感动）",
  "color_palette": ["主色调hex", "辅色调hex", "点缀色hex"],
  "interactives": [
    {
      "title": "热点名称（如：窗边的座位、那杯咖啡、旧票根）",
      "icon": "一个适合该热点的 emoji",
      "position": { "x": 0.2到0.8之间的小数, "y": 0.25到0.75之间的小数 },
      "memory_text": "点击后展示的独立记忆文字（40-90字，必须和该热点相关，不要和其他热点重复）",
      "reward_text": "解锁提示（15-35字）"
    }
  ],
  "puzzle": {
    "type": "trivia 或 password 或 hidden（根据场景内容选择最合适的类型）",
    "question": "解谜问题（基于记忆细节设计，玩家需要回忆才能回答）",
    "answer": "答案（简短，1-6个字或4-6位数字）",
    "hint": "提示（引导但不直接给答案）"
  },
  "memory_shard_text": "解锁后显示的记忆碎片文字（30-60字，感性、触动人心）"
}

规则：
1. interactives 必须生成 3-5 个，每个代表场景中不同可点击物件或位置
2. interactives 的 memory_text 必须基于用户上传的记忆、照片、地点、人物、对话或歌曲进行拆分扩写
3. 如果记忆中有明确的对话内容，优先设计成问答类谜题
4. 如果有日期相关信息，可以设计成密码锁（用日期数字）
5. 文字风格要温柔、有诗意，避免过于直白
6. 记忆碎片文字要让玩家（接收者）感动
7. 场景描述必须适合生成明亮、轻柔、漫画日记式的恋爱插画，避免阴暗、惊悚、霓虹或过度电影化效果
8. 热点名称应对应画面中容易辨认且适合点击的真实物件
9. 必须严格返回有效的 JSON 格式`;

    const systemPromptEn = `You are the creative director of a romantic puzzle game. You need to generate a complete level configuration based on real memories provided by the user.

Game Type: 2D Romantic Puzzle Point & Click
Art Style: ${styleStr}
Creator: ${characters.creator.name}
Receiver (Player): ${characters.receiver.name}
Current Level: ${sceneIndex + 1} / ${totalScenes}

Please return a JSON object with the following fields:
{
  "title": "Level Title (Poetic, max 4 words)",
  "narrative": "Scene narrative text (30-60 words, 2nd person 'you', gentle and affectionate, guiding the player to recall this memory)",
  "scene_description": "Visual scene description (for AI image gen, 30-50 words)",
  "mood": "Scene mood (e.g. Cozy, Romantic, Nostalgic, Sweet)",
  "color_palette": ["Main hex", "Secondary hex", "Accent hex"],
  "interactives": [
    {
      "title": "Hotspot name (e.g. Window Seat, The Coffee, Old Ticket)",
      "icon": "A suitable emoji",
      "position": { "x": 0.2-0.8 float, "y": 0.25-0.75 float },
      "memory_text": "Text shown when clicked (20-40 words, must relate to this specific object)",
      "reward_text": "Unlock hint (5-15 words)"
    }
  ],
  "puzzle": {
    "type": "trivia or password or hidden (choose best fit)",
    "question": "Puzzle question (based on memory details, player must recall to answer)",
    "answer": "Answer (short, 1-3 words or 4-6 digits)",
    "hint": "Hint (guiding but not direct)"
  },
  "memory_shard_text": "Memory shard text shown after unlocking (15-30 words, emotional and touching)"
}

Rules:
1. Generate 3-5 interactives, each representing a clickable object/location.
2. memory_text must expand upon the user's uploaded memories, photos, locations, people, etc.
3. If there is dialogue, prioritize 'trivia' puzzle.
4. If there is a date, prioritize 'password' lock (using digits).
5. Tone must be gentle, poetic, and emotional.
6. The memory_shard_text must move the player (receiver).
7. The scene description must support a light, tender, manga-diary love-story illustration; avoid dark, frightening, neon, or excessively dramatic imagery.
8. Hotspot titles should be recognizable physical objects that can be visibly placed in the illustration.
9. Must strictly return valid JSON format.`;

    const userContent = this._buildMemoryPrompt(memory, isEn);
    const messages = [
      { role: 'system', content: isEn ? systemPromptEn : systemPromptZh },
      { role: 'user', content: userContent },
    ];

    return await this._callAPI(messages, 1800);
  }

  /**
   * Generate the overall game narrative arc and enhanced confession letter.
   */
  async generateNarrative(allMemories, characters, existingLetter) {
    const isEn = getLocale() === 'en';

    const systemPromptZh = `你是一个浪漫文学创作者。根据用户提供的所有记忆场景概要，生成一封深情的告白信。

创作者：${characters.creator.name}
接收者：${characters.receiver.name}

请返回一个 JSON 对象：
{
  "love_letter": "告白信全文（200-400字，以「致 ${characters.receiver.name}」开头，以「—— 永远的 ${characters.creator.name}」结尾，深情但不做作，融入真实记忆细节）",
  "opening_text": "游戏开场白（30-50字，在主菜单显示）"
}

规则：
1. 融入用户提供的真实记忆细节，让信件显得真实而非模板化
2. 文风温柔内敛，有诗意，不要太夸张
3. 如果用户已提供告白信草稿，在其基础上润色增强`;

    const systemPromptEn = `You are a romantic writer. Generate a deeply affectionate love letter based on all the memory scenes provided by the user.

Creator: ${characters.creator.name}
Receiver: ${characters.receiver.name}

Please return a JSON object:
{
  "love_letter": "Full love letter (150-300 words, starting with 'Dear ${characters.receiver.name},' and ending with 'Forever yours, ${characters.creator.name}'. Deeply emotional but natural, incorporating real memory details)",
  "opening_text": "Game opening text (15-30 words, shown on main menu)"
}

Rules:
1. Incorporate real memory details provided by the user to make the letter authentic.
2. Tone should be gentle, poetic, and not overly dramatic.
3. If the user provided a draft, enhance and polish it.`;

    const memorySummaries = allMemories.map((m, i) =>
      isEn
        ? `Memory ${i + 1}: ${m.title || 'Untitled'} | ${m.location || ''} | ${m.description || ''} | ${m.dialogue || ''}`
        : `记忆${i + 1}：${m.title || '未命名'} | ${m.location || ''} | ${m.description || ''} | ${m.dialogue || ''}`
    ).join('\n');

    const userMsgZh = `记忆场景概要：\n${memorySummaries}\n\n${existingLetter ? `用户告白信草稿：\n${existingLetter}` : '请原创一封告白信。'}`;
    const userMsgEn = `Memory scenes overview:\n${memorySummaries}\n\n${existingLetter ? `User's draft love letter:\n${existingLetter}` : 'Please write an original love letter.'}`;

    return await this._callAPI([
      { role: 'system', content: isEn ? systemPromptEn : systemPromptZh },
      { role: 'user', content: isEn ? userMsgEn : userMsgZh },
    ], 800);
  }

  /**
   * Build the user prompt content including images if available.
   */
  _buildMemoryPrompt(memory, isEn = false) {
    const textParts = [];
    if (isEn) {
      if (memory.title) textParts.push(`Scene name: ${memory.title}`);
      if (memory.location) textParts.push(`Location: ${memory.location}`);
      if (memory.date) textParts.push(`Date: ${memory.date}`);
      if (memory.people) textParts.push(`People present: ${memory.people}`);
      if (memory.description) textParts.push(`Emotional description: ${memory.description}`);
      if (memory.dialogue) textParts.push(`Memorable dialogue: ${memory.dialogue}`);
      if (memory.soundtrack) textParts.push(`Song playing: ${memory.soundtrack}`);
    } else {
      if (memory.title) textParts.push(`场景名称：${memory.title}`);
      if (memory.location) textParts.push(`地点：${memory.location}`);
      if (memory.date) textParts.push(`日期：${memory.date}`);
      if (memory.people) textParts.push(`在场的人：${memory.people}`);
      if (memory.description) textParts.push(`情感描述：${memory.description}`);
      if (memory.dialogue) textParts.push(`印象深刻的对话：${memory.dialogue}`);
      if (memory.soundtrack) textParts.push(`当时的歌曲：${memory.soundtrack}`);
    }

    const text = textParts.join('\n') || (isEn ? 'A precious memory' : '一段珍贵的记忆');

    // If there are photos, use multimodal content format. Photos may be
    // Google Cloud public URLs or legacy data URLs.
    const photos = memory.photos || [];
    const validPhotos = photos.filter(p => (
      p && (p.startsWith('data:image') || p.startsWith('http://') || p.startsWith('https://'))
    ));

    if (validPhotos.length > 0) {
      // Build multimodal content array
      const content = [
        { type: 'text', text: isEn ? `Please generate level config based on memory details and photos:\n\n${text}` : `请根据以下记忆信息和照片，生成游戏关卡配置：\n\n${text}` },
      ];

      validPhotos.forEach((photoUrl, idx) => {
        content.push({
          type: 'image_url',
          image_url: {
            url: photoUrl,
            detail: 'low', // Use low detail to save tokens
          },
        });
      });

      return content;
    }

    return isEn ? `Please generate level config based on memory details:\n\n${text}` : `请根据以下记忆信息生成游戏关卡配置：\n\n${text}`;
  }

  /**
   * Core API call with retry logic and JSON parsing.
   */
  async _callAPI(messages, maxTokens = 500) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            max_completion_tokens: maxTokens,
            response_format: { type: 'json_object' },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API Error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) throw new Error('Empty response from API');

        return JSON.parse(content);
      } catch (err) {
        lastError = err;
        console.warn(`AIService attempt ${attempt + 1} failed:`, err.message);
        if (attempt < this.maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }
}
