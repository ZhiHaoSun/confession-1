/**
 * Step 2 — Core Data
 * Input her name, birthday, anniversary, and puzzle answer keys.
 */
import { t } from '../../i18n/i18n.js';

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
