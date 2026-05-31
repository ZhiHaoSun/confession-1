/**
 * Step 2 — Core Data
 * Input couple identity, portrait references, anniversary, and puzzle answer keys.
 */
import { t } from '../../i18n/i18n.js';
import { MediaUploader } from '../../utils/MediaUploader.js';

export class Step2CoreData {
  constructor(wizard) {
    this.wizard = wizard;
  }

  render(container) {
    const d = this.wizard.data;
    container.innerHTML = `
      <div class="step-container">
        <div class="step-content">
          <div class="step-emoji">📝</div>
          <h2 class="step-title">${t('core.title')}</h2>
          <p class="step-subtitle">${t('core.subtitle')}</p>

          <div class="glass-card">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">${t('core.myName')}</label>
                <input class="form-input" id="myName" type="text" placeholder="${t('core.myNamePlaceholder')}" value="${d.myName || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">${t('core.herName')}</label>
                <input class="form-input" id="herName" type="text" placeholder="${t('core.herNamePlaceholder')}" value="${d.herName || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">${t('core.herBirthday')}</label>
                <input class="form-input" id="herBirthday" type="date" value="${d.herBirthday || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">${t('core.anniversary')}</label>
                <input class="form-input" id="anniversary" type="date" value="${d.anniversary || ''}" />
              </div>
              <div class="form-group form-group-full">
                <label class="form-label">${t('core.nickname')}</label>
                <input class="form-input" id="nickname" type="text" placeholder="${t('core.nicknamePlaceholder')}" value="${d.nickname || ''}" />
              </div>
            </div>

            <div class="portrait-reference-section">
              <h3>${t('core.portraitTitle')}</h3>
              <p>${t('core.portraitDesc')}</p>
              <div class="portrait-reference-grid">
                ${this.renderPortraitUpload('creator', d.creatorPortraitUrl, d.creatorPortraitName, t('core.myPortrait'))}
                ${this.renderPortraitUpload('receiver', d.receiverPortraitUrl, d.receiverPortraitName, t('core.herPortrait'))}
              </div>
              <p class="portrait-reference-hint">${t('core.portraitHint')}</p>
            </div>
          </div>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">${t('nav.prev')}</button>
            <button class="btn btn-primary" id="btn-next">${t('nav.next')}</button>
          </div>
        </div>
      </div>
    `;

    // Bind inputs
    const fields = ['myName', 'herName', 'herBirthday', 'anniversary', 'nickname'];
    fields.forEach(field => {
      const el = container.querySelector(`#${field}`);
      if (!el) return;
      el.addEventListener('input', (e) => {
        this.wizard.updateData(field, e.target.value);
      });
    });

    this.bindPortraitUploads(container);

    container.querySelector('#btn-prev').addEventListener('click', () => this.wizard.prevStep());
    container.querySelector('#btn-next').addEventListener('click', () => {
      // Validate
      if (!this.wizard.data.myName || !this.wizard.data.herName) {
        this.showValidation(t('core.validationNames'));
        return;
      }
      this.wizard.nextStep();
    });
  }

  renderPortraitUpload(role, url, fileName, label) {
    return `
      <div class="portrait-reference">
        <label class="form-label">${label}</label>
        <div class="portrait-upload ${url ? 'has-image' : ''}" data-portrait-upload="${role}">
          ${url ? `
            <img src="${url}" alt="${label}" />
            <button class="portrait-remove" type="button" data-portrait-remove="${role}" title="${t('core.removePortrait')}">✕</button>
            <span class="portrait-file-name">${fileName || t('core.portraitUploaded')}</span>
          ` : `
            <span class="photo-upload-icon">📷</span>
            <span class="photo-upload-text">${t('core.uploadPortrait')}</span>
          `}
          <input type="file" accept="image/*" data-portrait-file="${role}" />
        </div>
      </div>
    `;
  }

  bindPortraitUploads(container) {
    container.querySelectorAll('[data-portrait-upload]').forEach(upload => {
      upload.addEventListener('click', event => {
        if (event.target.closest('[data-portrait-remove]')) return;
        upload.querySelector('input[type="file"]')?.click();
      });
    });

    container.querySelectorAll('[data-portrait-file]').forEach(input => {
      input.addEventListener('change', async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        const role = input.dataset.portraitFile;
        const prefix = role === 'creator' ? 'creator' : 'receiver';

        try {
          this.showValidation(t('core.portraitUploading'));
          const imageFile = await MediaUploader.imageFileToUploadBlob(file, 1024);
          const upload = await MediaUploader.uploadFile(imageFile, { folder: 'memorymaze/portraits' });
          this.wizard.updateData(`${prefix}PortraitUrl`, upload.url);
          this.wizard.updateData(`${prefix}PortraitName`, file.name);
          this.render(container);
        } catch (error) {
          this.showValidation(error.message || t('core.portraitUploadFail'));
        }
      });
    });

    container.querySelectorAll('[data-portrait-remove]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        const prefix = button.dataset.portraitRemove === 'creator' ? 'creator' : 'receiver';
        this.wizard.updateData(`${prefix}PortraitUrl`, '');
        this.wizard.updateData(`${prefix}PortraitName`, '');
        this.render(container);
      });
    });
  }

  showValidation(msg) {
    let existing = document.querySelector('.validation-msg');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'validation-msg';
    div.style.cssText = `
      color: var(--accent-coral); 
      text-align: center; 
      margin-top: var(--space-md); 
      font-size: 0.9rem;
      animation: fadeInUp 0.3s ease forwards;
    `;
    div.textContent = msg;
    document.querySelector('.step-nav').before(div);

    setTimeout(() => div.remove(), 3000);
  }
}
