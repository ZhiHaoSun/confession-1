/**
 * Step 6 — Finale Configuration
 * Upload confession video, select BGM, write love letter.
 */
import { MediaUploader } from '../../utils/MediaUploader.js';

export class Step6Finale {
  constructor(wizard) {
    this.wizard = wizard;
  }

  render(container) {
    const d = this.wizard.data;

    container.innerHTML = `
      <div class="step-container">
        <div class="step-content">
          <div class="step-emoji">💌</div>
          <h2 class="step-title">终章告白</h2>
          <p class="step-subtitle">上传你的告白视频，选择背景音乐，写下最真挚的情书</p>

          <!-- Video Upload -->
          <div class="glass-card mb-xl">
            <h3 style="font-size: 1.1rem; margin-bottom: var(--space-lg);">🎬 告白视频</h3>
            <div class="video-upload ${d.confessionVideoUrl ? 'has-video' : ''}" id="video-upload">
              ${d.confessionVideoUrl ? 
                `<video src="${d.confessionVideoUrl}" controls style="pointer-events: auto;"></video>` :
                `<span style="font-size: 3rem;">🎥</span>
                 <span style="color: var(--text-secondary);">点击上传告白视频</span>
                 <span style="font-size: 0.8rem; color: var(--text-muted);">支持 MP4、WebM 格式</span>`
              }
              <input type="file" accept="video/*" id="video-input" />
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: var(--space-sm); text-align: center;">
              这段视频将在她解开所有谜题后全屏播放 ✨
            </p>
          </div>

          <!-- BGM Selection -->
          <div class="glass-card mb-xl">
            <h3 style="font-size: 1.1rem; margin-bottom: var(--space-lg);">🎵 背景音乐</h3>
            <div class="music-selector">
              <div class="music-option ${d.bgm === 'romantic-piano' ? 'selected' : ''}" data-bgm="romantic-piano">
                <span>🎹</span>
                <div>
                  <div style="font-weight: 500; font-size: 0.9rem;">浪漫钢琴曲</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">温柔舒缓</div>
                </div>
              </div>
              <div class="music-option ${d.bgm === 'acoustic-guitar' ? 'selected' : ''}" data-bgm="acoustic-guitar">
                <span>🎸</span>
                <div>
                  <div style="font-weight: 500; font-size: 0.9rem;">木吉他小品</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">清新自然</div>
                </div>
              </div>
              <div class="music-option ${d.bgm === 'orchestral' ? 'selected' : ''}" data-bgm="orchestral">
                <span>🎻</span>
                <div>
                  <div style="font-weight: 500; font-size: 0.9rem;">管弦乐叙事</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">史诗感动</div>
                </div>
              </div>
              <div class="music-option ${d.bgm === 'music-box' ? 'selected' : ''}" data-bgm="music-box">
                <span>🎶</span>
                <div>
                  <div style="font-weight: 500; font-size: 0.9rem;">八音盒旋律</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">童话梦幻</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Love Letter -->
          <div class="glass-card mb-xl">
            <h3 style="font-size: 1.1rem; margin-bottom: var(--space-lg);">✉️ 告白情书</h3>
            <textarea class="form-input form-textarea" id="love-letter" 
                      placeholder="亲爱的${d.herName || '她'}，&#10;&#10;从那天起，我的世界就多了一份色彩...&#10;&#10;（在这里写下你最想对她说的话）"
                      style="min-height: 180px; font-family: var(--font-serif); font-size: 1rem; line-height: 2;"
            >${d.loveLetter || ''}</textarea>
          </div>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">← 上一步</button>
            <button class="btn btn-primary" id="btn-next">下一步 — 生成游戏 ✨</button>
          </div>
        </div>
      </div>
    `;

    // Video upload
    const videoUpload = container.querySelector('#video-upload');
    const videoInput = container.querySelector('#video-input');
    
    videoUpload.addEventListener('click', (e) => {
      if (e.target.tagName === 'VIDEO') return;
      videoInput.click();
    });

    videoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          this.showUploadStatus(container, '正在上传告白视频到 Google Cloud...');
          const upload = await MediaUploader.uploadFile(file, { folder: 'memorymaze/video' });
          this.wizard.updateData('confessionVideo', file);
          this.wizard.updateData('confessionVideoUrl', upload.url);
          this.wizard.updateData('confessionVideoName', file.name);
          this.render(container);
        } catch (err) {
          this.showUploadStatus(container, err.message || '视频上传失败，请检查 Google Cloud 配置', true);
        }
      }
    });

    // BGM selection
    container.querySelectorAll('[data-bgm]').forEach(opt => {
      opt.addEventListener('click', () => {
        container.querySelectorAll('.music-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.wizard.updateData('bgm', opt.dataset.bgm);
      });
    });

    // Love letter
    container.querySelector('#love-letter').addEventListener('input', (e) => {
      this.wizard.updateData('loveLetter', e.target.value);
    });

    container.querySelector('#btn-prev').addEventListener('click', () => this.wizard.prevStep());
    container.querySelector('#btn-next').addEventListener('click', () => this.wizard.nextStep());
  }

  showUploadStatus(container, message, isError = false) {
    let status = container.querySelector('.video-upload-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'video-upload-status';
      status.style.cssText = `
        text-align: center;
        margin-top: var(--space-md);
        font-size: 0.9rem;
      `;
      container.querySelector('#video-upload')?.after(status);
    }
    status.style.color = isError ? 'var(--accent-coral)' : 'var(--text-accent)';
    status.textContent = message;
  }
}
