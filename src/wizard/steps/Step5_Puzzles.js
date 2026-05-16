/**
 * Step 5 — Puzzle Configuration
 * Set puzzle type and answers for each memory scene.
 */
export class Step5Puzzles {
  constructor(wizard) {
    this.wizard = wizard;
  }

  render(container) {
    const memories = this.wizard.data.memories || [];
    
    // Initialize puzzles array if empty
    if (!this.wizard.data.puzzles || this.wizard.data.puzzles.length !== memories.length) {
      this.wizard.data.puzzles = memories.map((m, i) => ({
        memoryIndex: i,
        type: i === 0 ? 'trivia' : (i === 1 ? 'password' : 'hidden'),
        question: '',
        answer: '',
        hint: '',
      }));
    }

    container.innerHTML = `
      <div class="step-container">
        <div class="step-content">
          <div class="step-emoji">🧩</div>
          <h2 class="step-title">解谜关卡设计</h2>
          <p class="step-subtitle">为每个记忆场景设置解谜机关，利用你们的共同记忆作为通关钥匙</p>

          <div class="puzzle-list" id="puzzle-list"></div>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">← 上一步</button>
            <button class="btn btn-primary" id="btn-next">下一步 →</button>
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
            <div style="font-weight: 600; color: var(--text-primary);">${memory.title || `场景 ${index + 1}`}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">设置通关机关</div>
          </div>
        </div>

        <label class="form-label">选择机关类型</label>
        <div class="puzzle-type-selector">
          <button class="puzzle-type-btn ${puzzle.type === 'trivia' ? 'active' : ''}" data-idx="${index}" data-type="trivia">
            <span class="puzzle-type-icon">❓</span>
            记忆问答
          </button>
          <button class="puzzle-type-btn ${puzzle.type === 'password' ? 'active' : ''}" data-idx="${index}" data-type="password">
            <span class="puzzle-type-icon">🔐</span>
            密码锁
          </button>
          <button class="puzzle-type-btn ${puzzle.type === 'hidden' ? 'active' : ''}" data-idx="${index}" data-type="hidden">
            <span class="puzzle-type-icon">🔍</span>
            隐藏物品
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
    const birthdayHint = d.herBirthday ? new Date(d.herBirthday).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) : '她的生日';
    const anniversaryHint = d.anniversary ? new Date(d.anniversary).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) : '纪念日';

    switch (puzzle.type) {
      case 'trivia':
        return `
          <div class="form-group mt-md">
            <label class="form-label">❓ 问题</label>
            <input class="form-input" placeholder="例如：你还记得借给我的第一本书吗？" 
                   value="${puzzle.question || ''}" data-cidx="${index}" data-cfield="question" />
          </div>
          <div class="form-group">
            <label class="form-label">✅ 答案</label>
            <input class="form-input" placeholder="例如：小王子" 
                   value="${puzzle.answer || ''}" data-cidx="${index}" data-cfield="answer" />
          </div>
          <div class="form-group">
            <label class="form-label">💡 提示（可选）</label>
            <input class="form-input" placeholder="例如：法国作家写的童话..." 
                   value="${puzzle.hint || ''}" data-cidx="${index}" data-cfield="hint" />
          </div>
        `;
      case 'password':
        return `
          <div class="form-group mt-md">
            <label class="form-label">🔢 密码（4-6位数字）</label>
            <input class="form-input" type="text" placeholder="例如：0520（${anniversaryHint}）" maxlength="6"
                   value="${puzzle.answer || ''}" data-cidx="${index}" data-cfield="answer" />
            <div style="margin-top: var(--space-sm); font-size: 0.8rem; color: var(--text-muted);">
              💡 建议使用有意义的日期：${birthdayHint}、${anniversaryHint}等
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">📜 密码提示文字</label>
            <input class="form-input" placeholder="例如：我们在一起的那个特别日子..." 
                   value="${puzzle.hint || ''}" data-cidx="${index}" data-cfield="hint" />
          </div>
        `;
      case 'hidden':
        return `
          <div class="form-group mt-md">
            <label class="form-label">🔍 隐藏物品名称</label>
            <input class="form-input" placeholder="例如：发光的日记本、闪烁的星星..." 
                   value="${puzzle.question || ''}" data-cidx="${index}" data-cfield="question" />
          </div>
          <div class="form-group">
            <label class="form-label">📝 找到后显示的文字</label>
            <textarea class="form-input form-textarea" placeholder="例如：打开日记本，里面写着你们第一次约会的故事..."
                      data-cidx="${index}" data-cfield="answer" style="height: 80px;">${puzzle.answer || ''}</textarea>
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
