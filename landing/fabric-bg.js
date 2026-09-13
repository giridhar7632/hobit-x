/**
 * Interactive Fabric Background Simulation
 * 
 * Draws a clean grid of '+' crosses with clear icon size and a comfortable,
 * responsive impact zone that moves like fine fabric with critically damped return.
 */

(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-fabric-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // Grid settings - increased cross size and balanced spacing
  const SPACING = 32; // Balanced grid rhythm
  const CROSS_SIZE = 10; // Clearly legible 10px cross size
  const ARM_HALF = CROSS_SIZE / 2;
  const INFLUENCE_RADIUS = 115; // Increased impact zone (comfortable sweep)

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  let mouse = { x: -9999, y: -9999, active: false };
  let points = [];
  let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class Point {
    constructor(x, y) {
      this.ox = x;
      this.oy = y;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
    }

    update() {
      // Critically damped spring return: responsive recovery with zero wobble
      const dx = this.ox - this.x;
      const dy = this.oy - this.y;

      this.vx = (this.vx + dx * 0.14) * 0.74;
      this.vy = (this.vy + dy * 0.14) * 0.74;

      this.x += this.vx;
      this.y += this.vy;

      // Sub-pixel rest stabilization
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(this.vx) < 0.03 && Math.abs(this.vy) < 0.03) {
        this.x = this.ox;
        this.y = this.oy;
        this.vx = 0;
        this.vy = 0;
      }
    }
  }

  function initGrid() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    const cols = Math.ceil(width / SPACING) + 2;
    const rows = Math.ceil(height / SPACING) + 2;

    const offsetX = (width - (cols - 1) * SPACING) / 2;
    const offsetY = (height - (rows - 1) * SPACING) / 2;

    points = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * SPACING;
        const y = offsetY + r * SPACING;
        points.push(new Point(x, y));
      }
    }
  }

  function applyMousePhysics() {
    if (!mouse.active) return;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < INFLUENCE_RADIUS * INFLUENCE_RADIUS && distSq > 0.5) {
        const dist = Math.sqrt(distSq);
        // Smooth cosine falloff curve
        const factor = (1 + Math.cos((dist / INFLUENCE_RADIUS) * Math.PI)) * 0.5;
        const angle = Math.atan2(dy, dx);

        // Responsive, noticeable displacement without excess
        p.vx += Math.cos(angle) * factor * 2.5;
        p.vy += Math.sin(angle) * factor * 2.5;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const baseColor = isDark ? 'rgba(236, 238, 240, 0.06)' : 'rgba(18, 20, 32, 0.05)';
    const activeColor = isDark ? 'rgba(129, 140, 248, 0.45)' : 'rgba(70, 85, 224, 0.4)';

    ctx.lineWidth = 1.35;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (!isReducedMotion) {
        p.update();
      }

      const dispSq = (p.x - p.ox) * (p.x - p.ox) + (p.y - p.oy) * (p.y - p.oy);

      if (dispSq > 0.8) {
        ctx.strokeStyle = activeColor;
      } else {
        ctx.strokeStyle = baseColor;
      }

      ctx.beginPath();
      ctx.moveTo(p.x - ARM_HALF, p.y);
      ctx.lineTo(p.x + ARM_HALF, p.y);
      ctx.moveTo(p.x, p.y - ARM_HALF);
      ctx.lineTo(p.x, p.y + ARM_HALF);
      ctx.stroke();
    }

    if (!isReducedMotion) {
      applyMousePhysics();
    }

    requestAnimationFrame(render);
  }

  let mouseTimer = null;
  function onPointerMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    mouse.x = clientX;
    mouse.y = clientY;
    mouse.active = true;

    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => {
      mouse.active = false;
    }, 120);
  }

  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });

  window.addEventListener('resize', () => {
    initGrid();
  });

  initGrid();
  render();
})();
