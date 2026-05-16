/**
 * WizardController — Central state machine for the multi-step creation wizard.
 * Manages step navigation, data aggregation, validation, and transitions.
 */
import { Step1Welcome } from './steps/Step1_Welcome.js';
import { Step2CoreData } from './steps/Step2_CoreData.js';
import { Step3Memories } from './steps/Step3_Memories.js';
import { Step4ArtStyle } from './steps/Step4_ArtStyle.js';
import { Step5Puzzles } from './steps/Step5_Puzzles.js';
import { Step6Finale } from './steps/Step6_Finale.js';
import { Step7Generate } from './steps/Step7_Generate.js';

const STORAGE_KEY = 'memorymaze_wizard_data';

export class WizardController {
  constructor(appEl) {
    this.app = appEl;
    this.currentStep = 0; // 0 = welcome, 1-6 = wizard steps
    this.totalSteps = 7;
    this.data = this.loadSavedData();
    this.steps = [];
    this.headerEl = null;
    this.bodyEl = null;
  }

  loadSavedData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return {
      herName: '',
      herBirthday: '',
      anniversary: '',
      nickname: '',
      myName: '',
      memories: [],
      artStyle: 'watercolor',
      puzzles: [],
      confessionVideo: null,
      confessionVideoUrl: '',
      confessionVideoName: '',
      globalSceneMusicTitle: '',
      globalSceneMusicUrl: '',
      globalSceneMusicName: '',
      bgm: 'romantic-piano',
      loveLetter: '',
    };
  }

  saveData() {
    try {
      const serializableData = { ...this.data };
      // Don't save file blobs
      delete serializableData.confessionVideo;
      serializableData.memories = serializableData.memories.map(m => ({
        ...m,
        photoFile: undefined,
        photoUrl: m.photoUrl || '',
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableData));
    } catch (e) { /* ignore */ }
  }

  init() {
    this.steps = [
      new Step1Welcome(this),
      new Step2CoreData(this),
      new Step3Memories(this),
      new Step4ArtStyle(this),
      new Step5Puzzles(this),
      new Step6Finale(this),
      new Step7Generate(this),
    ];
    this.render();
  }

  render() {
    this.app.innerHTML = '';

    // Header with progress (only after welcome)
    if (this.currentStep > 0) {
      this.headerEl = this.createHeader();
      this.app.appendChild(this.headerEl);
    }

    // Body
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'wizard-container';
    this.app.appendChild(this.bodyEl);

    // Render current step
    this.steps[this.currentStep].render(this.bodyEl);
  }

  createHeader() {
    const header = document.createElement('header');
    header.className = 'wizard-header';
    header.innerHTML = `
      <a href="/" class="wizard-logo">
        <span class="wizard-logo-icon">💌</span>
        <span>MemoryMaze</span>
      </a>
      <div class="progress-container" id="progress-bar"></div>
    `;

    const progressBar = header.querySelector('#progress-bar');
    const stepLabels = ['📝', '📸', '🎨', '🧩', '💌', '✨'];
    
    for (let i = 1; i <= 6; i++) {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      if (i < this.currentStep) dot.classList.add('completed');
      if (i === this.currentStep) dot.classList.add('active');
      dot.textContent = i < this.currentStep ? '✓' : stepLabels[i - 1];
      progressBar.appendChild(dot);

      if (i < 6) {
        const line = document.createElement('div');
        line.className = 'progress-line';
        if (i < this.currentStep) line.classList.add('completed');
        progressBar.appendChild(line);
      }
    }

    return header;
  }

  goToStep(step) {
    this.saveData();
    this.currentStep = step;
    
    // Transition animation
    if (this.bodyEl) {
      this.bodyEl.style.opacity = '0';
      this.bodyEl.style.transform = 'translateY(20px)';
      this.bodyEl.style.transition = 'all 0.3s ease';
    }

    setTimeout(() => {
      this.render();
    }, 300);
  }

  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.goToStep(this.currentStep - 1);
    }
  }

  updateData(key, value) {
    this.data[key] = value;
    this.saveData();
  }

  resetData() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadSavedData();
  }
}
