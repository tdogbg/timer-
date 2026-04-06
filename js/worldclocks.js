/**
 * js/worldclocks.js — World clock ticker carousel + timezone search
 * Exports: WorldClocks (attached to window)
 */
(function () {
  'use strict';

  /* ── Default timezones shown in ticker ── */
  const DEFAULT_TIMEZONES = [
    { label: 'New York',    tz: 'America/New_York'              },
    { label: 'Los Angeles', tz: 'America/Los_Angeles'           },
    { label: 'Chicago',     tz: 'America/Chicago'               },
    { label: 'Toronto',     tz: 'America/Toronto'               },
    { label: 'Sao Paulo',   tz: 'America/Sao_Paulo'             },
    { label: 'London',      tz: 'Europe/London'                 },
    { label: 'Paris',       tz: 'Europe/Paris'                  },
    { label: 'Berlin',      tz: 'Europe/Berlin'                 },
    { label: 'Moscow',      tz: 'Europe/Moscow'                 },
    { label: 'Dubai',       tz: 'Asia/Dubai'                    },
    { label: 'Mumbai',      tz: 'Asia/Kolkata'                  },
    { label: 'Bangkok',     tz: 'Asia/Bangkok'                  },
    { label: 'Singapore',   tz: 'Asia/Singapore'                },
    { label: 'Beijing',     tz: 'Asia/Shanghai'                 },
    { label: 'Tokyo',       tz: 'Asia/Tokyo'                    },
    { label: 'Seoul',       tz: 'Asia/Seoul'                    },
    { label: 'Sydney',      tz: 'Australia/Sydney'              },
    { label: 'Auckland',    tz: 'Pacific/Auckland'              },
    { label: 'Cairo',       tz: 'Africa/Cairo'                  },
    { label: 'Lagos',       tz: 'Africa/Lagos'                  },
  ];

  /* ── Comprehensive city / country → IANA timezone lookup ── */
  const CITY_TZ_MAP = {
    'new york': { tz: 'America/New_York', label: 'New York' },
    'nyc': { tz: 'America/New_York', label: 'New York' },
    'new york city': { tz: 'America/New_York', label: 'New York' },
    'los angeles': { tz: 'America/Los_Angeles', label: 'Los Angeles' },
    'la': { tz: 'America/Los_Angeles', label: 'Los Angeles' },
    'san francisco': { tz: 'America/Los_Angeles', label: 'San Francisco' },
    'sf': { tz: 'America/Los_Angeles', label: 'San Francisco' },
    'seattle': { tz: 'America/Los_Angeles', label: 'Seattle' },
    'portland': { tz: 'America/Los_Angeles', label: 'Portland' },
    'las vegas': { tz: 'America/Los_Angeles', label: 'Las Vegas' },
    'chicago': { tz: 'America/Chicago', label: 'Chicago' },
    'houston': { tz: 'America/Chicago', label: 'Houston' },
    'dallas': { tz: 'America/Chicago', label: 'Dallas' },
    'minneapolis': { tz: 'America/Chicago', label: 'Minneapolis' },
    'denver': { tz: 'America/Denver', label: 'Denver' },
    'phoenix': { tz: 'America/Phoenix', label: 'Phoenix' },
    'miami': { tz: 'America/New_York', label: 'Miami' },
    'atlanta': { tz: 'America/New_York', label: 'Atlanta' },
    'boston': { tz: 'America/New_York', label: 'Boston' },
    'washington': { tz: 'America/New_York', label: 'Washington DC' },
    'dc': { tz: 'America/New_York', label: 'Washington DC' },
    'philadelphia': { tz: 'America/New_York', label: 'Philadelphia' },
    'toronto': { tz: 'America/Toronto', label: 'Toronto' },
    'montreal': { tz: 'America/Toronto', label: 'Montreal' },
    'ottawa': { tz: 'America/Toronto', label: 'Ottawa' },
    'vancouver': { tz: 'America/Vancouver', label: 'Vancouver' },
    'calgary': { tz: 'America/Edmonton', label: 'Calgary' },
    'mexico city': { tz: 'America/Mexico_City', label: 'Mexico City' },
    'anchorage': { tz: 'America/Anchorage', label: 'Anchorage' },
    'honolulu': { tz: 'Pacific/Honolulu', label: 'Honolulu' },
    'hawaii': { tz: 'Pacific/Honolulu', label: 'Honolulu' },
    'alaska': { tz: 'America/Anchorage', label: 'Anchorage' },
    'sao paulo': { tz: 'America/Sao_Paulo', label: 'Sao Paulo' },
    'rio de janeiro': { tz: 'America/Sao_Paulo', label: 'Rio de Janeiro' },
    'buenos aires': { tz: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
    'bogota': { tz: 'America/Bogota', label: 'Bogota' },
    'lima': { tz: 'America/Lima', label: 'Lima' },
    'santiago': { tz: 'America/Santiago', label: 'Santiago' },
    'caracas': { tz: 'America/Caracas', label: 'Caracas' },
    'london': { tz: 'Europe/London', label: 'London' },
    'paris': { tz: 'Europe/Paris', label: 'Paris' },
    'berlin': { tz: 'Europe/Berlin', label: 'Berlin' },
    'madrid': { tz: 'Europe/Madrid', label: 'Madrid' },
    'barcelona': { tz: 'Europe/Madrid', label: 'Barcelona' },
    'rome': { tz: 'Europe/Rome', label: 'Rome' },
    'milan': { tz: 'Europe/Rome', label: 'Milan' },
    'amsterdam': { tz: 'Europe/Amsterdam', label: 'Amsterdam' },
    'brussels': { tz: 'Europe/Brussels', label: 'Brussels' },
    'vienna': { tz: 'Europe/Vienna', label: 'Vienna' },
    'zurich': { tz: 'Europe/Zurich', label: 'Zurich' },
    'geneva': { tz: 'Europe/Zurich', label: 'Geneva' },
    'stockholm': { tz: 'Europe/Stockholm', label: 'Stockholm' },
    'oslo': { tz: 'Europe/Oslo', label: 'Oslo' },
    'copenhagen': { tz: 'Europe/Copenhagen', label: 'Copenhagen' },
    'helsinki': { tz: 'Europe/Helsinki', label: 'Helsinki' },
    'warsaw': { tz: 'Europe/Warsaw', label: 'Warsaw' },
    'prague': { tz: 'Europe/Prague', label: 'Prague' },
    'budapest': { tz: 'Europe/Budapest', label: 'Budapest' },
    'bucharest': { tz: 'Europe/Bucharest', label: 'Bucharest' },
    'athens': { tz: 'Europe/Athens', label: 'Athens' },
    'istanbul': { tz: 'Europe/Istanbul', label: 'Istanbul' },
    'moscow': { tz: 'Europe/Moscow', label: 'Moscow' },
    'st petersburg': { tz: 'Europe/Moscow', label: 'St. Petersburg' },
    'kyiv': { tz: 'Europe/Kyiv', label: 'Kyiv' },
    'kiev': { tz: 'Europe/Kyiv', label: 'Kyiv' },
    'lisbon': { tz: 'Europe/Lisbon', label: 'Lisbon' },
    'dublin': { tz: 'Europe/Dublin', label: 'Dublin' },
    'cairo': { tz: 'Africa/Cairo', label: 'Cairo' },
    'lagos': { tz: 'Africa/Lagos', label: 'Lagos' },
    'johannesburg': { tz: 'Africa/Johannesburg', label: 'Johannesburg' },
    'nairobi': { tz: 'Africa/Nairobi', label: 'Nairobi' },
    'casablanca': { tz: 'Africa/Casablanca', label: 'Casablanca' },
    'accra': { tz: 'Africa/Accra', label: 'Accra' },
    'addis ababa': { tz: 'Africa/Addis_Ababa', label: 'Addis Ababa' },
    'dubai': { tz: 'Asia/Dubai', label: 'Dubai' },
    'abu dhabi': { tz: 'Asia/Dubai', label: 'Abu Dhabi' },
    'riyadh': { tz: 'Asia/Riyadh', label: 'Riyadh' },
    'jeddah': { tz: 'Asia/Riyadh', label: 'Jeddah' },
    'doha': { tz: 'Asia/Qatar', label: 'Doha' },
    'kuwait': { tz: 'Asia/Kuwait', label: 'Kuwait City' },
    'tel aviv': { tz: 'Asia/Jerusalem', label: 'Tel Aviv' },
    'jerusalem': { tz: 'Asia/Jerusalem', label: 'Jerusalem' },
    'baghdad': { tz: 'Asia/Baghdad', label: 'Baghdad' },
    'tehran': { tz: 'Asia/Tehran', label: 'Tehran' },
    'karachi': { tz: 'Asia/Karachi', label: 'Karachi' },
    'mumbai': { tz: 'Asia/Kolkata', label: 'Mumbai' },
    'delhi': { tz: 'Asia/Kolkata', label: 'Delhi' },
    'new delhi': { tz: 'Asia/Kolkata', label: 'New Delhi' },
    'kolkata': { tz: 'Asia/Kolkata', label: 'Kolkata' },
    'bangalore': { tz: 'Asia/Kolkata', label: 'Bangalore' },
    'hyderabad': { tz: 'Asia/Kolkata', label: 'Hyderabad' },
    'chennai': { tz: 'Asia/Kolkata', label: 'Chennai' },
    'dhaka': { tz: 'Asia/Dhaka', label: 'Dhaka' },
    'colombo': { tz: 'Asia/Colombo', label: 'Colombo' },
    'kathmandu': { tz: 'Asia/Kathmandu', label: 'Kathmandu' },
    'yangon': { tz: 'Asia/Yangon', label: 'Yangon' },
    'bangkok': { tz: 'Asia/Bangkok', label: 'Bangkok' },
    'ho chi minh': { tz: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City' },
    'hanoi': { tz: 'Asia/Bangkok', label: 'Hanoi' },
    'phnom penh': { tz: 'Asia/Phnom_Penh', label: 'Phnom Penh' },
    'kuala lumpur': { tz: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur' },
    'singapore': { tz: 'Asia/Singapore', label: 'Singapore' },
    'jakarta': { tz: 'Asia/Jakarta', label: 'Jakarta' },
    'manila': { tz: 'Asia/Manila', label: 'Manila' },
    'hong kong': { tz: 'Asia/Hong_Kong', label: 'Hong Kong' },
    'beijing': { tz: 'Asia/Shanghai', label: 'Beijing' },
    'shanghai': { tz: 'Asia/Shanghai', label: 'Shanghai' },
    'guangzhou': { tz: 'Asia/Shanghai', label: 'Guangzhou' },
    'shenzhen': { tz: 'Asia/Shanghai', label: 'Shenzhen' },
    'taipei': { tz: 'Asia/Taipei', label: 'Taipei' },
    'seoul': { tz: 'Asia/Seoul', label: 'Seoul' },
    'tokyo': { tz: 'Asia/Tokyo', label: 'Tokyo' },
    'osaka': { tz: 'Asia/Tokyo', label: 'Osaka' },
    'ulaanbaatar': { tz: 'Asia/Ulaanbaatar', label: 'Ulaanbaatar' },
    'sydney': { tz: 'Australia/Sydney', label: 'Sydney' },
    'melbourne': { tz: 'Australia/Melbourne', label: 'Melbourne' },
    'brisbane': { tz: 'Australia/Brisbane', label: 'Brisbane' },
    'perth': { tz: 'Australia/Perth', label: 'Perth' },
    'auckland': { tz: 'Pacific/Auckland', label: 'Auckland' },
    'wellington': { tz: 'Pacific/Auckland', label: 'Wellington' },
    'fiji': { tz: 'Pacific/Fiji', label: 'Suva' },
    /* countries */
    'usa': { tz: 'America/New_York', label: 'New York' },
    'us': { tz: 'America/New_York', label: 'New York' },
    'united states': { tz: 'America/New_York', label: 'New York' },
    'america': { tz: 'America/New_York', label: 'New York' },
    'uk': { tz: 'Europe/London', label: 'London' },
    'britain': { tz: 'Europe/London', label: 'London' },
    'england': { tz: 'Europe/London', label: 'London' },
    'france': { tz: 'Europe/Paris', label: 'Paris' },
    'germany': { tz: 'Europe/Berlin', label: 'Berlin' },
    'spain': { tz: 'Europe/Madrid', label: 'Madrid' },
    'italy': { tz: 'Europe/Rome', label: 'Rome' },
    'japan': { tz: 'Asia/Tokyo', label: 'Tokyo' },
    'china': { tz: 'Asia/Shanghai', label: 'Beijing' },
    'india': { tz: 'Asia/Kolkata', label: 'Mumbai' },
    'australia': { tz: 'Australia/Sydney', label: 'Sydney' },
    'new zealand': { tz: 'Pacific/Auckland', label: 'Auckland' },
    'brazil': { tz: 'America/Sao_Paulo', label: 'Sao Paulo' },
    'russia': { tz: 'Europe/Moscow', label: 'Moscow' },
    'south korea': { tz: 'Asia/Seoul', label: 'Seoul' },
    'korea': { tz: 'Asia/Seoul', label: 'Seoul' },
    'uae': { tz: 'Asia/Dubai', label: 'Dubai' },
    'saudi arabia': { tz: 'Asia/Riyadh', label: 'Riyadh' },
    'egypt': { tz: 'Africa/Cairo', label: 'Cairo' },
    'nigeria': { tz: 'Africa/Lagos', label: 'Lagos' },
    'south africa': { tz: 'Africa/Johannesburg', label: 'Johannesburg' },
    'kenya': { tz: 'Africa/Nairobi', label: 'Nairobi' },
    'turkey': { tz: 'Europe/Istanbul', label: 'Istanbul' },
    'iran': { tz: 'Asia/Tehran', label: 'Tehran' },
    'pakistan': { tz: 'Asia/Karachi', label: 'Karachi' },
    'bangladesh': { tz: 'Asia/Dhaka', label: 'Dhaka' },
    'thailand': { tz: 'Asia/Bangkok', label: 'Bangkok' },
    'vietnam': { tz: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City' },
    'indonesia': { tz: 'Asia/Jakarta', label: 'Jakarta' },
    'philippines': { tz: 'Asia/Manila', label: 'Manila' },
    'malaysia': { tz: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur' },
    'taiwan': { tz: 'Asia/Taipei', label: 'Taipei' },
    'mexico': { tz: 'America/Mexico_City', label: 'Mexico City' },
    'argentina': { tz: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
    'colombia': { tz: 'America/Bogota', label: 'Bogota' },
    'peru': { tz: 'America/Lima', label: 'Lima' },
    'chile': { tz: 'America/Santiago', label: 'Santiago' },
    'canada': { tz: 'America/Toronto', label: 'Toronto' },
    'morocco': { tz: 'Africa/Casablanca', label: 'Casablanca' },
    'israel': { tz: 'Asia/Jerusalem', label: 'Tel Aviv' },
    'ukraine': { tz: 'Europe/Kyiv', label: 'Kyiv' },
    'poland': { tz: 'Europe/Warsaw', label: 'Warsaw' },
    'sweden': { tz: 'Europe/Stockholm', label: 'Stockholm' },
    'norway': { tz: 'Europe/Oslo', label: 'Oslo' },
    'denmark': { tz: 'Europe/Copenhagen', label: 'Copenhagen' },
    'finland': { tz: 'Europe/Helsinki', label: 'Helsinki' },
    'netherlands': { tz: 'Europe/Amsterdam', label: 'Amsterdam' },
    'belgium': { tz: 'Europe/Brussels', label: 'Brussels' },
    'austria': { tz: 'Europe/Vienna', label: 'Vienna' },
    'switzerland': { tz: 'Europe/Zurich', label: 'Zurich' },
    'greece': { tz: 'Europe/Athens', label: 'Athens' },
    'hungary': { tz: 'Europe/Budapest', label: 'Budapest' },
    'czech republic': { tz: 'Europe/Prague', label: 'Prague' },
    'czechia': { tz: 'Europe/Prague', label: 'Prague' },
    'romania': { tz: 'Europe/Bucharest', label: 'Bucharest' },
    'iraq': { tz: 'Asia/Baghdad', label: 'Baghdad' },
    'qatar': { tz: 'Asia/Qatar', label: 'Doha' },
    'mongolia': { tz: 'Asia/Ulaanbaatar', label: 'Ulaanbaatar' },
    'portugal': { tz: 'Europe/Lisbon', label: 'Lisbon' },
    'ireland': { tz: 'Europe/Dublin', label: 'Dublin' },
    'ethiopia': { tz: 'Africa/Addis_Ababa', label: 'Addis Ababa' },
    'ghana': { tz: 'Africa/Accra', label: 'Accra' },
  };

  let carouselTimezones = [...DEFAULT_TIMEZONES];
  let tickInterval = null;

  /* ── Time helpers ── */
  function formatTime(tz) {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }).format(new Date());
    } catch { return '--:--:--'; }
  }

  function getTzAbbr(tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, timeZoneName: 'short',
      }).formatToParts(new Date());
      return (parts.find(p => p.type === 'timeZoneName') || {}).value || '';
    } catch { return ''; }
  }

  /* ── Ticker build/update ── */
  function buildTicker() {
    const ticker = document.getElementById('clockTicker');
    if (!ticker) return;

    let html = '';
    // Duplicate items for seamless infinite scroll (-50% animation)
    for (let copy = 0; copy < 2; copy++) {
      carouselTimezones.forEach(({ label, tz }, i) => {
        const id = `tk-${copy}-${i}`;
        html += `
          <div class="ticker-item">
            <span class="ticker-city">${label}</span>
            <span class="ticker-time" id="${id}">${formatTime(tz)}</span>
            <span class="ticker-tz">${getTzAbbr(tz)}</span>
          </div>
          <span class="ticker-dot" aria-hidden="true"></span>`;
      });
    }
    ticker.innerHTML = html;

    // Reset animation so new items join the flow cleanly
    ticker.style.animation = 'none';
    // Force reflow — reading offsetWidth triggers a synchronous layout,
    // which is required to restart the CSS animation from the beginning.
    void ticker.offsetWidth;
    ticker.style.animation = '';
  }

  function updateTicker() {
    const now = new Date();
    carouselTimezones.forEach(({ tz }, i) => {
      let time;
      try {
        time = new Intl.DateTimeFormat('en-US', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }).format(now);
      } catch { return; }
      for (let copy = 0; copy < 2; copy++) {
        const el = document.getElementById(`tk-${copy}-${i}`);
        if (el) el.textContent = time;
      }
    });
  }

  /* ── World clocks grid (bottom panel) ── */
  function buildGrid() {
    const container = document.getElementById('worldClocksGrid');
    if (!container) return;
    container.innerHTML = '';
    DEFAULT_TIMEZONES.forEach(({ label, tz }, i) => {
      const card = document.createElement('div');
      card.className = 'clock-card';
      card.dataset.tz = tz;
      card.innerHTML = `
        <div class="clock-city">${label}</div>
        <div class="clock-time" id="wc-time-${i}">${formatTime(tz)}</div>
        <div class="clock-tz">${getTzAbbr(tz)}</div>
      `;
      container.appendChild(card);
    });
  }

  function updateGrid() {
    const now = new Date();
    DEFAULT_TIMEZONES.forEach(({ tz }, i) => {
      const el = document.getElementById(`wc-time-${i}`);
      if (!el) return;
      try {
        el.textContent = new Intl.DateTimeFormat('en-US', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }).format(now);
      } catch { /* */ }
    });
  }

  /* ── Search ── */
  function initSearch() {
    const input   = document.getElementById('tzSearchInput');
    const results = document.getElementById('tzSearchResults');
    if (!input || !results) return;

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      if (!query) { results.classList.add('hidden'); results.innerHTML = ''; return; }

      const matches = Object.entries(CITY_TZ_MAP)
        .filter(([key]) => key.includes(query))
        .slice(0, 8);

      if (!matches.length) {
        results.innerHTML = '<div class="tz-no-result">No results found</div>';
        results.classList.remove('hidden');
        return;
      }

      results.innerHTML = matches.map(([, { tz, label }]) => `
        <div class="tz-result-item" data-tz="${tz}" data-label="${label}" role="option">
          <span class="tz-result-city">${label}</span>
          <span class="tz-result-time">${formatTime(tz)}</span>
          <span class="tz-result-tz">${getTzAbbr(tz)}</span>
        </div>
      `).join('');
      results.classList.remove('hidden');
    });

    results.addEventListener('click', e => {
      const item = e.target.closest('.tz-result-item');
      if (!item) return;
      const { tz, label } = item.dataset;
      if (!tz) return;

      // Add to carousel if not already present
      if (!carouselTimezones.find(t => t.tz === tz)) {
        carouselTimezones.push({ label, tz });
        buildTicker();
        updateTicker();
      }

      input.value = '';
      results.innerHTML = '';
      results.classList.add('hidden');
      showAddedNotification(label);
    });

    // Close dropdown on outside click
    document.addEventListener('click', e => {
      const wrap = document.querySelector('.tz-search-inner');
      if (wrap && !wrap.contains(e.target)) results.classList.add('hidden');
    });

    // Keyboard: Escape closes
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { results.classList.add('hidden'); input.blur(); }
    });
  }

  function showAddedNotification(label) {
    let notif = document.getElementById('tzAddedNotif');
    if (!notif) {
      notif = document.createElement('div');
      notif.id = 'tzAddedNotif';
      notif.className = 'tz-added-notif';
      document.body.appendChild(notif);
    }
    notif.textContent = `${label} added to carousel`;
    notif.classList.add('show');
    clearTimeout(notif._hideTimer);
    notif._hideTimer = setTimeout(() => notif.classList.remove('show'), 2600);
  }

  /* ── Init ── */
  function init() {
    buildTicker();
    buildGrid();
    initSearch();
    tickInterval = setInterval(() => { updateTicker(); updateGrid(); }, 1000);
  }

  window.WorldClocks = { init };
})();
