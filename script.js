/* ==================== MASTER RENDER LOOP DISPATCHER ==================== */
const __masterLoop = (() => {
  let rafId = 0;
  const tasks = new Map();

  function hasActiveTasks() {
    if (document.hidden) return false;
    for (const task of tasks.values()) {
      if (task.active()) return true;
    }
    return false;
  }

  function step(now) {
    rafId = 0;
    if (document.hidden) return;
    let anyActive = false;
    for (const task of tasks.values()) {
      if (task.active()) {
        anyActive = true;
        task.tick(now);
      }
    }
    if (anyActive) {
      rafId = requestAnimationFrame(step);
    }
  }

  function schedule() {
    if (rafId || !hasActiveTasks()) return;
    rafId = requestAnimationFrame(step);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    } else {
      schedule();
    }
  });

  return {
    register(name, activeFn, tickFn) {
      tasks.set(name, { active: activeFn, tick: tickFn });
      schedule();
    },
    schedule,
    getRafId: () => rafId
  };
})();
window.__masterLoop = __masterLoop;

/* ==================== space-rings.js ==================== */
/* ================================================================
       1.5. GLASSY CELESTIAL SPACE ORBIT RINGS
       (ORIGINATED FROM TOP-RIGHT CORNER WITH SCROLL-EXPANSION DYNAMICS)
       ================================================================ */
    function initSpaceOrbitRings() {
      const canvas = document.getElementById('space-orbit-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let dpr = 1.0; // Optimized: 1.0 DPR saves 55% GPU fill rate churn with zero visible difference
      let width = window.innerWidth;
      let height = window.innerHeight;
      let docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, height * 2);

      // Offscreen Static Orbit Track Layer Cache (Updated strictly on window resize)
      const orbitTrackCacheCanvas = document.createElement('canvas');
      const trackCtx = orbitTrackCacheCanvas.getContext('2d');
      let cachedOriginX = 0;
      let cachedOriginY = 0;
      let cachedRot = 0;
      let isTrackCacheDirty = true;

      function resize() {
        dpr = 1.0;
        width = window.innerWidth;
        height = window.innerHeight;
        docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, height * 2);
        const rw = Math.round(width * dpr);
        const rh = Math.round(height * dpr);
        canvas.width = rw;
        canvas.height = rh;
        orbitTrackCacheCanvas.width = rw;
        orbitTrackCacheCanvas.height = rh;
        isTrackCacheDirty = true;
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('load', () => {
        docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, height * 2);
      }, { once: true, passive: true });

      // Interactive mouse parallax
      let mouseX = 0, mouseY = 0;
      let curMouseX = 0, curMouseY = 0;
      window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / width - 0.5) * 2;
        mouseY = (e.clientY / height - 0.5) * 2;
      }, { passive: true });

      // Silky-smooth kinetic scroll damping (Zero jitter, luxury 0.055 lerp)
      let currentScrollY = window.scrollY || 0;
      let targetScrollY = currentScrollY;
      let smoothScrollY = currentScrollY;
      let lastSmoothScrollY = currentScrollY;
      let scrollPhase = 0;
      let scrollVelocity = 0;
      let scrollGlow = 0;

      window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY || 0;
      }, { passive: true });

      // 1. UNIFIED CONCENTRIC ORBITAL FAMILY (Pure Parallel Curves • Zero Crossing / Spirals)
      // Generously scaled to sweep across both Left & Right sides of the website
      const ORBITS = [
        { baseR: 160,  ecc: 0.60, hasCompanion: true,  lineWidth: 2.2, dash: null },
        { baseR: 300,  ecc: 0.62, hasCompanion: false, lineWidth: 2.6, dash: [14, 18] },
        { baseR: 480,  ecc: 0.63, hasCompanion: true,  lineWidth: 2.4, dash: null },
        { baseR: 720,  ecc: 0.64, hasCompanion: false, lineWidth: 2.8, dash: null },
        { baseR: 1020, ecc: 0.65, hasCompanion: true,  lineWidth: 2.4, dash: [18, 22] },
        { baseR: 1380, ecc: 0.66, hasCompanion: false, lineWidth: 2.8, dash: null },
        { baseR: 1820, ecc: 0.67, hasCompanion: true,  lineWidth: 2.6, dash: null }
      ];

      // =============================================================
      // PRE-BAKED OPTICAL SPRITE LUTs (Zero Per-Frame Gradient/Arc/Text Churn)
      // =============================================================
      const SPRITE_SCALE = 2;

      // A. Pre-baked Stellar Anchor Core Sprite (64x64 CSS -> 128x128 2x HiDPI)
      const anchorSprite = document.createElement('canvas');
      anchorSprite.width = 64 * SPRITE_SCALE;
      anchorSprite.height = 64 * SPRITE_SCALE;
      const aCtx = anchorSprite.getContext('2d');
      if (aCtx) {
        aCtx.scale(SPRITE_SCALE, SPRITE_SCALE);
        const acx = 32, acy = 32;
        const anchorGlow = aCtx.createRadialGradient(acx, acy, 0, acx, acy, 28);
        anchorGlow.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
        anchorGlow.addColorStop(0.3, 'rgba(56, 189, 248, 0.72)');
        anchorGlow.addColorStop(0.7, 'rgba(14, 165, 233, 0.24)');
        anchorGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        aCtx.beginPath();
        aCtx.arc(acx, acy, 28, 0, Math.PI * 2);
        aCtx.fillStyle = anchorGlow;
        aCtx.fill();

        aCtx.beginPath();
        aCtx.arc(acx, acy, 9.0, 0, Math.PI * 2);
        aCtx.fillStyle = 'rgba(56, 189, 248, 0.48)';
        aCtx.fill();

        aCtx.beginPath();
        aCtx.arc(acx, acy, 4.2, 0, Math.PI * 2);
        aCtx.fillStyle = '#ffffff';
        aCtx.fill();
      }

      // B. Pre-baked Bindu + Target Reticle Halo Sprites (2x HiDPI Supersampled for Razor-Sharp Clarity)
      function createBinduSprite(radius, isMoonPlanet) {
        const sCanvas = document.createElement('canvas');
        const cssSize = 32;
        const half = cssSize / 2;
        sCanvas.width = cssSize * SPRITE_SCALE;
        sCanvas.height = cssSize * SPRITE_SCALE;
        const sCtx = sCanvas.getContext('2d');
        if (!sCtx) return { canvas: sCanvas, size: cssSize, half: half };
        sCtx.scale(SPRITE_SCALE, SPRITE_SCALE);

        // 1. Soft outer cyan radial glow aura so bindu stands out clearly on the ring
        const auraGrad = sCtx.createRadialGradient(half, half, 0, half, half, radius + 9);
        auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        auraGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.65)');
        auraGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.18)');
        auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        sCtx.beginPath();
        sCtx.arc(half, half, radius + 9, 0, Math.PI * 2);
        sCtx.fillStyle = auraGrad;
        sCtx.fill();

        // 2. Optional miniature orbit ring for Moon Planets (R=10)
        if (isMoonPlanet) {
          sCtx.beginPath();
          sCtx.arc(half, half, 10.0, 0, Math.PI * 2);
          sCtx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
          sCtx.lineWidth = 0.9;
          sCtx.stroke();
        }

        // 3. Concentric Cyan Target Reticle Halo
        const haloR = radius + 3.6;
        sCtx.beginPath();
        sCtx.arc(half, half, haloR, 0, Math.PI * 2);
        sCtx.strokeStyle = 'rgba(125, 211, 252, 0.95)';
        sCtx.lineWidth = 1.35;
        sCtx.stroke();

        // 4. Solid Luminous White Core Bindu
        sCtx.beginPath();
        sCtx.arc(half, half, radius, 0, Math.PI * 2);
        sCtx.fillStyle = '#ffffff';
        sCtx.fill();

        return { canvas: sCanvas, size: cssSize, half: half };
      }
      const binduSpriteStandard = createBinduSprite(3.2, false);
      const binduSpriteMoon = createBinduSprite(3.6, true);

      // C. Pre-baked Telemetry Callout Badge Sprites (2x HiDPI Supersampled • Crisp 11px JetBrains Mono)
      const labelSpriteCache = new Map();
      function getOrBakeLabelSprite(text) {
        if (labelSpriteCache.has(text)) return labelSpriteCache.get(text);
        const lCanvas = document.createElement('canvas');
        const lCtx = lCanvas.getContext('2d');
        const fontSpec = '700 11px "JetBrains Mono", monospace';
        lCtx.font = fontSpec;
        const textWidth = Math.ceil(lCtx.measureText(text).width);
        const padX = 8;
        const boxW = textWidth + padX * 2 + 4;
        const boxH = 22;
        lCanvas.width = boxW * SPRITE_SCALE;
        lCanvas.height = boxH * SPRITE_SCALE;

        lCtx.scale(SPRITE_SCALE, SPRITE_SCALE);
        lCtx.font = fontSpec;
        lCtx.textBaseline = 'middle';

        // Crisp dark HUD pill background
        lCtx.fillStyle = 'rgba(6, 11, 20, 0.90)';
        lCtx.fillRect(1, 1, boxW - 2, boxH - 2);

        // Luminous cyan border
        lCtx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        lCtx.lineWidth = 1.0;
        lCtx.strokeRect(1.5, 1.5, boxW - 3, boxH - 3);

        // Left cybernetic accent bar
        lCtx.fillStyle = '#38bdf8';
        lCtx.fillRect(1, 1, 2.5, boxH - 2);

        // High-contrast crisp label text
        lCtx.fillStyle = '#f0f9ff';
        lCtx.fillText(text, padX + 2, boxH / 2 + 0.5);

        const spriteObj = { canvas: lCanvas, width: boxW, height: boxH };
        labelSpriteCache.set(text, spriteObj);
        return spriteObj;
      }

      // Central star ('CPU') pre-baked label sprite
      let centralStarLabelSprite = getOrBakeLabelSprite('CPU');

      // 2. 7 DETERMINISTIC ORBITAL BINDUS (1 Per Ring, Innermost -> Outermost, Continuous One-Way Revolution)
      const RING_BINDU_SPEC = [
        { orbitIdx: 0, label: 'GPU',      baseAngle: 2.55, mobAngle: 2.50, speed:  0.42, isMoonPlanet: false, isPulsar: false, color: '#38bdf8' },
        { orbitIdx: 1, label: 'DDR5',     baseAngle: 2.85, mobAngle: 2.75, speed: -0.32, isMoonPlanet: true,  isPulsar: false, color: '#38bdf8' },
        { orbitIdx: 2, label: 'NVMe',     baseAngle: 2.22, mobAngle: 2.28, speed:  0.25, isMoonPlanet: false, isPulsar: true,  color: '#2dd4bf' },
        { orbitIdx: 3, label: 'L1_CACHE', baseAngle: 2.04, mobAngle: 2.08, speed: -0.20, isMoonPlanet: true,  isPulsar: false, color: '#60a5fa' },
        { orbitIdx: 4, label: 'PCIe',     baseAngle: 3.24, mobAngle: 2.22, speed:  0.16, isMoonPlanet: true,  isPulsar: true,  color: '#38bdf8' },
        { orbitIdx: 5, label: 'BIOS',     baseAngle: 3.46, mobAngle: 1.98, speed: -0.13, isMoonPlanet: false, isPulsar: false, color: '#2dd4bf' },
        { orbitIdx: 6, label: 'KERNEL',   baseAngle: 3.53, mobAngle: 1.88, speed:  0.10, isMoonPlanet: false, isPulsar: true,  color: '#38bdf8' }
      ];

      const CELESTIAL_NODES = RING_BINDU_SPEC.map((cfg, idx) => ({
        orbitIdx: cfg.orbitIdx,
        baseAngle: cfg.baseAngle,
        mobAngle: cfg.mobAngle,
        speed: cfg.speed,
        dir: cfg.speed > 0 ? 1 : -1,
        color: cfg.color,
        radius: cfg.isMoonPlanet ? 3.6 : 3.2,
        isMoonPlanet: cfg.isMoonPlanet,
        isPulsar: cfg.isPulsar,
        hasLabel: true,
        labelText: cfg.label,
        labelSprite: getOrBakeLabelSprite(cfg.label),
        binduSprite: cfg.isMoonPlanet ? binduSpriteMoon : binduSpriteStandard,
        wakeLen: 0.28,
        moonAngle: idx * 1.1,
        moonSpeed: 2.6,
        renderX: 0,
        renderY: 0,
        nodeAngle: cfg.baseAngle,
        isInitialized: false
      }));

      // Re-bake label sprites once web fonts finish loading so JetBrains Mono metrics are 100% exact
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          labelSpriteCache.clear();
          centralStarLabelSprite = getOrBakeLabelSprite('CPU');
          for (let i = 0; i < CELESTIAL_NODES.length; i++) {
            const n = CELESTIAL_NODES[i];
            if (n.hasLabel && n.labelText) {
              n.labelSprite = getOrBakeLabelSprite(n.labelText);
            }
          }
        });
      }

      // 3. ZERO-ALLOCATION METEOROID POOL (Shooting stars passing ONLY when scrolling is active!)
      const MAX_METEORS = 5;
      const meteorPool = [];
      for (let i = 0; i < MAX_METEORS; i++) {
        meteorPool.push({
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          normVx: 0,
          normVy: 0,
          len: 0,
          life: 0,
          decay: 0,
          width: 0
        });
      }
      let activeMeteorCount = 0;
      let meteorCooldown = 0;

      function spawnMeteor() {
        for (let i = 0; i < MAX_METEORS; i++) {
          const m = meteorPool[i];
          if (!m.active) {
            const angle = -0.44 + (Math.random() - 0.5) * 0.26;
            const speed = 22 + Math.random() * 16;
            const vx = -Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed * 1.35;
            const invHypot = 1.0 / Math.hypot(vx, vy);

            m.active = true;
            m.x = width * (0.30 + Math.random() * 0.70);
            m.y = height * (Math.random() * 0.40);
            m.vx = vx;
            m.vy = vy;
            m.normVx = vx * invHypot;
            m.normVy = vy * invHypot;
            m.len = 110 + Math.random() * 130;
            m.life = 1.0;
            m.decay = 0.024 + Math.random() * 0.016;
            m.width = 2.2 + Math.random() * 1.0;
            activeMeteorCount++;
            break;
          }
        }
      }

      // Pre-allocated orbit radii cache to avoid redundant math between Track and Node passes
      const curRxArray = new Float64Array(ORBITS.length);
      const curRyArray = new Float64Array(ORBITS.length);
      const ticks = [0.22, 1.42, 2.82, 4.22];

      function updateOrbitTrackCache() {
        if (!trackCtx) return;
        const isMobileScreen = width < 768;
        const originX = isMobileScreen ? width * 0.66 : width * 0.92;
        const originY = isMobileScreen ? height * 0.07 : height * 0.05;
        const rot = isMobileScreen ? -0.34 : -0.42;
        const expansion = isMobileScreen ? 0.76 : 1.0;
        const viewportScale = isMobileScreen ? 0.68 : Math.min(width / 1920, 1.0);

        for (let i = 0; i < ORBITS.length; i++) {
          const orb = ORBITS[i];
          const rx = orb.baseR * expansion * viewportScale;
          curRxArray[i] = rx;
          curRyArray[i] = rx * (isMobileScreen ? Math.min(orb.ecc * 1.35, 0.72) : orb.ecc);
        }

        trackCtx.save();
        trackCtx.scale(dpr, dpr);
        trackCtx.clearRect(0, 0, width, height);

        const cosRot = Math.cos(rot);
        const sinRot = Math.sin(rot);

        for (let i = 0; i < ORBITS.length; i++) {
          const orb = ORBITS[i];
          const curRx = curRxArray[i];
          const curRy = curRyArray[i];

          // Enhanced radiant opacity & vibrant celestial presence across all lines
          let ringAlpha;
          if (i <= 1) {
            ringAlpha = 0.85;
          } else if (i <= 4) {
            ringAlpha = 0.95;
          } else {
            ringAlpha = 0.74 - (i - 5) * 0.025;
          }
          ringAlpha = Math.min(Math.max(ringAlpha, 0.48), 1.0);

          // Rich Frosted Glass & Electric Cyan Gradient with enhanced luminosity
          const grad = trackCtx.createLinearGradient(
            originX, originY,
            originX - curRx * 0.85, originY + curRy * 1.55
          );
          grad.addColorStop(0, `rgba(56, 189, 248, ${ringAlpha * 0.68})`);
          grad.addColorStop(0.28, `rgba(255, 255, 255, ${ringAlpha * 1.0})`);
          grad.addColorStop(0.55, `rgba(56, 189, 248, ${ringAlpha * 0.98})`);
          grad.addColorStop(0.82, `rgba(45, 212, 191, ${ringAlpha * 0.90})`);
          grad.addColorStop(1, `rgba(56, 189, 248, ${ringAlpha * 0.62})`);

          // 1. Primary Orbit Track - Fast GPU Double-Stroke Neon Aura (0ms Gaussian blur)
          trackCtx.save();
          trackCtx.beginPath();
          if (orb.dash) trackCtx.setLineDash(orb.dash);
          trackCtx.ellipse(originX, originY, curRx, curRy, rot, 0, Math.PI * 2);
          // Pass A: Soft Neon Glow Outer Aura (Wide, semi-transparent stroke)
          trackCtx.strokeStyle = `rgba(56, 189, 248, ${ringAlpha * 0.32})`;
          trackCtx.lineWidth = orb.lineWidth * 2.8;
          trackCtx.stroke();
          // Pass B: Crisp Vibrant Gradient Core
          trackCtx.strokeStyle = grad;
          trackCtx.lineWidth = orb.lineWidth * 1.15;
          trackCtx.stroke();
          trackCtx.restore();

          // 2. Companion Guide Track (Twin wire: 1.4px with luminous aura)
          if (orb.hasCompanion) {
            trackCtx.save();
            trackCtx.beginPath();
            trackCtx.ellipse(originX, originY, curRx + 5.5, (curRx + 5.5) * orb.ecc, rot, 0, Math.PI * 2);
            trackCtx.strokeStyle = `rgba(56, 189, 248, ${ringAlpha * 0.72})`;
            trackCtx.lineWidth = 1.4;
            trackCtx.stroke();
            trackCtx.restore();
          }

          // 3. Telemetry Astronomical Degree Ticks at 4 cardinal points
          trackCtx.beginPath();
          for (let k = 0; k < 4; k++) {
            const a = ticks[k] + rot;
            const cosA = Math.cos(a);
            const sinA = Math.sin(a);
            const tx = originX + cosA * curRx * cosRot - sinA * curRy * sinRot;
            const ty = originY + cosA * curRx * sinRot + sinA * curRy * cosRot;
            const normAngle = a + Math.PI / 2;
            const dx = Math.cos(normAngle) * 3.2;
            const dy = Math.sin(normAngle) * 3.2;
            trackCtx.moveTo(tx - dx, ty - dy);
            trackCtx.lineTo(tx + dx, ty + dy);
          }
          trackCtx.strokeStyle = `rgba(224, 242, 254, ${ringAlpha * 0.75})`;
          trackCtx.lineWidth = 1.2;
          trackCtx.stroke();
        }

        trackCtx.restore();
        cachedOriginX = originX;
        cachedOriginY = originY;
        cachedRot = rot;
        isTrackCacheDirty = false;
      }

      let startTime = performance.now();
      let lastFrameNow = startTime;
      let isRunning = false;

      function renderFrame(now) {
        const t = (now - startTime) * 0.001;
        const dt = Math.min(Math.max((now - lastFrameNow) * 0.001, 0.001), 0.05);
        lastFrameNow = now;

        // Silky-smooth scroll interpolation (Zero jitter 0.055 lerp damping)
        smoothScrollY += (targetScrollY - smoothScrollY) * 0.055;
        const scrollDelta = smoothScrollY - lastSmoothScrollY;
        lastSmoothScrollY = smoothScrollY;

        // Continuous smooth scroll accumulation
        scrollPhase += scrollDelta * 0.00035;
        scrollVelocity = Math.abs(scrollDelta);
        scrollGlow = Math.min(scrollGlow * 0.94 + scrollVelocity * 0.015, 1.0);

        // --- SPAWN METEORS ONLY WHEN SCROLL IS ACTIVE ---
        if (scrollVelocity > 1.2) {
          meteorCooldown -= scrollVelocity;
          if (meteorCooldown <= 0 && activeMeteorCount < MAX_METEORS) {
            spawnMeteor();
            meteorCooldown = 22; // Interval between shooting stars during scroll
          }
        } else {
          meteorCooldown = 0;
        }

        curMouseX += (mouseX - curMouseX) * 0.05;
        curMouseY += (mouseY - curMouseY) * 0.05;

        // Document metrics: 0.0 -> 1.0 across the entire website (uses cached docHeight for 0 layout reflow)
        const maxScroll = Math.max(docHeight - height, 1);
        const scrollPct = Math.min(Math.max(smoothScrollY / maxScroll, 0), 1);

        // Re-bake offscreen orbit track cache strictly when window resize marked it dirty
        if (isTrackCacheDirty) {
          updateOrbitTrackCache();
        }

        // Clear canvas
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const isMobileScreen = width < 768;
        const offsetX = isMobileScreen
          ? (-scrollPct * width * 0.08) + curMouseX * 8
          : (-scrollPct * width * 0.08) + curMouseX * 16;
        const offsetY = isMobileScreen
          ? (-scrollPct * height * 0.04) + curMouseY * 6
          : (-scrollPct * height * 0.04) + curMouseY * 12;

        const originX = cachedOriginX + offsetX;
        const originY = cachedOriginY + offsetY;
        const rot = cachedRot;

        // =============================================================
        // A. CELESTIAL STELLAR ANCHOR (Central Star labeled 'CPU')
        // =============================================================
        ctx.drawImage(anchorSprite, originX - 32, originY - 32, 64, 64);

        // Rotating astrolabe crosshair spikes (Single batched path)
        const astrolabeAngle = t * 0.15 + scrollPhase;
        ctx.beginPath();
        for (let sp = 0; sp < 4; sp++) {
          const sa = astrolabeAngle + (sp * Math.PI / 2);
          const cosSa = Math.cos(sa);
          const sinSa = Math.sin(sa);
          ctx.moveTo(originX - cosSa * 4, originY - sinSa * 4);
          ctx.lineTo(originX + cosSa * 16, originY + sinSa * 16);
        }
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Position 'CPU' label clearly beside the central star without obstructing it
        if (centralStarLabelSprite) {
          const cpuSpriteW = centralStarLabelSprite.width;
          const cpuSpriteH = centralStarLabelSprite.height;
          const placeCpuLeft = (originX + 18 + cpuSpriteW > width - 8);
          const cpuLabelX = Math.round(
            placeCpuLeft
              ? Math.max(8, originX - cpuSpriteW - 14)
              : Math.min(width - cpuSpriteW - 8, originX + 18)
          );
          const cpuLabelY = Math.round(Math.min(Math.max(originY - cpuSpriteH / 2, 8), height - cpuSpriteH - 8));

          ctx.beginPath();
          ctx.moveTo(placeCpuLeft ? (originX - 8) : (originX + 8), originY);
          ctx.lineTo(placeCpuLeft ? (cpuLabelX + cpuSpriteW - 2) : (cpuLabelX + 2), cpuLabelY + cpuSpriteH / 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.60)';
          ctx.lineWidth = 1.0;
          ctx.stroke();

          ctx.drawImage(centralStarLabelSprite.canvas, cpuLabelX, cpuLabelY, cpuSpriteW, cpuSpriteH);
        }

        // =============================================================
        // B. UNIFIED CONCENTRIC GLASSY SPACE ORBITS (STATIC RESIZE-ONLY CACHE)
        // Performs an O(1) hardware blit from orbitTrackCacheCanvas every frame!
        // =============================================================
        ctx.drawImage(orbitTrackCacheCanvas, offsetX, offsetY, width, height);

        // =============================================================
        // C. 7 ORBITAL BINDUS & ANCHORED LABELS (1 PER RING, CONTINUOUS REVOLUTION)
        // =============================================================
        const cosRot = Math.cos(rot);
        const sinRot = Math.sin(rot);

        // Batch 1: Continuous one-way orbital revolution along each ring & trailing ion wakes
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.62)';
        ctx.lineWidth = 2.0;
        for (let b = 0; b < CELESTIAL_NODES.length; b++) {
          const node = CELESTIAL_NODES[b];
          const curRx = curRxArray[node.orbitIdx];
          const curRy = curRyArray[node.orbitIdx];

          if (!node.isInitialized) {
            node.nodeAngle = isMobileScreen ? node.mobAngle : node.baseAngle;
            node.isInitialized = true;
          }

          // Continuous one-way orbital revolution along the ring
          node.nodeAngle += dt * node.speed + scrollDelta * 0.00035 * node.dir;

          let cosA = Math.cos(node.nodeAngle);
          let sinA = Math.sin(node.nodeAngle);
          let renderX = originX + cosA * curRx * cosRot - sinA * curRy * sinRot;
          let renderY = originY + cosA * curRx * sinRot + sinA * curRy * cosRot;

          // Once the bindu + label have glided completely past the viewport edge, wrap forward
          // in the SAME orbital direction to just outside the opposite entry edge of the ring
          if (renderX < -75 || renderX > width + 75 || renderY < -50 || renderY > height + 50) {
            for (let step = 0; step < 120; step++) {
              node.nodeAngle += node.dir * 0.05;
              cosA = Math.cos(node.nodeAngle);
              sinA = Math.sin(node.nodeAngle);
              renderX = originX + cosA * curRx * cosRot - sinA * curRy * sinRot;
              renderY = originY + cosA * curRx * sinRot + sinA * curRy * cosRot;
              if (renderX >= -18 && renderX <= width + 18 && renderY >= -18 && renderY <= height + 18) {
                break;
              }
            }
          }

          node.renderX = renderX;
          node.renderY = renderY;

          const trailStart = node.nodeAngle - (node.wakeLen * node.dir);
          ctx.beginPath();
          ctx.ellipse(
            originX, originY, curRx, curRy, rot,
            Math.min(trailStart, node.nodeAngle), Math.max(trailStart, node.nodeAngle)
          );
          ctx.stroke();
        }

        // Batch 2: Render Bindu Sprites, Moons, Pulsars, and Rigidly Anchored Callout Labels
        for (let b = 0; b < CELESTIAL_NODES.length; b++) {
          const node = CELESTIAL_NODES[b];
          const renderX = node.renderX;
          const renderY = node.renderY;

          // Special Feature: Revolving Micro-Moon Satellite OR Pulsar Radar Ripple
          if (node.isMoonPlanet) {
            const mA = node.moonAngle + t * node.moonSpeed;
            const mx = renderX + Math.cos(mA) * 10.0;
            const my = renderY + Math.sin(mA) * 10.0;
            ctx.beginPath();
            ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          } else if (node.isPulsar) {
            const pulseR = 9.0 + Math.sin(t * 3.6 + b * 0.7) * 2.0;
            ctx.beginPath();
            ctx.arc(renderX, renderY, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(125, 211, 252, 0.42)';
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }

          // Blit 2x HiDPI Bindu + Target Reticle Halo + Aura directly centered on the ring
          const bSprite = node.binduSprite;
          ctx.drawImage(bSprite.canvas, renderX - bSprite.half, renderY - bSprite.half, bSprite.size, bSprite.size);

          // Rigidly Anchored Micro-HUD Callout Label (No border-freeze or side-flipping lag at edges)
          if (node.hasLabel && node.labelSprite) {
            const lSprite = node.labelSprite;
            const spriteW = lSprite.width;
            const spriteH = lSprite.height;
            const labelX = Math.round(renderX + 13);
            const labelY = Math.round(renderY - spriteH - 5);

            // Crisp hairline leader connector line
            ctx.beginPath();
            ctx.moveTo(renderX + 5.5, renderY - 5.5);
            ctx.lineTo(labelX + 2, labelY + spriteH / 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
            ctx.lineWidth = 1.0;
            ctx.stroke();

            ctx.drawImage(lSprite.canvas, labelX, labelY, spriteW, spriteH);
          }
        }

        // =============================================================
        // D. SCROLL-TRIGGERED METEOROIDS (ZERO-ALLOCATION OBJECT POOL)
        // =============================================================
        if (activeMeteorCount > 0) {
          for (let mIdx = 0; mIdx < MAX_METEORS; mIdx++) {
            const m = meteorPool[mIdx];
            if (!m.active) continue;

            m.x += m.vx;
            m.y += m.vy;
            m.life -= m.decay;

            if (m.life <= 0 || m.x < -100 || m.y > height + 100) {
              m.active = false;
              activeMeteorCount--;
              continue;
            }

            const tailX = m.x - m.normVx * m.len;
            const tailY = m.y - m.normVy * m.len;

            const mGrad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
            mGrad.addColorStop(0, `rgba(255, 255, 255, ${m.life})`);
            mGrad.addColorStop(0.2, `rgba(56, 189, 248, ${m.life * 0.95})`);
            mGrad.addColorStop(0.65, `rgba(14, 165, 233, ${m.life * 0.40})`);
            mGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = mGrad;
            ctx.lineWidth = m.width;
            ctx.stroke();

            // Luminous White-Hot Meteoroid Head
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.width * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, ${m.life * 0.45})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(m.x, m.y, m.width * 1.25, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${m.life})`;
            ctx.fill();
          }
        }

        ctx.restore();
      }

      let spaceInView = true;

      __masterLoop.register(
        'spaceRings',
        () => isRunning && spaceInView,
        renderFrame
      );

      if ('IntersectionObserver' in window) {
        const spaceObserver = new IntersectionObserver((entries) => {
          spaceInView = entries[0].isIntersecting;
          if (spaceInView) {
            lastFrameNow = performance.now();
            __masterLoop.schedule();
          }
        }, { threshold: 0.01 });
        spaceObserver.observe(canvas);
      }

      // Pre-warm 1 frame into VRAM backbuffer immediately so canvas is ready behind intro
      renderFrame(performance.now());

      window.__startSpaceOrbitRings = function() {
        if (isRunning) return;
        isRunning = true;
        startTime = performance.now();
        lastFrameNow = startTime;
        __masterLoop.schedule();
      };

      // Only start continuous rAF loop immediately if brandIntroOverlay is not covering the viewport
      if (!document.getElementById('brandIntroOverlay')) {
        window.__startSpaceOrbitRings();
      }
    }

    // Fade out drag instruction badge on initial scroll
    window.addEventListener('scroll', () => {
      const dt = document.querySelector('.drag-instruction');
      if (dt) dt.classList.toggle('scrolled-out', (window.scrollY || 0) > 130);
    }, { passive: true });

/* ==================== quantum-orb.js ==================== */
/* ================================================================
       2. SMALL SHINY ALIVE QUANTUM ORB (PINNED TO UPPER-LEFT HERO)
          Calm obsidian idle state + Click-triggered Quantum Flash
       ================================================================ */
    function initSmallShinyOrb() {
      const canvas = document.getElementById('hero-orb-canvas');
      if (!canvas) return;

      const size = 84;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 3.6);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(1.0);
      renderer.setSize(size, size);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;

      const orbGroup = new THREE.Group();
      scene.add(orbGroup);

      // 1. Small Ultra-Shiny Glossy Obsidian Sphere (Optimized mirror without heavy offscreen transmission pass)
      const sphereGeom = new THREE.SphereGeometry(0.50, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x051329,
        emissive: 0x010d22,
        metalness: 0.96,
        roughness: 0.05
      });
      const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
      orbGroup.add(sphereMesh);

      // 2. Radiant Luminous Quantum Core (Optimized 20x20)
      const coreGeom = new THREE.SphereGeometry(0.28, 20, 20);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending
      });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      orbGroup.add(coreMesh);

      // 3. Precision Gyroscopic Telemetry Gimbal (5 Coordinated Harmonic Rings)
      const ringGroup = new THREE.Group();
      orbGroup.add(ringGroup);

      // Ring 1: Primary Equatorial Stabilizer (Cyan #38bdf8, R=0.84)
      const ring1Pivot = new THREE.Group();
      ringGroup.add(ring1Pivot);
      const ring1Geom = new THREE.TorusGeometry(0.84, 0.011, 8, 48);
      const ring1Mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.95,
        roughness: 0.15,
        emissive: 0x0284c7,
        emissiveIntensity: 0.20
      });
      const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
      ring1Pivot.add(ring1);

      // Ring 2: Polar Meridian Gimbal (Emerald #10b981, R=0.72) - Orthogonal 90°
      const ring2Pivot = new THREE.Group();
      ring2Pivot.rotation.set(Math.PI / 2, 0, 0);
      ringGroup.add(ring2Pivot);
      const ring2Geom = new THREE.TorusGeometry(0.72, 0.010, 8, 48);
      const ring2Mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        metalness: 0.90,
        roughness: 0.20,
        emissive: 0x059669,
        emissiveIntensity: 0.22
      });
      const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
      ring2Pivot.add(ring2);

      // Ring 3: Oblique Alpha Gimbal (Teal #06b6d4, R=0.63) - 45° Pitch & Roll
      const ring3Pivot = new THREE.Group();
      ring3Pivot.rotation.set(Math.PI / 4, 0, Math.PI / 4);
      ringGroup.add(ring3Pivot);
      const ring3Geom = new THREE.TorusGeometry(0.63, 0.009, 8, 48);
      const ring3Mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        metalness: 0.92,
        roughness: 0.18,
        emissive: 0x0891b2,
        emissiveIntensity: 0.22
      });
      const ring3 = new THREE.Mesh(ring3Geom, ring3Mat);
      ring3Pivot.add(ring3);

      // Ring 4: Oblique Beta Gimbal (Sky Blue #60a5fa, R=0.55) - Symmetric -45° Pitch & Roll
      const ring4Pivot = new THREE.Group();
      ring4Pivot.rotation.set(-Math.PI / 4, 0, -Math.PI / 4);
      ringGroup.add(ring4Pivot);
      const ring4Geom = new THREE.TorusGeometry(0.55, 0.008, 8, 40);
      const ring4Mat = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        metalness: 0.90,
        roughness: 0.20,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.25
      });
      const ring4 = new THREE.Mesh(ring4Geom, ring4Mat);
      ring4Pivot.add(ring4);

      // Ring 5: Inner Telemetry Orbit (Mint #34d399, R=0.50) - 60° Inclination
      const ring5Pivot = new THREE.Group();
      ring5Pivot.rotation.set(Math.PI / 3, Math.PI / 6, 0);
      ringGroup.add(ring5Pivot);
      const ring5Geom = new THREE.TorusGeometry(0.50, 0.007, 8, 40);
      const ring5Mat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        metalness: 0.92,
        roughness: 0.18,
        emissive: 0x10b981,
        emissiveIntensity: 0.28
      });
      const ring5 = new THREE.Mesh(ring5Geom, ring5Mat);
      ring5Pivot.add(ring5);

      // 4. Brilliant Studio Accent Lights
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
      keyLight.position.set(2.5, 3.0, 3.5);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.4);
      fillLight.position.set(-2.5, -1.5, 2.0);
      scene.add(fillLight);

      const cyanRim = new THREE.DirectionalLight(0x06b6d4, 1.8);
      cyanRim.position.set(0, 3.0, -2.5);
      scene.add(cyanRim);

      const coreLight = new THREE.PointLight(0x38bdf8, 0.65, 4.0);
      orbGroup.add(coreLight);

      // Lock static transform matrices once to eliminate redundant per-frame Matrix4 multiplications
      const staticNodes = [
        coreMesh, ringGroup,
        ring1Pivot, ring2Pivot, ring3Pivot, ring4Pivot, ring5Pivot,
        keyLight, fillLight, cyanRim, coreLight
      ];
      for (let i = 0; i < staticNodes.length; i++) {
        staticNodes[i].updateMatrix();
        staticNodes[i].matrixAutoUpdate = false;
      }

      // Interactive Click-Triggered Quantum Flash State & Audio Reactivity
      let flashEnergy = 0.0;
      let spinSpeedMultiplier = 1.0;
      let isAudioPlaying = false;
      let wasOrbExcited = false;
      const widget = document.getElementById('quantumOrbWidget') || canvas.parentElement;
      const frame = document.getElementById('orbCanvasFrame') || canvas.parentElement;

      function triggerQuantumFlash() {
        flashEnergy = 1.0;
        spinSpeedMultiplier = 4.2;
        if (frame) {
          frame.classList.remove('orb-flashing');
          void frame.offsetWidth; // Force CSS animation restart
          frame.classList.add('orb-flashing');
          setTimeout(() => {
            frame.classList.remove('orb-flashing');
          }, 800);
        }
      }

      window.__triggerOrbQuantumFlash = triggerQuantumFlash;
      window.__setOrbAudioPlaying = function(active) {
        isAudioPlaying = !!active;
      };

      let mouseX = 0, mouseY = 0;
      window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      const clock = new THREE.Clock(false);
      let running = false;
      let orbInView = true;
      let orbRafId = 0;
      let accumulatedTime = 0;

      function stepOrb(dt) {
        // Flash energy smooth decay
        if (flashEnergy > 0.001) {
          flashEnergy *= 0.93;
          spinSpeedMultiplier = 1.0 + (spinSpeedMultiplier - 1.0) * 0.92;
        } else {
          flashEnergy = 0.0;
          const targetSpin = isAudioPlaying ? 1.85 : 1.0;
          spinSpeedMultiplier += (targetSpin - spinSpeedMultiplier) * 0.06;
        }

        accumulatedTime += dt * spinSpeedMultiplier;
        const t = accumulatedTime;

        // Structured harmonic gyroscopic rotation pattern (zero collision, zero tangle)
        sphereMesh.rotation.y = t * 0.32;
        ring1.rotation.x = t * 0.44;
        ring2.rotation.y = -t * 0.38;
        ring3.rotation.x = t * 0.48;
        ring4.rotation.y = -t * 0.42;
        ring5.rotation.x = t * 0.52;

        // Heavy-to-Light State Gating: Only mutate materials/lights when excited by flash or audio
        const isOrbExcited = (flashEnergy > 0.001) || isAudioPlaying;
        if (isOrbExcited) {
          const audioWave = isAudioPlaying ? (Math.sin(t * 4.2) * 0.5 + 0.5) : 0;
          coreMat.opacity = 0.28 + flashEnergy * 0.72 + audioWave * 0.38;
          coreLight.intensity = 0.65 + flashEnergy * 4.2 + (isAudioPlaying ? (1.4 + audioWave * 1.8) : 0);
          coreLight.distance = 4.0 + flashEnergy * 5.0 + (isAudioPlaying ? 2.5 : 0);

          if (flashEnergy > 0.08 || isAudioPlaying) {
            sphereMat.emissive.setHex(isAudioPlaying ? 0x059669 : 0x0ea5e9);
            orbGroup.scale.setScalar(1.0 + flashEnergy * 0.18 + audioWave * 0.06);
          } else {
            sphereMat.emissive.setHex(0x010d22);
            orbGroup.scale.setScalar(1.0);
          }
          wasOrbExcited = true;
        } else if (wasOrbExcited) {
          // Cleanly settle back into Light idle state once
          coreMat.opacity = 0.28;
          coreLight.intensity = 0.65;
          coreLight.distance = 4.0;
          sphereMat.emissive.setHex(0x010d22);
          orbGroup.scale.setScalar(1.0);
          wasOrbExcited = false;
        }

        // Continuous majestic macro orbit drift + responsive cursor parallax tilt
        orbGroup.rotation.y = (t * 0.12) + (mouseX * 0.25);
        orbGroup.rotation.x = -mouseY * 0.20;

        // Zero-G Gentle Float (Sinusoidal weightless bobbing - Zero GPU Cost)
        orbGroup.position.y = Math.sin(t * 1.8) * 0.06;
        orbGroup.position.x = Math.cos(t * 1.3) * 0.035;

        renderer.render(scene, camera);
      }

      __masterLoop.register(
        'smallOrb',
        () => running && orbInView,
        () => {
          const dt = Math.min(clock.getDelta(), 0.1);
          stepOrb(dt);
        }
      );

      if ('IntersectionObserver' in window) {
        const orbObserver = new IntersectionObserver((entries) => {
          const wasInView = orbInView;
          orbInView = entries[0].isIntersecting;
          if (orbInView && !wasInView) {
            clock.getDelta(); // Reset delta accumulator so resuming after pause has zero jump
            __masterLoop.schedule();
          }
        }, { threshold: 0.05 });
        orbObserver.observe(canvas);
      }

      // Pre-compile shaders and render 1 static frame into VRAM backbuffer ahead of time
      renderer.compile(scene, camera);
      stepOrb(0);

      window.__startSmallOrb = function() {
        if (running) return;
        running = true;
        clock.start();
        __masterLoop.schedule();
      };

      // Only start continuous rAF loop immediately if brandIntroOverlay is not covering the viewport
      if (!document.getElementById('brandIntroOverlay')) {
        window.__startSmallOrb();
      }
    }

/* ==================== laptop.js ==================== */
/* ================================================================
       3. ULTRA-REALISTIC WORKSTATION (ENGRAVED KEYBOARD + DEVFIX CAD/IDE SCREEN)
       ================================================================ */
    function initLaptopStage() {
      const canvas = document.getElementById('laptop-canvas');
      if (!canvas) return;
      const container = canvas.parentElement;

      // Defensive sizing fallback for network load and mobile screens
      let cw = (container && container.clientWidth > 50) ? container.clientWidth : 720;
      let ch = (container && container.clientHeight > 50) ? container.clientHeight : 780;

      const scene = new THREE.Scene();
      
      const isMobile = window.innerWidth <= 900;
      const initScale = isMobile ? 0.62 : 0.78;
      const camera = new THREE.PerspectiveCamera(isMobile ? 38 : 40, cw / ch, 0.1, 100);
      camera.position.set(0, isMobile ? 0.70 : 1.25, isMobile ? 6.2 : 6.4);
      camera.lookAt(0, 0, 0);

      const getOptimalPixelRatio = () => (window.innerWidth <= 900)
        ? Math.min(window.devicePixelRatio || 1, 2)
        : Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(getOptimalPixelRatio());
      renderer.setSize(cw, ch);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;

      const laptop = new THREE.Group();
      laptop.scale.set(initScale, initScale, initScale);
      laptop.position.x = 0;
      scene.add(laptop);

      // --- MATERIALS ---
      // Anodized brushed aluminum palmrest / chassis (HEX: #1F2228 – #2A2E37, metalness: 0.85, roughness: 0.35)
      const aluminumMaterial = new THREE.MeshStandardMaterial({
        color: 0x242830, // Anodized brushed aluminum (#1F2228 – #2A2E37)
        metalness: 0.85,
        roughness: 0.35
      });
      const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x1f232b,
        metalness: 0.80,
        roughness: 0.40
      });
      // Keyboard Well / Recessed Well (Keys ke beech ka base)
      // HEX: #181A20, RGB: rgb(24, 26, 32) (Slightly darker shade of aluminum chassis)
      const keyboardTrayMaterial = new THREE.MeshStandardMaterial({
        color: 0x181a20,
        metalness: 0.78,
        roughness: 0.42
      });

      // --- A. LAPTOP BASE ---
      const baseW = 3.2, baseH = 0.075, baseD = 2.15;
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), aluminumMaterial);
      laptop.add(baseMesh);

      // --- A. LAPTOP BASE & WIDER CHICLET TRAY (IMAGE 2) ---
      const wellW = 2.84, wellD = 1.15;
      const wellMesh = new THREE.Mesh(new THREE.BoxGeometry(wellW, 0.015, wellD), keyboardTrayMaterial);
      wellMesh.position.set(0, baseH / 2 + 0.005, -0.22);
      laptop.add(wellMesh);

      // --- B. HYPER-DETAILED PRECISION CHICLET KEYBOARD (STEALTH OBSIDIAN) ---
      const keyGroup = new THREE.Group();
      keyGroup.position.set(0, baseH / 2 + 0.012, -0.22);
      laptop.add(keyGroup);

      // Authentic 6-row ANSI layout (All rows sum to exactly 14.5 units for flawless flush alignment)
      const detailedKeyboardRows = [
        // Row 0: Function Keys + Touch ID
        [
          { w: 1.25, main: "esc" },
          { w: 1.0, main: "F1", sub: "🔅" },
          { w: 1.0, main: "F2", sub: "🔆" },
          { w: 1.0, main: "F3", sub: "⊞" },
          { w: 1.0, main: "F4", sub: "🔍" },
          { w: 1.0, main: "F5", sub: "🎙" },
          { w: 1.0, main: "F6", sub: "🌙" },
          { w: 1.0, main: "F7", sub: "◀◀" },
          { w: 1.0, main: "F8", sub: "▶⏸" },
          { w: 1.0, main: "F9", sub: "▶▶" },
          { w: 1.0, main: "F10", sub: "🔇" },
          { w: 1.0, main: "F11", sub: "🔉" },
          { w: 1.0, main: "F12", sub: "🔊" },
          { w: 1.25, type: "touchid" }
        ],
        // Row 1: Numbers & Symbols (Dual legends)
        [
          { w: 1.0, main: "`", sub: "~" },
          { w: 1.0, main: "1", sub: "!" },
          { w: 1.0, main: "2", sub: "@" },
          { w: 1.0, main: "3", sub: "#" },
          { w: 1.0, main: "4", sub: "$" },
          { w: 1.0, main: "5", sub: "%" },
          { w: 1.0, main: "6", sub: "^" },
          { w: 1.0, main: "7", sub: "&" },
          { w: 1.0, main: "8", sub: "*" },
          { w: 1.0, main: "9", sub: "(" },
          { w: 1.0, main: "0", sub: ")" },
          { w: 1.0, main: "-", sub: "_" },
          { w: 1.0, main: "=", sub: "+" },
          { w: 1.5, main: "delete", glyph: "⌫" }
        ],
        // Row 2: QWERTY Row
        [
          { w: 1.5, main: "tab", glyph: "⇥" },
          { w: 1.0, main: "Q" },
          { w: 1.0, main: "W" },
          { w: 1.0, main: "E" },
          { w: 1.0, main: "R" },
          { w: 1.0, main: "T" },
          { w: 1.0, main: "Y" },
          { w: 1.0, main: "U" },
          { w: 1.0, main: "I" },
          { w: 1.0, main: "O" },
          { w: 1.0, main: "P" },
          { w: 1.0, main: "[", sub: "{" },
          { w: 1.0, main: "]", sub: "}" },
          { w: 1.0, main: "\\", sub: "|" }
        ],
        // Row 3: Home Row (with tactile bumps & Caps Lock LED)
        [
          { w: 1.8, main: "caps lock", glyph: "⇪", hasLed: true },
          { w: 1.0, main: "A" },
          { w: 1.0, main: "S" },
          { w: 1.0, main: "D" },
          { w: 1.0, main: "F", hasNub: true },
          { w: 1.0, main: "G" },
          { w: 1.0, main: "H" },
          { w: 1.0, main: "J", hasNub: true },
          { w: 1.0, main: "K" },
          { w: 1.0, main: "L" },
          { w: 1.0, main: ";", sub: ":" },
          { w: 1.0, main: "'", sub: "\"" },
          { w: 1.7, main: "return", glyph: "↵" }
        ],
        // Row 4: Shift Row
        [
          { w: 2.3, main: "shift", glyph: "⇧" },
          { w: 1.0, main: "Z" },
          { w: 1.0, main: "X" },
          { w: 1.0, main: "C" },
          { w: 1.0, main: "V" },
          { w: 1.0, main: "B" },
          { w: 1.0, main: "N" },
          { w: 1.0, main: "M" },
          { w: 1.0, main: ",", sub: "<" },
          { w: 1.0, main: ".", sub: ">" },
          { w: 1.0, main: "/", sub: "?" },
          { w: 2.2, main: "shift", glyph: "⇧" }
        ],
        // Row 5: Modifier & Space Row + Inverted-T Arrow Cluster
        [
          { w: 1.0, main: "fn", sub: "🌐" },
          { w: 1.0, main: "control", glyph: "⌃" },
          { w: 1.15, main: "option", glyph: "⌥" },
          { w: 1.35, main: "command", glyph: "⌘" },
          { w: 4.8, type: "space" },
          { w: 1.35, main: "command", glyph: "⌘" },
          { w: 1.15, main: "option", glyph: "⌥" },
          { w: 0.9, main: "◀", isHalfArrowBottom: true },
          { w: 0.9, type: "split_arrows", up: "▲", down: "▼" },
          { w: 0.9, main: "▶", isHalfArrowBottom: true }
        ]
      ];

      // Master Power-Of-Two canvas for keycap texture (2048x1024 desktop, 1024x512 mobile to save 75% VRAM & enable clean hardware mipmaps)
      const texScale = isMobile ? 0.5 : 1.0;
      const KB_LOGICAL_W = 2048;
      const KB_LOGICAL_H = 860;
      const kbCanvas = document.createElement('canvas');
      kbCanvas.width = Math.round(2048 * texScale);
      kbCanvas.height = Math.round(1024 * texScale);
      const kbCtx = kbCanvas.getContext('2d');

      const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 16;
      const keycapTexture = new THREE.CanvasTexture(kbCanvas);
      keycapTexture.generateMipmaps = true;
      keycapTexture.minFilter = THREE.LinearMipmapLinearFilter;
      keycapTexture.magFilter = THREE.LinearFilter;
      keycapTexture.anisotropy = maxAniso;
      const keycapMaterial = new THREE.MeshStandardMaterial({
        map: keycapTexture,
        metalness: 0.12,
        roughness: 0.78
      });

      function drawEngravedKeyboard() {
        const kbW = KB_LOGICAL_W;
        const kbH = KB_LOGICAL_H;

        kbCtx.save();
        kbCtx.scale(kbCanvas.width / KB_LOGICAL_W, kbCanvas.height / KB_LOGICAL_H);

        // Base keyboard tray / recessed well: HEX #181A20, RGB rgb(24, 26, 32)
        kbCtx.fillStyle = '#181a20';
        kbCtx.fillRect(0, 0, kbW, kbH);

        const padX = 14;
        const padY = 14;
        const keyGap = 6;
        const rowGap = 6;
        const row0H = 88;
        const stdH = (kbH - 2 * padY - row0H - 5 * rowGap) / 5;
        const pitch = (kbW - 2 * padX + keyGap) / 14.5;

        // Helper to draw a single 3D sculpted keycap
        function drawKey(kx, ky, kw, kh, key) {
          // 1. Socket well cavity shadow beneath keycap
          kbCtx.fillStyle = '#0e1015';
          kbCtx.beginPath();
          if (kbCtx.roundRect) kbCtx.roundRect(kx, ky + 1.5, kw, kh, 5.5);
          else kbCtx.rect(kx, ky + 1.5, kw, kh);
          kbCtx.fill();

          // 2. Keycap body gradient (Authentic dark obsidian / matte graphite PBT)
          const grad = kbCtx.createLinearGradient(kx, ky, kx, ky + kh);
          grad.addColorStop(0, '#1c2230');   // Micro ambient highlight at top rim
          grad.addColorStop(0.16, '#131622'); // Rich stealth obsidian
          grad.addColorStop(0.85, '#0c0f18');
          grad.addColorStop(1, '#070911');   // Dark base
          kbCtx.fillStyle = grad;
          kbCtx.beginPath();
          if (kbCtx.roundRect) kbCtx.roundRect(kx, ky, kw, kh, 5.5);
          else kbCtx.rect(kx, ky, kw, kh);
          kbCtx.fill();

          // 3. Ergonomic dish scoop (subtle radial depth concave)
          const dish = kbCtx.createRadialGradient(kx + kw * 0.5, ky + kh * 0.42, 2, kx + kw * 0.5, ky + kh * 0.42, Math.max(kw, kh) * 0.65);
          dish.addColorStop(0, 'rgba(255, 255, 255, 0.045)');
          dish.addColorStop(0.55, 'rgba(255, 255, 255, 0.012)');
          dish.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
          kbCtx.fillStyle = dish;
          kbCtx.beginPath();
          if (kbCtx.roundRect) kbCtx.roundRect(kx + 1, ky + 1, kw - 2, kh - 2, 4.5);
          else kbCtx.rect(kx + 1, ky + 1, kw - 2, kh - 2);
          kbCtx.fill();

          // 4. Chamfer bevel rim strokes
          // Top & side specular rim highlight
          kbCtx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
          kbCtx.lineWidth = 1.2;
          kbCtx.beginPath();
          if (kbCtx.roundRect) kbCtx.roundRect(kx + 0.6, ky + 0.6, kw - 1.2, kh - 1.2, 5.0);
          else kbCtx.rect(kx + 0.6, ky + 0.6, kw - 1.2, kh - 1.2);
          kbCtx.stroke();

          // Bottom edge contact shadow
          kbCtx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
          kbCtx.lineWidth = 1.4;
          kbCtx.beginPath();
          kbCtx.moveTo(kx + 5, ky + kh - 0.7);
          kbCtx.lineTo(kx + kw - 5, ky + kh - 0.7);
          kbCtx.stroke();

          // 5. Special Key Details
          if (key.type === 'touchid') {
            const cx = kx + kw / 2;
            const cy = ky + kh / 2;
            const r = Math.min(kw, kh) * 0.34;
            // Metal bevel ring
            kbCtx.strokeStyle = '#2d3748';
            kbCtx.lineWidth = 2.0;
            kbCtx.beginPath();
            kbCtx.arc(cx, cy, r + 2, 0, Math.PI * 2);
            kbCtx.stroke();
            // Recessed sensor glass
            const sensorGrad = kbCtx.createRadialGradient(cx, cy, 1, cx, cy, r);
            sensorGrad.addColorStop(0, '#0d111a');
            sensorGrad.addColorStop(1, '#05070b');
            kbCtx.fillStyle = sensorGrad;
            kbCtx.beginPath();
            kbCtx.arc(cx, cy, r, 0, Math.PI * 2);
            kbCtx.fill();
            // Subtle power icon inside
            kbCtx.strokeStyle = '#64748b';
            kbCtx.lineWidth = 1.8;
            kbCtx.beginPath();
            kbCtx.arc(cx, cy + 1, r * 0.42, -Math.PI * 0.7, -Math.PI * 0.3, true);
            kbCtx.stroke();
            kbCtx.beginPath();
            kbCtx.moveTo(cx, cy - r * 0.42);
            kbCtx.lineTo(cx, cy - 1);
            kbCtx.stroke();
            return;
          }

          if (key.type === 'space') {
            return; // Pristine minimalist matte spacebar
          }

          // Caps Lock Emerald LED
          if (key.hasLed) {
            const ledX = kx + 16;
            const ledY = ky + kh / 2;
            kbCtx.fillStyle = '#060a0f';
            kbCtx.beginPath();
            kbCtx.arc(ledX, ledY, 3.5, 0, Math.PI * 2);
            kbCtx.fill();
            kbCtx.fillStyle = '#10b981';
            kbCtx.shadowColor = 'rgba(16, 185, 129, 0.85)';
            kbCtx.shadowBlur = 6;
            kbCtx.beginPath();
            kbCtx.arc(ledX, ledY, 2.0, 0, Math.PI * 2);
            kbCtx.fill();
            kbCtx.shadowBlur = 0;
          }

          // Tactile Homing Bumps (F and J keys)
          if (key.hasNub) {
            const cx = kx + kw / 2;
            const nubY = ky + kh * 0.77;
            const nubW = 16;
            kbCtx.fillStyle = '#475569';
            kbCtx.beginPath();
            if (kbCtx.roundRect) kbCtx.roundRect(cx - nubW / 2, nubY, nubW, 2.5, 1.2);
            else kbCtx.rect(cx - nubW / 2, nubY, nubW, 2.5);
            kbCtx.fill();
            kbCtx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
            kbCtx.lineWidth = 0.8;
            kbCtx.beginPath();
            kbCtx.moveTo(cx - nubW / 2 + 1, nubY);
            kbCtx.lineTo(cx + nubW / 2 - 1, nubY);
            kbCtx.stroke();
          }

          // Dual-legend keys (Numbers / Symbols, e.g. "1" and "!", "[" and "{")
          if (key.sub && key.main && !key.main.startsWith('F') && key.main !== 'fn') {
            kbCtx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            kbCtx.fillStyle = '#94a3b8';
            kbCtx.textAlign = 'center';
            kbCtx.textBaseline = 'middle';
            kbCtx.fillText(key.sub, kx + kw / 2, ky + kh * 0.32);

            kbCtx.font = '700 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            kbCtx.fillStyle = '#f1f5f9';
            kbCtx.shadowColor = 'rgba(255, 255, 255, 0.3)';
            kbCtx.shadowBlur = 2.5;
            kbCtx.fillText(key.main, kx + kw / 2, ky + kh * 0.70);
            kbCtx.shadowBlur = 0;
          }
          // Function Keys (Row 0: F1-F12 + icons)
          else if (key.main && key.main.startsWith('F')) {
            if (key.sub) {
              kbCtx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              kbCtx.fillStyle = '#94a3b8';
              kbCtx.textAlign = 'center';
              kbCtx.textBaseline = 'middle';
              kbCtx.fillText(key.sub, kx + kw / 2, ky + kh * 0.32);
            }
            kbCtx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            kbCtx.fillStyle = '#cbd5e1';
            kbCtx.textAlign = 'center';
            kbCtx.textBaseline = 'middle';
            kbCtx.fillText(key.main, kx + kw / 2, ky + (key.sub ? kh * 0.72 : kh / 2));
          }
          // Modifier Keys with text + glyph (e.g. "tab ⇥", "shift ⇧", "delete ⌫")
          else if (key.glyph && key.main) {
            kbCtx.fillStyle = '#cbd5e1';
            kbCtx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            kbCtx.textAlign = 'left';
            kbCtx.textBaseline = 'bottom';
            kbCtx.fillText(key.main, kx + (key.hasLed ? 28 : 12), ky + kh - 11);

            kbCtx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            kbCtx.textAlign = 'right';
            kbCtx.textBaseline = 'top';
            kbCtx.fillText(key.glyph, kx + kw - 12, ky + 11);
          }
          // fn / globe key
          else if (key.main === 'fn' && key.sub) {
            kbCtx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
            kbCtx.fillStyle = '#94a3b8';
            kbCtx.textAlign = 'right';
            kbCtx.textBaseline = 'top';
            kbCtx.fillText(key.sub, kx + kw - 10, ky + 10);

            kbCtx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif';
            kbCtx.fillStyle = '#cbd5e1';
            kbCtx.textAlign = 'left';
            kbCtx.textBaseline = 'bottom';
            kbCtx.fillText(key.main, kx + 10, ky + kh - 10);
          }
          // Single Alphabet Character Keys (A-Z)
          else if (key.main && key.main.length === 1) {
            const isArrow = ['◀', '▲', '▼', '▶'].includes(key.main);
            kbCtx.font = isArrow
              ? '700 15px -apple-system, BlinkMacSystemFont, sans-serif'
              : '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            kbCtx.fillStyle = '#f8fafc';
            kbCtx.shadowColor = 'rgba(255, 255, 255, 0.35)';
            kbCtx.shadowBlur = 3;
            kbCtx.textAlign = 'center';
            kbCtx.textBaseline = 'middle';
            kbCtx.fillText(key.main, kx + kw / 2, ky + kh / 2);
            kbCtx.shadowBlur = 0;
          }
          // Text-only keys (esc, etc.)
          else if (key.main) {
            kbCtx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            kbCtx.fillStyle = '#cbd5e1';
            kbCtx.textAlign = 'center';
            kbCtx.textBaseline = 'middle';
            kbCtx.fillText(key.main, kx + kw / 2, ky + kh / 2);
          }
        }

        // Draw each row
        let curY = padY;
        for (let r = 0; r < detailedKeyboardRows.length; r++) {
          const row = detailedKeyboardRows[r];
          const rowH = (r === 0) ? row0H : stdH;
          let unitOffset = 0;

          for (let c = 0; c < row.length; c++) {
            const key = row[c];
            const keyX = padX + unitOffset * pitch;
            const keyW = key.w * pitch - keyGap;

            if (key.type === 'split_arrows') {
              // Half-height stacked Up and Down arrows
              const halfH = (rowH - 4) / 2;
              drawKey(keyX, curY, keyW, halfH, { main: key.up });
              drawKey(keyX, curY + halfH + 4, keyW, halfH, { main: key.down });
            } else if (key.isHalfArrowBottom) {
              // Half-height inverted-T arrow resting at bottom of row
              const halfH = (rowH - 4) / 2;
              drawKey(keyX, curY + halfH + 4, keyW, halfH, key);
            } else {
              drawKey(keyX, curY, keyW, rowH, key);
            }

            unitOffset += key.w;
          }
          curY += rowH + rowGap;
        }

        kbCtx.restore();
        keycapTexture.needsUpdate = true;
      }
      drawEngravedKeyboard();

      // Keyboard Mesh Plane on top of well
      const keyboardPlaneGeo = new THREE.PlaneGeometry(2.82, 1.14);
      const keyboardPlaneMesh = new THREE.Mesh(keyboardPlaneGeo, keycapMaterial);
      keyboardPlaneMesh.rotation.x = -Math.PI / 2;
      keyboardPlaneMesh.position.set(0, 0.006, 0);
      keyGroup.add(keyboardPlaneMesh);

      // --- C. PRECISION OBSIDIAN GLASS TRACKPAD ---
      const trackpadW = 1.10, trackpadD = 0.68;
      const trackpadGeo = new THREE.BoxGeometry(trackpadW, 0.012, trackpadD);
      const trackpadMat = new THREE.MeshStandardMaterial({
        color: 0x0f131c, // Sleek matte dark obsidian glass
        metalness: 0.15,
        roughness: 0.75
      });
      const trackpad = new THREE.Mesh(trackpadGeo, trackpadMat);
      trackpad.position.set(0, baseH / 2 + 0.006, 0.63);
      laptop.add(trackpad);

      // Subtle perimeter chamfer outline for trackpad
      const trackpadBorderGeo = new THREE.BoxGeometry(trackpadW + 0.01, 0.008, trackpadD + 0.01);
      const trackpadBorderMat = new THREE.MeshStandardMaterial({
        color: 0x07090e,
        metalness: 0.2,
        roughness: 0.9
      });
      const trackpadBorder = new THREE.Mesh(trackpadBorderGeo, trackpadBorderMat);
      trackpadBorder.position.set(0, baseH / 2 + 0.004, 0.63);
      laptop.add(trackpadBorder);

      // HINGE CYLINDER & PIVOT AXIS
      const hingeY = baseH / 2 + 0.025;
      const hingeZ = -baseD / 2 + 0.04;
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.9, 16), edgeMaterial);
      hinge.rotation.z = Math.PI / 2;
      hinge.position.set(0, hingeY, hingeZ);
      laptop.add(hinge);

      // LID
      const lidGroup = new THREE.Group();
      lidGroup.position.set(0, hingeY, hingeZ);
      laptop.add(lidGroup);

      const lidW = baseW, lidH = 2.1, lidThick = 0.045;
      const lidBack = new THREE.Mesh(new THREE.BoxGeometry(lidW, lidH, lidThick), aluminumMaterial);
      lidBack.position.set(0, lidH / 2, 0);
      lidGroup.add(lidBack);

      // Ultra-thin minimal bezel frame (separated from lidBack to prevent Z-fighting)
      const bezelFrame = new THREE.Mesh(
        new THREE.PlaneGeometry(lidW - 0.04, lidH - 0.04),
        new THREE.MeshBasicMaterial({
          color: 0x05070a,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        })
      );
      bezelFrame.position.set(0, lidH / 2, 0.026);
      lidGroup.add(bezelFrame);

      // Standalone Iconic "A" Brand Emblem on Back Lid (1024x1024 desktop, halved to 512x512 on mobile)
      const LOGO_LOGICAL_SIZE = 1024;
      const logoCanvas = document.createElement('canvas');
      logoCanvas.width = Math.round(LOGO_LOGICAL_SIZE * texScale);
      logoCanvas.height = Math.round(LOGO_LOGICAL_SIZE * texScale);
      const lCtx = logoCanvas.getContext('2d');

      const logoTexture = new THREE.CanvasTexture(logoCanvas);
      logoTexture.generateMipmaps = true;
      logoTexture.minFilter = THREE.LinearMipmapLinearFilter;
      logoTexture.magFilter = THREE.LinearFilter;
      logoTexture.anisotropy = maxAniso;

      const logoMaterial = new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        toneMapped: false
      });

      const logoMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 0.72),
        logoMaterial
      );
      logoMesh.rotation.y = Math.PI; // Face towards the rear
      logoMesh.position.set(0, lidH / 2, -lidThick / 2 - 0.002);
      lidGroup.add(logoMesh);

      function drawBackLidLogo() {
        const cx = 512, cy = 512;
        lCtx.save();
        lCtx.scale(texScale, texScale);
        lCtx.clearRect(0, 0, LOGO_LOGICAL_SIZE, LOGO_LOGICAL_SIZE);

        lCtx.shadowColor = 'rgba(56, 189, 248, 0.9)';
        lCtx.shadowBlur = 45 * texScale;

        // 1. Left Wing Blade
        lCtx.fillStyle = '#f8fafc';
        lCtx.beginPath();
        lCtx.moveTo(cx - 6, cy - 180);
        lCtx.lineTo(cx - 185, cy + 180);
        lCtx.lineTo(cx - 110, cy + 180);
        lCtx.lineTo(cx - 6, cy - 60);
        lCtx.closePath();
        lCtx.fill();

        // 2. Right Wing Blade
        lCtx.fillStyle = '#cbd5e1';
        lCtx.beginPath();
        lCtx.moveTo(cx + 6, cy - 180);
        lCtx.lineTo(cx + 185, cy + 180);
        lCtx.lineTo(cx + 110, cy + 180);
        lCtx.lineTo(cx + 6, cy - 60);
        lCtx.closePath();
        lCtx.fill();

        // 3. Center Arrow / Core Crossbar
        lCtx.fillStyle = '#38bdf8';
        lCtx.beginPath();
        lCtx.moveTo(cx, cy - 80);
        lCtx.lineTo(cx - 82, cy + 75);
        lCtx.lineTo(cx - 30, cy + 75);
        lCtx.lineTo(cx - 30, cy + 180);
        lCtx.lineTo(cx + 30, cy + 180);
        lCtx.lineTo(cx + 30, cy + 75);
        lCtx.lineTo(cx + 82, cy + 75);
        lCtx.closePath();
        lCtx.fill();

        lCtx.restore();
        logoTexture.needsUpdate = true;
      }
      drawBackLidLogo();

      // --- C. ULTRA-SHARP RETINA DARK CODE EDITOR SCREEN ---
      // Exact Power-Of-Two (2048x2048 desktop, 1024x1024 mobile) + 16x Anisotropy + 2x SSAA = zero shimmering & crystal-clear text
      const screenW = lidW - 0.16, screenH = lidH - 0.16;
      const SCREEN_LOGICAL_W = 2560;
      const SCREEN_LOGICAL_H = 1632;
      const screenCanvas = document.createElement('canvas');
      screenCanvas.width = Math.round(2048 * texScale);
      screenCanvas.height = Math.round(2048 * texScale);
      const sCtx = screenCanvas.getContext('2d');

      const screenTexture = new THREE.CanvasTexture(screenCanvas);
      screenTexture.generateMipmaps = true;
      screenTexture.minFilter = THREE.LinearMipmapLinearFilter;
      screenTexture.magFilter = THREE.LinearFilter;
      screenTexture.anisotropy = maxAniso;

      const screenMaterial = new THREE.MeshBasicMaterial({
        map: screenTexture,
        toneMapped: false,
        color: 0x000000, // Standby black initially
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      });
      const screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(screenW, screenH),
        screenMaterial
      );
      screenMesh.position.set(0, lidH / 2, 0.030);
      lidGroup.add(screenMesh);

      // Laptop lid kinematics: folded flat (closed) vs operational tilt (open)
      const closedLidAngle = Math.PI * 0.490;
      const openLidAngle = -Math.PI * 0.14;
      lidGroup.rotation.x = closedLidAngle;

      // High-contrast, punchy C systems code tokens (12 clear, impactful lines)
      const editorLines = [
        { num: 1,  tokens: [{ text: "// DevFix Core Engine • Memory Safety", color: "#64748b" }] },
        { num: 2,  tokens: [{ text: "#include ", color: "#38bdf8" }, { text: "<stdio.h>", color: "#2dd4bf" }] },
        { num: 3,  tokens: [{ text: "#include ", color: "#38bdf8" }, { text: "<devfix/core.h>", color: "#2dd4bf" }] },
        { num: 4,  tokens: [] },
        { num: 5,  tokens: [{ text: "int ", color: "#2dd4bf" }, { text: "main", color: "#ffffff" }, { text: "(", color: "#94a3b8" }, { text: "void", color: "#2dd4bf" }, { text: ") {", color: "#94a3b8" }] },
        { num: 6,  tokens: [{ text: "    DevNode ", color: "#2dd4bf" }, { text: "*node", color: "#ffffff" }, { text: " = ", color: "#38bdf8" }, { text: "dev_init", color: "#ffffff" }, { text: "(", color: "#94a3b8" }, { text: "\"devfix-core\"", color: "#a7f3d0" }, { text: ");", color: "#94a3b8" }] },
        { num: 7,  tokens: [{ text: "    if ", color: "#38bdf8" }, { text: "(", color: "#94a3b8" }, { text: "node->is_active", color: "#ffffff" }, { text: ") {", color: "#94a3b8" }] },
        { num: 8,  tokens: [{ text: "        printf", color: "#ffffff" }, { text: "(", color: "#94a3b8" }, { text: "\"Status: 100% OK • 60 FPS\\n\"", color: "#a7f3d0" }, { text: ");", color: "#94a3b8" }] },
        { num: 9,  tokens: [{ text: "        dev_launch_pipeline", color: "#ffffff" }, { text: "(", color: "#94a3b8" }, { text: "node", color: "#ffffff" }, { text: ");", color: "#94a3b8" }] },
        { num: 10, tokens: [{ text: "    }", color: "#94a3b8" }] },
        { num: 11, tokens: [{ text: "    return ", color: "#38bdf8" }, { text: "0", color: "#7dd3fc" }, { text: ";", color: "#94a3b8" }], hasCursor: true },
        { num: 12, tokens: [{ text: "}", color: "#94a3b8" }] }
      ];

      function renderCodeEditorScreen(cursorVisible) {
        const W = SCREEN_LOGICAL_W, H = SCREEN_LOGICAL_H;

        sCtx.save();
        sCtx.scale(screenCanvas.width / SCREEN_LOGICAL_W, screenCanvas.height / SCREEN_LOGICAL_H);

        // 1. Pure near-black editor base
        sCtx.fillStyle = '#050811';
        sCtx.fillRect(0, 0, W, H);

        // 2. Window Header / Tab Bar (Height: 96px)
        const tabH = 96;
        sCtx.fillStyle = '#080d1a';
        sCtx.fillRect(0, 0, W, tabH);
        sCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        sCtx.lineWidth = 2;
        sCtx.beginPath();
        sCtx.moveTo(0, tabH);
        sCtx.lineTo(W, tabH);
        sCtx.stroke();

        // Window controls (mac-style traffic lights)
        const dots = ['#ef4444', '#f59e0b', '#10b981'];
        for (let d = 0; d < 3; d++) {
          sCtx.beginPath();
          sCtx.arc(50 + d * 36, tabH / 2, 10, 0, Math.PI * 2);
          sCtx.fillStyle = dots[d];
          sCtx.fill();
        }

        // Active Tab: devfix_core.c
        const tabX = 185, tabW = 340;
        sCtx.fillStyle = '#0d1526';
        sCtx.fillRect(tabX, 0, tabW, tabH);
        // Bright cyan active indicator line
        sCtx.fillStyle = '#38bdf8';
        sCtx.fillRect(tabX, 0, tabW, 5);

        // Tab icon & filename
        sCtx.font = 'bold 26px "JetBrains Mono", monospace';
        sCtx.fillStyle = '#38bdf8';
        sCtx.fillText('C', tabX + 32, 58);
        sCtx.font = 'bold 27px "JetBrains Mono", monospace';
        sCtx.fillStyle = '#ffffff';
        sCtx.fillText('devfix_core.c', tabX + 70, 58);
        sCtx.fillStyle = '#64748b';
        sCtx.fillText('×', tabX + tabW - 40, 56);

        // Inactive Tab
        sCtx.fillStyle = '#475569';
        sCtx.fillText('engine.h', tabX + tabW + 40, 58);

        // Breadcrumb right
        sCtx.fillStyle = '#475569';
        sCtx.font = 'bold 24px "JetBrains Mono", monospace';
        sCtx.fillText('src > core > devfix_core.c', W - 520, 58);

        // Git indicator
        sCtx.fillStyle = '#10b981';
        sCtx.fillText('● main', W - 150, 58);

        // 3. Line numbers gutter (Width: 140px)
        const gutterW = 140;
        sCtx.fillStyle = '#060a14';
        sCtx.fillRect(0, tabH, gutterW, H - tabH - 72);
        sCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        sCtx.beginPath();
        sCtx.moveTo(gutterW, tabH);
        sCtx.lineTo(gutterW, H - 72);
        sCtx.stroke();

        // 4. Render Code Lines (Bold, large 38px font)
        const startY = tabH + 75;
        const lineSpacing = 88;
        const codeStartX = gutterW + 36;

        let cursorX = 0, cursorY = 0;

        for (let i = 0; i < editorLines.length; i++) {
          const line = editorLines[i];
          const y = startY + i * lineSpacing;

          // Active line subtle highlight
          if (line.hasCursor) {
            sCtx.fillStyle = 'rgba(56, 189, 248, 0.09)';
            sCtx.fillRect(gutterW, y - 52, W - gutterW, lineSpacing);
          }

          // Line number in gutter
          const numStr = (line.num < 10 ? '0' : '') + line.num;
          sCtx.font = 'bold 30px "JetBrains Mono", monospace';
          sCtx.fillStyle = line.hasCursor ? '#38bdf8' : '#334155';
          sCtx.fillText(numStr, 48, y);

          // Tokens rendering with bold crisp typography
          sCtx.font = 'bold 36px "JetBrains Mono", "Consolas", monospace';
          let currentX = codeStartX;
          for (let t = 0; t < line.tokens.length; t++) {
            const token = line.tokens[t];
            sCtx.fillStyle = token.color;
            sCtx.fillText(token.text, currentX, y);
            currentX += sCtx.measureText(token.text).width;
          }

          if (line.hasCursor) {
            cursorX = currentX + 6;
            cursorY = y - 44;
            savedCursorX = cursorX;
            savedCursorY = cursorY;
          }
        }

        // 6. Bottom Status Bar (Height: 72px)
        const barY = H - 72;
        sCtx.fillStyle = '#080d1a';
        sCtx.fillRect(0, barY, W, 72);
        sCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        sCtx.beginPath();
        sCtx.moveTo(0, barY);
        sCtx.lineTo(W, barY);
        sCtx.stroke();

        // Normal mode pill
        sCtx.fillStyle = 'rgba(16, 185, 129, 0.18)';
        sCtx.fillRect(32, barY + 14, 130, 44);
        sCtx.fillStyle = '#10b981';
        sCtx.font = 'bold 22px "JetBrains Mono", monospace';
        sCtx.fillText('NORMAL', 52, barY + 44);

        sCtx.fillStyle = '#cbd5e1';
        sCtx.font = 'bold 24px "JetBrains Mono", monospace';
        sCtx.fillText('devfix_core.c', 190, barY + 45);
        sCtx.fillText('UTF-8', 460, barY + 45);
        sCtx.fillText('C (Clang 17)', 600, barY + 45);

        sCtx.fillStyle = '#64748b';
        sCtx.fillText('Ln 11, Col 15', W - 420, barY + 45);
        sCtx.fillText('Spaces: 4', W - 240, barY + 45);
        sCtx.fillStyle = '#10b981';
        sCtx.fillText('● 0 err', W - 90, barY + 45);
        sCtx.restore();
      }

      let savedCursorX = 0, savedCursorY = 0;
      // Pre-warm screen canvas & GPU texture ONCE on startup (Permanent VRAM caching, 0 MB/s churn)
      renderCodeEditorScreen(false);
      screenTexture.needsUpdate = true;

      // Hardware-accelerated 3D glowing cursor mesh (Child of screenMesh, zero texture re-upload)
      const curNormX = (savedCursorX / SCREEN_LOGICAL_W) - 0.5;
      const curNormY = 0.5 - (savedCursorY / SCREEN_LOGICAL_H);
      const curW3D = (18 / SCREEN_LOGICAL_W) * screenW;
      const curH3D = (50 / SCREEN_LOGICAL_H) * screenH;

      const cursorMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(curW3D, curH3D),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.95,
          toneMapped: false
        })
      );
      cursorMesh.position.set(
        curNormX * screenW + curW3D / 2,
        curNormY * screenH - curH3D / 2,
        0.003
      );
      cursorMesh.visible = false;
      screenMesh.add(cursorMesh);

      // Re-bake screen and keyboard textures once web fonts (JetBrains Mono / Space Grotesk) finish loading
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          drawEngravedKeyboard();
          renderCodeEditorScreen(false);
          screenTexture.needsUpdate = true;
          const updatedNormX = (savedCursorX / SCREEN_LOGICAL_W) - 0.5;
          const updatedNormY = 0.5 - (savedCursorY / SCREEN_LOGICAL_H);
          cursorMesh.position.set(
            updatedNormX * screenW + curW3D / 2,
            updatedNormY * screenH - curH3D / 2,
            0.003
          );
          cursorMesh.updateMatrix();
        });
      }

      // LIGHTS & SHADOW (Calibrated studio lighting - soft, moody, zero keyboard blowout)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
      scene.add(ambientLight);

      // Key light: angled from side/front at gentle 0.85 intensity (eliminates harsh keyboard glare)
      const keyLight = new THREE.DirectionalLight(0xdbeafe, 0.85);
      keyLight.position.set(4, 3.5, 4.5);
      scene.add(keyLight);

      // Soft rim light
      const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
      rimLight.position.set(-4, 3, -3);
      scene.add(rimLight);

      // Soft rear fill light so the back lid and A logo are visible when rotated
      const backLight = new THREE.DirectionalLight(0x94a3b8, 1.0);
      backLight.position.set(0, 3.5, -6);
      scene.add(backLight);

      // Subtle, realistic screen glow radiance (initially 0 while screen is powered off)
      const screenGlowLight = new THREE.PointLight(0x2dd4bf, 0, 3.2);
      screenGlowLight.position.set(0, baseH / 2 + 0.5, -0.2);
      laptop.add(screenGlowLight);

      // Lock static transform matrices on all 15 non-moving child meshes & lights
      // Eliminates 15 redundant Matrix4 local-to-world recomputations every single frame!
      const staticLaptopNodes = [
        baseMesh, wellMesh, keyGroup, keyboardPlaneMesh,
        trackpad, trackpadBorder, hinge,
        lidBack, bezelFrame, logoMesh, screenMesh, cursorMesh,
        ambientLight, rimLight, backLight, screenGlowLight
      ];
      for (let i = 0; i < staticLaptopNodes.length; i++) {
        staticLaptopNodes[i].updateMatrix();
        staticLaptopNodes[i].matrixAutoUpdate = false;
      }

      laptop.rotation.x = 0.35;
      laptop.rotation.y = -0.07;

      let isDragging = false, prevMouse = { x: 0, y: 0 };
      let mouseNorm = { x: 0, y: 0 };
      let targetRot = { x: 0.35, y: -0.07 };
      let prevKeyLightX = 4.0, prevKeyLightY = 3.5;
      const trackRangeX = 0.24;
      const trackRangeY = 0.20;
      const trackRoll = 0.04;
      let isTouch = false, touchStart = { x: 0, y: 0 }, touchLock3D = false;

      canvas.addEventListener('pointerdown', (e) => {
        isTouch = (e.pointerType === 'touch');
        isDragging = true;
        touchLock3D = false;
        touchStart = { x: e.clientX, y: e.clientY };
        prevMouse = { x: e.clientX, y: e.clientY };
      });

      // Responsive cursor tracking across the window
      window.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'touch') {
          // Normalize cursor from -1 to 1 with smooth clamp
          const nx = (e.clientX / window.innerWidth) * 2 - 1;
          const ny = -(e.clientY / window.innerHeight) * 2 + 1;
          mouseNorm.x = Math.max(-1, Math.min(1, nx));
          mouseNorm.y = Math.max(-1, Math.min(1, ny));
        }

        if (isDragging) {
          const dx = e.clientX - prevMouse.x;
          const dy = e.clientY - prevMouse.y;

          if (isTouch) {
            if (isModalOpen) {
              // Full 360° touch rotation in dedicated fullscreen 3D viewer
              targetRot.y += dx * 0.009;
              targetRot.x += dy * 0.009;
            } else {
              // Normal in-page touch: Allow vertical page scrolling to take priority
              const totalDx = Math.abs(e.clientX - touchStart.x);
              const totalDy = Math.abs(e.clientY - touchStart.y);

              // If gesture is mainly vertical, release 3D drag so page scrolls smoothly!
              if (!touchLock3D && totalDy > totalDx && totalDy > 7) {
                isDragging = false;
                return;
              }
              if (totalDx > 9) {
                touchLock3D = true; // Lock into horizontal 3D rotation
              }
              targetRot.y += dx * 0.009;
            }
          } else {
            targetRot.y += dx * 0.008;
            targetRot.x += dy * 0.008;
          }
          prevMouse = { x: e.clientX, y: e.clientY };
        }
      }, { passive: true });

      // Gently ease cursor influence back to center if pointer exits window
      document.addEventListener('mouseleave', () => {
        mouseNorm.x = 0;
        mouseNorm.y = 0;
      });

      window.addEventListener('pointerup', () => { isDragging = false; touchLock3D = false; });
      window.addEventListener('pointercancel', () => { isDragging = false; touchLock3D = false; });

      // Inertial scroll-drift damping (Weightless Zero-G air resistance)
      let laptopScrollY = window.scrollY || 0;
      let targetLaptopScrollY = laptopScrollY;
      let laptopScrollVelocity = 0;

      window.addEventListener('scroll', () => {
        targetLaptopScrollY = window.scrollY || 0;
      }, { passive: true });

      function handleResize() {
        if (!container || !camera || !renderer) return;
        const isFullscreen = container.classList.contains('is-fullscreen-modal');
        const w = isFullscreen ? window.innerWidth : container.clientWidth;
        const h = isFullscreen ? window.innerHeight : container.clientHeight;
        if (w > 50 && h > 50) {
          const aspect = w / h;
          camera.aspect = aspect;
          const isMobile = window.innerWidth <= 900;
          const vfovRad = (camera.fov * Math.PI) / 180;

          if (isFullscreen) {
            // FULLSCREEN 3D VIEWER: Dynamic responsive framing for ANY phone screen size
            // Scale model and position camera so the entire laptop (screen + keyboard deck)
            // fits with 18% clean margins on all 4 sides and NEVER touches or exceeds boundaries!
            const scale = 0.54;
            laptop.scale.set(scale, scale, scale);
            const laptopW = 3.2 * scale;
            const targetVisibleW = laptopW / 0.74;
            const fitZ = targetVisibleW / (2 * Math.tan(vfovRad / 2) * Math.min(aspect, 1.0));
            const camZ = Math.max(5.8, Math.min(9.2, fitZ));
            camera.position.set(0, 0.42, camZ);
          } else if (isMobile) {
            // IN-PAGE MOBILE VIEW: Fit comfortably within .laptop-stage without clipping boundaries
            const scale = 0.62;
            laptop.scale.set(scale, scale, scale);
            const laptopW = 3.2 * scale;
            const targetVisibleW = laptopW / 0.74;
            const fitZ = targetVisibleW / (2 * Math.tan(vfovRad / 2) * Math.min(aspect, 1.1));
            const camZ = Math.max(5.8, Math.min(8.5, fitZ));
            camera.position.set(0, 0.70, camZ);
          } else {
            // DESKTOP WIDESCREEN: Original pristine desktop framing
            laptop.scale.set(0.78, 0.78, 0.78);
            camera.position.set(0, 1.25, 6.4);
          }

          camera.updateProjectionMatrix();
          renderer.setPixelRatio(getOptimalPixelRatio());
          renderer.setSize(w, h);
        }
      }
      window.addEventListener('resize', handleResize, { passive: true });

      // ===============================================================
      // MOBILE FULLSCREEN 3D LAPTOP VIEWER MODAL CONTROLLER
      // ===============================================================
      const openModalBtn = document.getElementById('openMobileLaptopModalBtn');
      const closeModalBtn = document.getElementById('closeLaptopModalBtn');
      const resetModalBtn = document.getElementById('resetLaptopModalBtn');
      let isModalOpen = false;

      function openLaptopModal() {
        if (!container) return;
        isModalOpen = true;
        container.classList.add('is-fullscreen-modal');
        document.body.classList.add('modal-scroll-lock');
        handleResize();
      }

      function closeLaptopModal() {
        if (!container) return;
        isModalOpen = false;
        container.classList.remove('is-fullscreen-modal');
        document.body.classList.remove('modal-scroll-lock');
        handleResize();
      }

      function resetLaptopModalView() {
        targetRot.y = 0.38;
        targetRot.x = 0.12;
        laptop.rotation.y = 0.38;
        laptop.rotation.x = 0.12;
        laptop.rotation.z = 0;
        laptop.position.set(0, 0, 0);
        handleResize();
      }

      if (openModalBtn) {
        openModalBtn.addEventListener('click', openLaptopModal);
      }
      if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeLaptopModal);
      }
      if (resetModalBtn) {
        resetModalBtn.addEventListener('click', resetLaptopModalView);
      }
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isModalOpen) closeLaptopModal();
      });

      // Pinch to zoom in fullscreen modal
      let pinchStartDist = 0;
      let initialCameraZ = 4.2;

      canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 2 && isModalOpen) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          pinchStartDist = Math.hypot(dx, dy);
          initialCameraZ = camera.position.z;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length === 2 && isModalOpen && pinchStartDist > 0) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const ratio = pinchStartDist / dist;
          camera.position.z = Math.max(2.5, Math.min(7.5, initialCameraZ * ratio));
        }
      }, { passive: true });

      // High-performance IntersectionObserver: completely halts rendering when scrolled out of view
      let laptopInView = true;

      // Silky Smooth & Elegant Unfold & Boot Timeline Parameters (Instant handoff, purely organic & fluid)
      const T_FOLD_PAUSE     = 0.0;   // Instant unfold handoff as intro dissolves: 0.0s
      const T_UNFOLD_DUR     = 1.05;  // Buttery-smooth opening duration: 1.05s
      const T_OPEN_OFF_PAUSE = 0.05;  // Natural boot wake delay: 0.05s
      const T_POWER_DUR      = 0.55;  // Silky smooth OLED display fade: 0.55s

      const tUnfoldStart = T_FOLD_PAUSE;
      const tUnfoldEnd   = tUnfoldStart + T_UNFOLD_DUR;
      const tPowerStart  = tUnfoldEnd + T_OPEN_OFF_PAUSE;
      const tPowerEnd    = tPowerStart + T_POWER_DUR;

      let clock2 = new THREE.Clock(false);
      let lastCursorBlink = 0;
      let cursorVisibleState = true;
      let laptopRunning = false;
      let screenFullyOn = false;

      if ('IntersectionObserver' in window) {
        const laptopObserver = new IntersectionObserver((entries) => {
          laptopInView = entries[0].isIntersecting;
          if (laptopInView) {
            __masterLoop.schedule();
          }
        }, { threshold: 0.02 });
        laptopObserver.observe(canvas);
      }

      function animate() {
        const elapsed = clock2.getElapsedTime();

        // Heavy-to-Light State Transition: Once boot sequence completes at tPowerEnd (1.65s),
        // permanently lock lidGroup matrix and bypass all unfold/fade trigonometry!
        if (!screenFullyOn) {
          // 1. KINEMATIC LID POSITIONING (ORGANIC HARMONIC GLIDE • ZERO ACCELERATION SNAP)
          if (elapsed < tUnfoldStart) {
            lidGroup.rotation.x = closedLidAngle;
          } else if (elapsed < tUnfoldEnd) {
            const p = (elapsed - tUnfoldStart) / T_UNFOLD_DUR;
            const ease = 0.5 - 0.5 * Math.cos(Math.PI * p);
            lidGroup.rotation.x = closedLidAngle + (openLidAngle - closedLidAngle) * ease;
          } else {
            lidGroup.rotation.x = openLidAngle;
          }

          // 2. SCREEN POWER & DISPLAY STATE (SILKY SMOOTH GRADUAL HARDWARE FADE-IN)
          if (elapsed < tPowerStart) {
            screenMaterial.color.setRGB(0, 0, 0);
            screenGlowLight.intensity = 0;
            if (cursorMesh) cursorMesh.visible = false;
          } else if (elapsed < tPowerEnd) {
            const pRaw = (elapsed - tPowerStart) / T_POWER_DUR;
            const p = 0.5 - 0.5 * Math.cos(Math.PI * pRaw);
            screenMaterial.color.setRGB(p, p, p);
            screenGlowLight.intensity = 0.35 * p;
            if (cursorMesh) cursorMesh.visible = false;
          } else {
            // Transition to Light State: Lock lidGroup matrix & finalize OLED screen power
            screenFullyOn = true;
            lidGroup.rotation.x = openLidAngle;
            lidGroup.updateMatrix();
            lidGroup.matrixAutoUpdate = false;
            screenMaterial.color.setRGB(1, 1, 1);
            screenGlowLight.intensity = 0.35;
            if (cursorMesh) cursorMesh.visible = true;
            lastCursorBlink = elapsed;
          }
        } else {
          // Light State: Subtle, lightweight cursor blink toggled via 3D mesh visibility (ZERO texture re-upload churn!)
          if (elapsed - lastCursorBlink > 0.52) {
            lastCursorBlink = elapsed;
            cursorVisibleState = !cursorVisibleState;
            if (cursorMesh) cursorMesh.visible = cursorVisibleState;
          }
        }

        // Kinetic scroll inertia and delay damping
        const prevLaptopScroll = laptopScrollY;
        laptopScrollY += (targetLaptopScrollY - laptopScrollY) * 0.05;
        laptopScrollVelocity = (laptopScrollY - prevLaptopScroll);

        // Zero-G Harmonic Weightless Float (Multi-axis sinusoidal bobbing - Zero GPU Cost)
        const zeroGBobY = Math.sin(elapsed * 1.3) * 0.075 + Math.sin(elapsed * 2.6) * 0.018;
        const zeroGBobX = Math.cos(elapsed * 1.0) * 0.035;
        const zeroGDriftTilt = Math.sin(elapsed * 0.85) * 0.02;

        // Inertial scroll tilt lag (gently pushes back as if drifting in atmospheric friction)
        const scrollInertiaPitch = -Math.max(-0.25, Math.min(0.25, laptopScrollVelocity * 0.007));

        if (isModalOpen) {
          laptop.rotation.y += (targetRot.y - laptop.rotation.y) * 0.12;
          laptop.rotation.x += (targetRot.x - laptop.rotation.x) * 0.12;
          laptop.rotation.z += (0 - laptop.rotation.z) * 0.10;
          laptop.position.x += (0 - laptop.position.x) * 0.10;
          laptop.position.y += (0 - laptop.position.y) * 0.10;
        } else if (!isDragging) {
          const destRotY = targetRot.y + mouseNorm.x * trackRangeX + zeroGDriftTilt;
          const destRotX = targetRot.x - mouseNorm.y * trackRangeY + scrollInertiaPitch;
          const destRotZ = mouseNorm.x * trackRoll;

          // Silky 0.045 damping: luxury smooth floating follow without any snappy jerk
          laptop.rotation.y += (destRotY - laptop.rotation.y) * 0.045;
          laptop.rotation.x += (destRotX - laptop.rotation.x) * 0.045;
          laptop.rotation.z += (destRotZ - laptop.rotation.z) * 0.045;

          // Subtly float position toward cursor + zero-G floating bobbing
          const baseOffset = 0;
          const destPosX = baseOffset + mouseNorm.x * 0.16 + zeroGBobX;
          const destPosY = zeroGBobY + mouseNorm.y * 0.12 - (laptopScrollVelocity * 0.005);
          laptop.position.x += (destPosX - laptop.position.x) * 0.045;
          laptop.position.y += (destPosY - laptop.position.y) * 0.045;
        } else {
          // Smooth rotation when user is actively dragging
          const baseOffset = 0;
          laptop.rotation.y += (targetRot.y - laptop.rotation.y) * 0.10;
          laptop.rotation.x += (targetRot.x - laptop.rotation.x) * 0.10;
          laptop.rotation.z += (0 - laptop.rotation.z) * 0.08;
          laptop.position.x += (baseOffset - laptop.position.x) * 0.08;
          laptop.position.y = zeroGBobY;
        }

        // Dynamic light reflection that glides gently across aluminum chassis (gated when pointer is stationary)
        const targetKeyX = 4.0 + mouseNorm.x * 1.2;
        const targetKeyY = 3.5 + mouseNorm.y * 1.0;
        if (Math.abs(targetKeyX - prevKeyLightX) > 0.0005 || Math.abs(targetKeyY - prevKeyLightY) > 0.0005) {
          keyLight.position.x = targetKeyX;
          keyLight.position.y = targetKeyY;
          prevKeyLightX = targetKeyX;
          prevKeyLightY = targetKeyY;
        }

        renderer.render(scene, camera);
      }

      __masterLoop.register(
        'laptop',
        () => laptopRunning && laptopInView,
        animate
      );

      // Pre-compile shaders and render 1 static frame into VRAM ahead of time
      laptop.rotation.y = targetRot.y;
      laptop.rotation.x = targetRot.x;
      lidGroup.rotation.x = closedLidAngle;
      renderer.compile(scene, camera);
      renderer.render(scene, camera);

      window.__startLaptop = function() {
        if (laptopRunning) return;
        laptopRunning = true;
        clock2 = new THREE.Clock();
        clock2.start();
        canvas.classList.add('is-ready');
        __masterLoop.schedule();
      };

      window.__laptopRef = { laptop, lidGroup, scene, camera, renderer };
      window.__laptopDebug = function() {
        return {
          laptopRunning,
          laptopInView,
          laptopRafId: (laptopRunning && laptopInView) ? __masterLoop.getRafId() : 0,
          elapsed: clock2 ? clock2.getElapsedTime() : 0,
          lidRotX: lidGroup ? lidGroup.rotation.x : null,
          laptopRotX: laptop ? laptop.rotation.x : null,
          laptopRotY: laptop ? laptop.rotation.y : null,
          laptopRotZ: laptop ? laptop.rotation.z : null,
          screenColor: screenMaterial ? screenMaterial.color.getHexString() : null,
          glowIntensity: screenGlowLight ? screenGlowLight.intensity : null,
          screenFullyOn
        };
      };

      if (!document.getElementById('brandIntroOverlay')) {
        window.__startLaptop();
      }
    }

/* ==================== main.js ==================== */
/* 4. MASTER PRODUCTION BOOTSTRAPPER (STAGGERED IDLE PRE-WARM FOR ZERO-JANK INTRO) */
    let spaceRingsBooted = false;
    let smallOrbBooted = false;
    let laptopBooted = false;

    function bootSpaceRingsSafe() {
      if (spaceRingsBooted) return;
      spaceRingsBooted = true;
      try { initSpaceOrbitRings(); } catch (err) { console.warn("Space orbit rings error:", err); }
    }

    function bootSmallOrbSafe() {
      if (smallOrbBooted) return;
      smallOrbBooted = true;
      try { initSmallShinyOrb(); } catch (err) { console.warn("Small orb error:", err); }
    }

    function bootLaptopSafe() {
      if (laptopBooted) return;
      laptopBooted = true;
      try { initLaptopStage(); } catch (err) { console.warn("Laptop error:", err); }
    }

    function boot3DAllImmediate() {
      if (typeof THREE === 'undefined') {
        setTimeout(boot3DAllImmediate, 60);
        return;
      }
      bootSpaceRingsSafe();
      bootSmallOrbSafe();
      bootLaptopSafe();
    }

    window.__start3DScenes = function() {
      boot3DAllImmediate();
      if (typeof window.__startSpaceOrbitRings === 'function') window.__startSpaceOrbitRings();
      if (typeof window.__startSmallOrb === 'function') window.__startSmallOrb();
      if (typeof window.__startLaptop === 'function') window.__startLaptop();
    };

    // If overlay does not exist on page, boot and start all scenes immediately
    if (!document.getElementById('brandIntroOverlay')) {
      window.__start3DScenes();
    } else {
      // Stagger heavy canvas/VRAM initialization across separate animation frames during the calm
      // early phase of the brand intro so the intro SVG/CSS animations never drop a single frame!
      const staggerBoot = () => {
        if (typeof THREE === 'undefined') {
          setTimeout(staggerBoot, 60);
          return;
        }
        requestAnimationFrame(() => {
          bootSpaceRingsSafe();
          requestAnimationFrame(() => {
            bootSmallOrbSafe();
            setTimeout(() => {
              requestAnimationFrame(() => {
                bootLaptopSafe();
              });
            }, 80);
          });
        });
      };
      staggerBoot();

      // Defensive safety fallback after 4.5s
      setTimeout(() => {
        window.__start3DScenes();
      }, 4500);
    }

/* ==================== audio.js ==================== */
/* ================================================================
   5. SEAMLESS AMBIENT SOUND CONTROLLER (DRIVEN BY QUANTUM ORB CORE)
   ================================================================ */
(() => {
  const audio = document.getElementById('ambientAudio');
  const orbWidget = document.getElementById('quantumOrbWidget');
  const orbStateText = document.getElementById('orbAudioStateText');
  const toast = document.getElementById('audioToast');
  const toastPlayBtn = document.getElementById('audioToastPlayBtn');
  const toastDismissBtn = document.getElementById('audioToastDismissBtn');

  if (!audio) return;

  let isPlaying = false;
  let isActivating = false;
  let fadeTimer = null;
  const TARGET_VOL = 0.22; // Comfortable, non-intrusive 22% background volume
  audio.volume = 0; // Starts at 0 for silky smooth fade-in

  function triggerWidgetClickFx() {
    if (!orbWidget) return;
    orbWidget.classList.remove('is-clicked', 'ripple-active');
    void orbWidget.offsetWidth; // Force CSS reflow to replay spring & shockwave
    orbWidget.classList.add('is-clicked', 'ripple-active');
    setTimeout(() => {
      if (orbWidget) orbWidget.classList.remove('ripple-active');
    }, 650);
  }

  function fadeAudio(targetVolume, durationMs, onDone) {
    if (fadeTimer) clearInterval(fadeTimer);
    const startVol = audio.volume;
    const diff = targetVolume - startVol;
    const steps = 25;
    const stepTime = durationMs / steps;
    let currentStep = 0;

    fadeTimer = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(0, Math.min(1, startVol + diff * (currentStep / steps)));
      if (currentStep >= steps) {
        clearInterval(fadeTimer);
        fadeTimer = null;
        audio.volume = targetVolume;
        if (onDone) onDone();
      }
    }, stepTime);
  }

  function updateUI(playing) {
    if (orbWidget) {
      orbWidget.classList.remove('is-activating');
      orbWidget.setAttribute('aria-pressed', playing ? 'true' : 'false');
      if (playing) {
        orbWidget.classList.add('is-audio-playing');
        orbWidget.setAttribute('title', 'Click to pause ambient soundtrack');
        if (orbStateText) orbStateText.textContent = 'AUDIO ACTIVE // TAP TO PAUSE';
      } else {
        orbWidget.classList.remove('is-audio-playing');
        orbWidget.setAttribute('title', 'Click to play ambient soundtrack');
        if (orbStateText) orbStateText.textContent = 'SOUND CORE // TAP TO PLAY';
      }
    }
    if (typeof window.__setOrbAudioPlaying === 'function') {
      window.__setOrbAudioPlaying(playing);
    }
  }

  function startPlayback() {
    if (isPlaying) return;
    isActivating = true;

    // Instant 0ms visual activation feedback
    if (orbWidget) {
      orbWidget.classList.add('is-activating');
      if (orbStateText) orbStateText.textContent = 'INITIALIZING CORE...';
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isPlaying = true;
        isActivating = false;
        updateUI(true);
        fadeAudio(TARGET_VOL, 800);
        if (toast) toast.classList.add('hidden');
      }).catch((err) => {
        isActivating = false;
        if (orbWidget) orbWidget.classList.remove('is-activating');
        console.log("Audio awaiting user interaction / deferred:", err.message);
      });
    }
  }

  function pausePlayback() {
    if (!isPlaying) return;
    if (orbWidget) {
      if (orbStateText) orbStateText.textContent = 'PAUSING CORE...';
    }
    fadeAudio(0, 350, () => {
      audio.pause();
      isPlaying = false;
      updateUI(false);
    });
  }

  function togglePlayback() {
    // 1. Instant tactile shockwave & spring animation
    triggerWidgetClickFx();

    // 2. Quantum flash & core acceleration
    if (typeof window.__triggerOrbQuantumFlash === 'function') {
      window.__triggerOrbQuantumFlash();
    }

    // 3. Toggle audio state
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }

  if (orbWidget) {
    orbWidget.addEventListener('click', togglePlayback);
  }

  if (toastPlayBtn) {
    toastPlayBtn.addEventListener('click', () => {
      triggerWidgetClickFx();
      if (typeof window.__triggerOrbQuantumFlash === 'function') {
        window.__triggerOrbQuantumFlash();
      }
      startPlayback();
    });
  }

  if (toastDismissBtn) {
    toastDismissBtn.addEventListener('click', () => {
      if (toast) toast.classList.add('hidden');
    });
  }

  // Gracefully hide toast after 14 seconds if untouched
  setTimeout(() => {
    if (!isPlaying && toast) {
      toast.classList.add('hidden');
    }
  }, 14000);
})();

/* ==================== nav.js ==================== */
/* 1. INTERACTIVE ONE-CLICK EMAIL COPY, CONTACT FORM & LIVE WEBGL PROFILER */
    (() => {
      const copyBtn = document.getElementById('copyEmailBtn');
      const copyEmailText = document.getElementById('copyEmailText');
      const mobileEmailLink = document.getElementById('mobileDirectEmailLink');
      const label = document.getElementById('copyBtnLabel');

      if (mobileEmailLink) {
        mobileEmailLink.addEventListener('click', (e) => {
          e.preventDefault();
          const email = ['anmol', 'kumar', '2762'].join('') + String.fromCharCode(64) + ['gmail', 'com'].join('.');
          window.location.href = 'mailto:' + email;
        });
      }

      if (copyBtn && label) {
        copyBtn.addEventListener('click', () => {
          const email = ['anmol', 'kumar', '2762'].join('') + String.fromCharCode(64) + ['gmail', 'com'].join('.');
          if (copyEmailText) {
            copyEmailText.textContent = email;
          }
          copyBtn.setAttribute('aria-label', 'Copy email address ' + email + ' to clipboard');
          navigator.clipboard.writeText(email).then(() => {
            label.textContent = 'Copied! ✓';
            label.classList.add('is-copied');
            setTimeout(() => {
              label.textContent = 'Copy ⧉';
              label.classList.remove('is-copied');
            }, 2500);
          });
        });
      }

      // Real-Time Browser Frame Rate & WebGL Renderer Profiler (Section 04)
      const fpsChip = document.getElementById('hudFpsChip');
      const frameTimeChip = document.getElementById('hudFrameTimeChip');
      const webglChip = document.getElementById('hudWebglChip');
      const profilerOutput = document.getElementById('hudLiveProfilerOutput');
      const hudCard = document.getElementById('hudTerminalCard');

      if (fpsChip && frameTimeChip && hudCard) {
        let hudVisible = false;
        let frameCount = 0;
        let lastSampleTime = performance.now();

        function sampleHudMetrics(now) {
          frameCount++;
          const elapsed = now - lastSampleTime;

          // Update DOM at most once every 600ms to guarantee 0 layout/paint overhead
          if (elapsed >= 600) {
            const fps = Math.round((frameCount * 1000) / elapsed);
            const msPerFrame = (elapsed / frameCount).toFixed(1);
            fpsChip.textContent = `● ${fps} FPS`;
            frameTimeChip.textContent = `${msPerFrame}ms / FRAME`;

            const laptopRenderer = window.__laptopRef && window.__laptopRef.renderer;
            if (laptopRenderer && laptopRenderer.info) {
              if (webglChip) {
                webglChip.textContent = laptopRenderer.capabilities.isWebGL2 ? 'WEBGL 2.0' : 'WEBGL 1.0';
              }
              if (profilerOutput) {
                const geoms = laptopRenderer.info.memory.geometries;
                const texs = laptopRenderer.info.memory.textures;
                const progs = laptopRenderer.info.programs ? laptopRenderer.info.programs.length : 3;
                profilerOutput.textContent = `## main • WebGL VRAM: ${geoms} geometries, ${texs} textures, ${progs} compiled shaders (${fps} FPS)`;
              }
            }

            frameCount = 0;
            lastSampleTime = now;
          }
        }

        __masterLoop.register(
          'hudTelemetry',
          () => hudVisible,
          sampleHudMetrics
        );

        if ('IntersectionObserver' in window) {
          const hudObs = new IntersectionObserver((entries) => {
            const wasVisible = hudVisible;
            hudVisible = entries[0].isIntersecting;
            if (hudVisible && !wasVisible) {
              frameCount = 0;
              lastSampleTime = performance.now();
              __masterLoop.schedule();
            }
          }, { threshold: 0.05 });
          hudObs.observe(hudCard);
        }
      }

      const form = document.getElementById('contactForm');
      const status = document.getElementById('formStatus');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const n = document.getElementById('name').value.trim();
        const em = document.getElementById('email').value.trim();
        const msg = document.getElementById('message').value.trim();

        if (!n || !em || !msg) {
          status.className = 'form-status error';
          status.textContent = 'Please fill out all fields.';
          return;
        }

        const email = ['anmol', 'kumar', '2762'].join('') + String.fromCharCode(64) + ['gmail', 'com'].join('.');
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent("Message from " + n)}&body=${encodeURIComponent(msg + "\n\nFrom: " + n + " (" + em + ")")}`;
        window.location.href = mailtoLink;

        status.className = 'form-status success';
        status.textContent = 'Opening your email client... Or copy the email directly above!';
      });
    })();

/* ================================================================
       6. MOBILE NAVIGATION DRAWER CONTROLLER
       ================================================================ */
    (() => {
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      const mobileDrawer = document.getElementById('mobileMenuDrawer');
      const mobileBackdrop = document.getElementById('mobileMenuBackdrop');
      const mobileLinks = document.querySelectorAll('.mobile-nav-link');

      if (!mobileMenuBtn || !mobileDrawer) return;

      function openDrawer() {
        mobileMenuBtn.classList.add('is-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileDrawer.classList.add('is-open');
        if (mobileBackdrop) mobileBackdrop.classList.add('is-open');
        document.body.classList.add('is-scroll-locked'); // Prevent background scrolling while open
      }

      function closeDrawer() {
        mobileMenuBtn.classList.remove('is-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileDrawer.classList.remove('is-open');
        if (mobileBackdrop) mobileBackdrop.classList.remove('is-open');
        document.body.classList.remove('is-scroll-locked');
      }

      mobileMenuBtn.addEventListener('click', () => {
        if (mobileDrawer.classList.contains('is-open')) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });

      if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', closeDrawer);
      }

      mobileLinks.forEach((link) => {
        link.addEventListener('click', () => {
          closeDrawer();
        });
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
          closeDrawer();
        }
      });
    })();

/* ==================== intro.js ==================== */
/* ================================================================
   7. CINEMATIC BRAND INTRO MOTION CONTROLLER & SMOOTH TRANSITION
   ================================================================ */
(() => {
  const overlay = document.getElementById('brandIntroOverlay');
  const glow = document.getElementById('introGlow');
  const emblem = document.getElementById('introEmblem');
  const hudRing = document.getElementById('introHudRing');
  const shockwave = document.getElementById('introShockwave');
  const sheen = document.getElementById('introSheenBeam');
  const wordmark = document.getElementById('introWordmark');
  const laser = document.getElementById('introLaser');
  const bootLine = document.getElementById('introBootLine');

  if (!overlay) return;

  document.body.classList.add('is-scroll-locked');

  let isCompleted = false;
  function triggerZoomThroughTransition() {
    if (isCompleted) return;
    isCompleted = true;

    // 1. Instantly trigger 3D laptop unfold & scenes the exact millisecond dissolve begins!
    if (typeof window.__start3DScenes === 'function') {
      window.__start3DScenes();
    }

    // 2. Silky smooth GPU depth dissolve into hero workstation
    overlay.classList.add('is-zoom-through');
    document.body.classList.remove('is-scroll-locked');

    setTimeout(() => {
      overlay.remove();
    }, 650);
  }

  // Smooth click/tap anywhere on intro overlay to bypass immediately
  overlay.addEventListener('click', triggerZoomThroughTransition);

  // --- STAGE 1: CALM ATMOSPHERIC GLOW & GYRO RING (T+100ms) ---
  setTimeout(() => {
    if (hudRing) hudRing.classList.add('is-active');
    if (glow) glow.classList.add('is-active');
  }, 100);

  // --- STAGE 2: TITANIUM DUAL-WING AERODYNAMIC ASSEMBLY (T+450ms) ---
  setTimeout(() => {
    if (emblem) emblem.classList.add('is-assembled');
  }, 450);

  // --- STAGE 3: ELECTROMAGNETIC SEAM LOCK & SOFT PULSE (T+1150ms) ---
  setTimeout(() => {
    if (shockwave) shockwave.classList.add('is-pulsed');
  }, 1150);

  // --- STAGE 4: SPECULAR TITANIUM SHEEN GLEAM (T+1450ms) ---
  setTimeout(() => {
    if (sheen) {
      sheen.classList.add('intro-sheen-active');
      setTimeout(() => { sheen.classList.add('is-hidden-display'); }, 1100);
    }
  }, 1450);

  // --- STAGE 5: ELEGANT "ANMOL" WORDMARK REVEAL (T+1750ms) ---
  setTimeout(() => {
    if (wordmark) wordmark.classList.add('is-revealed');
  }, 1750);

  // --- STAGE 6: SUBTLE LIGHT SWEEP, STATUS LINE & ZERO-G BREATHER (T+2200ms) ---
  setTimeout(() => {
    if (laser) {
      laser.classList.add('is-active');
      setTimeout(() => { laser.classList.add('is-hidden-display'); }, 1000);
    }
    if (bootLine) bootLine.classList.add('is-visible');
    if (emblem) emblem.classList.add('is-floating');
  }, 2200);

  // --- STAGE 7: CALM APPRECIATION HOLD -> SILKY DISSOLVE TO HERO WORKSTATION (T+3350ms) ---
  setTimeout(() => {
    triggerZoomThroughTransition();
  }, 3350);
})();
