/**
 * ParticleBackground — Ambient floating particles canvas overlay.
 * Creates a dreamy atmosphere with slowly drifting luminous dots.
 */
export class ParticleBackground {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animFrame = null;
    this.width = 0;
    this.height = 0;
  }

  start() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'particles-canvas';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.initParticles();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initParticles() {
    const count = Math.floor((this.width * this.height) / 15000);
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2 - 0.1,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.5 ? 25 : 280, // rose or violet
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const time = Date.now() * 0.001;

    for (const p of this.particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      const pulse = Math.sin(time * p.pulseSpeed * 10 + p.pulsePhase) * 0.3 + 0.7;
      const alpha = p.opacity * pulse;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${alpha})`;
      this.ctx.fill();

      // Glow
      if (p.size > 1.5) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${alpha * 0.1})`;
        this.ctx.fill();
      }
    }

    this.animFrame = requestAnimationFrame(() => this.animate());
  }

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.canvas) this.canvas.remove();
  }
}
