/**
 * Step 1 — Welcome Landing
 * Cinematic hero section with animated logo, feature highlights, and CTA.
 */
export class Step1Welcome {
  constructor(wizard) {
    this.wizard = wizard;
  }

  render(container) {
    container.innerHTML = `
      <div class="welcome-hero">
        <div class="welcome-logo-large">💌</div>
        <h1 class="welcome-title animate-fadeInUp">
          <span class="text-gradient">MemoryMaze</span>
        </h1>
        <p class="welcome-tagline">将你们的记忆，编织成一场她专属的解谜冒险</p>
        
        <div class="welcome-features">
          <div class="welcome-feature">
            <span class="welcome-feature-icon">📸</span>
            <span class="welcome-feature-text">上传真实照片与回忆</span>
          </div>
          <div class="welcome-feature">
            <span class="welcome-feature-icon">🎨</span>
            <span class="welcome-feature-text">AI 艺术风格转化</span>
          </div>
          <div class="welcome-feature">
            <span class="welcome-feature-icon">🧩</span>
            <span class="welcome-feature-text">自定义解谜关卡</span>
          </div>
        </div>

        <div class="welcome-cta">
          <button class="btn btn-primary btn-lg animate-heartbeat" id="btn-start">
            ✨ 开始创作
          </button>
          <p class="text-sm mt-md" style="color: var(--text-muted);">
            只需几分钟，为她创造一份独一无二的数字礼物
          </p>
        </div>
      </div>
    `;

    container.querySelector('#btn-start').addEventListener('click', () => {
      this.wizard.nextStep();
    });
  }
}
