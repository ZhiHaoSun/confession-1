import './styles/index.css';
import './styles/animations.css';
import './styles/wizard.css';
import { initLocale } from './i18n/i18n.js';
import { WizardController } from './wizard/WizardController.js';
import { ParticleBackground } from './wizard/components/ParticleBackground.js';

// Boot
document.addEventListener('DOMContentLoaded', () => {
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
  wizard.init();
});
