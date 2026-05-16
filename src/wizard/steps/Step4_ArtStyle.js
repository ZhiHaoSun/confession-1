/**
 * Step 4 — Art Style Selection
 * Choose from 3 preset art styles with live preview.
 */
export class Step4ArtStyle {
  constructor(wizard) {
    this.wizard = wizard;
  }

  render(container) {
    const selected = this.wizard.data.artStyle || 'watercolor';

    container.innerHTML = `
      <div class="step-container">
        <div class="step-content">
          <div class="step-emoji">🎨</div>
          <h2 class="step-title">艺术风格</h2>
          <p class="step-subtitle">选择一种视觉风格，让你们的记忆更加梦幻</p>

          <div class="style-grid">
            <div class="style-card ${selected === 'watercolor' ? 'selected' : ''}" data-style="watercolor">
              <div class="style-preview">
                <canvas id="preview-watercolor" width="400" height="300"></canvas>
              </div>
              <div class="style-info">
                <div class="style-name">🌸 温馨水彩绘本风</div>
                <div class="style-desc">柔和低饱和度，像翻开一本温暖的绘本，适合日常温馨回忆</div>
              </div>
            </div>

            <div class="style-card ${selected === 'anime' ? 'selected' : ''}" data-style="anime">
              <div class="style-preview">
                <canvas id="preview-anime" width="400" height="300"></canvas>
              </div>
              <div class="style-info">
                <div class="style-name">✨ 唯美日系新海诚风</div>
                <div class="style-desc">强光影、高饱和度，营造电影般的浪漫感与命运感</div>
              </div>
            </div>

            <div class="style-card ${selected === 'isometric' ? 'selected' : ''}" data-style="isometric">
              <div class="style-preview">
                <canvas id="preview-isometric" width="400" height="300"></canvas>
              </div>
              <div class="style-info">
                <div class="style-name">🎁 复古微缩模型风</div>
                <div class="style-desc">等距视角如精美八音盒，适合室内场景与特殊礼物</div>
              </div>
            </div>
          </div>

          <div class="step-nav">
            <button class="btn btn-ghost" id="btn-prev">← 上一步</button>
            <button class="btn btn-primary" id="btn-next">下一步 →</button>
          </div>
        </div>
      </div>
    `;

    // Draw previews
    this.drawWatercolor('preview-watercolor');
    this.drawAnime('preview-anime');
    this.drawIsometric('preview-isometric');

    // Bind style selection
    container.querySelectorAll('[data-style]').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.wizard.updateData('artStyle', card.dataset.style);
      });
    });

    container.querySelector('#btn-prev').addEventListener('click', () => this.wizard.prevStep());
    container.querySelector('#btn-next').addEventListener('click', () => this.wizard.nextStep());
  }

  drawWatercolor(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    // Soft gradient background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#fce4ec');
    grad.addColorStop(0.5, '#f3e5f5');
    grad.addColorStop(1, '#e8eaf6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Watercolor blobs
    const colors = ['rgba(244,143,177,0.3)', 'rgba(186,104,200,0.2)', 'rgba(129,212,250,0.25)', 'rgba(255,183,77,0.2)'];
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const r = Math.random() * 80 + 40;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grd.addColorStop(0, colors[i % colors.length]);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Simple house
    ctx.fillStyle = 'rgba(180,130,100,0.5)';
    ctx.fillRect(w * 0.35, h * 0.4, w * 0.3, h * 0.35);
    
    // Roof
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.4);
    ctx.lineTo(w * 0.5, h * 0.2);
    ctx.lineTo(w * 0.7, h * 0.4);
    ctx.fillStyle = 'rgba(200,100,100,0.4)';
    ctx.fill();

    // Window
    ctx.fillStyle = 'rgba(255,255,200,0.6)';
    ctx.fillRect(w * 0.43, h * 0.48, w * 0.14, h * 0.12);

    // Trees
    for (let x of [w * 0.15, w * 0.8]) {
      ctx.beginPath();
      ctx.arc(x, h * 0.5, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(129,199,132,0.4)';
      ctx.fill();
      ctx.fillStyle = 'rgba(121,85,72,0.3)';
      ctx.fillRect(x - 4, h * 0.55, 8, h * 0.2);
    }

    // Paper texture overlay
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  drawAnime(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    // Dramatic sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#1a237e');
    skyGrad.addColorStop(0.3, '#e91e63');
    skyGrad.addColorStop(0.5, '#ff6f00');
    skyGrad.addColorStop(0.7, '#ff8f00');
    skyGrad.addColorStop(1, '#283593');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h * 0.4, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
      ctx.fill();
    }

    // Clouds
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 5; i++) {
      const cx = Math.random() * w;
      const cy = h * 0.15 + Math.random() * h * 0.2;
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.arc(cx + j * 20 - 30, cy, 20 + Math.random() * 15, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Ground/city silhouette
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    
    // Buildings
    for (let i = 0; i < 12; i++) {
      const bx = i * (w / 12);
      const bh = Math.random() * h * 0.25 + h * 0.05;
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(bx, h * 0.7 - bh, w / 14, bh);
      
      // Windows
      ctx.fillStyle = 'rgba(255,200,50,0.7)';
      for (let wy = h * 0.7 - bh + 5; wy < h * 0.7 - 5; wy += 10) {
        for (let wx = bx + 3; wx < bx + w / 14 - 3; wx += 8) {
          if (Math.random() > 0.3) {
            ctx.fillRect(wx, wy, 4, 5);
          }
        }
      }
    }

    // Lens flare
    const flareGrad = ctx.createRadialGradient(w * 0.7, h * 0.25, 0, w * 0.7, h * 0.25, 120);
    flareGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
    flareGrad.addColorStop(0.3, 'rgba(255,200,100,0.2)');
    flareGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, w, h);
  }

  drawIsometric(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    // Background
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#2d3436');
    bg.addColorStop(1, '#636e72');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Isometric grid helper
    const drawIsoCube = (cx, cy, size, topColor, leftColor, rightColor) => {
      // Top face
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.5);
      ctx.lineTo(cx + size, cy);
      ctx.lineTo(cx, cy + size * 0.5);
      ctx.lineTo(cx - size, cy);
      ctx.closePath();
      ctx.fillStyle = topColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Left face
      ctx.beginPath();
      ctx.moveTo(cx - size, cy);
      ctx.lineTo(cx, cy + size * 0.5);
      ctx.lineTo(cx, cy + size);
      ctx.lineTo(cx - size, cy + size * 0.5);
      ctx.closePath();
      ctx.fillStyle = leftColor;
      ctx.fill();
      ctx.stroke();

      // Right face
      ctx.beginPath();
      ctx.moveTo(cx + size, cy);
      ctx.lineTo(cx, cy + size * 0.5);
      ctx.lineTo(cx, cy + size);
      ctx.lineTo(cx + size, cy + size * 0.5);
      ctx.closePath();
      ctx.fillStyle = rightColor;
      ctx.fill();
      ctx.stroke();
    };

    // Draw a small isometric room scene
    const cubeSize = 28;
    const startX = w * 0.5;
    const startY = h * 0.25;

    // Floor tiles
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = startX + (col - row) * cubeSize;
        const y = startY + (col + row) * cubeSize * 0.5;
        drawIsoCube(x, y, cubeSize,
          row % 2 === col % 2 ? '#dfe6e9' : '#b2bec3',
          '#636e72', '#74b9ff'
        );
      }
    }

    // Furniture cubes
    drawIsoCube(startX - cubeSize * 1.5, startY + cubeSize * 1.5, cubeSize * 0.8, '#fab1a0', '#e17055', '#d63031');
    drawIsoCube(startX + cubeSize * 0.5, startY + cubeSize * 0.8, cubeSize * 0.6, '#fdcb6e', '#f39c12', '#e67e22');
    drawIsoCube(startX + cubeSize * 2, startY + cubeSize * 2, cubeSize * 0.7, '#a29bfe', '#6c5ce7', '#5f27cd');

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Isometric View', w * 0.5, h * 0.92);
  }
}
