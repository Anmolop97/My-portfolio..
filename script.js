

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

      let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      let width = window.innerWidth;
      let height = window.innerHeight;

      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });

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
        { baseR: 1820, ecc: 0.67, hasCompanion: true,  lineWidth: 2.6, dash: null },
        { baseR: 2340, ecc: 0.68, hasCompanion: false, lineWidth: 2.8, dash: [16, 20] },
        { baseR: 2960, ecc: 0.69, hasCompanion: true,  lineWidth: 2.6, dash: null },
        { baseR: 3700, ecc: 0.70, hasCompanion: false, lineWidth: 3.0, dash: null },
        { baseR: 4550, ecc: 0.70, hasCompanion: true,  lineWidth: 2.8, dash: null },
        { baseR: 5500, ecc: 0.71, hasCompanion: false, lineWidth: 2.8, dash: [20, 24] }
      ];

      // 2. CELESTIAL PLANETS & 4PX GLOWING BINDUS (Harmonious Locked Spacing Across All 12 Orbits)
      // 4th & 5th lines increased in bindu count; locked speeds for constant aesthetic distance!
      const CELESTIAL_CONFIG = [
        { orbitIdx: 0,  count: 1, speed: 0.32,   hasSatellite: false, hasPulsar: false, color: '#38bdf8' },
        { orbitIdx: 1,  count: 2, speed: -0.25,  hasSatellite: true,  hasPulsar: false, color: '#38bdf8' },
        { orbitIdx: 2,  count: 3, speed: 0.21,   hasSatellite: false, hasPulsar: true,  color: '#2dd4bf' },
        { orbitIdx: 3,  count: 6, speed: -0.17,  hasSatellite: true,  hasPulsar: false, color: '#60a5fa' }, // 4th line increased!
        { orbitIdx: 4,  count: 8, speed: 0.14,   hasSatellite: true,  hasPulsar: true,  color: '#38bdf8' }, // 5th line increased!
        { orbitIdx: 5,  count: 5, speed: -0.12,  hasSatellite: true,  hasPulsar: false, color: '#2dd4bf' },
        { orbitIdx: 6,  count: 5, speed: 0.10,   hasSatellite: false, hasPulsar: true,  color: '#38bdf8' },
        { orbitIdx: 7,  count: 6, speed: -0.085, hasSatellite: true,  hasPulsar: false, color: '#60a5fa' },
        { orbitIdx: 8,  count: 6, speed: 0.07,   hasSatellite: false, hasPulsar: true,  color: '#38bdf8' },
        { orbitIdx: 9,  count: 6, speed: -0.06,  hasSatellite: true,  hasPulsar: false, color: '#2dd4bf' },
        { orbitIdx: 10, count: 7, speed: 0.05,   hasSatellite: false, hasPulsar: true,  color: '#60a5fa' },
        { orbitIdx: 11, count: 7, speed: -0.042, hasSatellite: true,  hasPulsar: false, color: '#38bdf8' }
      ];

      const CELESTIAL_NODES = [];
      // Scientific telemetry callsigns for zero-G orbital nodes
      const TELEMETRY_CALLSIGNS = [
        'ORB-SYS.ALPHA', 'ION-CORE.01', 'VEL-7.8k', 'STATION-01',
        'SPECTRA.9', 'ORB-SYS.BETA', 'PULSAR-X', 'VECTOR.FLUX',
        'ZERO-G.CORE', 'ECHO-SAT.03', 'ASTRO-7', 'CHRONO.SYNC'
      ];
      let labelCursor = 0;

      CELESTIAL_CONFIG.forEach(cfg => {
        const step = (Math.PI * 2) / cfg.count;
        for (let k = 0; k < cfg.count; k++) {
          const phase = k * step + ((cfg.orbitIdx * 0.45) % (Math.PI * 2));
          // Exactly identical speed for all nodes on the same orbit = LOCKED EQUIDISTANT SEPARATION!
          const isMoonPlanet = cfg.hasSatellite && (k === 0);
          const isPulsar = cfg.hasPulsar && (k % 2 === 1);
          // Flagship celestial anchors carry cybernetic micro-HUD callsigns
          const hasLabel = isMoonPlanet || (isPulsar && cfg.orbitIdx <= 6);
          const labelText = hasLabel ? (TELEMETRY_CALLSIGNS[labelCursor++ % TELEMETRY_CALLSIGNS.length]) : null;

          // Natural zero-G harmonic frequencies (individual sinusoidal bobbing offset)
          const floatSpeed = 1.2 + ((cfg.orbitIdx * 3 + k * 7) % 11) * 0.14;
          const floatOffset = ((cfg.orbitIdx * 1.7 + k * 2.3) % (Math.PI * 2));
          const floatAmp = isMoonPlanet ? 7.5 : (hasLabel ? 6.0 : 4.5);

          CELESTIAL_NODES.push({
            orbitIdx: cfg.orbitIdx,
            speed: cfg.speed, // Locked speed: no bunching or collisions!
            phase: phase,
            dir: cfg.speed > 0 ? 1 : -1,
            color: cfg.color,
            radius: isMoonPlanet ? 2.5 : 2.0, // 4px bindu (2.0) or focal micro-planet (2.5)
            isMoonPlanet: isMoonPlanet,
            isPulsar: isPulsar,
            hasLabel: hasLabel,
            labelText: labelText,
            wakeLen: 0.35,
            moonAngle: (k * 1.6),
            moonSpeed: 2.4,
            floatSpeed: floatSpeed,
            floatOffset: floatOffset,
            floatAmp: floatAmp,
            // Inertial scroll-lag tracking coordinates for weightless fluid drifting
            currentNx: 0,
            currentNy: 0,
            isInitialized: false
          });
        }
      });

      // 3. SCROLL-TRIGGERED METEOROIDS (Shooting stars passing ONLY when scrolling is active!)
      const meteors = [];
      let meteorCooldown = 0;

      function spawnMeteor() {
        // High-velocity diagonal shooting star trajectory crossing through the orbits
        const angle = -0.44 + (Math.random() - 0.5) * 0.26;
        const startX = width * (0.30 + Math.random() * 0.70);
        const startY = height * (Math.random() * 0.40);
        const speed = 22 + Math.random() * 16;
        const tailLength = 110 + Math.random() * 130;
        meteors.push({
          x: startX,
          y: startY,
          vx: -Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 1.35,
          len: tailLength,
          life: 1.0,
          decay: 0.024 + Math.random() * 0.016,
          width: 2.2 + Math.random() * 1.0
        });
      }

      let startTime = performance.now();
      let isRunning = false;

      function draw(now) {
        if (!isRunning) return;
        requestAnimationFrame(draw);
        if (document.hidden) return; // Skip canvas compute when browser tab is inactive

        const t = (now - startTime) * 0.001;

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
          if (meteorCooldown <= 0 && meteors.length < 5) {
            spawnMeteor();
            meteorCooldown = 22; // Interval between shooting stars during scroll
          }
        } else {
          meteorCooldown = 0;
        }

        curMouseX += (mouseX - curMouseX) * 0.05;
        curMouseY += (mouseY - curMouseY) * 0.05;

        // Document metrics: 0.0 -> 1.0 across the entire website
        const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight * 2);
        const maxScroll = Math.max(docHeight - window.innerHeight, 1);
        const scrollPct = Math.min(Math.max(smoothScrollY / maxScroll, 0), 1);

        // Clear canvas
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        // -------------------------------------------------------------
        // UNIFIED CONCENTRIC ORIGIN (No secondary center, No spirals/criss-cross!)
        // -------------------------------------------------------------
        const originX = width * (0.92 - scrollPct * 0.20) + curMouseX * 16;
        const originY = height * (0.05 - scrollPct * 0.10) + curMouseY * 12;

        // Dynamic 3D inclination (Pure parallel orientation)
        const rot = -0.42 + scrollPct * 0.24 + Math.sin(t * 0.3) * 0.02 + curMouseY * 0.03;

        // Expansive radius scaling across the entire website
        const expansion = 1.0 + scrollPct * 1.85;
        const dynamicFlare = 1.0 + scrollGlow * 0.65;

        // =============================================================
        // A. CELESTIAL STELLAR ANCHOR (Clean cybernetic astrolabe core)
        // =============================================================
        const anchorGlow = ctx.createRadialGradient(originX, originY, 0, originX, originY, 28);
        anchorGlow.addColorStop(0, 'rgba(255, 255, 255, 0.90)');
        anchorGlow.addColorStop(0.3, 'rgba(56, 189, 248, 0.65)');
        anchorGlow.addColorStop(0.7, 'rgba(14, 165, 233, 0.20)');
        anchorGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.beginPath();
        ctx.arc(originX, originY, 28, 0, Math.PI * 2);
        ctx.fillStyle = anchorGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(originX, originY, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Rotating astrolabe crosshair spikes
        const astrolabeAngle = t * 0.15 + scrollPhase;
        for (let sp = 0; sp < 4; sp++) {
          const sa = astrolabeAngle + (sp * Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(originX - Math.cos(sa) * 4, originY - Math.sin(sa) * 4);
          ctx.lineTo(originX + Math.cos(sa) * 16, originY + Math.sin(sa) * 16);
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }

        // =============================================================
        // B. UNIFIED CONCENTRIC GLASSY SPACE ORBITS (PURE PARALLEL)
        // Sweeping completely across both Left & Right sides of website
        // =============================================================
        for (let i = 0; i < ORBITS.length; i++) {
          const orb = ORBITS[i];
          const curRx = orb.baseR * expansion;
          const curRy = curRx * orb.ecc;

          // User requested: 3rd, 4th, 5th line opacity increased + all lines more glowing!
          let ringAlpha;
          if (i <= 1) {
            // Lines 1 & 2 (Inner): Normal radiant opacity
            ringAlpha = 0.65 * dynamicFlare;
          } else if (i <= 4) {
            // Lines 3, 4, 5: Increased opacity as requested!
            ringAlpha = 0.78 * dynamicFlare;
          } else {
            // Lines 6 onwards (outer): Soft background depth fade
            const depthFade = 0.44 - (i - 5) * 0.018;
            ringAlpha = depthFade * dynamicFlare;
          }
          ringAlpha = Math.min(Math.max(ringAlpha, 0.18), 0.88);

          // Rich Frosted Glass & Electric Cyan Gradient with enhanced luminosity
          const grad = ctx.createLinearGradient(
            originX, originY,
            originX - curRx * 0.85, originY + curRy * 1.55
          );
          grad.addColorStop(0, `rgba(56, 189, 248, ${ringAlpha * 0.35})`);
          grad.addColorStop(0.28, `rgba(255, 255, 255, ${ringAlpha * 1.0})`); // Pure glowing white frost crest
          grad.addColorStop(0.55, `rgba(56, 189, 248, ${ringAlpha * 0.95})`); // Intense electric cyan
          grad.addColorStop(0.82, `rgba(45, 212, 191, ${ringAlpha * 0.80})`); // Starlight aurora teal
          grad.addColorStop(1, `rgba(56, 189, 248, ${ringAlpha * 0.28})`);

          // 1. Primary Orbit Track - Enhanced Glowing Aura
          ctx.save();
          ctx.beginPath();
          if (orb.dash) ctx.setLineDash(orb.dash);
          ctx.ellipse(originX, originY, curRx, curRy, rot, 0, Math.PI * 2);
          ctx.strokeStyle = grad;
          ctx.lineWidth = orb.lineWidth;
          if (i <= 4) {
            ctx.shadowColor = 'rgba(56, 189, 248, 0.82)'; // Rich neon cyan glow on primary focal orbits
            ctx.shadowBlur = 14;
          }
          ctx.stroke();
          ctx.restore();

          // 2. Companion Guide Track (Twin wire: 1.3px with luminous aura)
          if (orb.hasCompanion) {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(originX, originY, curRx + 5.5, (curRx + 5.5) * orb.ecc, rot, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(56, 189, 248, ${ringAlpha * 0.52})`;
            ctx.lineWidth = 1.3;
            if (i <= 4) {
              ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
              ctx.shadowBlur = 8;
            }
            ctx.stroke();
            ctx.restore();
          }

          // 3. Telemetry Astronomical Degree Ticks at 4 cardinal points
          const ticks = [0.22, 1.42, 2.82, 4.22];
          for (let k = 0; k < ticks.length; k++) {
            const a = ticks[k] + rot;
            const tx = originX + Math.cos(a) * curRx * Math.cos(rot) - Math.sin(a) * curRy * Math.sin(rot);
            const ty = originY + Math.cos(a) * curRx * Math.sin(rot) + Math.sin(a) * curRy * Math.cos(rot);
            const normAngle = a + Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(tx - Math.cos(normAngle) * 3.2, ty - Math.sin(normAngle) * 3.2);
            ctx.lineTo(tx + Math.cos(normAngle) * 3.2, ty + Math.sin(normAngle) * 3.2);
            ctx.strokeStyle = `rgba(224, 242, 254, ${ringAlpha * 0.75})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }

        // =============================================================
        // C. CELESTIAL PLANETS & 4PX GLOWING BINDUS (ON EVERY ORBIT LINE)
        // High-Tech Cybernetic Astro Reticles, Revolving Moons & Ion Wakes
        // =============================================================
        for (let b = 0; b < CELESTIAL_NODES.length; b++) {
          const node = CELESTIAL_NODES[b];
          const orb = ORBITS[node.orbitIdx];
          const curRx = orb.baseR * expansion;
          const curRy = curRx * orb.ecc;

          // Continuous silky angle progression
          const nodeAngle = node.phase + t * node.speed + scrollPhase * node.dir;
          const cosA = Math.cos(nodeAngle);
          const sinA = Math.sin(nodeAngle);
          const nx = originX + cosA * curRx * Math.cos(rot) - sinA * curRy * Math.sin(rot);
          const ny = originY + cosA * curRx * Math.sin(rot) + sinA * curRy * Math.cos(rot);

          // -----------------------------------------------------------
          // ZERO-G WEIGHTLESS PHYSICS & INERTIAL DRIFT (Zero GPU Cost)
          // -----------------------------------------------------------
          // Natural sinusoidal micro-bobbing offset (vertical Math.sin + horizontal Math.cos)
          const floatPhase = t * node.floatSpeed + node.floatOffset;
          const floatBobY = Math.sin(floatPhase) * node.floatAmp;
          const floatBobX = Math.cos(floatPhase * 0.85) * (node.floatAmp * 0.6);

          // Raw target orbital coordinates with floating offsets
          const targetNx = nx + floatBobX;
          const targetNy = ny + floatBobY;

          // First-frame initialization
          if (!node.isInitialized) {
            node.currentNx = targetNx;
            node.currentNy = targetNy;
            node.isInitialized = true;
          }

          // Inertia and Delay: Natural damping lerp simulates weightless floating in viscous space
          // Damping factor adapts during scroll: gives fluid inertial drift without lag
          const damping = scrollVelocity > 1.0 ? 0.075 : 0.095;
          node.currentNx += (targetNx - node.currentNx) * damping;
          node.currentNy += (targetNy - node.currentNy) * damping;

          const renderX = node.currentNx;
          const renderY = node.currentNy;

          // Viewport culling
          if (renderX < -110 || renderX > width + 110 || renderY < -110 || renderY > height + 110) continue;

          const themeColor = node.color || '#38bdf8';

          // 1. Soft Trailing Starlight / Ion Wake along ellipse track
          const trailStart = nodeAngle - (node.wakeLen * (node.speed > 0 ? 1 : -1));
          ctx.beginPath();
          ctx.ellipse(
            originX, originY, curRx, curRy, rot,
            Math.min(trailStart, nodeAngle), Math.max(trailStart, nodeAngle)
          );
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.46)';
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // 2. Concentric Cyan Target Reticle Halo
          const haloR = node.radius + 2.8;
          ctx.beginPath();
          ctx.arc(renderX, renderY, haloR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.90)';
          ctx.lineWidth = 1.1;
          ctx.shadowColor = themeColor;
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // 3. Special Feature: Revolving Micro-Moon Satellite OR Pulsar Radar Ripple
          if (node.isMoonPlanet) {
            // A. Miniature Orbit Ring for the Moon
            const moonOrbitR = 8.5;
            ctx.beginPath();
            ctx.arc(renderX, renderY, moonOrbitR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
            ctx.lineWidth = 0.7;
            ctx.stroke();

            // B. Revolving Micro-Moon (Tiny 1.2px diamond starlight satellite)
            const mA = node.moonAngle + t * node.moonSpeed;
            const mx = renderX + Math.cos(mA) * moonOrbitR;
            const my = renderY + Math.sin(mA) * moonOrbitR;
            ctx.beginPath();
            ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = themeColor;
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          } else if (node.isPulsar) {
            // Expanding Pulsar Radar Ripple
            const pulseR = 7.5 + Math.sin(t * 3.2 + b * 0.7) * 1.6;
            ctx.beginPath();
            ctx.arc(renderX, renderY, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          // 4. Solid Luminous White Core Bindu / Planet
          ctx.beginPath();
          ctx.arc(renderX, renderY, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = themeColor;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;

          // 5. Weightless Floating Micro-HUD Callout Label (Zero Overhead • Pure 2D Canvas)
          if (node.hasLabel && node.labelText) {
            // Slight delayed sway for label attachment
            const labelSwayY = Math.sin(floatPhase * 0.9 + 1.2) * 2.0;
            const labelX = renderX + 10;
            const labelY = renderY - 11 + labelSwayY;

            // Hairline leader connector line
            ctx.beginPath();
            ctx.moveTo(renderX + 4.5, renderY - 4.5);
            ctx.lineTo(labelX, labelY + 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Minimalist telemetry callout badge
            ctx.font = '600 8.5px "JetBrains Mono", monospace';
            const textWidth = ctx.measureText(node.labelText).width;
            
            ctx.fillStyle = 'rgba(10, 15, 24, 0.72)';
            ctx.fillRect(labelX - 2, labelY - 7.5, textWidth + 8, 11);
            
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(labelX - 2, labelY - 7.5, textWidth + 8, 11);

            ctx.fillStyle = '#bae6fd';
            ctx.fillText(node.labelText, labelX + 2, labelY + 1);
          }
        }

        // =============================================================
        // D. SCROLL-TRIGGERED METEOROIDS (SHOOTING STARS CROSSING ORBITS)
        // Activated exclusively during active user scrolling!
        // =============================================================
        for (let mIdx = meteors.length - 1; mIdx >= 0; mIdx--) {
          const m = meteors[mIdx];
          m.x += m.vx;
          m.y += m.vy;
          m.life -= m.decay;

          if (m.life <= 0 || m.x < -100 || m.y > height + 100) {
            meteors.splice(mIdx, 1);
            continue;
          }

          // Draw Meteoroid Tail (Luminous Ion Trail)
          const normVx = m.vx / Math.hypot(m.vx, m.vy);
          const normVy = m.vy / Math.hypot(m.vx, m.vy);
          const tailX = m.x - normVx * m.len;
          const tailY = m.y - normVy * m.len;

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
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Luminous White-Hot Meteoroid Head
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.width * 1.25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${m.life})`;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      window.__startSpaceOrbitRings = function() {
        if (isRunning) return;
        isRunning = true;
        startTime = performance.now();
        canvas.classList.add('is-ready');
        requestAnimationFrame(draw);
      };

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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(size, size);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;

      const orbGroup = new THREE.Group();
      scene.add(orbGroup);

      // 1. Small Ultra-Shiny Glossy Obsidian Sphere (Optimized 36x36 for 84px widget)
      const sphereGeom = new THREE.SphereGeometry(0.50, 36, 36);
      const sphereMat = new THREE.MeshPhysicalMaterial({
        color: 0x051329,         // Deep space obsidian with navy tint
        emissive: 0x010d22,      // Subtle quantum core bleed
        metalness: 0.94,         // Liquid mirror reflectance
        roughness: 0.04,         // Ultra-smooth mirror polish for dazzling shine
        clearcoat: 1.0,          // Diamond/automotive clearcoat
        clearcoatRoughness: 0.03,
        reflectivity: 1.0,
        transmission: 0.18,
        ior: 1.55
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

      // Interactive Click-Triggered Quantum Flash State & Audio Reactivity
      let flashEnergy = 0.0;
      let spinSpeedMultiplier = 1.0;
      let isAudioPlaying = false;
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

      let orbInView = true;
      if ('IntersectionObserver' in window) {
        const orbObserver = new IntersectionObserver((entries) => {
          orbInView = entries[0].isIntersecting;
        }, { threshold: 0.05 });
        orbObserver.observe(canvas);
      }

      const clock = new THREE.Clock();
      let running = false;
      let accumulatedTime = 0;

      function renderOrb() {
        if (!running) return;
        requestAnimationFrame(renderOrb);
        if (!orbInView || document.hidden) return; // Skip GPU draw when scrolled away or tab hidden
        const dt = Math.min(clock.getDelta(), 0.1);

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

        // Dynamic audio reactivity
        const audioWave = isAudioPlaying ? (Math.sin(t * 4.2) * 0.5 + 0.5) : 0;

        // Visual flash & sound wave response
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

        // Continuous majestic macro orbit drift + responsive cursor parallax tilt
        orbGroup.rotation.y = (t * 0.12) + (mouseX * 0.25);
        orbGroup.rotation.x = -mouseY * 0.20;

        // Zero-G Gentle Float (Sinusoidal weightless bobbing - Zero GPU Cost)
        orbGroup.position.y = Math.sin(t * 1.8) * 0.06;
        orbGroup.position.x = Math.cos(t * 1.3) * 0.035;

        renderer.render(scene, camera);
      }

      window.__startSmallOrb = function() {
        if (running) return;
        running = true;
        clock.start();
        renderOrb();
      };

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
      
      const isMobile = window.innerWidth <= 860;
      const initScale = isMobile ? 0.58 : 0.78;
      const camera = new THREE.PerspectiveCamera(isMobile ? 38 : 40, cw / ch, 0.1, 100);
      camera.position.set(0, isMobile ? 1.0 : 1.25, isMobile ? 7.2 : 6.4);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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

      // Master high-definition canvas for keycap texture (2048 x 860)
      const kbCanvas = document.createElement('canvas');
      kbCanvas.width = 2048;
      kbCanvas.height = 860;
      const kbCtx = kbCanvas.getContext('2d');

      const keycapTexture = new THREE.CanvasTexture(kbCanvas);
      keycapTexture.generateMipmaps = false;
      keycapTexture.minFilter = THREE.LinearFilter;
      keycapTexture.magFilter = THREE.LinearFilter;
      const keycapMaterial = new THREE.MeshStandardMaterial({
        map: keycapTexture,
        metalness: 0.12,
        roughness: 0.78
      });

      function drawEngravedKeyboard() {
        const kbW = kbCanvas.width;
        const kbH = kbCanvas.height;

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

      // Ultra-thin minimal bezel frame
      const bezelFrame = new THREE.Mesh(
        new THREE.PlaneGeometry(lidW - 0.04, lidH - 0.04),
        new THREE.MeshBasicMaterial({ color: 0x05070a })
      );
      bezelFrame.position.set(0, lidH / 2, 0.023);
      lidGroup.add(bezelFrame);

      // Standalone Iconic "A" Brand Emblem on Back Lid
      const logoCanvas = document.createElement('canvas');
      logoCanvas.width = 1024;
      logoCanvas.height = 1024;
      const lCtx = logoCanvas.getContext('2d');

      const logoTexture = new THREE.CanvasTexture(logoCanvas);
      logoTexture.generateMipmaps = false;
      logoTexture.minFilter = THREE.LinearFilter;
      logoTexture.magFilter = THREE.LinearFilter;

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
      logoMesh.position.set(0, lidH / 2, -lidThick / 2 - 0.001);
      lidGroup.add(logoMesh);

      function drawBackLidLogo() {
        const cx = 512, cy = 512;
        lCtx.clearRect(0, 0, 1024, 1024);

        lCtx.save();
        lCtx.shadowColor = 'rgba(56, 189, 248, 0.9)';
        lCtx.shadowBlur = 45;

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
      // 2560x1632 resolution + 16x anisotropic filtering + bold typography = 100% crisp & zero blur
      const screenW = lidW - 0.16, screenH = lidH - 0.16;
      const screenCanvas = document.createElement('canvas');
      screenCanvas.width = 2560;
      screenCanvas.height = 1632;
      const sCtx = screenCanvas.getContext('2d');

      const screenTexture = new THREE.CanvasTexture(screenCanvas);
      screenTexture.generateMipmaps = false;
      screenTexture.minFilter = THREE.LinearFilter;
      screenTexture.magFilter = THREE.LinearFilter;

      const screenMaterial = new THREE.MeshBasicMaterial({
        map: screenTexture,
        toneMapped: false,
        color: 0x000000 // Standby black initially
      });
      const screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(screenW, screenH),
        screenMaterial
      );
      screenMesh.position.set(0, lidH / 2, 0.024);
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
        const W = screenCanvas.width, H = screenCanvas.height;

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
      }

      let savedCursorX = 0, savedCursorY = 0;
      // Pre-warm screen canvas & GPU texture ONCE on startup (Permanent VRAM caching, 0 MB/s churn)
      renderCodeEditorScreen(false);
      screenTexture.needsUpdate = true;

      // Hardware-accelerated 3D glowing cursor mesh (Child of screenMesh, zero texture re-upload)
      const curNormX = (savedCursorX / screenCanvas.width) - 0.5;
      const curNormY = 0.5 - (savedCursorY / screenCanvas.height);
      const curW3D = (18 / screenCanvas.width) * screenW;
      const curH3D = (50 / screenCanvas.height) * screenH;

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
        0.001
      );
      cursorMesh.visible = false;
      screenMesh.add(cursorMesh);

      // LIGHTS & SHADOW (Calibrated studio lighting - soft, moody, zero keyboard blowout)
      scene.add(new THREE.AmbientLight(0xffffff, 0.65));

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

      laptop.rotation.x = 0.35;
      laptop.rotation.y = -0.07;

      let isDragging = false, prevMouse = { x: 0, y: 0 };
      let mouseNorm = { x: 0, y: 0 };
      let targetRot = { x: 0.35, y: -0.07 };
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
            // Determine whether user wants to scroll page or rotate 3D laptop
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
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 50 && h > 50) {
          camera.aspect = w / h;
          const isMobile = window.innerWidth <= 860;
          const scale = isMobile ? 0.58 : 0.79;
          laptop.scale.set(scale, scale, scale);
          if (isMobile) {
            camera.position.set(0, 1.0, 7.2);
          } else {
            camera.position.set(0, 1.3, 6.4);
          }
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
      window.addEventListener('resize', handleResize, { passive: true });

      // High-performance IntersectionObserver: pauses laptop WebGL rendering when scrolled out of view
      let laptopInView = true;
      if ('IntersectionObserver' in window) {
        const laptopObserver = new IntersectionObserver((entries) => {
          laptopInView = entries[0].isIntersecting;
        }, { threshold: 0.02 });
        laptopObserver.observe(canvas);
      }

      // Silky Smooth & Elegant Unfold & Boot Timeline Parameters (No snap, purely organic & fluid)
      const T_FOLD_PAUSE     = 0.08;  // Gentle settling pause on entrance: 0.08s
      const T_UNFOLD_DUR     = 1.15;  // Buttery-smooth opening duration: 1.15s
      const T_OPEN_OFF_PAUSE = 0.12;  // Natural boot wake delay: 0.12s
      const T_POWER_DUR      = 0.65;  // Silky smooth OLED display fade: 0.65s

      const tUnfoldStart = T_FOLD_PAUSE;
      const tUnfoldEnd   = tUnfoldStart + T_UNFOLD_DUR;
      const tPowerStart  = tUnfoldEnd + T_OPEN_OFF_PAUSE;
      const tPowerEnd    = tPowerStart + T_POWER_DUR;

      let clock2 = new THREE.Clock(false);
      let lastCursorBlink = 0;
      let cursorVisibleState = true;
      let laptopRunning = false;
      let screenFullyOn = false;

      function animate() {
        if (!laptopRunning) return;
        requestAnimationFrame(animate);
        if (!laptopInView || document.hidden) return; // Completely idle when scrolled offscreen or tab hidden
        const elapsed = clock2.getElapsedTime();

        // 1. KINEMATIC LID POSITIONING (ORGANIC HARMONIC GLIDE • ZERO ACCELERATION SNAP)
        if (elapsed < tUnfoldStart) {
          // Closed flat against base
          lidGroup.rotation.x = closedLidAngle;
        } else if (elapsed < tUnfoldEnd) {
          // Pure cosine ease-in-out: zero jerk at endpoints, maximum buttery smoothness
          const p = (elapsed - tUnfoldStart) / T_UNFOLD_DUR;
          const ease = 0.5 - 0.5 * Math.cos(Math.PI * p);
          lidGroup.rotation.x = closedLidAngle + (openLidAngle - closedLidAngle) * ease;
        } else {
          // Fully opened to operational viewing angle
          lidGroup.rotation.x = openLidAngle;
        }

        // 2. SCREEN POWER & DISPLAY STATE (SILKY SMOOTH GRADUAL HARDWARE FADE-IN)
        if (elapsed < tPowerStart) {
          // Screen completely OFF (pure black standby on GPU)
          screenMaterial.color.setRGB(0, 0, 0);
          screenGlowLight.intensity = 0;
          if (cursorMesh) cursorMesh.visible = false;
        } else if (elapsed < tPowerEnd) {
          // Harmonic cosine power-on fade
          const pRaw = (elapsed - tPowerStart) / T_POWER_DUR;
          const p = 0.5 - 0.5 * Math.cos(Math.PI * pRaw);
          screenMaterial.color.setRGB(p, p, p);
          screenGlowLight.intensity = 0.35 * p;
          if (cursorMesh) cursorMesh.visible = false;
        } else {
          // Screen is fully ON
          if (!screenFullyOn) {
            screenFullyOn = true;
            screenMaterial.color.setRGB(1, 1, 1);
            screenGlowLight.intensity = 0.35;
            if (cursorMesh) cursorMesh.visible = true;
          }

          // Subtle, lightweight cursor blink toggled via 3D mesh visibility (ZERO texture re-upload churn!)
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

        if (!isDragging) {
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

        // Dynamic light reflection that glides gently across aluminum chassis
        keyLight.position.x = 4.0 + mouseNorm.x * 1.2;
        keyLight.position.y = 3.5 + mouseNorm.y * 1.0;

        renderer.render(scene, camera);
      }

      // Render 1 static frame to compile materials/shaders ahead of time
      laptop.rotation.y = targetRot.y;
      laptop.rotation.x = targetRot.x;
      lidGroup.rotation.x = closedLidAngle;
      renderer.render(scene, camera);

      window.__startLaptop = function() {
        if (laptopRunning) return;
        laptopRunning = true;
        clock2 = new THREE.Clock();
        clock2.start();
        canvas.classList.add('is-ready');
        animate();
      };

      window.__laptopRef = { laptop, lidGroup, scene, camera, renderer };
      window.__laptopDebug = function() {
        return {
          laptopRunning,
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
/* 4. MASTER PRODUCTION BOOTSTRAPPER (DEFERRED FOR ZERO-JANK INTRO) */
    let threeBooted = false;
    function boot3D() {
      if (threeBooted) return;
      if (typeof THREE === 'undefined') {
        setTimeout(boot3D, 100);
        return;
      }
      threeBooted = true;
      try { initSpaceOrbitRings(); } catch (err) { console.warn("Space orbit rings error:", err); }
      try { initSmallShinyOrb(); } catch (err) { console.warn("Small orb error:", err); }
      try { initLaptopStage(); } catch (err) { console.warn("Laptop error:", err); }
    }

    window.__start3DScenes = function() {
      boot3D();
      if (typeof window.__startSpaceOrbitRings === 'function') window.__startSpaceOrbitRings();
      if (typeof window.__startSmallOrb === 'function') window.__startSmallOrb();
      if (typeof window.__startLaptop === 'function') window.__startLaptop();
    };

    // Pre-warm 3D geometries and shaders immediately in background
    boot3D();

    // If overlay does not exist on page, start scenes immediately
    if (!document.getElementById('brandIntroOverlay')) {
      window.__start3DScenes();
    } else {
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

  // Pre-prime audio buffer in background for zero-latency start
  try { audio.load(); } catch (_) {}

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
    orbWidget.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePlayback();
      }
    });
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
/* 1. INTERACTIVE ONE-CLICK EMAIL COPY & CONTACT FORM */
    (() => {
      const copyBtn = document.getElementById('copyEmailBtn');
      const label = document.getElementById('copyBtnLabel');
      const email = 'anmolkumar2762@gmail.com';

      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(email).then(() => {
          label.textContent = 'Copied! ✓';
          label.style.background = 'rgba(16, 185, 129, 0.2)';
          label.style.color = '#6ee7b7';
          setTimeout(() => {
            label.textContent = 'Copy ⧉';
            label.style.background = '';
            label.style.color = '';
          }, 2500);
        });
      });

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
        document.body.style.overflow = 'hidden'; // Prevent background scrolling while open
      }

      function closeDrawer() {
        mobileMenuBtn.classList.remove('is-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileDrawer.classList.remove('is-open');
        if (mobileBackdrop) mobileBackdrop.classList.remove('is-open');
        document.body.style.overflow = '';
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

  document.body.style.overflow = 'hidden';

  let isCompleted = false;
  function triggerZoomThroughTransition() {
    if (isCompleted) return;
    isCompleted = true;

    // Silky smooth GPU depth dissolve into hero workstation
    overlay.classList.add('is-zoom-through');
    document.body.style.overflow = '';
    setTimeout(() => {
      overlay.remove();
      // Seamlessly start 3D scenes
      if (typeof window.__start3DScenes === 'function') {
        window.__start3DScenes();
      }
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
      setTimeout(() => { sheen.style.display = 'none'; }, 1100);
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
      setTimeout(() => { laser.style.display = 'none'; }, 1000);
    }
    if (bootLine) bootLine.classList.add('is-visible');
    if (emblem) emblem.classList.add('is-floating');
  }, 2200);

  // --- STAGE 7: CALM APPRECIATION HOLD -> SILKY DISSOLVE TO HERO WORKSTATION (T+3350ms) ---
  setTimeout(() => {
    triggerZoomThroughTransition();
  }, 3350);
})();
