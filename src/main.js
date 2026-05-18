import './styles/index.css';
import './styles/animations.css';
import './styles/wizard.css';
import { initLocale, t } from './i18n/i18n.js';
import { WizardController } from './wizard/WizardController.js';
import { ParticleBackground } from './wizard/components/ParticleBackground.js';

// Boot
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize locale
  initLocale();

  // Dynamically set document title based on locale
  document.title = t('core.title');
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = t('core.description');
  }

  const app = document.getElementById('app');

  // Ambient particle background
  const particles = new ParticleBackground(app);
  particles.start();

  // Initialize wizard
  const wizard = new WizardController(app);
  const editMazeId = new URLSearchParams(window.location.search).get('edit');
  if (editMazeId) {
    const safeEditMazeId = escapeHtml(editMazeId);
    app.innerHTML = `
      <div class="wizard-container">
        <div class="step-container">
          <div class="step-content generate-container">
            <div class="generate-animation">
              <div class="generate-ring"></div>
              <div class="generate-ring"></div>
              <div class="generate-ring"></div>
              <div class="generate-icon">✏️</div>
            </div>
            <h2 class="step-title" style="margin-top: var(--space-xl);">正在加载可编辑的记忆迷宫...</h2>
            <p class="loading-text">Maze ID: ${safeEditMazeId}</p>
          </div>
        </div>
      </div>
    `;

    try {
      await wizard.loadEditMode(editMazeId);
    } catch (err) {
      const safeError = escapeHtml(err.message || '请检查 Maze ID 后重试。');
      app.innerHTML = `
        <div class="wizard-container">
          <div class="step-container">
            <div class="step-content generate-container">
              <div class="step-emoji" style="font-size: 4rem;">⚠️</div>
              <h2 class="step-title">无法加载这个迷宫</h2>
              <p class="step-subtitle" style="color: var(--accent-coral);">${safeError}</p>
              <a class="btn btn-primary mt-lg" href="/">返回创建页</a>
            </div>
          </div>
        </div>
      `;
      return;
    }
  }

  wizard.init();
});

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
