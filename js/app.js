/**
 * js/app.js — Main application bootstrap
 * Handles: Intro animation (Three.js or Canvas 2D fallback),
 *           GSAP animations, smoke trail cursor, particles,
 *           settings panel, scroll effects.
 */
(function () {
  'use strict';

  /* =========================================================
     SETTINGS — persisted to localStorage
     ========================================================= */
  const SETTINGS_KEY = 'chronos_settings';

  const defaultSettings = {
    soundEnabled: true,
    notificationsEnabled: false,
    spotifyPauseWithTimer: true,
    spotifyClientId: '',
    pomWork: 25,
    pomShort: 5,
    pomLong: 15,
    pomCycles: 4,
  };

  function loadSettings() {
    try {
      // Support migrating from old key
      const old = localStorage.getItem('timex_settings');
      if (old && !localStorage.getItem(SETTINGS_KEY)) {
        localStorage.setItem(SETTINGS_KEY, old);
      }
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      return { ...defaultSettings, ...saved };
    } catch { return { ...defaultSettings }; }
  }

  function saveSettings(data) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); } catch { /* */ }
    window.timerSettings = data;
  }

  function applySettingsToUI(settings) {
    const ids = {
      soundSetting:           'soundEnabled',
      notifToggle:            'notificationsEnabled',
      spotifyPauseWithTimer:  'spotifyPauseWithTimer',
      spotifyClientId:        'spotifyClientId',
      pomWorkDuration:        'pomWork',
      pomShortBreak:          'pomShort',
      pomLongBreak:           'pomLong',
      pomCyclesBeforeLong:    'pomCycles',
    };
    Object.entries(ids).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (!el) return;
      if (el.type === 'checkbox') { el.checked = !!settings[key]; }
      else { el.value = settings[key] ?? ''; }
    });
  }

  function readSettingsFromUI() {
    return {
      soundEnabled:           !!document.getElementById('soundSetting')?.checked,
      notificationsEnabled:   !!document.getElementById('notifToggle')?.checked,
      spotifyPauseWithTimer:  !!document.getElementById('spotifyPauseWithTimer')?.checked,
      spotifyClientId:        document.getElementById('spotifyClientId')?.value.trim() || '',
      pomWork:   parseInt(document.getElementById('pomWorkDuration')?.value, 10)   || 25,
      pomShort:  parseInt(document.getElementById('pomShortBreak')?.value,   10)   || 5,
      pomLong:   parseInt(document.getElementById('pomLongBreak')?.value,    10)   || 15,
      pomCycles: parseInt(document.getElementById('pomCyclesBeforeLong')?.value, 10) || 4,
    };
  }

  /* =========================================================
     THREE.JS INTRO ANIMATION
     ========================================================= */
  function initThreeIntro(onComplete) {
    const screen  = document.getElementById('introScreen');
    const canvas  = document.getElementById('introCanvas');
    const barFill = document.getElementById('introBarFill');
    if (!screen || !canvas) { if (onComplete) onComplete(); return; }

    const THREE = window.THREE;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    // Wireframe shapes
    const shapes = [
      { geo: new THREE.IcosahedronGeometry(1.8, 1), color: 0x6c63ff, pos: [0, 0, 0],      speed: [0.004, 0.006, 0.002] },
      { geo: new THREE.OctahedronGeometry(0.9),     color: 0xff6584, pos: [3.2, 0.8, -2], speed: [0.007, 0.004, 0.005] },
      { geo: new THREE.TetrahedronGeometry(0.7),    color: 0x43e97b, pos: [-3, -1, -1.5], speed: [0.006, 0.008, 0.003] },
    ];

    const meshes = shapes.map(({ geo, color, pos, speed }) => {
      const mat  = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.45 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh._speed = speed;
      scene.add(mesh);
      return mesh;
    });

    // Particles
    const pCount = 600;
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPositions[i] = (Math.random() - 0.5) * 22;
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x6c63ff, size: 0.035, transparent: true, opacity: 0.55 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    let startTime = null;
    const DURATION = 2800;
    let rafId;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed  = ts - startTime;
      const progress = Math.min(elapsed / DURATION, 1);

      if (barFill) barFill.style.width = `${progress * 100}%`;

      const t = elapsed * 0.001;
      meshes.forEach(m => {
        m.rotation.x += m._speed[0];
        m.rotation.y += m._speed[1];
        m.rotation.z += m._speed[2];
      });
      points.rotation.y = t * 0.04;
      points.rotation.x = t * 0.02;

      renderer.render(scene, camera);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        if (window.gsap) {
          gsap.to(screen, {
            opacity: 0, duration: 0.7, ease: 'power2.inOut',
            onComplete: () => { screen.style.display = 'none'; if (onComplete) onComplete(); },
          });
        } else {
          screen.style.display = 'none';
          if (onComplete) onComplete();
        }
      }
    }

    rafId = requestAnimationFrame(animate);
  }

  /* =========================================================
     CANVAS 2D INTRO FALLBACK
     ========================================================= */
  function initCanvas2DIntro(onComplete) {
    const screen  = document.getElementById('introScreen');
    const canvas  = document.getElementById('introCanvas');
    const barFill = document.getElementById('introBarFill');
    if (!screen || !canvas) { if (onComplete) onComplete(); return; }

    const ctx = canvas.getContext('2d');
    let W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = window.innerWidth < 600 ? 300 : 800;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 0.5 + Math.random() * 1.5,
      hue: Math.random() > 0.55 ? 248 : 340,
      alpha: 0.3 + Math.random() * 0.7,
    }));

    function makeTriangle(cx, cy, size, angle) {
      return [0, 1, 2].map(i => {
        const a = angle + (i * Math.PI * 2) / 3;
        return { x: cx + Math.cos(a) * size, y: cy + Math.sin(a) * size };
      });
    }

    const shapeList = [
      { cx: W * 0.5,  cy: H * 0.5,  size: 80, angle: 0,   speed: 0.008 },
      { cx: W * 0.25, cy: H * 0.4,  size: 45, angle: 0.5, speed: 0.012 },
      { cx: W * 0.75, cy: H * 0.55, size: 55, angle: 1.0, speed: 0.009 },
    ];

    let startTime = null;
    const DURATION = 2600;
    let rafId;

    function draw(ts) {
      if (!startTime) startTime = ts;
      const elapsed  = ts - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      if (barFill) barFill.style.width = `${progress * 100}%`;

      ctx.clearRect(0, 0, W, H);

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha * 0.9})`;
        ctx.fill();
      });

      shapeList.forEach((s, i) => {
        s.angle += s.speed;
        const pts  = makeTriangle(s.cx, s.cy, s.size, s.angle);
        const pts2 = makeTriangle(s.cx, s.cy, s.size * 0.5, -s.angle * 1.5);
        ctx.beginPath();
        pts.forEach((p, j) => j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.strokeStyle = `rgba(108, 99, 255, ${0.25 + i * 0.05})`;
        ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath();
        pts2.forEach((p, j) => j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.strokeStyle = `rgba(255, 101, 132, ${0.2 + i * 0.04})`;
        ctx.lineWidth = 0.8; ctx.stroke();
      });

      if (progress < 1) {
        rafId = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        if (window.gsap) {
          gsap.to(screen, {
            opacity: 0, duration: 0.7, ease: 'power2.inOut',
            onComplete: () => { screen.style.display = 'none'; if (onComplete) onComplete(); },
          });
        } else {
          screen.style.display = 'none';
          if (onComplete) onComplete();
        }
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  function initIntro(onComplete) {
    if (window.THREE) {
      try {
        initThreeIntro(onComplete);
      } catch (e) {
        initCanvas2DIntro(onComplete);
      }
    } else {
      initCanvas2DIntro(onComplete);
    }
  }

  /* =========================================================
     PARTICLES (background field)
     ========================================================= */
  function initParticles() {
    const field = document.getElementById('particleField');
    if (!field) return;
    const count = window.innerWidth < 600 ? 20 : 50;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = 1 + Math.random() * 2.5;
      p.style.cssText = `
        position:absolute;
        width:${size}px; height:${size}px;
        background:rgba(${Math.random() > 0.5 ? '108,99,255' : '255,101,132'},${0.15 + Math.random() * 0.3});
        border-radius:50%;
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        pointer-events:none;
      `;
      field.appendChild(p);
      if (window.gsap) {
        gsap.to(p, {
          x: () => (Math.random() - 0.5) * 280,
          y: () => (Math.random() - 0.5) * 280,
          duration: 12 + Math.random() * 24,
          repeat: -1, yoyo: true, ease: 'sine.inOut',
          delay: Math.random() * 12,
        });
      }
    }
  }

  /* =========================================================
     SMOKE TRAIL CURSOR
     ========================================================= */
  function initSmokeCursor() {
    if ('ontouchstart' in window) return;
    const container = document.getElementById('smokeTrail');
    if (!container) return;

    const POOL_SIZE = 20;
    const pool = [];
    let poolIdx = 0;

    for (let i = 0; i < POOL_SIZE; i++) {
      const p = document.createElement('div');
      p.className = 'smoke-particle';
      p.style.cssText = 'width:10px;height:10px;background:radial-gradient(circle,rgba(108,99,255,0.7) 0%,transparent 70%);opacity:0;';
      container.appendChild(p);
      pool.push(p);
    }

    let lastX = -999, lastY = -999;

    function spawnSmoke(x, y) {
      const dx = x - lastX, dy = y - lastY;
      if (dx * dx + dy * dy < 64) return;
      lastX = x; lastY = y;

      const particle = pool[poolIdx % POOL_SIZE];
      poolIdx++;

      const useAccent2 = Math.random() > 0.6;
      const color = useAccent2 ? 'rgba(255,101,132,0.7)' : 'rgba(108,99,255,0.7)';
      const size = 8 + Math.random() * 14;

      particle.style.left   = x + 'px';
      particle.style.top    = y + 'px';
      particle.style.width  = size + 'px';
      particle.style.height = size + 'px';
      particle.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;

      if (window.gsap) {
        gsap.killTweensOf(particle);
        gsap.fromTo(particle,
          { opacity: 0.65, scale: 0.5, x: 0, y: 0 },
          {
            opacity: 0, scale: 2 + Math.random(),
            x: (Math.random() - 0.5) * 40,
            y: -20 - Math.random() * 30,
            duration: 0.7 + Math.random() * 0.5,
            ease: 'power2.out',
          }
        );
      }
    }

    window.addEventListener('mousemove', e => spawnSmoke(e.clientX, e.clientY));
  }

  /* =========================================================
     GSAP ANIMATIONS (post-intro)
     ========================================================= */
  function initAnimations() {
    if (!window.gsap) return;

    gsap.from('.site-header', { y: -80, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.1 });
    gsap.from('.clock-ticker-section', { y: -20, opacity: 0, duration: 0.8, ease: 'expo.out', delay: 0.25 });
    gsap.from('.tz-search-section', { y: -10, opacity: 0, duration: 0.7, ease: 'expo.out', delay: 0.35 });
    gsap.from('.timer-display-wrap', { scale: 0.88, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.4 });
    gsap.from('.controls-bar', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.6 });

    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      gsap.to('#panelsSection', {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '#panelsSection', start: 'top 85%', toggleActions: 'play none none reverse' },
      });

      gsap.from('.clock-card', {
        opacity: 0, y: 20, scale: 0.96, stagger: 0.05, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: '#worldClocksGrid', start: 'top 88%' },
      });

      gsap.to('.bg-orb-1', {
        y: '15%', ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true },
      });
      gsap.to('.bg-orb-2', {
        y: '-12%', ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true },
      });
    }
  }

  /* =========================================================
     SETTINGS PANEL
     ========================================================= */
  function initSettingsPanel(settings) {
    const overlay    = document.getElementById('settingsOverlay');
    const openBtn    = document.getElementById('settingsToggle');
    const closeBtn   = document.getElementById('settingsClose');
    const saveSpotify = document.getElementById('saveSpotifyClientId');
    const notifToggle = document.getElementById('notifToggle');

    openBtn?.addEventListener('click', () => {
      overlay?.classList.remove('hidden');
      if (window.gsap) gsap.from('#settingsPanel', { scale: 0.92, opacity: 0, duration: 0.35, ease: 'expo.out' });
    });

    function closePanel() {
      const current = readSettingsFromUI();
      saveSettings(current);
      window.timerSettings = current;
      window.TimerController?.syncSettings();
      overlay?.classList.add('hidden');
    }

    closeBtn?.addEventListener('click', closePanel);
    overlay?.addEventListener('click', e => { if (e.target === overlay) closePanel(); });

    saveSpotify?.addEventListener('click', () => {
      const current = readSettingsFromUI();
      saveSettings(current);
      window.timerSettings = current;
      closePanel();
      window.SpotifyController?.login();
    });

    notifToggle?.addEventListener('change', e => {
      if (e.target.checked && Notification.permission !== 'granted') {
        Notification.requestPermission().then(perm => { if (perm !== 'granted') e.target.checked = false; });
      }
    });
  }

  /* =========================================================
     SOUND TOGGLE
     ========================================================= */
  function initSoundToggle(settings) {
    const btn     = document.getElementById('soundToggle');
    const iconOn  = document.getElementById('soundIconOn');
    const iconOff = document.getElementById('soundIconOff');
    let soundOn   = settings.soundEnabled;

    function update() {
      if (iconOn)  iconOn.style.display  = soundOn ? '' : 'none';
      if (iconOff) iconOff.style.display = soundOn ? 'none' : '';
      window.timerSettings = { ...window.timerSettings, soundEnabled: soundOn };
      saveSettings(window.timerSettings);
      const el = document.getElementById('soundSetting');
      if (el) el.checked = soundOn;
    }

    btn?.addEventListener('click', () => { soundOn = !soundOn; update(); });
    update();
  }

  /* =========================================================
     PARALLAX — mouse movement subtle effect on timer
     ========================================================= */
  function initMouseParallax() {
    if (!window.gsap) return;
    const wrap = document.getElementById('timerRingWrap');
    window.addEventListener('mousemove', e => {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx, dy = (e.clientY - cy) / cy;
      if (wrap) {
        gsap.to(wrap, {
          rotationY: dx * 3, rotationX: -dy * 3,
          duration: 0.9, ease: 'power2.out',
          transformPerspective: 1200,
        });
      }
    });
  }

  /* =========================================================
     ZOOM ON SCROLL — hero shrinks
     ========================================================= */
  function initScrollZoom() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.to('.hero-content', {
      scale: 0.95, opacity: 0.8, ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom 40%',
        scrub: true,
      },
    });
  }

  /* =========================================================
     BUTTON MICRO-ANIMATIONS
     ========================================================= */
  function initButtonAnimations() {
    if (!window.gsap) return;
    document.querySelectorAll('.ctrl-btn, .sp-btn, .nav-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.08, duration: 0.18, ease: 'back.out(2)' }));
      btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1,    duration: 0.18, ease: 'power2.out' }));
      btn.addEventListener('click',      () => gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.22, ease: 'back.out(3)' }));
    });
  }

  /* =========================================================
     CLOCK CARD HOVER TILT
     ========================================================= */
  function initCardTilt() {
    if (!window.gsap) return;
    const grid = document.getElementById('worldClocksGrid');
    if (!grid) return;

    grid.addEventListener('mousemove', e => {
      const card = e.target.closest('.clock-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 18;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -18;
      gsap.to(card, { rotationY: x, rotationX: y, transformPerspective: 700, duration: 0.25, ease: 'power2.out' });
    });

    grid.addEventListener('mouseleave', e => {
      const card = e.target.closest('.clock-card');
      if (card) {
        gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.4, ease: 'power2.out' });
      } else if (!e.relatedTarget || !grid.contains(e.relatedTarget)) {
        grid.querySelectorAll('.clock-card').forEach(c =>
          gsap.to(c, { rotationY: 0, rotationX: 0, duration: 0.4, ease: 'power2.out' })
        );
      }
    }, true);
  }

  /* =========================================================
     ALBUM ART ROTATION (playing)
     ========================================================= */
  function initAlbumArtAnimation() {
    const art = document.getElementById('albumArt');
    if (!art || !window.gsap) return;
    let rotTween = null;
    window.addEventListener('spotifyPlayState', e => {
      const playing = e.detail?.playing;
      if (playing) {
        rotTween = gsap.to(art, { rotation: '+=360', duration: 10, repeat: -1, ease: 'none' });
      } else {
        rotTween?.pause();
      }
    });
  }

  /* =========================================================
     MAIN INIT
     ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    const settings = loadSettings();
    window.timerSettings = settings;
    applySettingsToUI(settings);

    initIntro(() => {
      window.TimerController?.init();
      window.WorldClocks?.init();
      window.SpotifyController?.init();

      initSettingsPanel(settings);
      initSoundToggle(settings);
      initParticles();
      initSmokeCursor();
      initAnimations();
      initMouseParallax();
      initScrollZoom();
      initButtonAnimations();
      initCardTilt();
      initAlbumArtAnimation();
    });
  });
})();
