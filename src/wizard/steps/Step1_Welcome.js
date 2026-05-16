/**
 * Step 1 — Welcome Landing
 * Cinematic hero section with animated logo, feature highlights, CTA, and language switcher.
 */
import { t, getLocale, setLocale } from '../../i18n/i18n.js';

export class Step1Welcome {
  constructor(wizard) {
    this.wizard = wizard;
  }

  render(container) {
    const lang = getLocale();
    container.innerHTML = `
      <div class="welcome-hero">
        <div class="lang-switcher" id="lang-switcher" title="${t('langSwitch.tooltip')}">
          🌐 ${t('langSwitch.label')}
        </div>
        <div class="welcome-logo-large">💌</div>
        <h1 class="welcome-title animate-fadeInUp">
          <span class="text-gradient">MemoryMaze</span>
        </h1>
        <p class="welcome-tagline">${t('welcome.tagline')}</p>
        
        <div class="welcome-features">
          <div class="welcome-feature">
            <span class="welcome-feature-icon">📸</span>
            <span class="welcome-feature-text">${t('welcome.feature1')}</span>
          </div>
          <div class="welcome-feature">
            <span class="welcome-feature-icon">🎨</span>
            <span class="welcome-feature-text">${t('welcome.feature2')}</span>
          </div>
          <div class="welcome-feature">
            <span class="welcome-feature-icon">🧩</span>
            <span class="welcome-feature-text">${t('welcome.feature3')}</span>
          </div>
        </div>

        <div class="welcome-cta">
          <button class="btn btn-primary btn-lg animate-heartbeat" id="btn-start">
            ${t('welcome.cta')}
          </button>
          <p class="text-sm mt-md" style="color: var(--text-muted);">
            ${t('welcome.ctaHint')}
          </p>
        </div>
      </div>
    `;

    container.querySelector('#btn-start').addEventListener('click', () => {
      this.wizard.nextStep();
    });

    container.querySelector('#lang-switcher').addEventListener('click', () => {
      const newLang = getLocale() === 'zh' ? 'en' : 'zh';
      setLocale(newLang);
      this.render(container);
    });
  }
}
