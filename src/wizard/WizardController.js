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
import { t, getLocale, setLocale } from '../i18n/i18n.js';

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
    return this.createDefaultData();
  }

  createDefaultData() {
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
      delete serializableData.existingConfig;
      serializableData.memories = serializableData.memories.map(m => ({
        ...m,
        photoFile: undefined,
        photoUrl: m.photoUrl || '',
        existingLevel: undefined,
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

  async loadEditMode(mazeId) {
    const cleanMazeId = String(mazeId || '').trim();
    if (!cleanMazeId) {
      throw new Error('Missing maze id.');
    }

    const response = await fetch(`/api/maze-config?id=${encodeURIComponent(cleanMazeId)}`);
    if (!response.ok) {
      throw new Error(`Cloud config load failed (${response.status}).`);
    }

    const config = await response.json();
    this.data = this.mapConfigToWizardData(config, cleanMazeId);
    this.currentStep = 1;
    this.saveData();
  }

  mapConfigToWizardData(config, mazeId) {
    const defaults = this.createDefaultData();
    const levels = Array.isArray(config?.levels) ? config.levels : [];
    const firstMusic = levels.find(level => level?.music?.url || level?.music?.title || level?.music?.fileName)?.music || {};
    const finale = config?.finale || {};
    const characters = config?.characters || {};
    const receiver = characters.receiver || {};
    const creator = characters.creator || {};

    const memories = levels.map((level, index) => ({
      id: level.id || index + 1,
      title: level.title || '',
      description: level.description || level.memory_shard_text || '',
      date: level.date || '',
      photos: this.getLevelPhotos(level),
      location: level.location || '',
      people: level.people || '',
      dialogue: level.dialogue || '',
      soundtrack: level.soundtrack || level.music?.title || '',
      existingLevel: level,
    }));

    const puzzles = levels.map((level, index) => {
      const puzzleInteractive = (level.interactives || []).find(item => item?.puzzle) || {};
      const puzzle = puzzleInteractive.puzzle || {};
      return {
        memoryIndex: index,
        type: puzzle.type || puzzleInteractive.type || 'trivia',
        question: puzzle.question || '',
        answer: puzzle.answer || '',
        hint: puzzle.hint || '',
      };
    });

    return {
      ...defaults,
      myName: creator.name || '',
      herName: receiver.name || '',
      artStyle: config?.meta?.artStyle || defaults.artStyle,
      memories,
      puzzles,
      confessionVideoUrl: finale.videoUrl || '',
      confessionVideoName: finale.videoName || '',
      globalSceneMusicTitle: firstMusic.title || '',
      globalSceneMusicUrl: firstMusic.url || '',
      globalSceneMusicName: firstMusic.fileName || '',
      bgm: finale.bgm || defaults.bgm,
      loveLetter: finale.loveLetter || '',
      editMode: true,
      editMazeId: mazeId || config?.meta?.mazeId || '',
      existingConfig: config,
    };
  }

  getLevelPhotos(level) {
    const photos = Array.isArray(level?.photos) ? level.photos.filter(Boolean) : [];
    if (photos.length > 0) return photos;
    return level?.background ? [level.background] : [];
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
      <div class="lang-switcher" id="header-lang-switcher" title="${t('langSwitch.tooltip')}" style="position: absolute; right: var(--space-xl); top: 50%; transform: translateY(-50%); font-size: 0.9rem; padding: 6px 12px; cursor: pointer; color: var(--text-secondary); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; transition: all 0.3s ease;">
        🌐 ${t('langSwitch.label')}
      </div>
    `;

    const langBtn = header.querySelector('#header-lang-switcher');
    langBtn.addEventListener('click', () => {
      const newLang = getLocale() === 'zh' ? 'en' : 'zh';
      setLocale(newLang);
      this.render(); // re-render current step
    });

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
