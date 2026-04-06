# ⏱ TIMEX — Setup Guide

A fully client-side, static timer web app with Spotify integration and world clocks.  
No build step required — just open `index.html` in a browser or serve the folder.

---

## 🚀 Quick Start (Local)

```bash
# Clone / enter repo
cd timer-

# Serve with any static server (Python example):
python3 -m http.server 8080
# → Open http://localhost:8080
```

---

## 🌐 Deploy to terryzheng.tech/timer

### Option A — Static hosting (Nginx / Apache)
1. Copy all files into your web root under `/timer/`:
   ```
   /var/www/html/timer/
   ├── index.html
   ├── callback.html
   ├── css/
   ├── js/
   └── ...
   ```
2. Ensure your server serves `index.html` as the directory index.
3. Update the Spotify **Redirect URI** (see below) to `https://terryzheng.tech/timer/callback.html`.

### Option B — GitHub Pages
1. Push this repo to GitHub.
2. Go to **Settings → Pages** → Deploy from `main` branch (root folder).
3. Your site will be at `https://your-username.github.io/timer-/`.

### Connect to Main Portfolio
To link from your main site at `terryzheng.tech`, add a card/link that points to `https://terryzheng.tech/timer/`.

---

## 🎵 Spotify API Setup

### 1. Create a Spotify App
1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **Create app**
4. Fill in:
   - **App name**: `TIMEX`
   - **App description**: Personal timer site
   - **Website**: `https://terryzheng.tech`
   - **Redirect URI**: `https://terryzheng.tech/timer/callback.html`  
     *(For local dev, also add `http://localhost:8080/callback.html`)*
5. Check **Web API** → Save

### 2. Get Your Client ID
1. Open your newly created app in the dashboard
2. Copy the **Client ID** (the **Client Secret** is NOT needed — we use PKCE)

### 3. Add to TIMEX
1. Open TIMEX in your browser
2. Click the **⚙ Settings** button (top right)
3. Scroll to **Spotify** section
4. Paste your **Client ID** into the field
5. Click **Save & Connect**
6. You'll be redirected to Spotify to authorize
7. After authorizing, you'll be redirected back and music controls will appear

### Required Scopes (auto-requested)
| Scope | Purpose |
|-------|---------|
| `user-read-playback-state` | See current track & playback status |
| `user-modify-playback-state` | Play, pause, skip tracks |
| `user-read-currently-playing` | Show now-playing info |

### Security Note
This app uses **Authorization Code with PKCE** — no Client Secret or server required.
Your Client ID is stored only in your browser's localStorage.

---

## ⚙️ Features

| Feature | Description |
|---------|-------------|
| **Custom Timer** | Set hours, minutes, seconds — visual ring countdown |
| **Stop Clock** | Live clock display with date |
| **Pomodoro** | Work/short-break/long-break cycles, customizable durations |
| **Sound Alerts** | Web Audio API tones on completion |
| **Notifications** | Browser push notifications (permission required) |
| **Spotify** | OAuth login, now-playing display, play/pause/skip controls |
| **World Clocks** | 12 live timezone clocks updating every second |
| **Parallax** | GSAP-powered scroll and mouse parallax effects |
| **Custom Cursor** | Smooth cursor tracking with hover ring expansion |
| **Settings** | Persistent settings stored in localStorage |

---

## 📁 File Structure

```
timer-/
├── index.html          # Main page
├── callback.html       # Spotify OAuth redirect handler
├── css/
│   └── style.css       # All styles (glassmorphism dark theme)
├── js/
│   ├── timer.js        # Timer, Stop Clock, Pomodoro logic
│   ├── spotify.js      # Spotify PKCE OAuth + playback API
│   ├── worldclocks.js  # Live world timezone clocks
│   └── app.js          # Animations, cursor, settings, bootstrap
├── .env.example        # Environment variable template
└── SETUP.md            # This file
```

---

## 🛠 Dependencies (CDN — no npm required)

- [GSAP 3.12](https://gsap.com/) — Animations & ScrollTrigger
- [Google Fonts](https://fonts.google.com/) — Inter + Space Mono
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)

---

## 🤝 Connecting to Main Portfolio

In your main portfolio site's `index.html` or navigation, add:

```html
<a href="/timer/" class="project-link">
  ⏱ TIMEX Timer
</a>
```

Or as a card:
```html
<div class="project-card">
  <h3>⏱ TIMEX</h3>
  <p>Immersive timer with Spotify & world clocks</p>
  <a href="/timer/">Open App →</a>
</div>
```
