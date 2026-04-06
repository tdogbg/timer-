/**
 * js/timer.js — Timer, Stop Clock, Pomodoro logic
 * Exports: TimerController (attached to window)
 * Progress uses horizontal bar (no SVG ring).
 */
(function () {
  'use strict';

  /* ── Utility ── */
  function pad(n) { return String(n).padStart(2, '0'); }
  function formatHMS(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  }
  function formatHMSFull(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  /* ── Audio (Web Audio API) ── */
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playBeep(freq, duration, type = 'sine', gain = 0.3) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) { /* ignore */ }
  }

  function playCompletionSound() {
    if (!window.timerSettings?.soundEnabled) return;
    const delays = [0, 0.25, 0.5, 0.75];
    const freqs  = [523, 659, 784, 1047];
    delays.forEach((d, i) => {
      setTimeout(() => playBeep(freqs[i], 0.4, 'sine', 0.35), d * 1000);
    });
  }

  /* ── Browser Notifications ── */
  function sendNotification(title, body) {
    if (!window.timerSettings?.notificationsEnabled) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  /* ── DOM references ── */
  const els = {
    timerDigits: null,
    clockDigits:  null,
    clockDate:    null,
    pomDigits:    null,
    pomPhaseBadge: null,
    pomCycleCount: null,
    // Progress fills (horizontal bars replacing ring)
    timerProgressFill: null,
    clockProgressFill: null,
    pomProgressFill:   null,
    btnPlay:  null,
    btnReset: null,
    btnStop:  null,
    playIcon: null,
    pauseIcon: null,
    timerInputs: null,
    inputHours:  null,
    inputMinutes: null,
    inputSeconds: null,
    displayTimer:    null,
    displayClock:    null,
    displayPomodoro: null,
    completionBanner: null,
    liveRegion: null,
    timerRingWrap: null,
  };

  /* ── State ── */
  const state = {
    mode: 'timer',        // 'timer' | 'stopclock' | 'pomodoro'
    running: false,

    // Custom timer
    totalSeconds: 0,
    remainingSeconds: 0,
    timerInterval: null,

    // Stop clock
    clockInterval: null,

    // Pomodoro
    pomPhase: 'work',   // 'work' | 'short' | 'long'
    pomCycles: 0,
    pomRemaining: 0,
    pomInterval: null,

    // Settings (synced from window.timerSettings)
    workDuration: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    cyclesBeforeLong: 4,
  };

  /* ── Progress bar helpers ── */
  function setProgressFill(fillEl, fraction) {
    if (!fillEl) return;
    const pct = Math.max(0, Math.min(1, fraction)) * 100;
    fillEl.style.width = `${pct}%`;
  }

  function resetProgress() {
    setProgressFill(els.timerProgressFill, 1);
    setProgressFill(els.clockProgressFill, 1);
    setProgressFill(els.pomProgressFill, 1);
  }

  /* ── Kept for backward compat: maps to the active mode's progress bar ── */
  function setRingProgress(fraction) {
    if (state.mode === 'timer')     { setProgressFill(els.timerProgressFill, fraction); return; }
    if (state.mode === 'stopclock') { setProgressFill(els.clockProgressFill, fraction); return; }
    setProgressFill(els.pomProgressFill, fraction);
  }
  function resetRing() { resetProgress(); }

  /* ── Timer Mode ── */
  function startTimer() {
    if (state.remainingSeconds <= 0) {
      const h = parseInt(els.inputHours?.value  || 0, 10) || 0;
      const m = parseInt(els.inputMinutes?.value || 0, 10) || 0;
      const s = parseInt(els.inputSeconds?.value || 0, 10) || 0;
      state.totalSeconds = h * 3600 + m * 60 + s;
      state.remainingSeconds = state.totalSeconds;
    }
    if (state.remainingSeconds <= 0) return;
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.running = true;
    updateTimerDisplay();
    els.timerRingWrap?.classList.add('timer-active');
    els.timerProgressFill?.classList.add('active');
    state.timerInterval = setInterval(timerTick, 1000);
    updatePlayBtn();
  }

  function pauseTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.running = false;
    els.timerRingWrap?.classList.remove('timer-active');
    els.timerProgressFill?.classList.remove('active');
    updatePlayBtn();
  }

  function stopTimer() {
    pauseTimer();
    state.remainingSeconds = 0;
    state.totalSeconds = 0;
    resetProgress();
    updateTimerDisplay();
  }

  function resetTimer() {
    pauseTimer();
    const h = parseInt(els.inputHours?.value  || 0, 10) || 0;
    const m = parseInt(els.inputMinutes?.value || 0, 10) || 0;
    const s = parseInt(els.inputSeconds?.value || 0, 10) || 0;
    state.totalSeconds = h * 3600 + m * 60 + s;
    state.remainingSeconds = state.totalSeconds;
    resetProgress();
    updateTimerDisplay();
  }

  function timerTick() {
    if (state.remainingSeconds > 0) {
      state.remainingSeconds--;
      updateTimerDisplay();
      const fraction = state.totalSeconds > 0 ? state.remainingSeconds / state.totalSeconds : 0;
      setProgressFill(els.timerProgressFill, fraction);
    } else {
      pauseTimer();
      onTimerComplete();
    }
  }

  function updateTimerDisplay() {
    if (els.timerDigits) {
      els.timerDigits.textContent = formatHMSFull(state.remainingSeconds);
    }
  }

  function onTimerComplete() {
    playCompletionSound();
    sendNotification('Timer Complete', "Time's up!");
    showCompletionBanner();
    if (els.liveRegion) els.liveRegion.textContent = "Timer complete. Time's up!";
    window.dispatchEvent(new CustomEvent('timerComplete'));
  }

  function showCompletionBanner() {
    const banner = els.completionBanner;
    if (!banner) return;
    banner.classList.remove('hidden');
    if (window.gsap) {
      gsap.from('.completion-inner', { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
    }
    setTimeout(() => banner.classList.add('hidden'), 5000);
  }

  /* ── Stop Clock ── */
  function startClock() {
    if (state.clockInterval) clearInterval(state.clockInterval);
    state.running = true;
    updateClockDisplay();
    state.clockInterval = setInterval(updateClockDisplay, 1000);
    updatePlayBtn();
  }

  function pauseClock() {
    clearInterval(state.clockInterval);
    state.running = false;
    updatePlayBtn();
  }

  function stopClock() { pauseClock(); }
  function resetClock() { pauseClock(); updateClockDisplay(); }

  function updateClockDisplay() {
    const now = new Date();
    if (els.clockDigits) {
      els.clockDigits.textContent = now.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
    }
    if (els.clockDate) {
      els.clockDate.textContent = now.toLocaleDateString([], {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      });
    }
    // Progress: sweep through the minute
    const secs = now.getSeconds() + now.getMinutes() * 60;
    setProgressFill(els.clockProgressFill, secs / 3600);
  }

  /* ── Pomodoro ── */
  function syncPomSettings() {
    const cfg = window.timerSettings || {};
    state.workDuration     = (cfg.pomWork  || 25) * 60;
    state.shortBreak       = (cfg.pomShort || 5)  * 60;
    state.longBreak        = (cfg.pomLong  || 15) * 60;
    state.cyclesBeforeLong = cfg.pomCycles || 4;
  }

  function startPomodoro() {
    syncPomSettings();
    if (state.pomRemaining <= 0) {
      state.pomPhase = 'work';
      state.pomRemaining = state.workDuration;
    }
    if (state.pomInterval) clearInterval(state.pomInterval);
    state.running = true;
    updatePomDisplay();
    els.timerRingWrap?.classList.add('timer-active');
    els.pomProgressFill?.classList.add('active');
    state.pomInterval = setInterval(pomTick, 1000);
    updatePlayBtn();
  }

  function pausePomodoro() {
    clearInterval(state.pomInterval);
    state.running = false;
    els.timerRingWrap?.classList.remove('timer-active');
    els.pomProgressFill?.classList.remove('active');
    updatePlayBtn();
  }

  function stopPomodoro()  { pausePomodoro(); resetPomodoro(); }

  function resetPomodoro() {
    pausePomodoro();
    state.pomPhase = 'work';
    state.pomCycles = 0;
    syncPomSettings();
    state.pomRemaining = state.workDuration;
    resetProgress();
    updatePomDisplay();
  }

  function pomTick() {
    if (state.pomRemaining > 0) {
      state.pomRemaining--;
      updatePomDisplay();
      const total = getPomPhaseDuration();
      setProgressFill(els.pomProgressFill, state.pomRemaining / total);
    } else {
      clearInterval(state.pomInterval);
      state.running = false;
      onPomPhaseComplete();
    }
  }

  function getPomPhaseDuration() {
    if (state.pomPhase === 'work') return state.workDuration;
    if (state.pomPhase === 'short') return state.shortBreak;
    return state.longBreak;
  }

  function onPomPhaseComplete() {
    playCompletionSound();
    els.timerRingWrap?.classList.remove('timer-active');
    els.pomProgressFill?.classList.remove('active');

    if (state.pomPhase === 'work') {
      state.pomCycles++;
      if (state.pomCycles % state.cyclesBeforeLong === 0) {
        state.pomPhase = 'long';
        state.pomRemaining = state.longBreak;
        sendNotification('Pomodoro', 'Great work! Take a long break.');
        if (els.liveRegion) els.liveRegion.textContent = 'Work session complete! Long break time.';
      } else {
        state.pomPhase = 'short';
        state.pomRemaining = state.shortBreak;
        sendNotification('Pomodoro', 'Work session done! Short break.');
        if (els.liveRegion) els.liveRegion.textContent = 'Work session complete! Short break time.';
      }
    } else {
      state.pomPhase = 'work';
      state.pomRemaining = state.workDuration;
      sendNotification('Pomodoro', "Break's over! Time to focus.");
      if (els.liveRegion) els.liveRegion.textContent = 'Break complete! Back to work.';
    }

    showCompletionBanner();
    updatePomDisplay();
    updatePlayBtn();
    window.dispatchEvent(new CustomEvent('pomodoroPhaseChange', { detail: { phase: state.pomPhase } }));
  }

  function updatePomDisplay() {
    if (els.pomDigits) els.pomDigits.textContent = formatHMS(state.pomRemaining);
    if (els.pomPhaseBadge) {
      const labels = { work: 'WORK', short: 'BREAK', long: 'LONG BREAK' };
      els.pomPhaseBadge.textContent = labels[state.pomPhase] || 'WORK';
    }
    if (els.pomCycleCount) els.pomCycleCount.textContent = state.pomCycles;
  }

  /* ── Mode switching ── */
  function setMode(mode) {
    stopAll();
    state.mode = mode;

    const displays = { timer: 'displayTimer', stopclock: 'displayClock', pomodoro: 'displayPomodoro' };
    Object.entries(displays).forEach(([k, id]) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', k !== mode);
    });

    if (els.timerInputs) {
      els.timerInputs.style.display = mode === 'timer' ? 'flex' : 'none';
    }

    resetProgress();
    updatePlayBtn();

    if (mode === 'stopclock') {
      updateClockDisplay();
      startClock();
    }
    if (mode === 'pomodoro') {
      syncPomSettings();
      state.pomRemaining = state.workDuration;
      updatePomDisplay();
    }
  }

  function stopAll() {
    pauseTimer();
    pauseClock();
    pausePomodoro();
    state.running = false;
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.clockInterval)  clearInterval(state.clockInterval);
    if (state.pomInterval)    clearInterval(state.pomInterval);
  }

  /* ── Play/Pause toggle ── */
  function togglePlay() {
    if (state.mode === 'timer') {
      state.running ? pauseTimer() : startTimer();
    } else if (state.mode === 'stopclock') {
      state.running ? pauseClock() : startClock();
    } else if (state.mode === 'pomodoro') {
      state.running ? pausePomodoro() : startPomodoro();
    }
    window.dispatchEvent(new CustomEvent('timerToggle', { detail: { running: state.running } }));
  }

  function handleReset() {
    if (state.mode === 'timer') resetTimer();
    else if (state.mode === 'stopclock') resetClock();
    else if (state.mode === 'pomodoro') resetPomodoro();
  }

  function handleStop() {
    if (state.mode === 'timer') stopTimer();
    else if (state.mode === 'stopclock') stopClock();
    else if (state.mode === 'pomodoro') stopPomodoro();
  }

  function updatePlayBtn() {
    const playIcon  = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    if (playIcon)  playIcon.style.display  = state.running ? 'none' : '';
    if (pauseIcon) pauseIcon.style.display = state.running ? ''     : 'none';
    if (els.btnPlay) {
      els.btnPlay.setAttribute('aria-label', state.running ? 'Pause' : 'Start');
    }
  }

  /* ── Init ── */
  function init() {
    els.timerDigits    = document.getElementById('timerDigits');
    els.clockDigits    = document.getElementById('clockDigits');
    els.clockDate      = document.getElementById('clockDate');
    els.pomDigits      = document.getElementById('pomDigits');
    els.pomPhaseBadge  = document.getElementById('pomPhaseBadge');
    els.pomCycleCount  = document.getElementById('pomCycleCount');
    // Progress fills
    els.timerProgressFill = document.getElementById('ringProgress');
    els.clockProgressFill = document.getElementById('clockRingProgress');
    els.pomProgressFill   = document.getElementById('pomRingProgress');
    // Buttons
    els.btnPlay   = document.getElementById('btnPlay');
    els.btnReset  = document.getElementById('btnReset');
    els.btnStop   = document.getElementById('btnStop');
    // Inputs
    els.timerInputs  = document.getElementById('timerInputs');
    els.inputHours   = document.getElementById('inputHours');
    els.inputMinutes = document.getElementById('inputMinutes');
    els.inputSeconds = document.getElementById('inputSeconds');
    // Displays
    els.displayTimer    = document.getElementById('displayTimer');
    els.displayClock    = document.getElementById('displayClock');
    els.displayPomodoro = document.getElementById('displayPomodoro');
    // Misc
    els.completionBanner = document.getElementById('completionBanner');
    els.liveRegion       = document.getElementById('liveRegion');
    els.timerRingWrap    = document.getElementById('timerRingWrap');

    // Wire buttons
    els.btnPlay?.addEventListener('click', togglePlay);
    els.btnReset?.addEventListener('click', handleReset);
    els.btnStop?.addEventListener('click', handleStop);

    // Mode nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setMode(btn.dataset.mode);
      });
    });

    // Input changes reset timer
    [els.inputHours, els.inputMinutes, els.inputSeconds].forEach(input => {
      input?.addEventListener('input', () => {
        if (!state.running) {
          const h = parseInt(els.inputHours?.value  || 0, 10) || 0;
          const m = parseInt(els.inputMinutes?.value || 0, 10) || 0;
          const s = parseInt(els.inputSeconds?.value || 0, 10) || 0;
          state.totalSeconds = h * 3600 + m * 60 + s;
          state.remainingSeconds = state.totalSeconds;
          updateTimerDisplay();
          resetProgress();
        }
      });
    });

    // Banner click to dismiss
    els.completionBanner?.addEventListener('click', () => {
      els.completionBanner.classList.add('hidden');
    });

    // Initial mode
    setMode('timer');
    resetTimer();
  }

  /* ── Public API ── */
  window.TimerController = {
    init,
    setMode,
    getState: () => ({ ...state }),
    syncSettings: () => syncPomSettings(),
    setRingProgress,
    resetRing,
  };
})();
