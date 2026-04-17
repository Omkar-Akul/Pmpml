// Build unique stop index
const ALL_STOPS = [...new Set(
  BUS_DATA.flatMap(r => r.stops.map(s => s.name))
)].sort();

let fromSelected = '';
let toSelected = '';
let activeList = null;
let activeIndex = -1;

// ===== AUTOCOMPLETE =====
function filterStops(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return ALL_STOPS.filter(s => s.toLowerCase().includes(q)).slice(0, 10);
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0,idx) + '<span class="match">' + text.slice(idx, idx+query.length) + '</span>' + text.slice(idx+query.length);
}

function showList(listEl, items, query, onSelect) {
  listEl.innerHTML = '';
  if (items.length === 0) { listEl.classList.remove('show'); return; }
  items.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.innerHTML = `<div class="stop-icon">📍</div><div class="stop-name">${highlightMatch(item, query)}</div>`;
    div.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onSelect(item);
      listEl.classList.remove('show');
    });
    listEl.appendChild(div);
  });
  listEl.classList.add('show');
  activeList = listEl;
  activeIndex = -1;
}

function setupInput(inputEl, listId, varSetter) {
  const listEl = document.getElementById(listId);
  inputEl.addEventListener('input', () => {
    const q = inputEl.value;
    varSetter('');
    const matches = filterStops(q);
    showList(listEl, matches, q, (val) => {
      inputEl.value = val;
      varSetter(val);
    });
  });
  inputEl.addEventListener('focus', () => {
    if (inputEl.value) inputEl.dispatchEvent(new Event('input'));
  });
  inputEl.addEventListener('blur', () => {
    setTimeout(() => listEl.classList.remove('show'), 150);
  });
  inputEl.addEventListener('keydown', (e) => {
    const items = listEl.querySelectorAll('.autocomplete-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex+1, items.length-1);
      items.forEach((it,i) => it.classList.toggle('active', i===activeIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex-1, -1);
      items.forEach((it,i) => it.classList.toggle('active', i===activeIndex));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      items[activeIndex].dispatchEvent(new MouseEvent('mousedown'));
    }
  });
}

const fromInput = document.getElementById('from-input');
const toInput = document.getElementById('to-input');

setupInput(fromInput, 'from-list', (v) => { fromSelected = v; });
setupInput(toInput, 'to-list', (v) => { toSelected = v; });

// ===== SEARCH =====
function searchBuses() {
  const from = fromSelected || fromInput.value.trim();
  const to = toSelected || toInput.value.trim();

  if (!from || !to) {
    alert(LANG[currentLang].alertBoth);
    return;
  }

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  const results = [];

  BUS_DATA.forEach(route => {
    const stops = route.stops;
    const fromIdx = stops.findIndex(s => s.name.toLowerCase() === fromLower);
    const toIdx = stops.findIndex(s => s.name.toLowerCase() === toLower);
    
    // Also try partial match fallback
    const fromIdxPartial = fromIdx === -1 ? stops.findIndex(s => s.name.toLowerCase().includes(fromLower)) : fromIdx;
    const toIdxPartial = toIdx === -1 ? stops.findIndex(s => s.name.toLowerCase().includes(toLower)) : toIdx;

    const fi = fromIdx !== -1 ? fromIdx : fromIdxPartial;
    const ti = toIdx !== -1 ? toIdx : toIdxPartial;

    if (fi !== -1 && ti !== -1 && fi < ti) {
      results.push({
        bus: route.bus,
        routeName: route.route,
        direction: route.direction,
        fromStop: stops[fi].name,
        fromOrder: stops[fi].order,
        toStop: stops[ti].name,
        toOrder: stops[ti].order,
        stopsBetween: ti - fi - 1,
        allStops: stops
      });
    }
  });

  displayResults(results, from, to);
}

function displayResults(results, from, to) {
  const section = document.getElementById('results-section');
  const container = document.getElementById('results-container');
  const title = document.getElementById('results-title');
  const summary = document.getElementById('route-summary');
  const count = document.getElementById('results-count');

  section.classList.add('show');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const t = LANG[currentLang]; count.textContent = results.length + (results.length === 1 ? t.routeCount1 : t.routeCountN);
  count.style.background = results.length > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
  count.style.color = results.length > 0 ? 'var(--green)' : '#f87171';
  count.style.borderColor = results.length > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';

  summary.textContent = from + ' → ' + to;
  title.textContent = results.length > 0 ? t.resultsTitle : t.noResultsTitle;

  container.innerHTML = '';

  if (results.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="icon">🔍</div>
        <h3>${LANG[currentLang].noDirectMsg}</h3>
        <p>${LANG[currentLang].noDirectSub}</p>
      </div>`;
    return;
  }

  results.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'bus-card';
    card.style.animationDelay = (i * 0.07) + 's';

    const dirClass = r.direction === 'OUT' ? 'dir-out' : 'dir-in';
    const tl = LANG[currentLang]; const dirLabel = r.direction === 'OUT' ? tl.outbound : tl.inbound;

    card.innerHTML = `
      <div class="bus-card-top">
        <div class="bus-number-badge">${r.bus}</div>
        <div class="bus-info">
          <div class="bus-route-name">${r.routeName}</div>
          <span class="bus-direction ${dirClass}">${dirLabel}</span>
        </div>
      </div>
      <div class="journey">
        <div class="journey-row">
          <div class="journey-dot from"></div>
          <span class="journey-label">${tl.fromLabel2}</span>
          <span class="journey-stop">${r.fromStop}</span>
          <span class="journey-order">${tl.stopNum}${r.fromOrder}</span>
        </div>
        <div class="journey-row">
          <div class="journey-line" style="margin-left:4px; margin-top:-4px; margin-bottom:-4px;"></div>
        </div>
        ${r.stopsBetween > 0 ? `
        <div class="stops-between">
          <span class="stops-between-badge">↕ ${r.stopsBetween}${r.stopsBetween>1 ? tl.stopBetweenN : tl.stopBetween1}</span>
        </div>` : ''}
        <div class="journey-row">
          <div class="journey-dot to"></div>
          <span class="journey-label">${tl.toLabel2}</span>
          <span class="journey-stop">${r.toStop}</span>
          <span class="journey-order">${tl.stopNum}${r.toOrder}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}


// ===== TRANSLATIONS =====
const LANG = {
  en: {
    pageTitle: 'Alandi Bus Finder – Pune PMPML',
    logoSub: 'Pune PMPML Route Finder',
    badge: '🟢 Live',
    heroTag: '✦ Smart Route Search',
    heroH2Line1: 'Find your bus,',
    heroH2Line2: 'instantly.',
    heroDesc: "Search any stop in Alandi's PMPML network and get direct bus routes.",
    statBuses: 'Bus Routes',
    statStops: 'Bus Stops',
    statDirections: 'Directions',
    cardHeader: 'Plan Your Journey',
    fromLabel: 'From – Start Location',
    fromPlaceholder: 'Enter your starting stop...',
    toLabel: 'To – Destination',
    toPlaceholder: 'Enter your destination stop...',
    searchBtn: '🔍 Find Buses',
    resultsTitle: 'Available Buses',
    noResultsTitle: 'No Direct Routes',
    alertBoth: 'Please enter both start and destination stops.',
    routeCount1: ' route',
    routeCountN: ' routes',
    outbound: '→ Outbound',
    inbound: '← Inbound',
    fromLabel2: 'FROM',
    toLabel2: 'TO',
    stopNum: 'Stop #',
    stopBetween1: ' stop in between',
    stopBetweenN: ' stops in between',
    noDirectMsg: 'No direct buses found',
    noDirectSub: 'No direct route connects these stops.<br>Try nearby stops or check stop names.',
    footerText: 'Alandi PMPML Bus Finder &nbsp;·&nbsp; Pune, Maharashtra &nbsp;·&nbsp; Data sourced from official route dataset',
  },
  mr: {
    pageTitle: 'अलंदी बस शोधक – पुणे PMPML',
    logoSub: 'पुणे PMPML मार्ग शोधक',
    badge: '🟢 सुरू',
    heroTag: '✦ स्मार्ट मार्ग शोध',
    heroH2Line1: 'तुमची बस शोधा,',
    heroH2Line2: 'त्वरित.',
    heroDesc: 'अलंदीच्या PMPML नेटवर्कमध्ये कोणताही थांबा शोधा आणि थेट बस मार्ग मिळवा.',
    statBuses: 'बस मार्ग',
    statStops: 'बस थांबे',
    statDirections: 'दिशा',
    cardHeader: 'तुमचा प्रवास नियोजित करा',
    fromLabel: 'कोठून – सुरुवातीचे ठिकाण',
    fromPlaceholder: 'सुरुवातीचा थांबा टाका...',
    toLabel: 'कोठे – गंतव्य ठिकाण',
    toPlaceholder: 'गंतव्य थांबा टाका...',
    searchBtn: '🔍 बस शोधा',
    resultsTitle: 'उपलब्ध बस',
    noResultsTitle: 'थेट मार्ग नाही',
    alertBoth: 'कृपया सुरुवात आणि गंतव्य दोन्ही थांबे टाका.',
    routeCount1: ' मार्ग',
    routeCountN: ' मार्ग',
    outbound: '→ बाहेर जाणारी',
    inbound: '← आत येणारी',
    fromLabel2: 'येथून',
    toLabel2: 'येथे',
    stopNum: 'थांबा #',
    stopBetween1: ' थांबा मध्ये',
    stopBetweenN: ' थांबे मध्ये',
    noDirectMsg: 'थेट बस आढळली नाही',
    noDirectSub: 'या थांब्यांमध्ये कोणताही थेट मार्ग नाही.<br>जवळचे थांबे वापरून पहा.',
    footerText: 'अलंदी PMPML बस शोधक &nbsp;·&nbsp; पुणे, महाराष्ट्र &nbsp;·&nbsp; अधिकृत मार्ग डेटावरून',
  }
};

let currentLang = 'en';

function setLang(lang) {
  currentLang = lang;
  const t = LANG[lang];
  const isMarathi = lang === 'mr';

  // Toggle button styles
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-mr').classList.toggle('active', lang === 'mr');

  // Page title
  document.title = t.pageTitle;
  document.documentElement.lang = lang;

  // Header
  document.querySelector('.logo-text p').textContent = t.logoSub;
  document.querySelector('.badge').innerHTML = t.badge;

  // Hero
  document.querySelector('.hero-tag').textContent = t.heroTag;
  document.querySelector('.hero h2').innerHTML = t.heroH2Line1 + '<br><span>' + t.heroH2Line2 + '</span>';
  document.querySelector('.hero p').textContent = t.heroDesc;

  // Stats
  document.querySelectorAll('.stat-label')[0].textContent = t.statBuses;
  document.querySelectorAll('.stat-label')[1].textContent = t.statStops;
  document.querySelectorAll('.stat-label')[2].textContent = t.statDirections;

  // Search card
  document.querySelector('.search-card-header span').textContent = t.cardHeader;
  document.querySelectorAll('.field-label')[0].textContent = t.fromLabel;
  document.getElementById('from-input').placeholder = t.fromPlaceholder;
  document.querySelectorAll('.field-label')[1].textContent = t.toLabel;
  document.getElementById('to-input').placeholder = t.toPlaceholder;
  document.querySelector('.search-btn').innerHTML = t.searchBtn;

  // Footer
  document.querySelector('footer p').innerHTML = t.footerText;

  // Results title if visible
  const resultsSection = document.getElementById('results-section');
  if (resultsSection.classList.contains('show')) {
    const currentTitle = document.getElementById('results-title').textContent;
    const wasAvailable = currentTitle === LANG.en.resultsTitle || currentTitle === LANG.mr.resultsTitle;
    document.getElementById('results-title').textContent = wasAvailable ? t.resultsTitle : t.noResultsTitle;
  }
}

// Keyboard enter on button
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement !== fromInput && document.activeElement !== toInput) {
    searchBuses();
  }
});