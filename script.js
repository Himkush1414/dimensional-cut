(() => {
  'use strict';

  if (document.documentElement.classList.contains('ink-gate-skip')) {
    return; // already torn open this session — nothing to wire up
  }

  const gate = document.getElementById('inkGate');
  const trigger = document.getElementById('inkTrigger');
  const seamGlowSvg = document.getElementById('inkSeamGlow');
  const seamGlowLine = document.getElementById('inkSeamGlowLine');
  const stamp = document.getElementById('inkStamp');

  if (!gate || !trigger) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MOVE_LOCK_PX = 6;          // movement before a gesture is treated as a drag, not a tap
  const COMMIT_FRACTION = 0.16;    // fraction of viewport diagonal needed to complete the rip
  const SEAM_POINTS = 16;
  const JITTER_FRACTION = 0.035;   // jaggedness amplitude, relative to min(vw, vh)
  const SHEAR_FACTOR = 0.18;       // how much cross-axis wander leans the seam
  const OVERSCAN = 48;

  let activated = false; // set once the gate has been fully dismissed

  function markSessionTorn() {
    try {
      sessionStorage.setItem('inkRipTornV1', '1');
    } catch (e) {
      /* sessionStorage unavailable (private mode etc.) — non-fatal */
    }
  }

  function stripIds(root) {
    root.removeAttribute('id');
    root.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  }

  // ---------------------------------------------------------------------
  // Reduced-motion path: keep the gate + intro logic, swap the payoff for
  // a quick fade/dissolve instead of the full tear-and-fling.
  // ---------------------------------------------------------------------
  function runReducedActivation() {
    if (activated) return;
    activated = true;

    gate.style.transition = 'opacity 320ms ease';
    gate.style.opacity = '0';

    stamp.animate(
      [
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.75)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1.04)' },
      ],
      { duration: 480, easing: 'ease-out' }
    );

    setTimeout(() => {
      gate.classList.add('is-torn-out');
      markSessionTorn();
    }, 340);
  }

  if (reducedMotion) {
    trigger.addEventListener('click', runReducedActivation);
    trigger.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' || e.key === ' ') runReducedActivation();
    });
    return;
  }

  // ---------------------------------------------------------------------
  // Full tear interaction
  // ---------------------------------------------------------------------

  let dragging = false;
  let axisLocked = null; // 'x' | 'y'
  let startX = 0, startY = 0, curX = 0, curY = 0;
  let jitterSeeds = [];
  let clone = null;
  let rafScheduled = false;
  let lastParticleDist = 0;
  let pointerId = null;

  function rand(seed) {
    return seed; // seeds are already random -1..1, kept as a named pass-through for clarity
  }

  function buildSeam(axis, base, shear) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minDim = Math.min(vw, vh);
    const jitterAmp = minDim * JITTER_FRACTION;
    const span = axis === 'x' ? vh : vw;
    const points = [];
    for (let i = 0; i < SEAM_POINTS; i++) {
      const t = i / (SEAM_POINTS - 1);
      const cross = -OVERSCAN + t * (span + OVERSCAN * 2);
      const along = base + shear + jitterSeeds[i] * jitterAmp;
      points.push(axis === 'x' ? { x: along, y: cross } : { x: cross, y: along });
    }
    return points;
  }

  function polygonFromSeam(axis, seamPoints, side) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pts = [];
    if (axis === 'x') {
      if (side === 'neg') {
        pts.push({ x: -OVERSCAN, y: -OVERSCAN });
        seamPoints.forEach((p) => pts.push(p));
        pts.push({ x: -OVERSCAN, y: vh + OVERSCAN });
      } else {
        pts.push({ x: vw + OVERSCAN, y: -OVERSCAN });
        pts.push({ x: vw + OVERSCAN, y: vh + OVERSCAN });
        for (let i = seamPoints.length - 1; i >= 0; i--) pts.push(seamPoints[i]);
      }
    } else {
      if (side === 'neg') {
        pts.push({ x: -OVERSCAN, y: -OVERSCAN });
        seamPoints.forEach((p) => pts.push(p));
        pts.push({ x: vw + OVERSCAN, y: -OVERSCAN });
      } else {
        pts.push({ x: -OVERSCAN, y: vh + OVERSCAN });
        pts.push({ x: vw + OVERSCAN, y: vh + OVERSCAN });
        for (let i = seamPoints.length - 1; i >= 0; i--) pts.push(seamPoints[i]);
      }
    }
    return `polygon(${pts.map((p) => `${p.x}px ${p.y}px`).join(',')})`;
  }

  function spawnParticles(seamPoints, count) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = seamPoints[Math.floor(Math.random() * seamPoints.length)];
      const el = document.createElement('div');
      const isRed = Math.random() < 0.22;
      el.className = 'ink-particle' + (isRed ? ' ink-particle--red' : '');
      const size = 3 + Math.random() * 7;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      frag.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 140;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 20;
      const dur = 450 + Math.random() * 400;

      requestAnimationFrame(() => {
        const anim = el.animate(
          [
            { transform: `translate(${p.x}px, ${p.y}px) rotate(0deg)`, opacity: 1 },
            {
              transform: `translate(${p.x + dx}px, ${p.y + dy}px) rotate(${(Math.random() - 0.5) * 480}deg)`,
              opacity: 0,
            },
          ],
          { duration: dur, easing: 'cubic-bezier(.22,.61,.36,1)' }
        );
        anim.onfinish = () => el.remove();
      });
    }
    document.body.appendChild(frag);
  }

  function ensureClone() {
    if (clone) return clone;
    clone = gate.cloneNode(true);
    stripIds(clone);
    clone.classList.add('ink-gate--piece');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('button, img').forEach((n) => {
      n.setAttribute('tabindex', '-1');
      if (n.tagName === 'BUTTON') n.disabled = true;
    });
    gate.parentNode.insertBefore(clone, seamGlowSvg);
    gate.classList.add('ink-gate--piece');
    gate.style.willChange = 'transform, clip-path';
    clone.style.willChange = 'transform, clip-path';
    return clone;
  }

  function resetGesture() {
    dragging = false;
    axisLocked = null;
    lastParticleDist = 0;
    if (clone) {
      clone.remove();
      clone = null;
    }
    gate.classList.remove('ink-gate--piece');
    gate.style.transform = '';
    gate.style.clipPath = '';
    gate.style.willChange = '';
  }

  function updateFrame() {
    rafScheduled = false;
    if (!dragging || !axisLocked) return;

    const axis = axisLocked;
    const shear = axis === 'x' ? (curY - startY) * SHEAR_FACTOR : (curX - startX) * SHEAR_FACTOR;
    const base = axis === 'x' ? startX : startY;
    const pull = axis === 'x' ? curX - startX : curY - startY;

    const seamPoints = buildSeam(axis, base, shear);
    const negPoly = polygonFromSeam(axis, seamPoints, 'neg');
    const posPoly = polygonFromSeam(axis, seamPoints, 'pos');

    gate.style.clipPath = negPoly;
    clone.style.clipPath = posPoly;

    const half = pull / 2;
    const t = axis === 'x' ? `translateX(${-half}px)` : `translateY(${-half}px)`;
    const t2 = axis === 'x' ? `translateX(${half}px)` : `translateY(${half}px)`;
    gate.style.transform = t;
    clone.style.transform = t2;

    if (Math.abs(pull) - lastParticleDist > 26) {
      lastParticleDist = Math.abs(pull);
      spawnParticles(seamPoints, 2);
    }
  }

  function scheduleFrame() {
    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(updateFrame);
    }
  }

  function flashSeamGlow(seamPoints) {
    seamGlowLine.setAttribute('points', seamPoints.map((p) => `${p.x},${p.y}`).join(' '));
    seamGlowSvg.setAttribute('width', window.innerWidth);
    seamGlowSvg.setAttribute('height', window.innerHeight);
    seamGlowSvg.animate(
      [{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }],
      { duration: 520, easing: 'ease-out' }
    );
  }

  function showStamp() {
    stamp.animate(
      [
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.4) rotate(-10deg)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1.08) rotate(3deg)', offset: 0.32 },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', offset: 0.55 },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1.12) rotate(2deg)' },
      ],
      { duration: 560, easing: 'cubic-bezier(.22,.61,.36,1)' }
    );
  }

  function commitTear(axis, seamPoints, signHint) {
    dragging = false;
    activated = true;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const diag = Math.hypot(vw, vh);
    const flingDist = diag * 1.15;
    const sign = signHint >= 0 ? 1 : -1;

    const negFinal = axis === 'x'
      ? `translateX(${-flingDist}px) rotate(${-6 * sign}deg)`
      : `translateY(${-flingDist}px) rotate(${-6 * sign}deg)`;
    const posFinal = axis === 'x'
      ? `translateX(${flingDist}px) rotate(${6 * sign}deg)`
      : `translateY(${flingDist}px) rotate(${6 * sign}deg)`;

    const negStart = gate.style.transform || 'translateX(0px)';
    const posStart = clone.style.transform || 'translateX(0px)';

    const dur = 620;
    const easing = 'cubic-bezier(.16,.84,.44,1)';

    const negAnim = gate.animate(
      [{ transform: negStart }, { transform: negFinal }],
      { duration: dur, easing, fill: 'forwards' }
    );
    clone.animate(
      [{ transform: posStart }, { transform: posFinal }],
      { duration: dur, easing, fill: 'forwards' }
    );

    flashSeamGlow(seamPoints);
    spawnParticles(seamPoints, 18);

    negAnim.onfinish = () => {
      gate.classList.add('is-torn-out');
      resetGesture();
      showStamp();
      markSessionTorn();
    };
  }

  function snapBack() {
    dragging = false;
    if (!axisLocked || !clone) {
      resetGesture();
      return;
    }
    const negStart = gate.style.transform || 'translateX(0px)';
    const posStart = clone.style.transform || 'translateX(0px)';
    const dur = 260;
    const easing = 'cubic-bezier(.33,1,.68,1)';

    const negAnim = gate.animate(
      [{ transform: negStart }, { transform: 'translate(0px, 0px)' }],
      { duration: dur, easing, fill: 'forwards' }
    );
    clone.animate(
      [{ transform: posStart }, { transform: 'translate(0px, 0px)' }],
      { duration: dur, easing, fill: 'forwards' }
    );
    negAnim.onfinish = resetGesture;
  }

  function onPointerDown(e) {
    if (activated || dragging) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    dragging = true;
    axisLocked = null;
    startX = curX = e.clientX;
    startY = curY = e.clientY;
    pointerId = e.pointerId;
    lastParticleDist = 0;

    try {
      trigger.setPointerCapture(pointerId);
    } catch (err) {}
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    curX = e.clientX;
    curY = e.clientY;

    if (!axisLocked) {
      const dx = curX - startX;
      const dy = curY - startY;
      if (Math.hypot(dx, dy) < MOVE_LOCK_PX) return;
      axisLocked = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      jitterSeeds = Array.from({ length: SEAM_POINTS }, () => (Math.random() * 2 - 1));
      ensureClone();
    }

    e.preventDefault();
    scheduleFrame();
  }

  function onPointerUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;

    if (!axisLocked) {
      // never crossed the move-lock threshold — treat as a non-event (no
      // accidental-tap activation), matches the "shouldn't fire on an
      // accidental tap" requirement.
      resetGesture();
      return;
    }

    const axis = axisLocked;
    const shear = axis === 'x' ? (curY - startY) * SHEAR_FACTOR : (curX - startX) * SHEAR_FACTOR;
    const base = axis === 'x' ? startX : startY;
    const pull = axis === 'x' ? curX - startX : curY - startY;
    const seamPoints = buildSeam(axis, base, shear);

    const diag = Math.hypot(window.innerWidth, window.innerHeight);
    if (Math.abs(pull) >= diag * COMMIT_FRACTION) {
      commitTear(axis, seamPoints, pull);
    } else {
      snapBack();
    }
  }

  trigger.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // Keyboard fallback: Enter/Space is an unambiguous, deliberate activation
  // (unlike a stray tap), so it's allowed to trigger the full effect even
  // though it can't "drag". Runs a default left-to-right tear.
  trigger.addEventListener('keyup', (e) => {
    if (activated || dragging) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();

    axisLocked = 'x';
    jitterSeeds = Array.from({ length: SEAM_POINTS }, () => (Math.random() * 2 - 1));
    startX = window.innerWidth / 2;
    startY = window.innerHeight / 2;
    ensureClone();
    gate.style.transform = 'translateX(0px)';
    clone.style.transform = 'translateX(0px)';
    const seamPoints = buildSeam('x', startX, 0);
    gate.style.clipPath = polygonFromSeam('x', seamPoints, 'neg');
    clone.style.clipPath = polygonFromSeam('x', seamPoints, 'pos');
    commitTear('x', seamPoints, 1);
  });

  // Geometry is recomputed live from window.innerWidth/innerHeight on every
  // drag frame, so an in-gesture resize already rescales correctly. This
  // listener just guards the (rare) case of a resize landing between
  // gestures with a piece still mid-animation.
  window.addEventListener('resize', () => {
    if (dragging && axisLocked) scheduleFrame();
  });
})();
