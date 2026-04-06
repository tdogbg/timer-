# ⏱ TIMEX — Immersive Timer

A premium countdown timer website with Spotify integration, Pomodoro mode, world clocks, and GSAP animations.

## Features
- **Custom Timer** — set any duration with a visual ring countdown
- **Stop Clock** — live clock with date display
- **Pomodoro Mode** — work/break cycles with customizable durations
- **Spotify Integration** — OAuth PKCE login, now-playing display, play/pause/skip controls
- **World Clocks** — 12 live timezone clocks (USA, UK, Europe, Asia, Australia)
- **GSAP Animations** — parallax, scroll zoom, mouse parallax, staggered reveals
- **Custom Cursor** — tracking cursor with hover ring expansion
- **Sound & Browser Notifications** — alerts on timer completion
- **Glassmorphism Dark UI** — responsive, mobile-friendly

## Quick Start

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## Spotify Setup

See **[SETUP.md](SETUP.md)** for full instructions on:
- Creating a Spotify Developer app
- Getting your Client ID (no secret needed — uses PKCE)
- Configuring redirect URIs
- Deploying to `terryzheng.tech/timer`

