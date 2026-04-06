/**
 * js/worldclocks.js — Live world clocks: EST, PST, UK, China, Japan, Australia, India
 */
(function () {
  'use strict';

  const TIMEZONES = [
    { region: 'USA',       city: 'New York',    tz: 'America/New_York'    },
    { region: 'USA',       city: 'Los Angeles', tz: 'America/Los_Angeles' },
    { region: 'UK',        city: 'London',      tz: 'Europe/London'       },
    { region: 'India',     city: 'Mumbai',      tz: 'Asia/Kolkata'        },
    { region: 'China',     city: 'Beijing',     tz: 'Asia/Shanghai'       },
    { region: 'Japan',     city: 'Tokyo',       tz: 'Asia/Tokyo'          },
    { region: 'Australia', city: 'Sydney',      tz: 'Australia/Sydney'    },
  ];

  let tickInterval = null;

  function formatTime(date, tz) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }

  function formatDate(date, tz) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  function getTzAbbr(tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short',
      }).formatToParts(new Date());
      const tzPart = parts.find(p => p.type === 'timeZoneName');
      return tzPart ? tzPart.value : '';
    } catch { return ''; }
  }

  function buildGrid(container) {
    TIMEZONES.forEach(({ region, city, tz }, i) => {
      const card = document.createElement('div');
      card.className = 'clock-card';
      card.dataset.tz = tz;
      card.innerHTML = `
        <div class="clock-region">${region}</div>
        <div class="clock-city">${city}</div>
        <div class="clock-time" id="wc-time-${i}">--:--:--</div>
        <div class="clock-tz" id="wc-tz-${i}">${getTzAbbr(tz)}</div>
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
