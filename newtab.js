/* ══════════════════════════════════════
   newtab.js — Launchpad (MD3 Light)
   ══════════════════════════════════════ */

// ─────────────────────────────────────
// UTILS
// ─────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}


// ─────────────────────────────────────
// SETTINGS — synchronously available, loaded from chrome.storage.sync
// ─────────────────────────────────────
const SETTINGS_KEY = 'launchpad_settings';
const DEFAULT_SETTINGS = {
  name:           '',
  temp_unit:      'c',     // 'c' | 'f'
  clock_format:   '24',    // '24' | '12'
  wind_unit:      'kmh',   // 'kmh' | 'mph'
  show_seconds:   true,
  show_greeting:  true,
  show_search:    true,
  show_weather:   true,
  color_scheme:   'light', // 'light' | 'dark'
};

// Globally accessible — populated synchronously from cache, then refreshed async.
const SETTINGS = { ...DEFAULT_SETTINGS };

// Try localStorage cache first for instant render, then async chrome.storage.sync
try {
  const cached = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
  if (cached) Object.assign(SETTINGS, cached);
} catch {}

function loadSettings(cb) {
  if (chrome?.storage?.sync) {
    chrome.storage.sync.get([SETTINGS_KEY], (res) => {
      const stored = res[SETTINGS_KEY] || {};
      Object.assign(SETTINGS, DEFAULT_SETTINGS, stored);
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch {}
      cb && cb();
    });
  } else {
    cb && cb();
  }
}

function saveSettings(cb) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch {}
  if (chrome?.storage?.sync) {
    chrome.storage.sync.set({ [SETTINGS_KEY]: SETTINGS }, cb);
  } else if (cb) cb();
}

function applySettingsToBody() {
  document.body.classList.toggle('hide-greeting', !SETTINGS.show_greeting);
  document.body.classList.toggle('hide-search',   !SETTINGS.show_search);
  document.body.classList.toggle('hide-weather',  !SETTINGS.show_weather);
  document.body.classList.toggle('hide-seconds',  !SETTINGS.show_seconds);
  document.body.classList.toggle('dark',           SETTINGS.color_scheme === 'dark');
}

// Apply immediately from cache, then refresh from sync storage
applySettingsToBody();
loadSettings(applySettingsToBody);


// ─────────────────────────────────────
// EMPTY STATE ILLUSTRATIONS
// ─────────────────────────────────────
const EMPTY_SVG = {
  sites: `<svg class="empty-state-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="42" fill="#cde7ec" opacity="0.5"/>
    <circle cx="60" cy="60" r="32" fill="none" stroke="#4a6267" stroke-width="2" stroke-dasharray="3 4"/>
    <path d="M28 60 q32 -25 64 0 M28 60 q32 25 64 0 M60 28 q-25 32 0 64 M60 28 q25 32 0 64"
      fill="none" stroke="#4a6267" stroke-width="1.5" opacity="0.6"/>
    <circle cx="60" cy="60" r="5" fill="#006874"/>
    <circle cx="42" cy="40" r="3" fill="#006874" opacity="0.7"/>
    <circle cx="80" cy="50" r="3" fill="#006874" opacity="0.5"/>
    <circle cx="78" cy="78" r="3" fill="#006874" opacity="0.6"/>
  </svg>`,

  favorites: `<svg class="empty-state-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 25 l8 17 18 2 -13 12 4 18 -17 -10 -17 10 4 -18 -13 -12 18 -2 z"
      fill="#fff3d0" stroke="#f57f17" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="32" cy="40" r="2.5" fill="#f57f17" opacity="0.5"/>
    <circle cx="92" cy="55" r="2" fill="#f57f17" opacity="0.4"/>
    <circle cx="28" cy="80" r="2" fill="#f57f17" opacity="0.4"/>
    <circle cx="95" cy="88" r="2.5" fill="#f57f17" opacity="0.5"/>
  </svg>`,

  downloads: `<svg class="empty-state-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <rect x="35" y="30" width="50" height="60" rx="6" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>
    <path d="M48 50 h24 M48 60 h24 M48 70 h16" stroke="#1565c0" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <path d="M60 78 v10 M53 84 l7 7 7 -7" fill="none" stroke="#1565c0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="42" y="98" width="36" height="3" rx="1.5" fill="#1565c0" opacity="0.3"/>
  </svg>`,

  notes: `<svg class="empty-state-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <rect x="32" y="28" width="50" height="64" rx="4" fill="#fff8e1" stroke="#f57f17" stroke-width="2"/>
    <rect x="32" y="28" width="50" height="10" fill="#f57f17" opacity="0.2"/>
    <line x1="42" y1="50" x2="72" y2="50" stroke="#f57f17" stroke-width="1.5" opacity="0.6"/>
    <line x1="42" y1="60" x2="72" y2="60" stroke="#f57f17" stroke-width="1.5" opacity="0.6"/>
    <line x1="42" y1="70" x2="62" y2="70" stroke="#f57f17" stroke-width="1.5" opacity="0.6"/>
    <path d="M75 86 l12 -28 8 4 -12 28 z" fill="#ffd54f" stroke="#f57f17" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M75 86 l-3 8 8 -2 z" fill="#f57f17"/>
  </svg>`,

  todos: `<svg class="empty-state-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="36" width="64" height="48" rx="4" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
    <rect x="38" y="48" width="10" height="10" rx="2" fill="#2e7d32"/>
    <path d="M40 53 l2 2 4 -4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="55" y1="53" x2="80" y2="53" stroke="#2e7d32" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <rect x="38" y="62" width="10" height="10" rx="2" fill="none" stroke="#2e7d32" stroke-width="2"/>
    <line x1="55" y1="67" x2="80" y2="67" stroke="#2e7d32" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <rect x="38" y="76" width="10" height="10" rx="2" fill="none" stroke="#2e7d32" stroke-width="2"/>
    <line x1="55" y1="81" x2="74" y2="81" stroke="#2e7d32" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
  </svg>`,
};

function renderEmptyState(container, kind, title, text) {
  container.innerHTML = `
    <div class="empty-state">
      ${EMPTY_SVG[kind] || ''}
      <p class="empty-state-title">${escHtml(title)}</p>
      <p class="empty-state-text">${escHtml(text)}</p>
    </div>
  `;
}


// ─────────────────────────────────────
// 1. DYNAMIC BACKGROUND
// ─────────────────────────────────────
const TIME_THEMES = [
  // [startHour, endHour, gradient, bodyBg]
  { from:  5, to:  7, grad: 'linear-gradient(160deg,#ff9a5c 0%,#ffcf77 40%,#a8d8ea 100%)', bg: '#fdf0e0' }, // sunrise
  { from:  7, to: 10, grad: 'linear-gradient(160deg,#5ba4cf 0%,#89c4e1 40%,#d4eaf7 100%)', bg: '#eaf4fb' }, // morning
  { from: 10, to: 14, grad: 'linear-gradient(160deg,#1a8fc1 0%,#3aa0d5 50%,#74c0e0 100%)', bg: '#e3f2fd' }, // midday
  { from: 14, to: 17, grad: 'linear-gradient(160deg,#2e86ab 0%,#5ba8c8 50%,#a8d1e7 100%)', bg: '#e8f4f8' }, // afternoon
  { from: 17, to: 19, grad: 'linear-gradient(160deg,#e06c28 0%,#f0a045 40%,#f5c97a 100%)', bg: '#fef3e2' }, // golden hour
  { from: 19, to: 21, grad: 'linear-gradient(160deg,#b84b5a 0%,#d97070 40%,#e8a87c 100%)', bg: '#fce8e8' }, // sunset
  { from: 21, to: 23, grad: 'linear-gradient(160deg,#1a1a3e 0%,#2d2b55 50%,#5a4a7a 100%)', bg: '#1a1a2e' }, // dusk
  { from: 23, to: 24, grad: 'linear-gradient(160deg,#0d0d1f 0%,#1a1a3a 50%,#2d2b55 100%)', bg: '#0d0d1f' }, // night
  { from:  0, to:  5, grad: 'linear-gradient(160deg,#0d0d1f 0%,#1a1a3a 50%,#2d2b55 100%)', bg: '#0d0d1f' }, // night
];

function getTheme(hour) {
  return TIME_THEMES.find(t => hour >= t.from && hour < t.to) || TIME_THEMES[1];
}

function applyBackground() {
  const hour = new Date().getHours();
  const theme = getTheme(hour);
  document.getElementById('hero-bg').style.background = theme.grad;
}
applyBackground();
// Update every minute
setInterval(applyBackground, 60000);


// ─────────────────────────────────────
// 2. GREETING
// ─────────────────────────────────────
function updateGreeting() {
  const hour = new Date().getHours();
  const phrase =
    hour >= 5  && hour < 12 ? 'Good morning' :
    hour >= 12 && hour < 17 ? 'Good afternoon' :
    hour >= 17 && hour < 21 ? 'Good evening' : 'Good night';

  const el = document.getElementById('greeting');
  const name = SETTINGS.name?.trim();
  el.textContent = name ? `${phrase}, ${name}` : phrase;
  el.title = 'Click the gear to personalise';
}
updateGreeting();
setInterval(updateGreeting, 60 * 1000); // refresh phrase as time-of-day changes


// ─────────────────────────────────────
// 3. CLOCK
// ─────────────────────────────────────
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  let displayH;
  if (SETTINGS.clock_format === '12') {
    const h12 = ((h + 11) % 12) + 1;  // 1..12
    displayH = String(h12).padStart(2, '0');
  } else {
    displayH = String(h).padStart(2, '0');
  }

  document.getElementById('clock').textContent = `${displayH}:${m}`;
  document.getElementById('clock-seconds').textContent = `:${s}`;
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  document.getElementById('date-str').textContent =
    `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}
updateClock();
setInterval(updateClock, 1000);


// ─────────────────────────────────────
// 4. SEARCH BAR
// ─────────────────────────────────────
const ENGINES = {
  google:     { url: 'https://www.google.com/search?q=',     label: 'G' },
  duckduckgo: { url: 'https://duckduckgo.com/?q=',           label: 'D' },
  brave:      { url: 'https://search.brave.com/search?q=',   label: 'B' },
  bing:       { url: 'https://www.bing.com/search?q=',       label: 'Ȼ' },
};
const ENGINE_KEY = 'launchpad_engine';

let currentEngine = 'google';

function loadEngine(cb) {
  if (chrome?.storage?.sync) {
    chrome.storage.sync.get([ENGINE_KEY], (r) => cb(r[ENGINE_KEY] || 'google'));
  } else {
    cb(localStorage.getItem(ENGINE_KEY) || 'google');
  }
}
function saveEngine(e) {
  if (chrome?.storage?.sync) chrome.storage.sync.set({ [ENGINE_KEY]: e });
  else localStorage.setItem(ENGINE_KEY, e);
}

function setEngine(name) {
  currentEngine = name;
  saveEngine(name);
  document.getElementById('search-engine-label').textContent = ENGINES[name].label;
  document.querySelectorAll('.engine-opt').forEach(b => {
    b.style.fontWeight = b.dataset.engine === name ? '700' : '400';
  });
}

loadEngine(setEngine);

const searchInput = document.getElementById('search-input');
const enginePicker = document.getElementById('engine-picker');

// Submit search
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // Defer to the suggestions handler if one is highlighted (it will run after this one)
    if (typeof _suggIndex !== 'undefined' && _suggIndex >= 0 && _suggCurrent && _suggCurrent.length) return;
    const q = searchInput.value.trim();
    if (!q) return;
    // If it looks like a URL, navigate directly
    const looksLikeUrl = /^https?:\/\//i.test(q) || (/^[\w-]+\.[\w.-]+/.test(q) && !q.includes(' '));
    window.location.href = looksLikeUrl
      ? (q.includes('://') ? q : 'https://' + q)
      : ENGINES[currentEngine].url + encodeURIComponent(q);
  }
});

// Engine switcher
document.getElementById('search-engine-btn').onclick = (e) => {
  e.stopPropagation();
  enginePicker.classList.toggle('hidden');
};

document.querySelectorAll('.engine-opt').forEach(btn => {
  btn.onclick = () => {
    setEngine(btn.dataset.engine);
    enginePicker.classList.add('hidden');
    searchInput.focus();
  };
});

// Close picker on outside click
document.addEventListener('click', (e) => {
  if (!enginePicker.contains(e.target) && e.target.id !== 'search-engine-btn') {
    enginePicker.classList.add('hidden');
  }
});

// Keyboard shortcut: / focuses search
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});


// ─────────────────────────────────────
// 5. WEATHER
// ─────────────────────────────────────

// Animated SVG weather icons. Each returns inline SVG string sized 1em.
const WEATHER_SVG = {
  sun: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <g class="wi-sun" stroke="#ffb74d" stroke-width="3" stroke-linecap="round" fill="none">
      <line x1="32" y1="6"  x2="32" y2="14"/>
      <line x1="32" y1="50" x2="32" y2="58"/>
      <line x1="6"  y1="32" x2="14" y2="32"/>
      <line x1="50" y1="32" x2="58" y2="32"/>
      <line x1="13" y1="13" x2="19" y2="19"/>
      <line x1="45" y1="45" x2="51" y2="51"/>
      <line x1="13" y1="51" x2="19" y2="45"/>
      <line x1="45" y1="19" x2="51" y2="13"/>
    </g>
    <circle cx="32" cy="32" r="11" fill="#ffd54f" stroke="#ffb74d" stroke-width="2"/>
  </svg>`,

  partlyCloudy: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <g class="wi-sun" transform-origin="22 22">
      <circle cx="22" cy="22" r="9" fill="#ffd54f" stroke="#ffb74d" stroke-width="1.5"/>
    </g>
    <g class="wi-cloud">
      <path d="M20 42 q0 -8 8 -9 q3 -7 11 -7 q9 0 11 9 q6 1 6 7 q0 7 -7 7 H22 q-7 0 -7 -7 q0 -5 5 0 z"
        fill="#e0e0e0" stroke="#9e9e9e" stroke-width="1.5"/>
    </g>
  </svg>`,

  cloudy: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <g class="wi-cloud">
      <path d="M14 44 q0 -9 9 -10 q3 -8 12 -8 q10 0 12 10 q7 1 7 8 q0 8 -8 8 H16 q-8 0 -8 -8 q0 -6 6 0 z"
        fill="#bdbdbd" stroke="#757575" stroke-width="1.5"/>
    </g>
  </svg>`,

  fog: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <g class="wi-fog" stroke="#9e9e9e" stroke-width="3" stroke-linecap="round" fill="none">
      <line x1="10" y1="20" x2="48" y2="20" opacity="0.7"/>
      <line x1="14" y1="30" x2="54" y2="30"/>
      <line x1="8"  y1="40" x2="46" y2="40" opacity="0.85"/>
      <line x1="12" y1="50" x2="50" y2="50" opacity="0.6"/>
    </g>
  </svg>`,

  rain: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <g class="wi-cloud">
      <path d="M14 36 q0 -9 9 -10 q3 -8 12 -8 q10 0 12 10 q7 1 7 8 q0 8 -8 8 H16 q-8 0 -8 -8 q0 -6 6 0 z"
        fill="#90a4ae" stroke="#546e7a" stroke-width="1.5"/>
    </g>
    <g stroke="#42a5f5" stroke-width="2.5" stroke-linecap="round">
      <line class="wi-drop" x1="22" y1="46" x2="22" y2="50" style="animation-delay:0s"/>
      <line class="wi-drop" x1="32" y1="46" x2="32" y2="50" style="animation-delay:.3s"/>
      <line class="wi-drop" x1="42" y1="46" x2="42" y2="50" style="animation-delay:.6s"/>
    </g>
  </svg>`,

  snow: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <g class="wi-cloud">
      <path d="M14 36 q0 -9 9 -10 q3 -8 12 -8 q10 0 12 10 q7 1 7 8 q0 8 -8 8 H16 q-8 0 -8 -8 q0 -6 6 0 z"
        fill="#cfd8dc" stroke="#90a4ae" stroke-width="1.5"/>
    </g>
    <g fill="#e3f2fd" stroke="#90caf9" stroke-width="0.8">
      <text class="wi-flake" x="18" y="56" font-size="12" style="animation-delay:0s">❄</text>
      <text class="wi-flake" x="29" y="58" font-size="14" style="animation-delay:.6s">❄</text>
      <text class="wi-flake" x="42" y="56" font-size="12" style="animation-delay:1.2s">❄</text>
    </g>
  </svg>`,

  thunder: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <g class="wi-cloud">
      <path d="M14 32 q0 -9 9 -10 q3 -8 12 -8 q10 0 12 10 q7 1 7 8 q0 8 -8 8 H16 q-8 0 -8 -8 q0 -6 6 0 z"
        fill="#607d8b" stroke="#37474f" stroke-width="1.5"/>
    </g>
    <polygon class="wi-bolt" points="32,40 24,52 32,52 28,60 40,46 32,46 36,40"
      fill="#ffeb3b" stroke="#fbc02d" stroke-width="1"/>
  </svg>`,
};

const WMO = {
  0:  ['sun',          'Clear sky'],
  1:  ['partlyCloudy', 'Mainly clear'],
  2:  ['partlyCloudy', 'Partly cloudy'],
  3:  ['cloudy',       'Overcast'],
  45: ['fog',          'Foggy'],
  48: ['fog',          'Icy fog'],
  51: ['rain',         'Light drizzle'],
  53: ['rain',         'Drizzle'],
  55: ['rain',         'Heavy drizzle'],
  61: ['rain',         'Slight rain'],
  63: ['rain',         'Moderate rain'],
  65: ['rain',         'Heavy rain'],
  71: ['snow',         'Slight snow'],
  73: ['snow',         'Moderate snow'],
  75: ['snow',         'Heavy snow'],
  80: ['rain',         'Rain showers'],
  81: ['rain',         'Heavy showers'],
  95: ['thunder',      'Thunderstorm'],
  99: ['thunder',      'Thunderstorm + hail'],
};
function wmoInfo(code) { return WMO[code] || ['cloudy', 'Unknown']; }
function weatherSvg(iconKey) { return WEATHER_SVG[iconKey] || WEATHER_SVG.cloudy; }

async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } });
    const d = await r.json();
    const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
    const country = d.address?.country_code?.toUpperCase() || '';
    return city ? `${city}, ${country}` : country;
  } catch { return ''; }
}

async function fetchWeather(lat, lon) {
  const tempUnit = SETTINGS.temp_unit === 'f' ? 'fahrenheit' : 'celsius';
  const windUnit = SETTINGS.wind_unit === 'mph' ? 'mph' : 'kmh';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto&forecast_days=5`;
  return (await fetch(url)).json();
}

async function initWeather() {
  if (!navigator.geolocation) { showWeatherError(); return; }
  navigator.geolocation.getCurrentPosition(
    async ({ coords: { latitude: lat, longitude: lon } }) => {
      try {
        const [data, loc] = await Promise.all([fetchWeather(lat, lon), reverseGeocode(lat, lon)]);
        renderWeather(data, loc);
      } catch { showWeatherError(); }
    },
    () => showWeatherError(), { timeout: 8000 }
  );
}

let _weatherExpanded = false;
let _weatherData = null;        // cache for re-render on settings change
let _weatherLocation = null;

function renderWeather(data, locationName) {
  _weatherData = data;
  _weatherLocation = locationName;

  const c = data.current;
  const d = data.daily;
  const [iconKey, desc] = wmoInfo(c.weather_code);
  const tempSym = SETTINGS.temp_unit === 'f' ? '°F' : '°C';
  const windSym = SETTINGS.wind_unit === 'mph' ? 'mph' : 'km/h';
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Inline strip
  document.getElementById('w-icon').innerHTML = weatherSvg(iconKey);
  document.getElementById('w-temp').textContent = `${Math.round(c.temperature_2m)}${tempSym}`;
  document.getElementById('w-desc').textContent = desc;
  document.getElementById('w-location-text').textContent =
    locationName || `${data.latitude.toFixed(1)}, ${data.longitude.toFixed(1)}`;

  // Expanded
  document.getElementById('we-icon').innerHTML = weatherSvg(iconKey);
  document.getElementById('we-temp').textContent = `${Math.round(c.temperature_2m)}${tempSym}`;
  document.getElementById('we-feels').textContent = `feels like ${Math.round(c.apparent_temperature)}${tempSym}`;

  document.getElementById('w-details').innerHTML = `
    <div class="w-chip"><span class="material-symbols-rounded">water_drop</span>${c.relative_humidity_2m}%</div>
    <div class="w-chip"><span class="material-symbols-rounded">air</span>${Math.round(c.wind_speed_10m)} ${windSym}</div>
  `;

  const row = document.getElementById('forecast-row');
  row.innerHTML = '';
  for (let i = 0; i < Math.min(5, d.time.length); i++) {
    const dt = new Date(d.time[i] + 'T12:00:00');
    const label = i === 0 ? 'Today' : dayNames[dt.getDay()];
    const [fIcon] = wmoInfo(d.weather_code[i]);
    const el = document.createElement('div');
    el.className = 'forecast-day';
    el.innerHTML = `<span class="fc-day">${label}</span><span class="fc-icon">${weatherSvg(fIcon)}</span><span class="fc-hi">${Math.round(d.temperature_2m_max[i])}°</span><span class="fc-lo">${Math.round(d.temperature_2m_min[i])}°</span>`;
    row.appendChild(el);
  }

  document.getElementById('weather-loading').classList.add('hidden');
  document.getElementById('weather-ready').classList.remove('hidden');

  const toggleBtn = document.getElementById('weather-toggle');
  toggleBtn.classList.remove('hidden');
  toggleBtn.onclick = () => {
    _weatherExpanded = !_weatherExpanded;
    document.getElementById('weather-expanded').classList.toggle('hidden', !_weatherExpanded);
    toggleBtn.classList.toggle('open', _weatherExpanded);
    document.getElementById('weather-toggle-label').textContent =
      _weatherExpanded ? 'Hide forecast' : 'Show forecast';
  };
}

function showWeatherError() {
  document.getElementById('weather-loading').classList.add('hidden');
  document.getElementById('weather-error').classList.remove('hidden');
  document.getElementById('retry-geo').onclick = () => {
    document.getElementById('weather-error').classList.add('hidden');
    document.getElementById('weather-loading').classList.remove('hidden');
    initWeather();
  };
}
initWeather();


// ─────────────────────────────────────
// 6. TOP SITES
// ─────────────────────────────────────
function cleanTitle(url, title) {
  if (title?.trim() && title !== url) return title.trim();
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}
function getFaviconUrl(url) {
  try { return `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(new URL(url).origin)}`; }
  catch { return ''; }
}
function getInitial(url, title) { return cleanTitle(url, title).charAt(0).toUpperCase(); }

function renderTopSites() {
  const grid = document.getElementById('sites-grid');
  if (!chrome?.topSites) {
    renderEmptyState(grid, 'sites', 'Unavailable', 'The topSites API is not available.');
    return;
  }
  chrome.topSites.get((sites) => {
    grid.innerHTML = '';
    const list = sites.slice(0, 12);
    if (!list.length) {
      renderEmptyState(grid, 'sites', 'No top sites yet', 'Browse the web a bit and your most-visited sites will show up here.');
      return;
    }
    list.forEach((site) => {
      const a = document.createElement('a');
      a.className = 'site-card md-card ripple';
      a.href = site.url; a.title = site.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      const faviconUrl = getFaviconUrl(site.url);
      const initial = getInitial(site.url, site.title);
      const title = escHtml(cleanTitle(site.url, site.title));
      const imgHtml = faviconUrl
        ? `<img class="site-favicon" src="${faviconUrl}" alt="" onerror="this.outerHTML='<div class=\\'site-favicon-fallback\\'>${initial}</div>'">`
        : `<div class="site-favicon-fallback">${initial}</div>`;
      a.innerHTML = `${imgHtml}<span class="site-title">${title}</span>`;
      grid.appendChild(a);
    });
  });
}
renderTopSites();


// ─────────────────────────────────────
// 7. RECENT DOWNLOADS + CONTEXT MENU
// ─────────────────────────────────────
const EXT_MAP = {
  pdf:{group:'pdf',icon:'picture_as_pdf'}, png:{group:'img',icon:'image'}, jpg:{group:'img',icon:'image'},
  jpeg:{group:'img',icon:'image'}, gif:{group:'img',icon:'gif'}, webp:{group:'img',icon:'image'},
  svg:{group:'img',icon:'image'}, avif:{group:'img',icon:'image'},
  zip:{group:'zip',icon:'folder_zip'}, rar:{group:'zip',icon:'folder_zip'}, '7z':{group:'zip',icon:'folder_zip'},
  gz:{group:'zip',icon:'folder_zip'}, tar:{group:'zip',icon:'folder_zip'}, dmg:{group:'zip',icon:'folder_zip'},
  doc:{group:'doc',icon:'description'}, docx:{group:'doc',icon:'description'},
  xls:{group:'doc',icon:'table_chart'}, xlsx:{group:'doc',icon:'table_chart'},
  ppt:{group:'doc',icon:'slideshow'}, pptx:{group:'doc',icon:'slideshow'},
  txt:{group:'doc',icon:'article'}, csv:{group:'doc',icon:'table_chart'},
  mp4:{group:'vid',icon:'movie'}, mkv:{group:'vid',icon:'movie'}, avi:{group:'vid',icon:'movie'},
  mov:{group:'vid',icon:'movie'}, webm:{group:'vid',icon:'movie'},
  js:{group:'code',icon:'code'}, ts:{group:'code',icon:'code'}, py:{group:'code',icon:'code'},
  html:{group:'code',icon:'code'}, css:{group:'code',icon:'code'},
  json:{group:'code',icon:'data_object'}, sh:{group:'code',icon:'terminal'},
};

function classifyFile(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return EXT_MAP[ext] || { group: 'file', icon: 'insert_drive_file' };
}
function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
}
function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function stateLabel(state) {
  if (state === 'complete')    return { cls: 'complete',     label: 'Done' };
  if (state === 'interrupted') return { cls: 'interrupted',  label: 'Failed' };
  return { cls: 'in-progress', label: '…' };
}

// Context menu state
let _ctxItem = null; // the download item object
const dlMenu = document.getElementById('dl-menu');

function hideMenu() { dlMenu.classList.add('hidden'); _ctxItem = null; }

document.addEventListener('click', hideMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideMenu(); });

function showMenu(e, item, filename) {
  e.preventDefault();
  e.stopPropagation();
  _ctxItem = { item, filename };

  // Position menu near cursor, keep inside viewport
  const x = Math.min(e.clientX, window.innerWidth  - 200);
  const y = Math.min(e.clientY, window.innerHeight - 160);
  dlMenu.style.left = x + 'px';
  dlMenu.style.top  = y + 'px';
  dlMenu.classList.remove('hidden');

  // Disable "Open file" if not complete
  document.getElementById('dl-open').disabled   = item.state !== 'complete';
  document.getElementById('dl-folder').disabled = item.state !== 'complete';
}

document.getElementById('dl-open').onclick = (e) => {
  e.stopPropagation();
  if (_ctxItem && chrome?.downloads) chrome.downloads.open(_ctxItem.item.id);
  hideMenu();
};
document.getElementById('dl-folder').onclick = (e) => {
  e.stopPropagation();
  if (_ctxItem && chrome?.downloads) chrome.downloads.show(_ctxItem.item.id);
  hideMenu();
};
document.getElementById('dl-copy').onclick = (e) => {
  e.stopPropagation();
  if (_ctxItem) navigator.clipboard?.writeText(_ctxItem.filename).catch(() => {});
  hideMenu();
};
document.getElementById('dl-delete').onclick = (e) => {
  e.stopPropagation();
  if (_ctxItem && chrome?.downloads) {
    chrome.downloads.erase({ id: _ctxItem.item.id }, () => renderDownloads());
  }
  hideMenu();
};

function renderDownloads() {
  const grid = document.getElementById('downloads-list');
  if (!chrome?.downloads) {
    renderEmptyState(grid, 'downloads', 'Unavailable', 'The downloads API is not available.');
    return;
  }
  chrome.downloads.search({ limit: 10, orderBy: ['-startTime'] }, (items) => {
    grid.innerHTML = '';
    if (!items?.length) {
      renderEmptyState(grid, 'downloads', 'No recent downloads', 'Files you download will appear here for quick access.');
      return;
    }
    items.forEach((item) => {
      const filename = item.filename
        ? item.filename.split(/[/\\]/).pop()
        : (item.url?.split('/').pop().split('?')[0] || 'Unknown file');

      const { group, icon } = classifyFile(filename);
      const size = formatBytes(item.fileSize || item.bytesReceived);
      const ago  = timeAgo(item.startTime);
      const { cls } = stateLabel(item.state);

      const card = document.createElement('div');
      card.className = 'dl-item md-card ripple';
      card.setAttribute('tabindex', '0');

      // Left-click = show in folder (if complete)
      card.onclick = () => {
        if (item.state === 'complete' && item.id && chrome?.downloads) {
          chrome.downloads.show(item.id);
        }
      };
      // Right-click = context menu
      card.addEventListener('contextmenu', (e) => showMenu(e, item, filename));
      // Long-press on touch (for future proofing)
      card.onkeydown = (e) => {
        if (e.key === 'Enter') card.onclick();
        if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
          const r = card.getBoundingClientRect();
          showMenu({ preventDefault(){}, stopPropagation(){}, clientX: r.left + 10, clientY: r.top + 10 }, item, filename);
        }
      };

      card.innerHTML = `
        <div class="dl-icon-wrap ${group}">
          <span class="material-symbols-rounded">${icon}</span>
        </div>
        <div class="dl-info">
          <span class="dl-name" title="${escHtml(filename)}">${escHtml(filename)}</span>
          <span class="dl-meta">${ago}${size ? ' · ' + size : ''}</span>
        </div>
        <span class="dl-state-pill ${cls}"></span>
      `;
      grid.appendChild(card);
    });
  });
}
renderDownloads();


// ─────────────────────────────────────
// 8. FAVORITES
// ─────────────────────────────────────
const STORAGE_KEY = 'launchpad_favorites';

function loadFavorites(cb) {
  if (chrome?.storage?.sync) chrome.storage.sync.get([STORAGE_KEY], (r) => cb(r[STORAGE_KEY] || []));
  else { try { cb(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { cb([]); } }
}
function saveFavorites(favs, cb) {
  if (chrome?.storage?.sync) chrome.storage.sync.set({ [STORAGE_KEY]: favs }, cb);
  else { localStorage.setItem(STORAGE_KEY, JSON.stringify(favs)); if (cb) cb(); }
}

function renderFavorites(favs) {
  const grid = document.getElementById('favs-grid');
  grid.innerHTML = '';

  // Show/hide the + button based on whether the grid is full
  const addBtn = document.getElementById('btn-add-fav');
  addBtn.style.display = favs.length >= 12 ? 'none' : '';

  if (!favs.length) {
    renderEmptyState(grid, 'favorites', 'No favorites yet', 'Tap + above to pin your most-loved sites for quick access.');
    return;
  }
  favs.forEach((fav, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'fav-card';
    wrap.draggable = true;
    wrap.dataset.idx = idx;

    // Drag-reorder handlers
    wrap.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
      wrap.classList.add('dragging');
    });
    wrap.addEventListener('dragend', () => {
      wrap.classList.remove('dragging');
      document.querySelectorAll('.fav-card.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
    wrap.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!wrap.classList.contains('dragging')) wrap.classList.add('drag-over');
    });
    wrap.addEventListener('dragleave', () => wrap.classList.remove('drag-over'));
    wrap.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      wrap.classList.remove('drag-over');
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIdx   = idx;
      if (isNaN(fromIdx) || fromIdx === toIdx) return;
      loadFavorites((fs) => {
        const [moved] = fs.splice(fromIdx, 1);
        fs.splice(toIdx, 0, moved);
        saveFavorites(fs, () => renderFavorites(fs));
      });
    });

    const a = document.createElement('a');
    a.className = 'site-card md-card ripple';
    a.href = fav.url; a.title = fav.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.draggable = false;
    a.style.animationDelay = `${idx * 0.04}s`;
    const faviconUrl = getFaviconUrl(fav.url);
    const initial = (fav.name || fav.url).charAt(0).toUpperCase();
    const imgHtml = faviconUrl
      ? `<img class="site-favicon" src="${faviconUrl}" alt="" onerror="this.outerHTML='<div class=\\'site-favicon-fallback\\'>${escHtml(initial)}</div>'">`
      : `<div class="site-favicon-fallback">${escHtml(initial)}</div>`;
    a.innerHTML = `${imgHtml}<span class="site-title">${escHtml(fav.name || fav.url)}</span>`;

    const editBtn = document.createElement('button');
    editBtn.className = 'fav-edit'; editBtn.title = 'Edit';
    editBtn.innerHTML = `<span class="material-symbols-rounded">edit</span>`;
    editBtn.onclick = (e) => { e.preventDefault(); openFavDialog(fav, idx); };

    const delBtn = document.createElement('button');
    delBtn.className = 'fav-delete'; delBtn.title = 'Remove';
    delBtn.innerHTML = `<span class="material-symbols-rounded">close</span>`;
    delBtn.onclick = (e) => {
      e.preventDefault();
      loadFavorites((fs) => { fs.splice(idx, 1); saveFavorites(fs, () => renderFavorites(fs)); });
    };

    wrap.appendChild(a); wrap.appendChild(editBtn); wrap.appendChild(delBtn);
    grid.appendChild(wrap);
  });
}

let _editingFavIdx = null;
function openFavDialog(fav = null, idx = null) {
  _editingFavIdx = idx;
  const dialog = document.getElementById('fav-dialog');
  document.getElementById('fav-dialog-title').textContent = fav ? 'Edit Favorite' : 'Add Favorite';
  document.getElementById('fav-input-name').value = fav ? fav.name : '';
  document.getElementById('fav-input-url').value  = fav ? fav.url  : '';
  ['fav-input-name','fav-input-url'].forEach(id => document.getElementById(id).classList.remove('error'));
  dialog.querySelectorAll('.fav-error-msg').forEach(el => el.remove());
  dialog.classList.remove('hidden');
  document.getElementById('fav-input-name').focus();
}
function closeFavDialog() {
  document.getElementById('fav-dialog').classList.add('hidden');
  _editingFavIdx = null;
}
function isValidUrl(str) {
  try { const u = new URL(str.includes('://') ? str : 'https://' + str); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}
function normalizeUrl(str) { return str.includes('://') ? str : 'https://' + str; }
function showInputError(input, msg) {
  input.classList.add('error');
  const err = document.createElement('p');
  err.className = 'fav-error-msg'; err.textContent = msg;
  input.insertAdjacentElement('afterend', err);
}

document.getElementById('btn-add-fav').onclick = () => openFavDialog();
document.getElementById('fav-cancel').onclick = closeFavDialog;
document.getElementById('fav-dialog').addEventListener('click', (e) => { if (e.target === document.getElementById('fav-dialog')) closeFavDialog(); });

document.getElementById('fav-save').onclick = () => {
  const nameIn = document.getElementById('fav-input-name');
  const urlIn  = document.getElementById('fav-input-url');
  const dialog = document.getElementById('fav-dialog');
  let valid = true;
  [nameIn, urlIn].forEach(el => el.classList.remove('error'));
  dialog.querySelectorAll('.fav-error-msg').forEach(el => el.remove());
  const name = nameIn.value.trim();
  const rawUrl = urlIn.value.trim();
  if (!name) { showInputError(nameIn, 'Name is required'); valid = false; }
  if (!rawUrl) { showInputError(urlIn, 'URL is required'); valid = false; }
  else if (!isValidUrl(rawUrl)) { showInputError(urlIn, 'Enter a valid URL'); valid = false; }
  if (!valid) return;
  const url = normalizeUrl(rawUrl);
  loadFavorites((favs) => {
    if (_editingFavIdx !== null) favs[_editingFavIdx] = { ...favs[_editingFavIdx], name, url };
    else favs.push({ id: Date.now(), name, url });
    favs = favs.slice(0, 12); // hard cap
    saveFavorites(favs, () => { renderFavorites(favs); closeFavDialog(); });
  });
};
['fav-input-name','fav-input-url'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('fav-save').click(); });
});
loadFavorites(renderFavorites);


// ─────────────────────────────────────
// 9. QUICK NOTES
// ─────────────────────────────────────
const NOTES_KEY = 'launchpad_notes';
const NOTE_COLORS = [
  { name: 'teal',   value: '#006874' }, { name: 'indigo', value: '#3949ab' },
  { name: 'green',  value: '#2e7d32' }, { name: 'amber',  value: '#f57f17' },
  { name: 'rose',   value: '#c62828' }, { name: 'purple', value: '#6a1b9a' },
];

function loadNotes(cb) {
  if (chrome?.storage?.sync) chrome.storage.sync.get([NOTES_KEY], (r) => cb(r[NOTES_KEY] || []));
  else { try { cb(JSON.parse(localStorage.getItem(NOTES_KEY) || '[]')); } catch { cb([]); } }
}
function saveNotes(notes) {
  if (chrome?.storage?.sync) chrome.storage.sync.set({ [NOTES_KEY]: notes });
  else localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
function formatNoteTs(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
         d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

let _activeColorPicker = null;
function closeColorPicker() { if (_activeColorPicker) { _activeColorPicker.remove(); _activeColorPicker = null; } }
document.addEventListener('click', (e) => { if (_activeColorPicker && !_activeColorPicker.contains(e.target)) closeColorPicker(); });

function renderNotes(notes) {
  const area = document.getElementById('notes-area');
  area.innerHTML = '';
  if (!notes.length) {
    renderEmptyState(area, 'notes', 'No notes yet', 'Click + to jot down a quick thought, idea, or reminder.');
    return;
  }
  notes.forEach((note, idx) => {
    const card = document.createElement('div');
    card.className = 'note-card md-card';
    card.style.setProperty('--note-color', note.color || NOTE_COLORS[0].value);
    card.draggable = true;
    card.dataset.idx = idx;

    // Drag-reorder
    card.addEventListener('dragstart', (e) => {
      // Don't start drag from inputs / textareas
      if (e.target.matches('input, textarea, button')) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.note-card.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!card.classList.contains('dragging')) card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove('drag-over');
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIdx   = idx;
      if (isNaN(fromIdx) || fromIdx === toIdx) return;
      loadNotes((ns) => {
        const [moved] = ns.splice(fromIdx, 1);
        ns.splice(toIdx, 0, moved);
        saveNotes(ns);
        renderNotes(ns);
      });
    });
    const debouncedSave = debounce(() => {
      loadNotes((ns) => {
        ns[idx] = { ...ns[idx], title: card.querySelector('.note-title-input').value, body: card.querySelector('.note-body-input').value, updatedAt: new Date().toISOString() };
        saveNotes(ns);
        card.querySelector('.note-ts').textContent = formatNoteTs(ns[idx].updatedAt);
      });
    }, 600);

    card.innerHTML = `
      <div class="note-header">
        <input class="note-title-input" type="text" placeholder="Title…" value="${escHtml(note.title || '')}" maxlength="60" />
        <div class="note-actions">
          <button class="note-btn color-btn" title="Change colour"><span class="material-symbols-rounded">palette</span></button>
          <button class="note-btn delete" title="Delete note"><span class="material-symbols-rounded">delete</span></button>
        </div>
      </div>
      <textarea class="note-body-input" placeholder="Start typing…" rows="3">${escHtml(note.body || '')}</textarea>
      <span class="note-ts">${formatNoteTs(note.updatedAt || note.createdAt)}</span>
    `;

    const ta = card.querySelector('.note-body-input');
    const resizeTa = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; };
    resizeTa();
    card.querySelector('.note-title-input').addEventListener('input', debouncedSave);
    ta.addEventListener('input', () => { resizeTa(); debouncedSave(); });

    card.querySelector('.note-btn.delete').onclick = () => {
      loadNotes((ns) => { ns.splice(idx, 1); saveNotes(ns); renderNotes(ns); });
    };
    card.querySelector('.color-btn').onclick = (e) => {
      e.stopPropagation();
      closeColorPicker();
      const picker = document.createElement('div');
      picker.className = 'note-color-picker';
      NOTE_COLORS.forEach(({ name, value }) => {
        const sw = document.createElement('div');
        sw.className = 'note-swatch' + (value === (note.color || NOTE_COLORS[0].value) ? ' active' : '');
        sw.style.background = value; sw.title = name;
        sw.onclick = (ev) => {
          ev.stopPropagation();
          card.style.setProperty('--note-color', value);
          loadNotes((ns) => { ns[idx] = { ...ns[idx], color: value }; saveNotes(ns); });
          closeColorPicker();
        };
        picker.appendChild(sw);
      });
      card.querySelector('.note-actions').appendChild(picker);
      _activeColorPicker = picker;
    };
    area.appendChild(card);
  });
}

document.getElementById('btn-add-note').onclick = () => {
  loadNotes((notes) => {
    notes.unshift({ id: Date.now(), title: '', body: '', color: NOTE_COLORS[0].value, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    saveNotes(notes);
    renderNotes(notes);
    setTimeout(() => { const f = document.querySelector('.note-title-input'); if (f) f.focus(); }, 50);
  });
};

loadNotes(renderNotes);

// Escape also closes fav dialog
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFavDialog(); });


// ─────────────────────────────────────
// 10. SEARCH SUGGESTIONS (Google Suggest API via JSONP-style fetch)
// ─────────────────────────────────────
const suggestionsBox = document.getElementById('suggestions');
let _suggIndex = -1;
let _suggCurrent = [];

const fetchSuggestions = debounce(async (q) => {
  if (!q.trim()) { hideSuggestions(); return; }
  try {
    // The "firefox" client returns a clean JSON array: [query, [suggestions...]]
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`;
    const r = await fetch(url);
    const data = await r.json();
    const list = (data && Array.isArray(data[1])) ? data[1].slice(0, 8) : [];
    showSuggestions(list, q);
  } catch {
    hideSuggestions();
  }
}, 180);

function showSuggestions(list, query) {
  if (!list.length) { hideSuggestions(); return; }
  _suggCurrent = list;
  _suggIndex = -1;
  suggestionsBox.innerHTML = list.map((s, i) => `
    <div class="sugg-item" data-idx="${i}">
      <span class="material-symbols-rounded">search</span>
      <span class="sugg-text">${highlightQuery(s, query)}</span>
    </div>
  `).join('');
  suggestionsBox.classList.remove('hidden');

  suggestionsBox.querySelectorAll('.sugg-item').forEach(el => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();   // Don't blur the input before our handler runs
      runSearch(list[parseInt(el.dataset.idx, 10)]);
    });
    el.addEventListener('mouseenter', () => {
      _suggIndex = parseInt(el.dataset.idx, 10);
      updateSuggHighlight();
    });
  });
}

function highlightQuery(suggestion, query) {
  const safe = escHtml(suggestion);
  const q = escHtml(query.trim());
  if (!q) return safe;
  // Bold the parts of the suggestion that are *not* the original query
  const lower = safe.toLowerCase();
  const qLower = q.toLowerCase();
  const i = lower.indexOf(qLower);
  if (i === -1) return `<mark>${safe}</mark>`;
  const before = safe.slice(0, i);
  const middle = safe.slice(i, i + q.length);
  const after  = safe.slice(i + q.length);
  return `${before}${middle}<mark>${after}</mark>`;
}

function hideSuggestions() {
  suggestionsBox.classList.add('hidden');
  suggestionsBox.innerHTML = '';
  _suggCurrent = [];
  _suggIndex = -1;
}

function updateSuggHighlight() {
  suggestionsBox.querySelectorAll('.sugg-item').forEach((el, i) => {
    el.classList.toggle('active', i === _suggIndex);
  });
}

function runSearch(query) {
  const q = query.trim();
  if (!q) return;
  const looksLikeUrl = /^https?:\/\//i.test(q) || (/^[\w-]+\.[\w.-]+/.test(q) && !q.includes(' '));
  window.location.href = looksLikeUrl
    ? (q.includes('://') ? q : 'https://' + q)
    : ENGINES[currentEngine].url + encodeURIComponent(q);
}

// Wire up suggestions to the existing search input
searchInput.addEventListener('input', (e) => {
  fetchSuggestions(e.target.value);
});

searchInput.addEventListener('blur', () => {
  // Delay so a click on a suggestion has time to register via mousedown
  setTimeout(hideSuggestions, 120);
});

// Override the existing keydown handler to support arrow nav.
// Remove old one by simply listening with capture-priority logic:
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    if (_suggCurrent.length) {
      e.preventDefault();
      _suggIndex = (_suggIndex + 1) % _suggCurrent.length;
      updateSuggHighlight();
      // Show selected suggestion text in input (optional UX touch)
    }
  } else if (e.key === 'ArrowUp') {
    if (_suggCurrent.length) {
      e.preventDefault();
      _suggIndex = (_suggIndex - 1 + _suggCurrent.length) % _suggCurrent.length;
      updateSuggHighlight();
    }
  } else if (e.key === 'Enter') {
    // If a suggestion is highlighted, use it; otherwise fall through to original handler
    if (_suggIndex >= 0 && _suggCurrent[_suggIndex]) {
      e.preventDefault();
      e.stopImmediatePropagation();  // block the earlier-registered Enter handler
      runSearch(_suggCurrent[_suggIndex]);
    }
  } else if (e.key === 'Escape') {
    hideSuggestions();
  }
});


// ─────────────────────────────────────
// 11. TO-DO LIST
// ─────────────────────────────────────
const TODO_KEY = 'launchpad_todos';

function loadTodos(cb) {
  if (chrome?.storage?.sync) chrome.storage.sync.get([TODO_KEY], (r) => cb(r[TODO_KEY] || []));
  else { try { cb(JSON.parse(localStorage.getItem(TODO_KEY) || '[]')); } catch { cb([]); } }
}
function saveTodos(todos, cb) {
  if (chrome?.storage?.sync) chrome.storage.sync.set({ [TODO_KEY]: todos }, cb);
  else { localStorage.setItem(TODO_KEY, JSON.stringify(todos)); if (cb) cb(); }
}

function renderTodos(todos) {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  if (!todos.length) {
    renderEmptyState(list, 'todos', 'All clear', 'Type a task above and press Enter to add it.');
    return;
  }
  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    const cb = document.createElement('div');
    cb.className = 'todo-checkbox';
    cb.setAttribute('role', 'checkbox');
    cb.setAttribute('aria-checked', String(!!todo.done));
    cb.tabIndex = 0;
    cb.onclick = () => toggleTodo(idx);
    cb.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleTodo(idx); } };

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.contentEditable = 'true';
    text.spellcheck = false;
    text.textContent = todo.text || '';
    text.addEventListener('blur', () => {
      const newText = text.textContent.trim();
      if (newText === todo.text) return;
      loadTodos((ts) => {
        if (!ts[idx]) return;
        if (!newText) { ts.splice(idx, 1); }
        else ts[idx].text = newText;
        saveTodos(ts, () => renderTodos(ts));
      });
    });
    text.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); text.blur(); }
      if (e.key === 'Escape') { text.textContent = todo.text; text.blur(); }
    });

    const del = document.createElement('button');
    del.className = 'todo-delete';
    del.title = 'Delete';
    del.innerHTML = `<span class="material-symbols-rounded">close</span>`;
    del.onclick = (e) => {
      e.stopPropagation();
      loadTodos((ts) => { ts.splice(idx, 1); saveTodos(ts, () => renderTodos(ts)); });
    };

    li.appendChild(cb);
    li.appendChild(text);
    li.appendChild(del);
    list.appendChild(li);
  });
}

function toggleTodo(idx) {
  loadTodos((todos) => {
    if (!todos[idx]) return;
    todos[idx].done = !todos[idx].done;
    saveTodos(todos, () => renderTodos(todos));
  });
}

function addTodo(text) {
  text = text.trim();
  if (!text) return;
  loadTodos((todos) => {
    todos.unshift({ id: Date.now(), text, done: false, createdAt: new Date().toISOString() });
    saveTodos(todos, () => renderTodos(todos));
  });
}

document.getElementById('todo-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTodo(e.target.value);
    e.target.value = '';
  }
});

document.getElementById('btn-todo-clear').onclick = () => {
  loadTodos((todos) => {
    const filtered = todos.filter(t => !t.done);
    if (filtered.length === todos.length) return; // nothing to clear
    saveTodos(filtered, () => renderTodos(filtered));
  });
};

loadTodos(renderTodos);


// ─────────────────────────────────────
// 12. SETTINGS PANEL
// ─────────────────────────────────────
const settingsDialog = document.getElementById('settings-dialog');
const settingsFab = document.getElementById('settings-fab');

function openSettings() {
  // Populate form with current values
  document.getElementById('setting-name').value = SETTINGS.name || '';
  document.getElementById('setting-dark-mode').checked     = SETTINGS.color_scheme === 'dark';
  document.getElementById('setting-show-seconds').checked  = SETTINGS.show_seconds;
  document.getElementById('setting-show-greeting').checked = SETTINGS.show_greeting;
  document.getElementById('setting-show-search').checked   = SETTINGS.show_search;
  document.getElementById('setting-show-weather').checked  = SETTINGS.show_weather;
  // Segmented buttons
  document.querySelectorAll('.settings-segment').forEach(seg => {
    const key = seg.dataset.setting;
    const cur = SETTINGS[key];
    seg.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === cur);
    });
  });
  settingsDialog.classList.remove('hidden');
}

function closeSettings() { settingsDialog.classList.add('hidden'); }

settingsFab.onclick = openSettings;
document.getElementById('settings-close').onclick = closeSettings;
settingsDialog.addEventListener('click', (e) => {
  if (e.target === settingsDialog) closeSettings();
});

// Helper to apply + persist a single change
function changeSetting(key, value) {
  SETTINGS[key] = value;
  saveSettings();
  applySettingsToBody();
  // Side effects
  if (key === 'temp_unit' || key === 'wind_unit') {
    if (_weatherData) initWeather(); // refetch with new units
  }
  if (key === 'clock_format') updateClock();
  if (key === 'name')         updateGreeting();
}

// Name input
document.getElementById('setting-name').addEventListener('input', debounce((e) => {
  changeSetting('name', e.target.value.trim());
}, 350));

// Toggles
[
  ['setting-dark-mode',     null],  // handled separately below
  ['setting-show-seconds',  'show_seconds'],
  ['setting-show-greeting', 'show_greeting'],
  ['setting-show-search',   'show_search'],
  ['setting-show-weather',  'show_weather'],
].forEach(([id, key]) => {
  if (!key) return;
  document.getElementById(id).addEventListener('change', (e) => {
    changeSetting(key, e.target.checked);
  });
});

document.getElementById('setting-dark-mode').addEventListener('change', (e) => {
  changeSetting('color_scheme', e.target.checked ? 'dark' : 'light');
});

// Segmented buttons
document.querySelectorAll('.settings-segment').forEach(seg => {
  const key = seg.dataset.setting;
  seg.querySelectorAll('.seg-btn').forEach(btn => {
    btn.onclick = () => {
      seg.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      changeSetting(key, btn.dataset.value);
    };
  });
});

// Export / Import / Reset
document.getElementById('settings-export').onclick = () => {
  const collect = (key, fallback) => new Promise((res) => {
    if (chrome?.storage?.sync) chrome.storage.sync.get([key], (r) => res(r[key] ?? fallback));
    else { try { res(JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))); } catch { res(fallback); } }
  });
  Promise.all([
    collect(SETTINGS_KEY, SETTINGS),
    collect(STORAGE_KEY,  []),  // favorites
    collect(NOTES_KEY,    []),
    collect(TODO_KEY,     []),
  ]).then(([settings, favorites, notes, todos]) => {
    const blob = new Blob(
      [JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), settings, favorites, notes, todos }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `launchpad-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
};

document.getElementById('settings-import').onclick = () => {
  document.getElementById('settings-import-file').click();
};
document.getElementById('settings-import-file').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!confirm('Importing will overwrite your current data. Continue?')) return;
      const writes = [];
      if (data.settings)  writes.push([SETTINGS_KEY, data.settings]);
      if (data.favorites) writes.push([STORAGE_KEY,  data.favorites]);
      if (data.notes)     writes.push([NOTES_KEY,    data.notes]);
      if (data.todos)     writes.push([TODO_KEY,     data.todos]);
      writes.forEach(([k, v]) => {
        if (chrome?.storage?.sync) chrome.storage.sync.set({ [k]: v });
        else localStorage.setItem(k, JSON.stringify(v));
      });
      // Re-render everything
      setTimeout(() => location.reload(), 200);
    } catch {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';  // reset so re-importing same file works
});

document.getElementById('settings-reset').onclick = () => {
  if (!confirm('Reset all settings to defaults? Your favorites, notes, and to-dos will be kept.')) return;
  Object.assign(SETTINGS, DEFAULT_SETTINGS);
  saveSettings();
  applySettingsToBody();
  closeSettings();
  setTimeout(() => location.reload(), 200);
};

// Close settings on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsDialog.classList.contains('hidden')) closeSettings();
});


// ─────────────────────────────────────
// 13. POMODORO TIMER
// ─────────────────────────────────────
const POM_DURATIONS = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
const POM_LABELS    = { work: 'Focus', short: 'Short break', long: 'Long break' };
const POM_CIRCUMFERENCE = 2 * Math.PI * 52;

let _pomMode     = 'work';
let _pomSecsLeft = POM_DURATIONS.work;
let _pomRunning  = false;
let _pomSessions = 0;
let _pomInterval = null;

function pomUpdateDisplay() {
  const m = Math.floor(_pomSecsLeft / 60).toString().padStart(2, '0');
  const s = (_pomSecsLeft % 60).toString().padStart(2, '0');
  document.getElementById('pom-time').textContent = `${m}:${s}`;
  const fraction = _pomSecsLeft / POM_DURATIONS[_pomMode];
  document.getElementById('pom-ring-progress').style.strokeDashoffset =
    POM_CIRCUMFERENCE * (1 - fraction);
}

function pomSetMode(mode) {
  clearInterval(_pomInterval);
  _pomMode     = mode;
  _pomSecsLeft = POM_DURATIONS[mode];
  _pomRunning  = false;
  document.querySelectorAll('.pom-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('pom-start-icon').textContent = 'play_arrow';
  document.getElementById('pom-label').textContent = POM_LABELS[mode];
  pomUpdateDisplay();
}

function pomTick() {
  if (_pomSecsLeft <= 0) {
    clearInterval(_pomInterval);
    _pomRunning = false;
    document.getElementById('pom-start-icon').textContent = 'play_arrow';
    if (_pomMode === 'work') {
      _pomSessions++;
      document.getElementById('pom-session-num').textContent = _pomSessions;
    }
    if (Notification?.permission === 'granted') {
      const body = _pomMode === 'work'
        ? `Pomodoro #${_pomSessions} done! Take a ${_pomSessions % 4 === 0 ? 'long' : 'short'} break.`
        : 'Break over — time to focus!';
      new Notification('Launchpad Timer', { body, icon: 'icons/icon128.png' });
    }
    pomUpdateDisplay();
    return;
  }
  _pomSecsLeft--;
  pomUpdateDisplay();
}

function pomToggle() {
  if (_pomRunning) {
    clearInterval(_pomInterval);
    _pomRunning = false;
    document.getElementById('pom-start-icon').textContent = 'play_arrow';
  } else {
    if (Notification?.permission === 'default') Notification.requestPermission();
    _pomRunning  = true;
    document.getElementById('pom-start-icon').textContent = 'pause';
    _pomInterval = setInterval(pomTick, 1000);
  }
}

// Init ring geometry
const _pomRingProgress = document.getElementById('pom-ring-progress');
_pomRingProgress.style.strokeDasharray  = POM_CIRCUMFERENCE;
_pomRingProgress.style.strokeDashoffset = 0;

document.querySelectorAll('.pom-mode-btn').forEach(btn => { btn.onclick = () => pomSetMode(btn.dataset.mode); });
document.getElementById('pom-start').onclick = pomToggle;
document.getElementById('pom-reset').onclick = () => pomSetMode(_pomMode);
