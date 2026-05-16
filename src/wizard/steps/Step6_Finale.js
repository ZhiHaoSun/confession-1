/**
 * Step 6 — Finale Configuration
 * Upload confession video, select BGM, write love letter.
 */
import { MediaUploader } from '../../utils/MediaUploader.js';
import { t } from '../../i18n/i18n.js';

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
          <h2 class="step-title">${t('finale.title')}</h2>
          <p class="step-subtitle">${t('finale.subtitle')}</p>

          <!-- Video Upload -->
          <div class="glass-card mb-xl">
            <h3 style="font-size: 1.1rem; margin-bottom: var(--space-lg);">${t('finale.videoTitle')}</h3>
            <div class="video-upload ${d.confessionVideoUrl ? 'has-video' : ''}" id="video-upload">
              ${d.confessionVideoUrl ? 
                `<video src="${d.confessionVideoUrl}" controls style="pointer-events: auto;"></video>` :
                `<span style="font-size: 3rem;">🎥</span>
                 <span style="color: var(--text-secondary);">${t('finale.videoUploadText')}</span>
                 <span style="font-size: 0.8rem; color: var(--text-muted);">${t('finale.videoFormat')}</span>`
              }
              <input type="file" accept="video/*" id="video-input" />
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: var(--space-sm); text-align: center;">
              ${t('finale.videoHint')}
            </p>
          </div>

          <!-- BGM Selection -->
          <div class="glass-card mb-xl">
            <h3 style="font-size: 1.1rem; margin-bottom: var(--space-lg);">${t('finale.bgmTitle')}</h3>
            <div class="music-selector">
              <div class="music-option ${d.bgm === 'romantic-piano' ? 'selected' : ''}" data-bgm="romantic-piano">
                <span>🎹</span>
                <div>
                  <div style="font-weight: 500; font-size: 0.9rem;">${t('finale.romanticPiano')}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${t('finale.romanticPianoDesc')}</div>
                </div>
              </div>
              <div class="music-option ${d.bgm === 'acoustic-guitar' ? 'selected' : ''}" data-bgm="acoustic-guitar">
                <span>🎸</span>
                <div>
                  <div style="font-weight: 500; font-size: 0.9rem;">${t('finale.acousticGuitar')}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${t('finale.acousticGuitarDesc')}</div>
                </div>
              </div>
              <div class="music-option ${d.bgm === 'orchestral' ? 'selected' : ''}" data-bgm="orchestral">
                <span>🎻</span>
                <div>
                  <div style="font-weight: 500; font-size: 0.9rem;">${t('finale.orchestral')}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${t('finale.orchestralDesc')}</div>
                </div>
              </div>
              <div class="music-option ${d.bgm === 'music-box' ? 'selected' : ''}" data-bgm="music-box">
                <span>🎶</span>
                <div>
                  <div style="font-weight: 500; font-size: 0.9rem;">${t('finale.musicBox')}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${t('finale.musicBoxDesc')}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Love Letter -->
          <div class="glass-card mb-xl">
            <h3 style="font-size: 1.1rem; margin-bottom: var(--space-lg);">${t('finale.letterTitle')}</h3>
            <textarea class="form-input form-textarea" id="love-letter" 
                      placeholder="${t('finale.letterPlaceholder', { name: d.herName || t('generate.her') })}"
                      style="min-height: 180px; font-family: var(--font-serif); font-size: 1rem; line-height: 2;"
            >${d.loveLetter || ''}</textarea>
          </div>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">${t('nav.prev')}</button>
            <button class="btn btn-primary" id="btn-next">${t('finale.nextGenerate')}</button>
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
          this.showUploadStatus(container, t('finale.videoUploading'));
          const upload = await MediaUploader.uploadFile(file, { folder: 'memorymaze/video' });
          this.wizard.updateData('confessionVideo', file);
          this.wizard.updateData('confessionVideoUrl', upload.url);
          this.wizard.updateData('confessionVideoName', file.name);
          this.render(container);
        } catch (err) {
          this.showUploadStatus(container, err.message || t('finale.videoUploadFail'), true);
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
