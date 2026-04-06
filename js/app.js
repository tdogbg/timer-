/**
 * js/app.js — Main application bootstrap
 * Handles: GSAP animations, parallax, cursor tracking,
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
     PARTICLES
     ========================================================= */
  function initParticles() {
    const field = document.getElementById('particleField');
    if (!field) return;
    const count = window.innerWidth < 600 ? 20 : 50;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position:absolute;
        width:${1 + Math.random() * 2}px;
        height:${1 + Math.random() * 2}px;
        background:rgba(108,99,255,${0.2 + Math.random() * 0.4});
        border-radius:50%;
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        pointer-events:none;
      `;
      field.appendChild(p);
      if (window.gsap) {
        gsap.to(p, {
          x: () => (Math.random() - 0.5) * 200,
          y: () => (Math.random() - 0.5) * 200,
          duration: 10 + Math.random() * 20,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: Math.random() * 10,
        });
      }
    }
  }

  /* =========================================================
     CURSOR TRACKING
     ========================================================= */
  function initCursor() {
    const dot  = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;
    if ('ontouchstart' in window) return; // skip on touch

    let mx = 0, my = 0;
    let rx = 0, ry = 0;

    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (window.gsap) {
        gsap.to(dot, { left: mx, top: my, duration: 0.05, ease: 'none' });
        gsap.to(ring, { left: mx, top: my, duration: 0.18, ease: 'power2.out' });
      } else {
        dot.style.left  = mx + 'px'; dot.style.top  = my + 'px';
        ring.style.left = mx + 'px'; ring.style.top = my + 'px';
      }
    });

    // Hover effect on interactive elements
    const interactives = 'button, a, input, label, [data-mode]';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(interactives)) {
        ring.classList.add('hover');
      }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(interactives)) {
        ring.classList.remove('hover');
      }
    });
  }

  /* =========================================================
     GSAP ANIMATIONS
     ========================================================= */
  function initAnimations() {
    if (!window.gsap) return;

    // Header entrance
    gsap.from('.site-header', {
      y: -80, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.1,
    });

    // Hero ring and face
    gsap.from('.timer-ring-wrap', {
      scale: 0.5, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.3,
    });
    gsap.from('.controls-bar', {
      y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.6,
    });

    // Scroll-triggered sections
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      // Spotify section
      gsap.to('#spotifySection', {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: {
          trigger: '#spotifySection',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });

      // World clocks section
      gsap.to('#worldClocksSection', {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: {
          trigger: '#worldClocksSection',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });

      // Individual clock cards stagger
      gsap.from('.clock-card', {
        opacity: 0, y: 30, scale: 0.95,
        stagger: 0.05, duration: 0.5, ease: 'power2.out',
        scrollTrigger: {
          trigger: '#worldClocksGrid',
          start: 'top 85%',
        },
      });

      // Parallax on orbs
      document.querySelectorAll('.orb').forEach((orb, i) => {
        gsap.to(orb, {
          y: () => -100 * (i + 1),
          ease: 'none',
          scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        });
      });
    }
  }

  /* =========================================================
     SETTINGS PANEL
     ========================================================= */
  function initSettingsPanel(settings) {
    const overlay = document.getElementById('settingsOverlay');
    const openBtn = document.getElementById('settingsToggle');
    const closeBtn = document.getElementById('settingsClose');
    const saveSpotify = document.getElementById('saveSpotifyClientId');
    const notifToggle = document.getElementById('notifToggle');

    openBtn?.addEventListener('click', () => {
      overlay?.classList.remove('hidden');
      if (window.gsap) {
        gsap.from('#settingsPanel', { scale: 0.9, opacity: 0, duration: 0.35, ease: 'expo.out' });
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

    // Save Spotify client ID
    saveSpotify?.addEventListener('click', () => {
      const current = readSettingsFromUI();
      saveSettings(current);
      window.timerSettings = current;
      closePanel();
      // Re-init Spotify login flow
      window.SpotifyController?.login();
    });

    // Request notification permission
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
    const btn = document.getElementById('soundToggle');
    let soundOn = settings.soundEnabled;

    function update() {
      if (btn) btn.textContent = soundOn ? '🔊' : '🔇';
      window.timerSettings = { ...window.timerSettings, soundEnabled: soundOn };
      saveSettings(window.timerSettings);
      // Sync settings checkbox too
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
     PARALLAX — mouse movement subtle effect
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
          rotationY: dx * 6,
          rotationX: -dy * 6,
          duration: 0.6, ease: 'power2.out',
          transformPerspective: 800,
        });
      }
    });
  }

  /* =========================================================
     ZOOM ON SCROLL — hero shrinks away
     ========================================================= */
  function initScrollZoom() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.to('.hero-content', {
      scale: 0.92,
      opacity: 0.7,
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
        gsap.to(btn, { scale: 1.08, duration: 0.2, ease: 'back.out(2)' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' });
      });
      btn.addEventListener('click', () => {
        gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' });
      });
    });
  }

  /* =========================================================
     CLOCK CARD HOVER TILT
     ========================================================= */
  function initCardTilt() {
    if (!window.gsap) return;
    document.querySelectorAll('.clock-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 20;
        const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -20;
        gsap.to(card, {
          rotationY: x, rotationX: y,
          transformPerspective: 600,
          duration: 0.3, ease: 'power2.out',
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.4, ease: 'power2.out' });
      });
    });
  }

  /* =========================================================
     GLOWING RING — pulse on running
     ========================================================= */
  function initRingGlow() {
    const ring = document.getElementById('ringProgress');
    if (!ring || !window.gsap) return;
    window.addEventListener('timerToggle', e => {
      const running = e.detail?.running;
      if (running) {
        gsap.to(ring, { filter: 'drop-shadow(0 0 16px rgba(108,99,255,0.95))', duration: 0.5 });
      } else {
        gsap.to(ring, { filter: 'drop-shadow(0 0 6px rgba(108,99,255,0.5))', duration: 0.5 });
      }
    });
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
        rotTween = gsap.to(art, { rotation: '+=360', duration: 8, repeat: -1, ease: 'none' });
      } else {
        rotTween?.pause();
      }
    });
  }

  /* =========================================================
     MAIN INIT
     ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    // Load & apply settings
    const settings = loadSettings();
    window.timerSettings = settings;
    applySettingsToUI(settings);

    // Init modules
    window.TimerController?.init();
    window.WorldClocks?.init();
    window.SpotifyController?.init();

    // UI & animation init
    initSettingsPanel(settings);
    initSoundToggle(settings);
    initParticles();
    initCursor();
    initAnimations();
    initMouseParallax();
    initScrollZoom();
    initButtonAnimations();
    initCardTilt();
    initRingGlow();
    initAlbumArtAnimation();
  });
})();
