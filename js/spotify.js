/**
 * js/spotify.js — Spotify Web API integration (PKCE OAuth)
 * Exports: SpotifyController (attached to window)
 *
 * Uses Authorization Code with PKCE — no server required.
 * Docs: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */
(function () {
  'use strict';

  /* ── PKCE helpers ── */
  function generateCodeVerifier(length = 128) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values, v => possible[v % possible.length]).join('');
  }

  async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /* ── Token storage ── */
  const STORE_KEY = 'spotify_tokens';
  function saveTokens(data) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        accessToken:  data.access_token,
        refreshToken: data.refresh_token || null,
        expiresAt:    Date.now() + (data.expires_in || 3600) * 1000,
      }));
    } catch (e) { /* storage full */ }
  }
  function loadTokens() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
  }
  function clearTokens() {
    try { localStorage.removeItem(STORE_KEY); } catch { /* */ }
  }

  function getClientId() {
    return (window.timerSettings?.spotifyClientId || '').trim();
  }

  /* ── State ── */
  const state = {
    connected: false,
    playing: false,
    track: null,
    pollingInterval: null,
    progressInterval: null,
    progressMs: 0,
    durationMs: 1,
  };

  /* ── DOM ── */
  const ids = [
    'spotifyAuth', 'spotifyPlayer', 'spotifyLoginBtn', 'spotifyDisconnect',
    'albumArt', 'artGlow', 'trackName', 'artistName', 'albumName',
    'progressFill', 'progressTime', 'durationTime',
    'spPlayPause', 'spPrev', 'spNext',
  ];
  const el = {};

  /* ── Auth ── */
  async function login() {
    const clientId = getClientId();
    if (!clientId) {
      alert('Please enter your Spotify Client ID in Settings first.');
      document.getElementById('settingsToggle')?.click();
      return;
    }

    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    try { localStorage.setItem('spotify_verifier', verifier); } catch { /* */ }

    const redirectUri = window.location.origin + window.location.pathname.replace('index.html', '') + 'callback.html';
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state: Math.random().toString(36).slice(2),
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  }

  async function exchangeCode(code) {
    const clientId = getClientId();
    const verifier = localStorage.getItem('spotify_verifier');
    const redirectUri = window.location.origin + window.location.pathname.replace('index.html', '') + 'callback.html';
    if (!clientId || !verifier) return null;

    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: verifier,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      saveTokens(data);
      try { localStorage.removeItem('spotify_verifier'); } catch { /* */ }
      return data.access_token;
    } catch { return null; }
  }

  async function refreshAccessToken() {
    const tokens = loadTokens();
    if (!tokens?.refreshToken) return null;
    const clientId = getClientId();
    if (!clientId) return null;

    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: clientId,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      saveTokens({ ...data, refresh_token: tokens.refreshToken });
      return data.access_token;
    } catch { return null; }
  }

  async function getValidToken() {
    const tokens = loadTokens();
    if (!tokens) return null;
    if (tokens.expiresAt > Date.now() + 30000) return tokens.accessToken;
    return refreshAccessToken();
  }

  /* ── API calls ── */
  async function apiCall(endpoint, method = 'GET', body = null) {
    const token = await getValidToken();
    if (!token) { disconnect(); return null; }
    const opts = {
      method,
      headers: { Authorization: `Bearer ${token}` },
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    try {
      const res = await fetch(`https://api.spotify.com/v1${endpoint}`, opts);
      if (res.status === 401) { disconnect(); return null; }
      if (res.status === 204 || res.status === 200 && res.headers.get('content-length') === '0') return {};
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return res.json();
      return {};
    } catch { return null; }
  }

  /* ── Now Playing ── */
  async function fetchNowPlaying() {
    const data = await apiCall('/me/player?additional_types=track');
    if (!data) return;
    if (data.item) {
      updatePlayerUI(data);
    } else {
      updatePlayerUI(null);
    }
  }

  function updateSpPlayPauseIcon(playing) {
    const playIcon  = document.getElementById('spPlayIcon');
    const pauseIcon = document.getElementById('spPauseIcon');
    if (playIcon)  playIcon.style.display  = playing ? 'none' : '';
    if (pauseIcon) pauseIcon.style.display = playing ? ''     : 'none';
  }

  function updatePlayerUI(data) {
    if (!data || !data.item) {
      if (el.trackName) el.trackName.textContent = 'Nothing playing';
      if (el.artistName) el.artistName.textContent = '—';
      if (el.albumName)  el.albumName.textContent  = '—';
      if (el.albumArt)   el.albumArt.src = '';
      updateSpPlayPauseIcon(false);
      state.playing = false;
      return;
    }

    const track = data.item;
    state.playing = data.is_playing;
    state.progressMs = data.progress_ms || 0;
    state.durationMs = track.duration_ms || 1;

    if (el.trackName)  el.trackName.textContent  = track.name;
    if (el.artistName) el.artistName.textContent = track.artists?.map(a => a.name).join(', ') || '—';
    if (el.albumName)  el.albumName.textContent  = track.album?.name || '—';

    const artUrl = track.album?.images?.[0]?.url;
    if (el.albumArt && artUrl) {
      el.albumArt.src = artUrl;
      el.albumArt.alt = track.album.name;
      if (el.artGlow) el.artGlow.style.background = '#1DB954';
    }

    updateSpPlayPauseIcon(state.playing);

    updateProgress();
    startProgressSmoother(state.playing);
  }

  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function updateProgress() {
    const pct = state.durationMs > 0 ? (state.progressMs / state.durationMs) * 100 : 0;
    if (el.progressFill) el.progressFill.style.width = `${pct}%`;
    if (el.progressTime) el.progressTime.textContent = formatTime(state.progressMs);
    if (el.durationTime) el.durationTime.textContent = formatTime(state.durationMs);
  }

  function startProgressSmoother(playing) {
    if (state.progressInterval) clearInterval(state.progressInterval);
    if (!playing) return;
    state.progressInterval = setInterval(() => {
      state.progressMs = Math.min(state.progressMs + 1000, state.durationMs);
      updateProgress();
    }, 1000);
  }

  /* ── Controls ── */
  async function togglePlayPause() {
    const token = await getValidToken();
    if (!token) return;
    if (state.playing) {
      await apiCall('/me/player/pause', 'PUT');
      state.playing = false;
    } else {
      await apiCall('/me/player/play', 'PUT');
      state.playing = true;
    }
    if (el.spPlayPause) updateSpPlayPauseIcon(state.playing);
    startProgressSmoother(state.playing);
  }


  async function nextTrack() {
    await apiCall('/me/player/next', 'POST');
    setTimeout(fetchNowPlaying, 700);
  }

  async function prevTrack() {
    await apiCall('/me/player/previous', 'POST');
    setTimeout(fetchNowPlaying, 700);
  }

  /* ── Connect / Disconnect ── */
  function connect() {
    if (el.spotifyAuth)   el.spotifyAuth.classList.add('hidden');
    if (el.spotifyPlayer) el.spotifyPlayer.classList.remove('hidden');
    state.connected = true;
    fetchNowPlaying();
    if (state.pollingInterval) clearInterval(state.pollingInterval);
    state.pollingInterval = setInterval(fetchNowPlaying, 5000);
  }

  function disconnect() {
    clearTokens();
    if (state.pollingInterval) clearInterval(state.pollingInterval);
    if (state.progressInterval) clearInterval(state.progressInterval);
    state.connected = false;
    if (el.spotifyAuth)   el.spotifyAuth.classList.remove('hidden');
    if (el.spotifyPlayer) el.spotifyPlayer.classList.add('hidden');
  }

  /* ── Timer integration ── */
  let timerWasPausing = false;
  window.addEventListener('timerToggle', (e) => {
    const settings = window.timerSettings || {};
    if (!settings.spotifyPauseWithTimer) return;
    if (!state.connected) return;
    const running = e.detail?.running;
    if (running && state.playing) {
      apiCall('/me/player/pause', 'PUT');
      state.playing = false;
      updateSpPlayPauseIcon(false);
      timerWasPausing = true;
    } else if (!running && timerWasPausing) {
      apiCall('/me/player/play', 'PUT');
      state.playing = true;
      updateSpPlayPauseIcon(true);
      timerWasPausing = false;
    }
  });

  /* ── Init ── */
  function init() {
    ids.forEach(id => { el[id] = document.getElementById(id); });

    el.spotifyLoginBtn?.addEventListener('click', login);
    el.spotifyDisconnect?.addEventListener('click', disconnect);
    el.spPlayPause?.addEventListener('click', togglePlayPause);
    el.spNext?.addEventListener('click', nextTrack);
    el.spPrev?.addEventListener('click', prevTrack);

    // Check for OAuth callback code passed via sessionStorage (from callback.html)
    const pendingCode = sessionStorage.getItem('spotify_code');
    if (pendingCode) {
      sessionStorage.removeItem('spotify_code');
      exchangeCode(pendingCode).then(token => {
        if (token) connect();
      });
      return;
    }

    // Check for existing valid tokens
    getValidToken().then(token => {
      if (token) connect();
    });
  }

  /* ── Public API ── */
  window.SpotifyController = { init, login, disconnect, togglePlayPause, nextTrack, prevTrack };
})();
