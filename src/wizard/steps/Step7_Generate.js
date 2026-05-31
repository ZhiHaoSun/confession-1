/**
 * Step 7 — Generate & Preview
 * Generates config.json with real AI progress, and provides game preview + download.
 */
import { ConfigGenerator } from '../../ai/ConfigGenerator.js';
import { NarrationService } from '../../ai/NarrationService.js';
import { SceneArtworkService } from '../../ai/SceneArtworkService.js';
import { t } from '../../i18n/i18n.js';
import { MediaUploader } from '../../utils/MediaUploader.js';

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
    const useAI = !!apiKey && !this.wizard.data.editMode;
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
            ${useAI ? t('generate.aiGenerating') : t('generate.generating')}
          </h2>

          <div class="ai-progress-container" id="progress-container">
            ${this._buildProgressItems(sceneCount, useAI)}
          </div>

          <p class="loading-text" id="loading-status">${t('generate.preparing')}</p>
        </div>
      </div>
    `;

    this.runGeneration(container);
  }

  _buildProgressItems(sceneCount, useAI) {
    const items = [];
    const memories = this.wizard.data.memories || [];

    for (let i = 0; i < sceneCount; i++) {
      const name = memories[i]?.title || `${t('puzzles.sceneDefault')} ${i + 1}`;
      items.push(`
        <div class="ai-progress-item" id="progress-${i}">
          <div class="ai-progress-icon">${i + 1}</div>
          <span>${useAI ? `${t('generate.aiScene')}「${name}」` : `${t('generate.processScene')}「${name}」`}</span>
        </div>
      `);
    }

    if (useAI) {
      items.push(`
        <div class="ai-progress-item" id="progress-narrative">
          <div class="ai-progress-icon">💌</div>
          <span>${t('generate.genLetter')}</span>
        </div>
      `);
    }

    if (!this.wizard.data.editMode) {
      items.push(`
        <div class="ai-progress-item" id="progress-artwork">
          <div class="ai-progress-icon">🖼️</div>
          <span>${t('generate.illustrateScenes')}</span>
        </div>
      `);
    }

    items.push(`
      <div class="ai-progress-item" id="progress-finalize">
        <div class="ai-progress-icon">✨</div>
        <span>${t('generate.assembleGame')}</span>
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
      if (!this.wizard.data.editMode) {
        const artworkEl = document.getElementById('progress-artwork');
        if (artworkEl) artworkEl.className = 'ai-progress-item active';
        await SceneArtworkService.attachArtwork(this.configData, (message) => {
          if (statusEl) statusEl.textContent = message;
        });
        if (artworkEl) {
          artworkEl.className = 'ai-progress-item done';
          artworkEl.querySelector('.ai-progress-icon').textContent = '✓';
        }
      }
      if (this.wizard.data.voiceNarrationEnabled) {
        if (statusEl) statusEl.textContent = t('generate.narrationPreparing');
        await NarrationService.attachNarration(this.configData, this.wizard.data, (message) => {
          if (statusEl) statusEl.textContent = message;
        });
      }
      await this.attachAndUploadMazeConfig(this.configData, (message) => {
        if (statusEl) statusEl.textContent = message;
      });
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
          <h2 class="step-title">${t('generate.errorTitle')}</h2>
          <p class="step-subtitle" style="color: var(--accent-coral);">${this.escapeHtml(errorMsg)}</p>

          <div class="flex flex-center gap-lg mt-xl" style="flex-wrap: wrap;">
            <button class="btn btn-primary" id="btn-retry">${t('generate.retry')}</button>
          </div>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">${t('generate.goBack')}</button>
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
    const mazeId = this.configData?.meta?.configUploaded ? this.configData?.meta?.mazeId : '';
    const shareUrl = mazeId
      ? (this.configData?.meta?.shareUrl || `${window.location.origin}/game.html?id=${mazeId}`)
      : '';
    const qrUrl = shareUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=${encodeURIComponent(shareUrl)}`
      : '';
    const configStr = JSON.stringify(this.configData, null, 2);
    const configBlob = new Blob([configStr], { type: 'application/json' });
    const configUrl = URL.createObjectURL(configBlob);
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const useAI = !!apiKey && !this.wizard.data.editMode;
    const saveResult = this.saveConfigForPreview(configStr);
    const saveWarning = saveResult.ok ? '' : `
      <div class="glass-card mt-lg" style="text-align: left; border-color: rgba(248, 113, 113, 0.35);">
        <strong style="color: var(--accent-coral);">${t('generate.storageTitle')}</strong>
        <p style="margin-top: var(--space-sm); font-size: 0.9rem;">
          ${t('generate.storageDesc')}
        </p>
      </div>
    `;
    const cloudShare = mazeId ? `
      <div class="glass-card mt-lg share-card">
        <div class="share-card-main">
          <div class="share-copy">
            <strong style="color: var(--text-accent);">Maze ID: ${this.escapeHtml(mazeId)}</strong>
            <p style="margin-top: var(--space-sm); font-size: 0.9rem;">Scan this QR code or send the link directly.</p>
            <div class="link-output" style="margin: var(--space-md) 0 0; max-width: none;">
              <span class="link-output-url">${this.escapeHtml(shareUrl)}</span>
              <button class="btn btn-secondary btn-sm" id="btn-copy-share" type="button">Copy</button>
            </div>
            <div class="share-actions">
              <a class="btn btn-secondary btn-sm" href="${this.escapeHtml(qrUrl)}" download="memorymaze-${this.escapeHtml(mazeId)}-qr.png" target="_blank" rel="noreferrer">
                Download QR
              </a>
              <a class="btn btn-ghost btn-sm" href="${this.escapeHtml(shareUrl)}" target="_blank" rel="noreferrer">
                Open Game
              </a>
            </div>
          </div>
          <div class="qr-panel">
            <img src="${this.escapeHtml(qrUrl)}" alt="QR code for generated MemoryMaze game" />
          </div>
        </div>
      </div>
    ` : '';
    const artworkGallery = this.renderArtworkGallery();
    const narrationSummary = this.renderNarrationSummary();

    container.innerHTML = `
      <div class="step-container">
        <div class="step-content generate-container">
          <div class="step-emoji" style="font-size: 4rem;">🎉</div>
          <h2 class="step-title animate-fadeInUp">
            <span class="text-gradient">${d.myName || t('generate.you')} ❤ ${d.herName || t('generate.her')}</span> ${t('generate.resultTitle')}
          </h2>
          <p class="step-subtitle animate-fadeInUp delay-2">
            ${useAI ? t('generate.resultAI') : t('generate.resultReady')}${t('generate.resultHint')}
          </p>
          ${saveWarning}
          ${cloudShare}
          ${artworkGallery}
          ${narrationSummary}

          <!-- Preview -->
          <div class="preview-frame animate-fadeInScale delay-3">
            <iframe src="${mazeId ? `/game.html?id=${encodeURIComponent(mazeId)}` : '/game.html?demo=true'}" id="game-preview" title="${t('generate.gamePreview')}"></iframe>
          </div>

          <!-- Actions -->
          <div class="flex flex-center gap-lg mt-xl animate-fadeInUp delay-4" style="flex-wrap: wrap;">
            <button class="btn btn-primary btn-lg" id="btn-preview-fullscreen">
              ${t('generate.previewBtn')}
            </button>
            <a class="btn btn-secondary btn-lg" href="${configUrl}" download="config.json" id="btn-download">
              ${t('generate.downloadBtn')}
            </a>
          </div>

          <!-- Config Preview -->
          <details class="glass-card mt-xl" style="text-align: left; cursor: pointer;">
            <summary style="font-weight: 600; padding: var(--space-sm) 0; color: var(--text-accent);">
              ${t('generate.viewConfig')}
            </summary>
            <pre style="margin-top: var(--space-md); padding: var(--space-md); background: var(--bg-primary); border-radius: var(--radius-md); overflow-x: auto; font-size: 0.8rem; line-height: 1.6; color: var(--text-secondary); max-height: 400px; overflow-y: auto;"><code>${this.escapeHtml(configStr)}</code></pre>
          </details>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-restart">${t('generate.restartBtn')}</button>
            <button class="btn btn-primary" id="btn-save-and-open">
              ${t('generate.saveOpenBtn')}
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

    container.querySelector('#btn-copy-share')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch { /* ignore */ }
    });

    container.querySelectorAll('[data-regenerate-artwork]').forEach(button => {
      button.addEventListener('click', async () => {
        const index = Number(button.dataset.regenerateArtwork);
        await this.regenerateArtwork(index, button, container);
      });
    });

    container.querySelector('#btn-regenerate-narration')?.addEventListener('click', async (event) => {
      await this.regenerateNarration(event.currentTarget, container);
    });

    container.querySelector('#btn-restart')?.addEventListener('click', () => {
      this.wizard.resetData();
      this.generated = false;
      this.configData = null;
      this.wizard.goToStep(0);
    });

    container.querySelector('#btn-save-and-open')?.addEventListener('click', () => {
      const result = this.saveConfigForPreview(configStr);
      if (shareUrl) {
        window.open(shareUrl, '_blank');
      } else if (result.ok) {
        window.open('/game.html', '_blank');
      } else {
        this.showInlineStorageError(container);
      }
    });
  }

  renderArtworkGallery() {
    const levels = this.configData?.levels || [];
    if (levels.length === 0) return '';

    const scenes = levels.map((level, index) => {
      const artwork = level.artwork || {};
      const imageUrl = artwork.url || level.background || '';
      const statusClass = artwork.status === 'generated' ? 'generated' : 'fallback';
      const statusText = artwork.status === 'generated'
        ? t('generate.artworkGenerated')
        : t('generate.artworkFallback');
      return `
        <article class="artwork-scene-card">
          <div class="artwork-scene-image">
            ${imageUrl
              ? `<img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(level.title || t('puzzles.sceneDefault'))}" />`
              : `<div class="artwork-empty">${t('generate.artworkEmpty')}</div>`}
          </div>
          <div class="artwork-scene-info">
            <strong>${this.escapeHtml(level.title || `${t('puzzles.sceneDefault')} ${index + 1}`)}</strong>
            <span class="artwork-status ${statusClass}">${statusText}</span>
          </div>
          <button class="btn btn-secondary btn-sm artwork-regenerate" type="button" data-regenerate-artwork="${index}">
            ${t('generate.artworkRegenerate')}
          </button>
        </article>
      `;
    }).join('');

    return `
      <section class="glass-card artwork-gallery mt-lg">
        <div class="artwork-gallery-head">
          <h3>${t('generate.artworkTitle')}</h3>
          <p>${t('generate.artworkDesc')}</p>
        </div>
        <div class="artwork-scenes">${scenes}</div>
        <p class="artwork-feedback" id="artwork-feedback"></p>
      </section>
    `;
  }

  renderNarrationSummary() {
    if (!this.wizard.data.voiceNarrationEnabled) {
      return `
        <section class="glass-card mt-lg" style="text-align: left;">
          <h3>${t('generate.narrationTitle')}</h3>
          <p style="margin-top: var(--space-sm);">${t('generate.narrationOff')}</p>
        </section>
      `;
    }

    const finaleReady = !!this.configData?.finale?.narrationUrl;
    const hintCount = (this.configData?.levels || []).reduce((count, level) => (
      count + ((level.interactives || []).some(item => item?.puzzle?.narrationUrl) ? 1 : 0)
    ), 0);
    const error = this.configData?.narration?.error;
    const status = error
      ? t('generate.narrationFailed', { error })
      : finaleReady
        ? t('generate.narrationReady', { count: hintCount })
        : t('generate.narrationMissing');

    return `
      <section class="glass-card mt-lg" style="text-align: left;">
        <h3>${t('generate.narrationTitle')}</h3>
        <p id="narration-feedback" style="margin-top: var(--space-sm);">${this.escapeHtml(status)}</p>
        <button class="btn btn-secondary btn-sm mt-lg" type="button" id="btn-regenerate-narration">
          ${t('generate.narrationRegenerate')}
        </button>
      </section>
    `;
  }

  async regenerateNarration(button, container) {
    const feedback = container.querySelector('#narration-feedback');
    button.disabled = true;
    button.textContent = t('generate.narrationWorking');
    if (this.configData.narration) delete this.configData.narration.error;

    try {
      await NarrationService.attachNarration(this.configData, {
        ...this.wizard.data,
        voiceNarrationEnabled: true,
      }, (message) => {
        if (feedback) feedback.textContent = message;
      });
      if (!this.configData?.finale?.narrationUrl) {
        throw new Error(this.configData?.narration?.error || t('generate.narrationMissing'));
      }
      await this.attachAndUploadMazeConfig(this.configData, (message) => {
        if (feedback) feedback.textContent = message;
      });
      this.showResult(container);
    } catch (error) {
      if (feedback) feedback.textContent = t('generate.narrationFailed', {
        error: error.message || t('generate.narrationMissing'),
      });
      button.disabled = false;
      button.textContent = t('generate.narrationRegenerate');
    }
  }

  async regenerateArtwork(index, button, container) {
    const feedback = container.querySelector('#artwork-feedback');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = t('generate.artworkWorking');

    try {
      await SceneArtworkService.regenerateLevel(this.configData, index, (message) => {
        if (feedback) feedback.textContent = message;
      });
      await this.attachAndUploadMazeConfig(this.configData, (message) => {
        if (feedback) feedback.textContent = message;
      });
      this.showResult(container);
    } catch (error) {
      if (feedback) feedback.textContent = error.message || t('generate.artworkUnavailable');
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  async attachAndUploadMazeConfig(config, onStatus) {
    const mazeId = config.meta?.mazeId || this.createMazeId();
    const shareUrl = `${window.location.origin}/game.html?id=${mazeId}`;

    config.meta = {
      ...(config.meta || {}),
      mazeId,
      shareUrl,
    };

    try {
      onStatus?.(t('generate.uploadingCloud'));
      config.meta.configUploaded = true;
      const upload = await MediaUploader.uploadJson(config, {
        fileName: `${mazeId}.json`,
        objectName: `memorymaze/configs/${mazeId}.json`,
      });
      config.meta.configUrl = upload.url;
      onStatus?.(t('generate.uploadCloudDone'));
    } catch (err) {
      config.meta.configUploadError = err.message || 'Maze config upload failed';
      config.meta.configUploaded = false;
      onStatus?.(t('generate.uploadCloudFail'));
    }
  }

  createMazeId() {
    const random = crypto.getRandomValues(new Uint8Array(10));
    const token = Array.from(random, b => b.toString(36).padStart(2, '0')).join('').slice(0, 14);
    return `maze_${Date.now().toString(36)}_${token}`;
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
    div.textContent = t('generate.storageFull');
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
