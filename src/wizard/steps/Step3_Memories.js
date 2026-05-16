/**
 * Step 3 — Memories (Enhanced)
 * Rich memory scene input: multi-photo gallery, location, people, dialogue, soundtrack.
 */
import { MediaUploader } from '../../utils/MediaUploader.js';

export class Step3Memories {
  constructor(wizard) {
    this.wizard = wizard;
  }

  render(container) {
    if (!this.wizard.data.memories || this.wizard.data.memories.length === 0) {
      this.wizard.data.memories = [this.createEmptyMemory()];
    }

    // Migrate old format memories (single photoUrl → photos array)
    this.wizard.data.memories.forEach(m => {
      if (!m.photos) {
        m.photos = m.photoUrl ? [m.photoUrl] : [];
      }
      if (m.location === undefined) m.location = '';
      if (m.people === undefined) m.people = '';
      if (m.dialogue === undefined) m.dialogue = '';
      if (m.soundtrack === undefined) m.soundtrack = '';
    });
    this.wizard.data.globalSceneMusicTitle ??= '';
    this.wizard.data.globalSceneMusicUrl ??= '';
    this.wizard.data.globalSceneMusicName ??= '';

    container.innerHTML = `
      <div class="step-container">
        <div class="step-content">
          <div class="step-emoji">📸</div>
          <h2 class="step-title">记忆碎片</h2>
          <p class="step-subtitle">详细描述你们的珍贵瞬间——细节越丰富，AI 生成的游戏场景越动人</p>

          ${this.renderGlobalMusicUpload()}

          <div class="memory-cards" id="memory-cards"></div>

          <button class="add-memory-btn mt-lg" id="btn-add-memory" style="display: ${this.wizard.data.memories.length >= 5 ? 'none' : 'flex'}">
            ＋ 添加新的记忆场景
          </button>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">← 上一步</button>
            <button class="btn btn-primary" id="btn-next">下一步 →</button>
          </div>
        </div>
      </div>
    `;

    this.renderMemoryCards();

    container.querySelector('#btn-add-memory').addEventListener('click', () => {
      if (this.wizard.data.memories.length < 5) {
        this.wizard.data.memories.push(this.createEmptyMemory());
        this.wizard.saveData();
        this.renderMemoryCards();
        if (this.wizard.data.memories.length >= 5) {
          container.querySelector('#btn-add-memory').style.display = 'none';
        }
        // Scroll to new card
        setTimeout(() => {
          const cards = document.querySelectorAll('.memory-card');
          cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    });

    container.querySelector('#btn-prev').addEventListener('click', () => this.wizard.prevStep());
    container.querySelector('#btn-next').addEventListener('click', () => {
      const memories = this.wizard.data.memories;
      const hasValidMemory = memories.some(m => m.title || (m.photos && m.photos.length > 0) || m.description);
      if (memories.length === 0 || !hasValidMemory) {
        this.showValidation('请至少填写一个场景的名称或描述');
        return;
      }
      this.wizard.nextStep();
    });
  }

  createEmptyMemory() {
    return {
      id: Date.now() + Math.random(),
      title: '',
      description: '',
      date: '',
      photos: [],
      location: '',
      people: '',
      dialogue: '',
      soundtrack: '',
    };
  }

  renderGlobalMusicUpload() {
    const d = this.wizard.data;
    return `
      <div class="glass-card mb-xl">
        <h3 style="font-size: 1.1rem; margin-bottom: var(--space-md);">🎧 全局场景音乐</h3>
        <p style="font-size: 0.9rem; margin-bottom: var(--space-lg);">
          上传一首音乐，生成后的每个记忆场景都会循环播放这首歌。
        </p>
        <div class="form-group" style="margin-bottom: var(--space-md);">
          <label class="form-label">音乐名称 <span class="form-hint">（可选）</span></label>
          <input class="form-input" id="global-music-title" placeholder="如：我们的主题曲"
                 value="${d.globalSceneMusicTitle || ''}" />
        </div>
        <div class="audio-upload-row ${d.globalSceneMusicUrl ? 'has-audio' : ''}" id="global-audio-upload">
          ${d.globalSceneMusicUrl ? `
            <audio src="${d.globalSceneMusicUrl}" controls></audio>
            <span class="audio-file-name">${d.globalSceneMusicName || '已上传场景音乐'}</span>
            <button class="audio-remove-btn" id="global-audio-remove" type="button">移除</button>
          ` : `
            <span class="audio-upload-icon">＋</span>
            <span>上传所有场景共用的音乐</span>
          `}
          <input type="file" accept="audio/*" id="global-audio-file" />
        </div>
      </div>
    `;
  }

  renderMemoryCards() {
    const cardsContainer = document.getElementById('memory-cards');
    if (!cardsContainer) return;

    cardsContainer.innerHTML = '';

    this.wizard.data.memories.forEach((memory, index) => {
      const card = document.createElement('div');
      card.className = 'memory-card animate-fadeInUp';
      card.style.animationDelay = `${index * 100}ms`;

      const photosHtml = this._renderPhotoGallery(memory, index);
      const detailsExpanded = memory.location || memory.people || memory.dialogue || memory.soundtrack;

      card.innerHTML = `
        <div class="memory-card-header">
          <div style="display: flex; align-items: center; gap: var(--space-md);">
            <div class="memory-card-number">${index + 1}</div>
            <input class="form-input" style="max-width: 280px; padding: var(--space-sm) var(--space-md);"
                   placeholder="场景名称（如：初遇咖啡厅）"
                   value="${memory.title || ''}"
                   data-index="${index}" data-field="title" />
          </div>
          ${this.wizard.data.memories.length > 1 ?
            `<button class="memory-card-remove" data-remove="${index}" title="删除此场景">✕</button>` : ''}
        </div>

        <div class="memory-card-body memory-card-body--enhanced">
          <!-- Photo Gallery -->
          <div class="photo-gallery-section">
            <label class="form-label">📷 照片（最多 3 张，AI 将分析照片内容）</label>
            <div class="photo-gallery" id="photo-gallery-${index}">
              ${photosHtml}
            </div>
          </div>

          <!-- Core Fields -->
          <div class="memory-fields-grid">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">📅 日期</label>
              <input class="form-input" type="date" value="${memory.date || ''}"
                     data-index="${index}" data-field="date" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">📍 地点</label>
              <input class="form-input" placeholder="如：星巴克 · 大学城店"
                     value="${memory.location || ''}"
                     data-index="${index}" data-field="location" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">💭 情感描述 <span class="form-hint">（越详细，AI 生成效果越好）</span></label>
            <textarea class="form-input form-textarea"
                      placeholder="写下这段记忆中你最深刻的感受...&#10;&#10;例如：那天下着小雨，你撑着伞等在图书馆门口，笑着说「我猜你一定忘了带伞」..."
                      style="height: 120px;"
                      data-index="${index}" data-field="description">${memory.description || ''}</textarea>
          </div>

          <!-- Expandable Details -->
          <details class="memory-details-section" ${detailsExpanded ? 'open' : ''}>
            <summary class="memory-details-toggle">
              <span>✨ 更多细节</span>
              <span class="memory-details-hint">（添加对话、人物、音乐可让 AI 生成更生动的场景）</span>
            </summary>
            <div class="memory-details-body">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">👥 在场的人</label>
                <input class="form-input" placeholder="如：我、她、她的闺蜜小张"
                       value="${memory.people || ''}"
                       data-index="${index}" data-field="people" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">💬 印象深刻的对话</label>
                <textarea class="form-input form-textarea"
                          placeholder="如：&#10;她：「你怎么又迟到了？」&#10;我：「因为在路上给你买了这个。」"
                          style="height: 90px;"
                          data-index="${index}" data-field="dialogue">${memory.dialogue || ''}</textarea>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">🎵 当时听的歌 <span class="form-hint">（只用于 AI 理解场景，不上传文件）</span></label>
                <input class="form-input" placeholder="如：周杰伦 - 晴天"
                       value="${memory.soundtrack || ''}"
                       data-index="${index}" data-field="soundtrack" />
              </div>
            </div>
          </details>
        </div>
      `;
      cardsContainer.appendChild(card);
    });

    this._bindAllEvents(cardsContainer);
  }

  _renderPhotoGallery(memory, memoryIndex) {
    const photos = memory.photos || [];
    let html = '';

    // Render existing photos
    photos.forEach((photoUrl, photoIdx) => {
      html += `
        <div class="photo-gallery-item has-image">
          <img src="${photoUrl}" alt="记忆照片 ${photoIdx + 1}" />
          <button class="photo-gallery-remove" data-mem="${memoryIndex}" data-photo="${photoIdx}" title="移除照片">✕</button>
        </div>
      `;
    });

    // Add "+" button if < 3 photos
    if (photos.length < 3) {
      html += `
        <div class="photo-gallery-item photo-gallery-add" data-upload="${memoryIndex}">
          <span class="photo-upload-icon">📷</span>
          <span class="photo-upload-text">添加照片</span>
          <input type="file" accept="image/*" data-file-mem="${memoryIndex}" />
        </div>
      `;
    }

    return html;
  }

  _bindAllEvents(cardsContainer) {
    this.bindGlobalMusicEvents();

    // Text field inputs
    cardsContainer.querySelectorAll('[data-field]').forEach(el => {
      el.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        this.wizard.data.memories[idx][field] = e.target.value;
        this.wizard.saveData();
      });
    });

    // Photo gallery "add" click
    cardsContainer.querySelectorAll('[data-upload]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        el.querySelector('input[type="file"]').click();
      });
    });

    // Photo file change
    cardsContainer.querySelectorAll('[data-file-mem]').forEach(el => {
      el.addEventListener('change', async (e) => {
        const memIdx = parseInt(el.dataset.fileMem);
        const file = e.target.files[0];
        if (file) {
          try {
            this.showValidation('正在上传照片到 Google Cloud...');
            const imageFile = await MediaUploader.imageFileToUploadBlob(file);
            const upload = await MediaUploader.uploadFile(imageFile, { folder: 'memorymaze/images' });
            if (!this.wizard.data.memories[memIdx].photos) {
              this.wizard.data.memories[memIdx].photos = [];
            }
            this.wizard.data.memories[memIdx].photos.push(upload.url);
            this.wizard.saveData();
            this.renderMemoryCards();
          } catch (err) {
            this.showValidation(err.message || '照片上传失败，请检查 Google Cloud 配置');
          }
        }
      });
    });

    // Photo remove
    cardsContainer.querySelectorAll('.photo-gallery-remove').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const memIdx = parseInt(el.dataset.mem);
        const photoIdx = parseInt(el.dataset.photo);
        this.wizard.data.memories[memIdx].photos.splice(photoIdx, 1);
        this.wizard.saveData();
        this.renderMemoryCards();
      });
    });

    // Memory card remove
    cardsContainer.querySelectorAll('[data-remove]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.remove);
        this.wizard.data.memories.splice(idx, 1);
        this.wizard.saveData();
        this.renderMemoryCards();
        const addBtn = document.getElementById('btn-add-memory');
        if (addBtn) addBtn.style.display = this.wizard.data.memories.length < 5 ? 'flex' : 'none';
      });
    });
  }

  bindGlobalMusicEvents() {
    const titleInput = document.getElementById('global-music-title');
    const upload = document.getElementById('global-audio-upload');
    const fileInput = document.getElementById('global-audio-file');
    const removeBtn = document.getElementById('global-audio-remove');

    titleInput?.addEventListener('input', (e) => {
      this.wizard.data.globalSceneMusicTitle = e.target.value;
      this.wizard.saveData();
    });

    upload?.addEventListener('click', (e) => {
      if (e.target.tagName === 'AUDIO' || e.target.closest('#global-audio-remove')) return;
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 8 * 1024 * 1024) {
        this.showValidation('全局场景音乐建议控制在 8MB 内，避免生成链接过大');
        return;
      }

      try {
        this.showValidation('正在上传全局音乐到 Google Cloud...');
        const upload = await MediaUploader.uploadFile(file, { folder: 'memorymaze/audio' });
        this.wizard.data.globalSceneMusicUrl = upload.url;
        this.wizard.data.globalSceneMusicName = file.name;
        if (!this.wizard.data.globalSceneMusicTitle) {
          this.wizard.data.globalSceneMusicTitle = file.name.replace(/\.[^.]+$/, '');
        }
        this.wizard.saveData();
        this.wizard.render();
      } catch (err) {
        this.showValidation(err.message || '音乐上传失败，请检查 Google Cloud 配置');
      }
    });

    removeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.wizard.data.globalSceneMusicUrl = '';
      this.wizard.data.globalSceneMusicName = '';
      this.wizard.saveData();
      this.wizard.render();
    });
  }

  showValidation(msg) {
    let existing = document.querySelector('.validation-msg');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'validation-msg';
    div.style.cssText = `color: var(--accent-coral); text-align: center; margin-top: var(--space-md); font-size: 0.9rem; animation: fadeInUp 0.3s ease forwards;`;
    div.textContent = msg;
    document.querySelector('.step-nav').before(div);
    setTimeout(() => div.remove(), 3000);
  }
}
