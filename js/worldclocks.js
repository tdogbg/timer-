/**
 * js/worldclocks.js — Live world clocks for multiple timezones
 */
(function () {
  'use strict';

  const TIMEZONES = [
    { city: 'New York',    tz: 'America/New_York',       flag: '🇺🇸' },
    { city: 'Los Angeles', tz: 'America/Los_Angeles',    flag: '🇺🇸' },
    { city: 'Chicago',     tz: 'America/Chicago',        flag: '🇺🇸' },
    { city: 'London',      tz: 'Europe/London',          flag: '🇬🇧' },
    { city: 'Paris',       tz: 'Europe/Paris',           flag: '🇫🇷' },
    { city: 'Dubai',       tz: 'Asia/Dubai',             flag: '🇦🇪' },
    { city: 'Mumbai',      tz: 'Asia/Kolkata',           flag: '🇮🇳' },
    { city: 'Beijing',     tz: 'Asia/Shanghai',          flag: '🇨🇳' },
    { city: 'Tokyo',       tz: 'Asia/Tokyo',             flag: '🇯🇵' },
    { city: 'Seoul',       tz: 'Asia/Seoul',             flag: '🇰🇷' },
    { city: 'Sydney',      tz: 'Australia/Sydney',       flag: '🇦🇺' },
    { city: 'Auckland',    tz: 'Pacific/Auckland',       flag: '🇳🇿' },
  ];

  let tickInterval = null;

  function formatTime(date, tz) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }

  function formatDate(date, tz) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  function getTzAbbr(tz) {
    try {
      const str = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short',
      }).format(new Date());
      const parts = str.split(' ');
      return parts[parts.length - 1] || tz;
    } catch { return tz; }
  }

  function buildGrid(container) {
    TIMEZONES.forEach(({ city, tz, flag }, i) => {
      const card = document.createElement('div');
      card.className = 'clock-card';
      card.dataset.tz = tz;
      card.innerHTML = `
        <div class="clock-city">${flag} ${city}</div>
        <div class="clock-time" id="wc-time-${i}">00:00:00</div>
        <div class="clock-tz">${getTzAbbr(tz)}</div>
        <div class="clock-date-small" id="wc-date-${i}"></div>
      `;
      container.appendChild(card);
    });
  }

  function tick() {
    const now = new Date();
    TIMEZONES.forEach(({ tz }, i) => {
      const timeEl = document.getElementById(`wc-time-${i}`);
      const dateEl = document.getElementById(`wc-date-${i}`);
      if (timeEl) timeEl.textContent = formatTime(now, tz);
      if (dateEl) dateEl.textContent = formatDate(now, tz);
    });
  }

  function init() {
    const container = document.getElementById('worldClocksGrid');
    if (!container) return;
    buildGrid(container);
    tick();
    tickInterval = setInterval(tick, 1000);
  }

  window.WorldClocks = { init };
})();
