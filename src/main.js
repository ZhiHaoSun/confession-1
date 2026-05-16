import './styles/index.css';
import './styles/animations.css';
import './styles/wizard.css';
import { WizardController } from './wizard/WizardController.js';
import { ParticleBackground } from './wizard/components/ParticleBackground.js';

// Boot
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  
  // Ambient particle background
  const particles = new ParticleBackground(app);
  particles.start();

  // Initialize wizard
  const wizard = new WizardController(app);
  wizard.init();
});
