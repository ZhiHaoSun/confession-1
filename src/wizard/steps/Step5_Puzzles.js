/**
 * Step 5 — Puzzle Configuration
 * Set puzzle type and answers for each memory scene.
 */
import { t } from '../../i18n/i18n.js';

export class Step5Puzzles {
  constructor(wizard) {
    this.wizard = wizard;
  }

  render(container) {
    const memories = this.wizard.data.memories || [];
    
    // Initialize puzzles array if empty
    if (!this.wizard.data.puzzles || this.wizard.data.puzzles.length !== memories.length) {
      const existingPuzzles = this.wizard.data.puzzles || [];
      this.wizard.data.puzzles = memories.map((m, i) => ({
        memoryIndex: i,
        type: existingPuzzles[i]?.type || (i === 0 ? 'trivia' : (i === 1 ? 'password' : 'hidden')),
        question: existingPuzzles[i]?.question || '',
        answer: existingPuzzles[i]?.answer || '',
        hint: existingPuzzles[i]?.hint || '',
      }));
    }

    container.innerHTML = `
      <div class="step-container">
        <div class="step-content">
          <div class="step-emoji">🧩</div>
          <h2 class="step-title">${t('puzzles.title')}</h2>
          <p class="step-subtitle">${t('puzzles.subtitle')}</p>

          <div class="puzzle-list" id="puzzle-list"></div>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">${t('nav.prev')}</button>
            <button class="btn btn-primary" id="btn-next">${t('nav.next')}</button>
          </div>
        </div>
      </div>
    `;

    this.renderPuzzles();

    container.querySelector('#btn-prev').addEventListener('click', () => this.wizard.prevStep());
    container.querySelector('#btn-next').addEventListener('click', () => this.wizard.nextStep());
  }

  renderPuzzles() {
    const list = document.getElementById('puzzle-list');
    if (!list) return;
    
    const memories = this.wizard.data.memories || [];
    const puzzles = this.wizard.data.puzzles || [];

    list.innerHTML = '';

    puzzles.forEach((puzzle, index) => {
      const memory = memories[index];
      if (!memory) return;

      const item = document.createElement('div');
      item.className = 'puzzle-item animate-fadeInUp';
      item.style.animationDelay = `${index * 100}ms`;
      
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg);">
          <div class="memory-card-number">${index + 1}</div>
          <div>
            <div style="font-weight: 600; color: var(--text-primary);">${memory.title || `${t('puzzles.sceneDefault')} ${index + 1}`}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${t('puzzles.setupHint')}</div>
          </div>
        </div>

        <label class="form-label">${t('puzzles.selectType')}</label>
        <div class="puzzle-type-selector">
          <button class="puzzle-type-btn ${puzzle.type === 'trivia' ? 'active' : ''}" data-idx="${index}" data-type="trivia">
            <span class="puzzle-type-icon">❓</span>
            ${t('puzzles.trivia')}
          </button>
          <button class="puzzle-type-btn ${puzzle.type === 'password' ? 'active' : ''}" data-idx="${index}" data-type="password">
            <span class="puzzle-type-icon">🔐</span>
            ${t('puzzles.password')}
          </button>
          <button class="puzzle-type-btn ${puzzle.type === 'hidden' ? 'active' : ''}" data-idx="${index}" data-type="hidden">
            <span class="puzzle-type-icon">🔍</span>
            ${t('puzzles.hidden')}
          </button>
          <button class="puzzle-type-btn ${puzzle.type === 'jigsaw' ? 'active' : ''}" data-idx="${index}" data-type="jigsaw">
            <span class="puzzle-type-icon">🧩</span>
            ${t('puzzles.jigsaw')}
          </button>
        </div>

        <div class="puzzle-config" id="puzzle-config-${index}">
          ${this.renderPuzzleConfig(puzzle, index)}
        </div>
      `;

      list.appendChild(item);
    });

    // Bind puzzle type selection
    list.querySelectorAll('.puzzle-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const type = btn.dataset.type;
        this.wizard.data.puzzles[idx].type = type;
        this.wizard.saveData();
        
        // Update active state
        btn.closest('.puzzle-type-selector').querySelectorAll('.puzzle-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Re-render config
        const configEl = document.getElementById(`puzzle-config-${idx}`);
        if (configEl) {
          configEl.innerHTML = this.renderPuzzleConfig(this.wizard.data.puzzles[idx], idx);
          this.bindConfigInputs(idx);
        }
      });
    });

    // Bind all config inputs
    puzzles.forEach((_, idx) => this.bindConfigInputs(idx));
  }

  renderPuzzleConfig(puzzle, index) {
    const d = this.wizard.data;
    const birthdayHint = d.herBirthday ? new Date(d.herBirthday).toLocaleDateString(t('langSwitch.label') === 'EN' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric' }) : t('puzzles.herBirthday');
    const anniversaryHint = d.anniversary ? new Date(d.anniversary).toLocaleDateString(t('langSwitch.label') === 'EN' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric' }) : t('puzzles.anniversary');

    switch (puzzle.type) {
      case 'trivia':
        return `
          <div class="form-group mt-md">
            <label class="form-label">${t('puzzles.triviaQuestion')}</label>
            <input class="form-input" placeholder="${t('puzzles.triviaQuestionPlaceholder')}" 
                   value="${puzzle.question || ''}" data-cidx="${index}" data-cfield="question" />
          </div>
          <div class="form-group">
            <label class="form-label">${t('puzzles.triviaAnswer')}</label>
            <input class="form-input" placeholder="${t('puzzles.triviaAnswerPlaceholder')}" 
                   value="${puzzle.answer || ''}" data-cidx="${index}" data-cfield="answer" />
          </div>
          <div class="form-group">
            <label class="form-label">${t('puzzles.triviaHint')}</label>
            <input class="form-input" placeholder="${t('puzzles.triviaHintPlaceholder')}" 
                   value="${puzzle.hint || ''}" data-cidx="${index}" data-cfield="hint" />
          </div>
        `;
      case 'password':
        return `
          <div class="form-group mt-md">
            <label class="form-label">${t('puzzles.passwordLabel')}</label>
            <input class="form-input" type="text" placeholder="${t('puzzles.passwordPlaceholder')}（${anniversaryHint}）" maxlength="6"
                   value="${puzzle.answer || ''}" data-cidx="${index}" data-cfield="answer" />
            <div style="margin-top: var(--space-sm); font-size: 0.8rem; color: var(--text-muted);">
              ${t('puzzles.passwordSuggestion')}${birthdayHint}、${anniversaryHint}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t('puzzles.passwordHintLabel')}</label>
            <input class="form-input" placeholder="${t('puzzles.passwordHintPlaceholder')}" 
                   value="${puzzle.hint || ''}" data-cidx="${index}" data-cfield="hint" />
          </div>
        `;
      case 'hidden':
        return `
          <div class="form-group mt-md">
            <label class="form-label">${t('puzzles.hiddenItemLabel')}</label>
            <input class="form-input" placeholder="${t('puzzles.hiddenItemPlaceholder')}" 
                   value="${puzzle.question || ''}" data-cidx="${index}" data-cfield="question" />
          </div>
          <div class="form-group">
            <label class="form-label">${t('puzzles.hiddenFoundLabel')}</label>
            <textarea class="form-input form-textarea" placeholder="${t('puzzles.hiddenFoundPlaceholder')}"
                      data-cidx="${index}" data-cfield="answer" style="height: 80px;">${puzzle.answer || ''}</textarea>
          </div>
        `;
      case 'jigsaw':
        return `
          <div class="form-group mt-md">
            <label class="form-label">${t('puzzles.jigsawPromptLabel')}</label>
            <input class="form-input" placeholder="${t('puzzles.jigsawPromptPlaceholder')}"
                   value="${puzzle.question || ''}" data-cidx="${index}" data-cfield="question" />
            <div style="margin-top: var(--space-sm); font-size: 0.8rem; color: var(--text-muted);">
              ${t('puzzles.jigsawDesc')}
            </div>
          </div>
        `;
      default:
        return '';
    }
  }

  bindConfigInputs(idx) {
    const configEl = document.getElementById(`puzzle-config-${idx}`);
    if (!configEl) return;
    
    configEl.querySelectorAll('[data-cfield]').forEach(el => {
      el.addEventListener('input', (e) => {
        const field = e.target.dataset.cfield;
        this.wizard.data.puzzles[idx][field] = e.target.value;
        this.wizard.saveData();
      });
    });
  }
}
