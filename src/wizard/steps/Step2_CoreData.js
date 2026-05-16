/**
 * Step 2 — Core Data
 * Input her name, birthday, anniversary, and puzzle answer keys.
 */
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
          <h2 class="step-title">基础信息</h2>
          <p class="step-subtitle">这些信息将成为游戏中的解谜线索与密码</p>

          <div class="glass-card">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">你的名字</label>
                <input class="form-input" id="myName" type="text" placeholder="例如：Bob" value="${d.myName || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">她的名字 ❤️</label>
                <input class="form-input" id="herName" type="text" placeholder="例如：Alice" value="${d.herName || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">她的生日 🎂</label>
                <input class="form-input" id="herBirthday" type="date" value="${d.herBirthday || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">你们的纪念日 💕</label>
                <input class="form-input" id="anniversary" type="date" value="${d.anniversary || ''}" />
              </div>
              <div class="form-group form-group-full">
                <label class="form-label">你对她的专属昵称 💫</label>
                <input class="form-input" id="nickname" type="text" placeholder="例如：小兔子、宝贝..." value="${d.nickname || ''}" />
              </div>
          </div>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">← 上一步</button>
            <button class="btn btn-primary" id="btn-next">下一步 →</button>
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
        this.showValidation('请至少填写你和她的名字');
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
