/**
 * js/app.js — Main application bootstrap
 * Handles: Three.js intro, GSAP animations, smoke trail cursor,
 *           particles, settings panel, scroll effects.
 */
(function () {
  'use strict';

  /* =========================================================
     SETTINGS — persisted to localStorage
     ========================================================= */
  const SETTINGS_KEY = 'timex_settings';

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
     THREE.JS INTRO SCREEN
     ========================================================= */
  function initThreeIntro(onComplete) {
    const screen = document.getElementById('introScreen');
    const canvas = document.getElementById('introCanvas');
    const barFill = document.getElementById('introBarFill');
    if (!screen || !canvas || typeof THREE === 'undefined') {
      if (screen) {
        if (window.gsap) {
          gsap.to(screen, { opacity: 0, duration: 0.5, onComplete: () => { screen.style.display = 'none'; if (onComplete) onComplete(); } });
        } else {
          screen.style.display = 'none';
          if (onComplete) onComplete();
        }
      } else {
        if (onComplete) onComplete();
      }
      return;
    }

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 5;

    // Particle system
    const particleCount = 1200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      // Gradient from purple to pink
      const t = Math.random();
      colors[i * 3]     = 0.42 + t * 0.58;   // R
      colors[i * 3 + 1] = 0.39 * (1 - t);    // G
      colors[i * 3 + 2] = 1 - t * 0.5;       // B
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04, vertexColors: true, transparent: true, opacity: 0.85,
    });
    const particles = new THREE.Points(geo, particleMat);
    scene.add(particles);

    // A few wireframe geometric shapes
    const shapes = [];
    const shapeDefs = [
      { geo: new THREE.IcosahedronGeometry(0.8, 0), pos: [0, 0, 0] },
      { geo: new THREE.OctahedronGeometry(0.5, 0),  pos: [2.5, 1, -2] },
      { geo: new THREE.OctahedronGeometry(0.4, 0),  pos: [-2.5, -1, -2] },
    ];
    shapeDefs.forEach(({ geo: g, pos }) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0x6c63ff, wireframe: true, transparent: true, opacity: 0.3 });
      const mesh = new THREE.Mesh(g, mat);
      mesh.position.set(...pos);
      scene.add(mesh);
      shapes.push(mesh);
    });

    let startTime = null;
    const DURATION = 2800; // ms
    let rafId;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / DURATION, 1);

      // Update progress bar
      if (barFill) barFill.style.width = `${progress * 100}%`;

      particles.rotation.y += 0.002;
      particles.rotation.x += 0.001;
      shapes.forEach((s, i) => {
        s.rotation.x += 0.008 + i * 0.003;
        s.rotation.y += 0.01 + i * 0.002;
      });

      renderer.render(scene, camera);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        // Fade out intro
        cancelAnimationFrame(rafId);
        renderer.dispose();
        if (window.gsap) {
          gsap.to(screen, {
            opacity: 0, duration: 0.7, ease: 'power2.inOut',
            onComplete: () => {
              screen.style.display = 'none';
              if (onComplete) onComplete();
            },
          });
        } else {
          screen.style.display = 'none';
          if (onComplete) onComplete();
        }
      }
    }

    rafId = requestAnimationFrame(animate);

    // Handle resize during intro
    function onResize() {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize, { once: false });
  }

  /* =========================================================
     PARTICLES (background field)
     ========================================================= */
  function initParticles() {
    const field = document.getElementById('particleField');
    if (!field) return;
    const count = window.innerWidth < 600 ? 25 : 60;
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
          x: () => (Math.random() - 0.5) * 300,
          y: () => (Math.random() - 0.5) * 300,
          duration: 12 + Math.random() * 24,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: Math.random() * 12,
        });
      }
    }
  }

  /* =========================================================
     SMOKE TRAIL CURSOR
     ========================================================= */
  function initSmokeCursor() {
    if ('ontouchstart' in window) return; // skip on touch
    const container = document.getElementById('smokeTrail');
    if (!container) return;

    const POOL_SIZE = 30;
    const pool = [];
    let poolIdx = 0;

    // Pre-create particles
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = document.createElement('div');
      p.className = 'smoke-particle';
      p.style.cssText = `
        width: 10px; height: 10px;
        background: radial-gradient(circle, rgba(108,99,255,0.7) 0%, transparent 70%);
        opacity: 0;
      `;
      container.appendChild(p);
      pool.push(p);
    }

    let lastX = -999, lastY = -999;

    function spawnSmoke(x, y) {
      // Only spawn if moved enough
      const dx = x - lastX, dy = y - lastY;
      if (dx * dx + dy * dy < 64) return;
      lastX = x; lastY = y;

      const particle = pool[poolIdx % POOL_SIZE];
      poolIdx++;

      // Randomize color between accent and accent2
      const useAccent2 = Math.random() > 0.6;
      const color = useAccent2 ? 'rgba(255,101,132,0.7)' : 'rgba(108,99,255,0.7)';
      const size = 8 + Math.random() * 14;

      particle.style.left  = x + 'px';
      particle.style.top   = y + 'px';
      particle.style.width  = size + 'px';
      particle.style.height = size + 'px';
      particle.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;

      if (window.gsap) {
        gsap.killTweensOf(particle);
        gsap.fromTo(particle,
          { opacity: 0.7, scale: 0.5, x: 0, y: 0 },
          {
            opacity: 0,
            scale: 2 + Math.random(),
            x: (Math.random() - 0.5) * 40,
            y: -20 - Math.random() * 30,
            duration: 0.7 + Math.random() * 0.5,
            ease: 'power2.out',
          }
        );
      }
    }

    window.addEventListener('mousemove', e => {
      spawnSmoke(e.clientX, e.clientY);
    });
  }

  /* =========================================================
     GSAP ANIMATIONS (post-intro)
     ========================================================= */
  function initAnimations() {
    if (!window.gsap) return;

    // Header entrance
    gsap.from('.site-header', {
      y: -80, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.1,
    });

    // Timer display
    gsap.from('.timer-display-wrap', {
      scale: 0.85, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.3,
    });
    gsap.from('.controls-bar', {
      y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.55,
    });

    // Scroll-triggered sections
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      // Panels section fade-in
      gsap.to('#panelsSection', {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: {
          trigger: '#panelsSection',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      // Clock cards stagger
      gsap.from('.clock-card', {
        opacity: 0, y: 20, scale: 0.96,
        stagger: 0.06, duration: 0.5, ease: 'power2.out',
        scrollTrigger: {
          trigger: '#worldClocksGrid',
          start: 'top 88%',
        },
      });

      // Parallax on background gradient layers
      gsap.to('.bg-canvas', {
        backgroundPositionY: '30%',
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    }
  }

  /* =========================================================
     SETTINGS PANEL
     ========================================================= */
  function initSettingsPanel(settings) {
    const overlay  = document.getElementById('settingsOverlay');
    const openBtn  = document.getElementById('settingsToggle');
    const closeBtn = document.getElementById('settingsClose');
    const saveSpotify = document.getElementById('saveSpotifyClientId');
    const notifToggle = document.getElementById('notifToggle');

    openBtn?.addEventListener('click', () => {
      overlay?.classList.remove('hidden');
      if (window.gsap) {
        gsap.from('#settingsPanel', { scale: 0.92, opacity: 0, duration: 0.35, ease: 'expo.out' });
      }
    });

    function closePanel() {
      const current = readSettingsFromUI();
      saveSettings(current);
      window.timerSettings = current;
      window.TimerController?.syncSettings();
      overlay?.classList.add('hidden');
    }

    closeBtn?.addEventListener('click', closePanel);
    overlay?.addEventListener('click', e => {
      if (e.target === overlay) closePanel();
    });

    saveSpotify?.addEventListener('click', () => {
      const current = readSettingsFromUI();
      saveSettings(current);
      window.timerSettings = current;
      closePanel();
      window.SpotifyController?.login();
    });

    notifToggle?.addEventListener('change', e => {
      if (e.target.checked && Notification.permission !== 'granted') {
        Notification.requestPermission().then(perm => {
          if (perm !== 'granted') { e.target.checked = false; }
        });
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

    btn?.addEventListener('click', () => {
      soundOn = !soundOn;
      update();
    });
    update();
  }

  /* =========================================================
     PARALLAX — mouse movement subtle effect on timer
     ========================================================= */
  function initMouseParallax() {
    if (!window.gsap) return;
    const wrap = document.getElementById('timerRingWrap');
    window.addEventListener('mousemove', e => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      if (wrap) {
        gsap.to(wrap, {
          rotationY: dx * 4,
          rotationX: -dy * 4,
          duration: 0.8, ease: 'power2.out',
          transformPerspective: 1000,
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
      scale: 0.94,
      opacity: 0.75,
      ease: 'none',
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
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, { scale: 1.08, duration: 0.18, ease: 'back.out(2)' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { scale: 1, duration: 0.18, ease: 'power2.out' });
      });
      btn.addEventListener('click', () => {
        gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.22, ease: 'back.out(3)' });
      });
    });
  }

  /* =========================================================
     CLOCK CARD HOVER TILT
     ========================================================= */
  function initCardTilt() {
    if (!window.gsap) return;
    // Cards are injected by worldclocks.js, so use event delegation
    const grid = document.getElementById('worldClocksGrid');
    if (!grid) return;
    grid.addEventListener('mousemove', e => {
      const card = e.target.closest('.clock-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 18;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -18;
      gsap.to(card, {
        rotationY: x, rotationX: y,
        transformPerspective: 700,
        duration: 0.25, ease: 'power2.out',
      });
    });
    grid.addEventListener('mouseleave', e => {
      if (e.target.closest('.clock-card')) return;
      grid.querySelectorAll('.clock-card').forEach(c => {
        gsap.to(c, { rotationY: 0, rotationX: 0, duration: 0.4, ease: 'power2.out' });
      });
    }, true);
    grid.addEventListener('mouseleave', e => {
      const card = e.target.closest('.clock-card');
      if (card) {
        gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.4, ease: 'power2.out' });
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

    // Run Three.js intro, then bootstrap the rest of the app
    initThreeIntro(() => {
      // Init modules
      window.TimerController?.init();
      window.WorldClocks?.init();
      window.SpotifyController?.init();

      // UI & animation init
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
