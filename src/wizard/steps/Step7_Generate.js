/**
 * Step 7 — Generate & Preview
 * Generates config.json with real AI progress, and provides game preview + download.
 */
import { ConfigGenerator } from '../../ai/ConfigGenerator.js';

export class Step7Generate {
  constructor(wizard) {
    this.wizard = wizard;
    this.generated = false;
    this.configData = null;
    this.error = null;
  }

  render(container) {
    if (!this.generated) {
      this.showGenerating(container);
    } else {
      this.showResult(container);
    }
  }

  showGenerating(container) {
    const memories = this.wizard.data.memories || [];
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const useAI = !!apiKey;
    const sceneCount = memories.filter(m => m.title || m.description || (m.photos && m.photos.length > 0)).length || 1;

    container.innerHTML = `
      <div class="step-container">
        <div class="step-content generate-container">
          <div class="generate-animation">
            <div class="generate-ring"></div>
            <div class="generate-ring"></div>
            <div class="generate-ring"></div>
            <div class="generate-icon">${useAI ? '🤖' : '💫'}</div>
          </div>
          <h2 class="step-title" style="margin-top: var(--space-xl);">
            ${useAI ? '正在让 AI 编织你们的记忆迷宫...' : '正在编织你们的记忆迷宫...'}
          </h2>

          <div class="ai-progress-container" id="progress-container">
            ${this._buildProgressItems(sceneCount, useAI)}
          </div>

          <p class="loading-text" id="loading-status">准备中...</p>
        </div>
      </div>
    `;

    this.runGeneration(container);
  }

  _buildProgressItems(sceneCount, useAI) {
    const items = [];
    const memories = this.wizard.data.memories || [];

    for (let i = 0; i < sceneCount; i++) {
      const name = memories[i]?.title || `场景 ${i + 1}`;
      items.push(`
        <div class="ai-progress-item" id="progress-${i}">
          <div class="ai-progress-icon">${i + 1}</div>
          <span>${useAI ? `AI 生成「${name}」` : `处理「${name}」`}</span>
        </div>
      `);
    }

    if (useAI) {
      items.push(`
        <div class="ai-progress-item" id="progress-narrative">
          <div class="ai-progress-icon">💌</div>
          <span>生成告白信</span>
        </div>
      `);
    }

    items.push(`
      <div class="ai-progress-item" id="progress-finalize">
        <div class="ai-progress-icon">✨</div>
        <span>组装游戏</span>
      </div>
    `);

    return items.join('');
  }

  async runGeneration(container) {
    const statusEl = document.getElementById('loading-status');
    const memories = this.wizard.data.memories || [];
    const validMemories = memories.filter(m => m.title || m.description || (m.photos && m.photos.length > 0));

    // Progress callback
    const onProgress = (stepIndex, totalSteps, message) => {
      if (statusEl) statusEl.textContent = message;

      // Update progress items
      for (let i = 0; i < validMemories.length; i++) {
        const el = document.getElementById(`progress-${i}`);
        if (!el) continue;
        if (i < stepIndex) {
          el.className = 'ai-progress-item done';
          el.querySelector('.ai-progress-icon').textContent = '✓';
        } else if (i === stepIndex) {
          el.className = 'ai-progress-item active';
        }
      }

      // Narrative step
      const narrativeEl = document.getElementById('progress-narrative');
      if (narrativeEl) {
        if (stepIndex >= validMemories.length) {
          narrativeEl.className = 'ai-progress-item active';
        }
        if (stepIndex > validMemories.length) {
          narrativeEl.className = 'ai-progress-item done';
          narrativeEl.querySelector('.ai-progress-icon').textContent = '✓';
        }
      }

      // Finalize step
      const finalizeEl = document.getElementById('progress-finalize');
      if (finalizeEl && stepIndex >= totalSteps - 1) {
        finalizeEl.className = 'ai-progress-item active';
      }
    };

    try {
      const generator = new ConfigGenerator();
      this.configData = await generator.generate(this.wizard.data, onProgress);
      this.generated = true;
      this.error = null;

      // Mark finalize done
      const finalizeEl = document.getElementById('progress-finalize');
      if (finalizeEl) {
        finalizeEl.className = 'ai-progress-item done';
        finalizeEl.querySelector('.ai-progress-icon').textContent = '✓';
      }

      await this.delay(500);
      this.showResult(container);
    } catch (err) {
      console.error('Generation failed:', err);
      this.error = err.message;
      this.showError(container, err.message);
    }
  }

  showError(container, errorMsg) {
    container.innerHTML = `
      <div class="step-container">
        <div class="step-content generate-container">
          <div class="step-emoji" style="font-size: 4rem;">⚠️</div>
          <h2 class="step-title">生成遇到问题</h2>
          <p class="step-subtitle" style="color: var(--accent-coral);">${this.escapeHtml(errorMsg)}</p>

          <div class="flex flex-center gap-lg mt-xl" style="flex-wrap: wrap;">
            <button class="btn btn-primary" id="btn-retry">🔄 重试</button>
          </div>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">← 返回修改</button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-retry')?.addEventListener('click', () => {
      this.generated = false;
      this.showGenerating(container);
    });

    container.querySelector('#btn-prev')?.addEventListener('click', () => this.wizard.prevStep());
  }

  showResult(container) {
    const d = this.wizard.data;
    const configStr = JSON.stringify(this.configData, null, 2);
    const configBlob = new Blob([configStr], { type: 'application/json' });
    const configUrl = URL.createObjectURL(configBlob);
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const useAI = !!apiKey;
    const saveResult = this.saveConfigForPreview(configStr);
    const saveWarning = saveResult.ok ? '' : `
      <div class="glass-card mt-lg" style="text-align: left; border-color: rgba(248, 113, 113, 0.35);">
        <strong style="color: var(--accent-coral);">预览存储空间不足</strong>
        <p style="margin-top: var(--space-sm); font-size: 0.9rem;">
          你的照片/音乐/视频太大，浏览器无法保存完整预览数据。请下载 config.json，或返回压缩素材后重新生成。
        </p>
      </div>
    `;

    container.innerHTML = `
      <div class="step-container">
        <div class="step-content generate-container">
          <div class="step-emoji" style="font-size: 4rem;">🎉</div>
          <h2 class="step-title animate-fadeInUp">
            <span class="text-gradient">${d.myName || '你'} ❤ ${d.herName || '她'}</span> 的记忆迷宫已生成！
          </h2>
          <p class="step-subtitle animate-fadeInUp delay-2">
            ${useAI ? '🤖 AI 已为你的每段记忆注入了灵魂' : '游戏已准备就绪'}，你可以预览效果或下载配置文件
          </p>
          ${saveWarning}

          <!-- Preview -->
          <div class="preview-frame animate-fadeInScale delay-3">
            <iframe src="/game.html?demo=true" id="game-preview" title="游戏预览"></iframe>
          </div>

          <!-- Actions -->
          <div class="flex flex-center gap-lg mt-xl animate-fadeInUp delay-4" style="flex-wrap: wrap;">
            <button class="btn btn-primary btn-lg" id="btn-preview-fullscreen">
              🎮 全屏预览游戏
            </button>
            <a class="btn btn-secondary btn-lg" href="${configUrl}" download="config.json" id="btn-download">
              📦 下载配置文件
            </a>
          </div>

          <!-- Config Preview -->
          <details class="glass-card mt-xl" style="text-align: left; cursor: pointer;">
            <summary style="font-weight: 600; padding: var(--space-sm) 0; color: var(--text-accent);">
              📋 查看生成的 config.json
            </summary>
            <pre style="margin-top: var(--space-md); padding: var(--space-md); background: var(--bg-primary); border-radius: var(--radius-md); overflow-x: auto; font-size: 0.8rem; line-height: 1.6; color: var(--text-secondary); max-height: 400px; overflow-y: auto;"><code>${this.escapeHtml(configStr)}</code></pre>
          </details>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-restart">🔄 重新创作</button>
            <button class="btn btn-primary" id="btn-save-and-open">
              🚀 保存并在新窗口打开游戏
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind events
    container.querySelector('#btn-preview-fullscreen')?.addEventListener('click', () => {
      const iframe = document.getElementById('game-preview');
      if (iframe?.requestFullscreen) {
        iframe.requestFullscreen();
      }
    });

    container.querySelector('#btn-restart')?.addEventListener('click', () => {
      this.wizard.resetData();
      this.generated = false;
      this.configData = null;
      this.wizard.goToStep(0);
    });

    container.querySelector('#btn-save-and-open')?.addEventListener('click', () => {
      const result = this.saveConfigForPreview(configStr);
      if (result.ok) {
        window.open('/game.html', '_blank');
      } else {
        this.showInlineStorageError(container);
      }
    });
  }

  saveConfigForPreview(configStr) {
    try {
      sessionStorage.setItem('memorymaze_game_config', configStr);
      try {
        localStorage.setItem('memorymaze_game_config', configStr);
      } catch {
        localStorage.setItem('memorymaze_game_config', JSON.stringify(this.createLightweightConfig(this.configData)));
      }
      return { ok: true };
    } catch (sessionError) {
      try {
        const lightweight = JSON.stringify(this.createLightweightConfig(this.configData));
        sessionStorage.setItem('memorymaze_game_config', lightweight);
        localStorage.setItem('memorymaze_game_config', lightweight);
        return { ok: false, lightweight: true, error: sessionError };
      } catch (fallbackError) {
        return { ok: false, error: fallbackError };
      }
    }
  }

  createLightweightConfig(config) {
    return {
      ...config,
      levels: (config.levels || []).map(level => ({
        ...level,
        background: '',
        photos: [],
        music: level.music ? { ...level.music, url: '' } : undefined,
      })),
      finale: {
        ...(config.finale || {}),
        videoUrl: '',
        hasVideo: false,
      },
    };
  }

  showInlineStorageError(container) {
    let existing = container.querySelector('.storage-error-msg');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'storage-error-msg';
    div.style.cssText = `
      margin-top: var(--space-md);
      color: var(--accent-coral);
      text-align: center;
      font-size: 0.9rem;
    `;
    div.textContent = '当前素材太大，无法保存到浏览器预览。请下载 config.json，或压缩音频/视频/照片后再生成。';
    container.querySelector('.step-nav')?.before(div);
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
