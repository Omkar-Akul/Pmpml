let ALL_STOPS = [];

function updateAllStops(lang) {
  ALL_STOPS = [...new Set(
    BUS_DATA.flatMap(r => r.stops.map(s => lang === 'mr' && s.name_mr ? s.name_mr : s.name))
  )].sort();
}

let fromSelected = '';
let toSelected = '';
let activeList = null;
let activeIndex = -1;

// ===== TRANSLATIONS =====
const LANG = {
  en: {
    pageTitle: 'Alandi Bus Finder – Pune PMPML',
    badge: 'Live',
    heroTag: 'Smart Route Search',
    heroH2Line1: 'Find your ride,',
    heroH2Line2: 'instantly.',
    heroDesc: "Search any stop in Alandi's PMPML network and get direct bus routes.",
    statBuses: 'Bus Routes',
    statStops: 'Bus Stops',
    statDirections: 'Directions',
    cardHeader: 'Plan Your Journey',
    fromLabel: 'Pickup Location',
    fromPlaceholder: 'Enter pickup stop...',
    toLabel: 'Dropoff Location',
    toPlaceholder: 'Enter dropoff stop...',
    searchBtn: 'Find Buses',
    resultsTitle: 'Available Rides',
    noResultsTitle: 'No Direct Routes',
    alertBoth: 'Please enter both pickup and dropoff stops.',
    routeCount1: ' ride',
    routeCountN: ' rides',
    outbound: 'Outbound',
    inbound: 'Inbound',
    fromLabel2: 'PICKUP',
    toLabel2: 'DROPOFF',
    stopBetween1: ' stop',
    stopBetweenN: ' stops',
    noDirectMsg: 'No direct rides found',
    noDirectSub: 'No direct route connects these stops.<br>Try nearby stops or check stop names.',
    footerText: 'Alandi PMPML Bus Finder &nbsp;·&nbsp; Pune, Maharashtra &nbsp;·&nbsp; Data sourced from official route dataset',
    settingsTitle: 'Settings',
    settingTheme: 'Theme',
    settingLang: 'Language',
    themeLight: 'Light',
    themeDark: 'Dark',
    estTime: 'Est. Time',
    estFare: 'Est. Fare',
    totalStops: 'Stops',
    journeyTimeline: 'Journey Timeline'
  },
  mr: {
    pageTitle: 'अलंदी बस शोधक – पुणे PMPML',
    badge: 'सुरू',
    heroTag: 'स्मार्ट मार्ग शोध',
    heroH2Line1: 'तुमचा प्रवास शोधा,',
    heroH2Line2: 'त्वरित.',
    heroDesc: 'अलंदीच्या PMPML नेटवर्कमध्ये कोणताही थांबा शोधा आणि थेट बस मार्ग मिळवा.',
    statBuses: 'बस मार्ग',
    statStops: 'बस थांबे',
    statDirections: 'दिशा',
    cardHeader: 'तुमचा प्रवास नियोजित करा',
    fromLabel: 'सुरुवातीचे ठिकाण',
    fromPlaceholder: 'सुरुवातीचा थांबा टाका...',
    toLabel: 'गंतव्य ठिकाण',
    toPlaceholder: 'गंतव्य थांबा टाका...',
    searchBtn: 'बस शोधा',
    resultsTitle: 'उपलब्ध प्रवास',
    noResultsTitle: 'थेट मार्ग नाही',
    alertBoth: 'कृपया सुरुवात आणि गंतव्य दोन्ही थांबे टाका.',
    routeCount1: ' मार्ग',
    routeCountN: ' मार्ग',
    outbound: 'बाहेर जाणारी',
    inbound: 'आत येणारी',
    fromLabel2: 'येथून',
    toLabel2: 'येथे',
    stopBetween1: ' थांबा',
    stopBetweenN: ' थांबे',
    noDirectMsg: 'थेट बस आढळली नाही',
    noDirectSub: 'या थांब्यांमध्ये कोणताही थेट मार्ग नाही.<br>जवळचे थांबे वापरून पहा.',
    footerText: 'अलंदी PMPML बस शोधक &nbsp;·&nbsp; पुणे, महाराष्ट्र &nbsp;·&nbsp; अधिकृत मार्ग डेटावरून',
    settingsTitle: 'सेटिंग्ज',
    settingTheme: 'थीम',
    settingLang: 'भाषा',
    themeLight: 'लाईट',
    themeDark: 'डार्क',
    estTime: 'अंदाजित वेळ',
    estFare: 'अंदाजित भाडे',
    totalStops: 'थांबे',
    journeyTimeline: 'प्रवासाची वेळरेषा'
  }
};

let currentLang = 'en';

// ===== MAP STATE =====
let map = null;
let userMarker = null;
let stopMarkers = [];
let routePolyline = null;
let UNIQUE_STOPS_WITH_COORD = [];

function updateUniqueStops() {
  const stopMap = new Map();
  BUS_DATA.forEach(route => {
    route.stops.forEach(stop => {
      if (stop.lat && stop.lng && !stopMap.has(stop.name)) {
        stopMap.set(stop.name, {
          name: stop.name,
          name_mr: stop.name_mr,
          lat: stop.lat,
          lng: stop.lng
        });
      }
    });
  });
  UNIQUE_STOPS_WITH_COORD = Array.from(stopMap.values());
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize icons
  lucide.createIcons();

  // Load theme preference
  const savedTheme = localStorage.getItem('pmpml-theme') || 'dark';
  setTheme(savedTheme);

  // Set default language
  setLang('en');

  // Initialize Map
  updateUniqueStops();
  initMap();
  
  // Aggressive fix for mobile map rendering
  const refreshMap = () => { if (map) map.invalidateSize(); };
  setTimeout(refreshMap, 300);
  setTimeout(refreshMap, 1000);
  setTimeout(refreshMap, 2500);
  window.addEventListener('resize', refreshMap);
});

// Helper function to calculate distance between two lat/lng points (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Helper function to calculate bearing between two lat/lng points
function getBearing(lat1, lon1, lat2, lon2) {
    const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
    return (Math.atan2(y, x) * 180) / Math.PI;
}


function updateBusLocation(busId, lat, lng, routeName, bearing) {
  const busIcon = L.divIcon({
    html: `<div class="bus-marker-icon" style="transform: rotate(${bearing}deg);"><i data-lucide="bus"></i></div><span class="bus-marker-label">${routeName}</span>`,
    className: 'bus-live-marker',
    iconSize: [60, 30],
    iconAnchor: [30, 15],
  });

  if (busMarkers[busId]) {
    busMarkers[busId].setLatLng([lat, lng]);
    busMarkers[busId].setIcon(busIcon);
  } else {
    busMarkers[busId] = L.marker([lat, lng], { icon: busIcon })
      .addTo(mapDashboardMap)
      .bindPopup(`<b>Bus Route: ${routeName}</b><br>Live Location`);
  }
  lucide.createIcons();
}


function initMap() {
  // Alandi coordinates as default center
  const alandi = [18.6751, 73.8890];
  map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView(alandi, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  // Locate me button
  document.getElementById('locate-me-btn').addEventListener('click', locateMe);

  // Map click to select stops
  map.on('click', onMapClick);

  // Aggressive refresh for mobile
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 1000);
}

// Handle window resize for map
window.addEventListener('resize', () => {
  if (map) map.invalidateSize();
});

function locateMe() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  const btn = document.getElementById('locate-me-btn');
  btn.style.opacity = '0.5';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      btn.style.opacity = '1';
      const { latitude, longitude } = position.coords;
      const userPos = [latitude, longitude];
      
      if (userMarker) userMarker.remove();
      userMarker = L.marker(userPos, {
        icon: L.divIcon({
          className: 'user-location-icon',
          html: '<div class="pulse-dot"></div>',
          iconSize: [20, 20]
        })
      }).addTo(map);

      map.setView(userPos, 15);
      
      const nearest = findNearestStop(latitude, longitude);
      if (nearest) {
        setStopFromMap(nearest, 'from');
      }
    },
    (error) => {
      btn.style.opacity = '1';
      alert("Unable to retrieve your location");
    }
  );
}

function findNearestStop(lat, lng) {
  let minMarker = null;
  let minDist = Infinity;

  UNIQUE_STOPS_WITH_COORD.forEach(stop => {
    const dist = Math.sqrt(Math.pow(stop.lat - lat, 2) + Math.pow(stop.lng - lng, 2));
    if (dist < minDist) {
      minDist = dist;
      minMarker = stop;
    }
  });

  return minMarker;
}

function onMapClick(e) {
  const { lat, lng } = e.latlng;
  const nearest = findNearestStop(lat, lng);
  if (nearest) {
    const fromVal = document.getElementById('from-input').value.trim();
    const toVal = document.getElementById('to-input').value.trim();

    // If pickup is filled but dropoff is empty, set dropoff
    if (fromVal && !toVal) {
      setStopFromMap(nearest, 'to');
    } 
    // If both are filled, or both are empty, or just dropoff is filled (rare), set pickup
    else {
      setStopFromMap(nearest, 'from');
      // If we are resetting pickup, clear dropoff too for a fresh search
      if (toVal) {
        document.getElementById('to-input').value = '';
        toSelected = '';
      }
    }
  }
}

function setStopFromMap(stop, type) {
  const name = currentLang === 'mr' && stop.name_mr ? stop.name_mr : stop.name;
  const inputId = type === 'from' ? 'from-input' : 'to-input';
  const inputEl = document.getElementById(inputId);
  
  inputEl.value = name;
  if (type === 'from') fromSelected = name;
  else toSelected = name;

  // Visual feedback on map
  L.popup()
    .setLatLng([stop.lat, stop.lng])
    .setContent(`<b>${type === 'from' ? 'Pickup' : 'Dropoff'}:</b> ${name}`)
    .openOn(map);

  // Trigger search if both are selected
  if (fromSelected && toSelected) {
    searchBuses();
  }
}

function clearMapRoute() {
  if (routePolyline) routePolyline.remove();
  stopMarkers.forEach(m => m.remove());
  stopMarkers = [];
}

function drawRouteOnMap(stops) {
  clearMapRoute();
  const latlngs = stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng]);
  if (latlngs.length < 2) return;

  routePolyline = L.polyline(latlngs, {
    color: 'var(--accent)',
    weight: 4,
    opacity: 0.8,
    lineJoin: 'round'
  }).addTo(map);

  // Add small dots for intermediate stops
  latlngs.forEach((ll, i) => {
    const isFirst = i === 0;
    const isLast = i === latlngs.length - 1;
    
    const marker = L.circleMarker(ll, {
      radius: isFirst || isLast ? 6 : 3,
      fillColor: isFirst ? 'var(--text)' : isLast ? 'var(--accent)' : 'var(--border)',
      color: 'var(--bg)',
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    }).addTo(map);
    
    stopMarkers.push(marker);
  });

  map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
}

// ===== SETTINGS & THEME =====
function toggleSettings() {
  // Redundant with unified sidebar
}

// Theme Logic
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pmpml-theme', theme);
  const themeBtns = document.querySelectorAll('.mini-theme-btn');
  themeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
  });
}

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
    div.innerHTML = `<div class="stop-icon"><i data-lucide="map-pin"></i></div><div class="stop-name">${highlightMatch(item, query)}</div>`;
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
  lucide.createIcons({ root: listEl });
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

// ===== VOICE RECOGNITION =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const fromVoiceBtn = document.getElementById('from-voice-btn');
    const toVoiceBtn = document.getElementById('to-voice-btn');

    let activeInput = null;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (activeInput) {
            activeInput.value = transcript;
            activeInput.dispatchEvent(new Event('input')); // Trigger autocomplete
        }
    };

    recognition.onerror = (event) => {
        alert('Voice recognition error: ' + event.error);
    };
    
    recognition.onend = () => {
        fromVoiceBtn.classList.remove('active');
        toVoiceBtn.classList.remove('active');
        activeInput = null;
    };

    fromVoiceBtn.addEventListener('click', () => {
        if (activeInput) recognition.stop();
        activeInput = fromInput;
        recognition.lang = currentLang === 'mr' ? 'mr-IN' : 'en-US';
        fromVoiceBtn.classList.add('active');
        recognition.start();
    });

    toVoiceBtn.addEventListener('click', () => {
        if (activeInput) recognition.stop();
        activeInput = toInput;
        recognition.lang = currentLang === 'mr' ? 'mr-IN' : 'en-US';
        toVoiceBtn.classList.add('active');
        recognition.start();
    });

} else {
    console.log('Speech Recognition not supported');
    document.getElementById('from-voice-btn').style.display = 'none';
    document.getElementById('to-voice-btn').style.display = 'none';
}


let currentResults = [];

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

  currentResults = [];

  BUS_DATA.forEach(route => {
    const stops = route.stops;
    
    // Get the name according to current language
    const getName = (s) => (currentLang === 'mr' && s.name_mr) ? s.name_mr : s.name;
    const getRouteName = (r) => (currentLang === 'mr' && r.route_mr) ? r.route_mr : r.route;

    const fromIdx = stops.findIndex(s => getName(s).toLowerCase() === fromLower);
    const toIdx = stops.findIndex(s => getName(s).toLowerCase() === toLower);
    
    const fromIdxPartial = fromIdx === -1 ? stops.findIndex(s => getName(s).toLowerCase().includes(fromLower)) : fromIdx;
    const toIdxPartial = toIdx === -1 ? stops.findIndex(s => getName(s).toLowerCase().includes(toLower)) : toIdx;

    const fi = fromIdx !== -1 ? fromIdx : fromIdxPartial;
    const ti = toIdx !== -1 ? toIdx : toIdxPartial;

    if (fi !== -1 && ti !== -1 && fi < ti) {
      currentResults.push({
        bus: route.bus,
        routeName: getRouteName(route),
        direction: route.direction,
        fromStop: getName(stops[fi]),
        fromOrder: stops[fi].order,
        fromIdx: fi,
        toStop: getName(stops[ti]),
        toOrder: stops[ti].order,
        toIdx: ti,
        stopsBetween: ti - fi - 1,
        allStops: stops
      });
    }
  });

  displayResults(currentResults, from, to);
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
  count.style.background = results.length > 0 ? 'var(--surface)' : 'rgba(239,68,68,0.15)';
  count.style.color = results.length > 0 ? 'var(--text)' : '#f87171';
  count.style.borderColor = results.length > 0 ? 'var(--border)' : 'rgba(239,68,68,0.25)';

  summary.textContent = from + ' → ' + to;
  title.textContent = results.length > 0 ? t.resultsTitle : t.noResultsTitle;

  container.innerHTML = '';

  if (results.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="icon"><i data-lucide="search-x"></i></div>
        <h3>${LANG[currentLang].noDirectMsg}</h3>
        <p>${LANG[currentLang].noDirectSub}</p>
      </div>`;
    lucide.createIcons({ root: container });
    return;
  }

  results.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'bus-card';
    card.style.animationDelay = (i * 0.07) + 's';
    card.onclick = () => {
        console.log("Bus card clicked:", i);
        window.openBusDetail(i);
    };

    const dirClass = r.direction === 'OUT' ? 'dir-out' : 'dir-in';
    const tl = LANG[currentLang]; 
    const dirLabel = r.direction === 'OUT' ? tl.outbound : tl.inbound;
    const dirIcon = r.direction === 'OUT' ? 'arrow-right' : 'arrow-left';

    card.innerHTML = `
      <div class="bus-card-top">
        <div class="bus-number-badge">${r.bus}</div>
        <div class="bus-info">
          <div class="bus-route-name">${r.routeName}</div>
          <span class="bus-direction ${dirClass}"><i data-lucide="${dirIcon}"></i> ${dirLabel}</span>
        </div>
      </div>
      <div class="journey">
        <div class="journey-line-abs"></div>
        <div class="journey-row">
          <div class="journey-dot from"></div>
          <div class="journey-stop-info">
            <span class="journey-label">${tl.fromLabel2}</span>
            <span class="journey-stop">${r.fromStop}</span>
          </div>
        </div>
        
        <div class="journey-spacer"></div>

        ${r.stopsBetween > 0 ? `
        <div class="stops-between">
          <i data-lucide="more-vertical"></i> ${r.stopsBetween}${r.stopsBetween>1 ? tl.stopBetweenN : tl.stopBetween1}
        </div>` : ''}

        <div class="journey-row">
          <div class="journey-dot to"></div>
          <div class="journey-stop-info">
            <span class="journey-label">${tl.toLabel2}</span>
            <span class="journey-stop">${r.toStop}</span>
          </div>
        </div>
      </div>
      <div class="bus-card-actions">
        <button class="book-ticket-card-btn" onclick="event.stopPropagation(); openBooking('${r.bus}', '${r.routeName}', '${r.fromStop}', '${r.toStop}', ${r.stopsBetween})">
          <i data-lucide="ticket"></i> Book Ticket
        </button>
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons({ root: container });
}


// ===== BUS DETAIL MODAL =====
const detailOverlay = document.getElementById('detail-overlay');
const detailModal = document.getElementById('detail-modal');
const closeDetail = document.getElementById('close-detail');

window.openBusDetail = function(index) {
  const r = currentResults[index];
  if (!r) return;

  document.getElementById('detail-bus-badge').textContent = r.bus;
  document.getElementById('detail-bus-name').textContent = r.routeName;
  
  const estimatedTime = (r.stopsBetween + 1) * 2;
  const estimatedFare = (r.stopsBetween + 1) * 1;

  document.getElementById('detail-time').textContent = estimatedTime + (currentLang === 'mr' ? ' मि' : ' min');
  document.getElementById('detail-fare').textContent = '₹' + estimatedFare;
  document.getElementById('detail-stops-count').textContent = r.allStops.length;

  const timeline = document.getElementById('detail-timeline');
  timeline.innerHTML = '';
  
  const getName = (s) => (currentLang === 'mr' && s.name_mr) ? s.name_mr : s.name;
  
  r.allStops.forEach((stop, idx) => {
    let classes = 'timeline-item';
    if (idx === r.fromIdx) classes += ' start';
    else if (idx === r.toIdx) classes += ' end';
    else if (idx > r.fromIdx && idx < r.toIdx) classes += ' highlight';

    const div = document.createElement('div');
    div.className = classes;
    div.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-stop">${getName(stop)}</div>
      </div>
    `;
    timeline.appendChild(div);
  });

  detailOverlay.classList.add('show');
  detailModal.classList.add('show');

  // Draw on map
  drawRouteOnMap(r.allStops);
};

function closeBusDetailModal() {
  detailOverlay.classList.remove('show');
  detailModal.classList.remove('show');
}
closeDetail.addEventListener('click', closeBusDetailModal);
detailOverlay.addEventListener('click', closeBusDetailModal);


function setLang(lang) {
  currentLang = lang;
  updateAllStops(lang);
  
  // Clear inputs to prevent cross-language mismatch
  document.getElementById('from-input').value = '';
  document.getElementById('to-input').value = '';
  fromSelected = '';
  toSelected = '';

  const t = LANG[lang];

  // Toggle mini lang buttons in sidebar
  const miniLangBtns = document.querySelectorAll('.mini-lang-btn');
  miniLangBtns.forEach(btn => {
    const isTarget = (lang === 'en' && btn.textContent.includes('EN')) || (lang === 'mr' && btn.textContent.includes('मराठी'));
    btn.classList.toggle('active', isTarget);
  });

  // Page title
  document.title = t.pageTitle;
  document.documentElement.lang = lang;

  // Header & Hero
  document.getElementById('badge-text').textContent = t.badge;
  document.getElementById('hero-tag-text').textContent = t.heroTag;
  document.getElementById('hero-title').innerHTML = t.heroH2Line1 + '<br><span>' + t.heroH2Line2 + '</span>';
  document.getElementById('hero-desc').textContent = t.heroDesc;

  // Stats
  document.querySelectorAll('.stat-label')[0].textContent = t.statBuses;
  document.querySelectorAll('.stat-label')[1].textContent = t.statStops;
  document.querySelectorAll('.stat-label')[2].textContent = t.statDirections;

  // Search card
  document.getElementById('card-header-text').textContent = t.cardHeader;
  document.getElementById('from-label').textContent = t.fromLabel;
  document.getElementById('from-input').placeholder = t.fromPlaceholder;
  document.getElementById('to-label').textContent = t.toLabel;
  document.getElementById('to-input').placeholder = t.toPlaceholder;
  document.getElementById('search-btn-text').textContent = t.searchBtn;

  // Footer & Settings in Sidebar
  const footerText = document.getElementById('footer-text');
  if(footerText) footerText.innerHTML = t.footerText;
  
  const setLabel = document.getElementById('setting-title-label');
  const themeLabel = document.getElementById('label-theme');
  const langLabel = document.getElementById('label-lang');
  
  if(setLabel) setLabel.textContent = t.settingsTitle;
  if(themeLabel) themeLabel.textContent = t.settingTheme;
  if(langLabel) langLabel.textContent = t.settingLang;

  // Detail Modal Translations
  const lTime = document.getElementById('label-time');
  const lFare = document.getElementById('label-fare');
  const lStops = document.getElementById('label-stops');
  const lJourney = document.getElementById('label-journey');
  
  if(lTime) lTime.textContent = t.estTime;
  if(lFare) lFare.textContent = t.estFare;
  if(lStops) lStops.textContent = t.totalStops;
  if(lJourney) lJourney.textContent = t.journeyTimeline;

  // Results title if visible
  const resultsSection = document.getElementById('results-section');
  if (resultsSection.classList.contains('show')) {
    const currentTitle = document.getElementById('results-title').textContent;
    const wasAvailable = currentTitle === LANG.en.resultsTitle || currentTitle === LANG.mr.resultsTitle;
    document.getElementById('results-title').textContent = wasAvailable ? t.resultsTitle : t.noResultsTitle;
    
    // Re-render results to update text inside cards
    const from = fromSelected || document.getElementById('from-input').value.trim();
    const to = toSelected || document.getElementById('to-input').value.trim();
    if(from && to) {
        searchBuses();
    }
  }
}

// Keyboard enter on button
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    searchBuses();
  }
});

// ===== FIREBASE AUTH & BOOKING =====
console.log("PMPML Script: Auth section initializing...");
if (typeof auth === 'undefined') {
  console.error("PMPML Script: 'auth' is not defined. Check firebase-config.js!");
} else {
  console.log("PMPML Script: 'auth' is ready.");
}

// Firebase is initialized in firebase-config.js

let currentUser = null;
const loginHeaderBtn = document.getElementById('login-header-btn');
const loginText = document.getElementById('login-text');
const userAvatar = document.getElementById('user-avatar');
const userIconDefault = document.getElementById('user-icon-default');
const profileDropdown = document.getElementById('profile-dropdown');

const authOverlay = document.getElementById('auth-overlay');
const authModal = document.getElementById('auth-modal');
const googleLoginBtn = document.getElementById('google-login-btn');
const closeAuth = document.getElementById('close-auth');

const bookingOverlay = document.getElementById('booking-overlay');
const bookingModal = document.getElementById('booking-modal');
const closeBooking = document.getElementById('close-booking');
const bookingDetails = document.getElementById('booking-details');
const confirmBookBtn = document.getElementById('confirm-book-btn');
const passengerNum = document.getElementById('passenger-num');
const incPassenger = document.getElementById('inc-passenger');
const decPassenger = document.getElementById('dec-passenger');

let currentBookingData = null;
let currentPassengers = 1;

// ===== Wallet & Ticket Elements =====
const walletContainer = document.getElementById('wallet-container');
const walletBalance = document.getElementById('wallet-balance');
const walletOverlay = document.getElementById('wallet-overlay');
const walletModal = document.getElementById('wallet-modal');
const closeWallet = document.getElementById('close-wallet');
const currentBalance = document.getElementById('current-balance');
const addMoneyInput = document.getElementById('add-money-input');
const addMoneyBtn = document.getElementById('add-money-btn');

const ticketOverlay = document.getElementById('ticket-overlay');
const ticketModal = document.getElementById('ticket-modal');
const closeTicket = document.getElementById('close-ticket');

let userWalletBalance = 0;
let walletUnsubscribe = null; // To listen for wallet changes

// Auth State Listener
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    const menuText = document.getElementById('menu-text');
    const userAvatar = document.getElementById('user-avatar');
    const menuIconDefault = document.getElementById('menu-icon-default');
    
    if(menuText) menuText.textContent = user.displayName.split(' ')[0];
    if(userAvatar) {
        userAvatar.style.backgroundImage = `url(${user.photoURL})`;
        userAvatar.style.display = 'block';
    }
    if(menuIconDefault) menuIconDefault.style.display = 'none';
    
    // Update Sidebar
    updateSidebarUI(user);
    
    // Setup Wallet
    setupWalletListener(user.uid);
    if(walletContainer) walletContainer.style.display = 'flex';
    if(authModal && authModal.classList.contains('show')) closeAuthModal();
    
  } else {
    currentUser = null;
    const menuText = document.getElementById('menu-text');
    const userAvatar = document.getElementById('user-avatar');
    const menuIconDefault = document.getElementById('menu-icon-default');
    
    if(menuText) menuText.textContent = "Menu";
    if(userAvatar) userAvatar.style.display = 'none';
    if(menuIconDefault) menuIconDefault.style.display = 'block';
    
    // Reset Sidebar
    updateSidebarUI(null);
    
    // Reset Wallet
    if(walletContainer) walletContainer.style.display = 'none';
    if (walletUnsubscribe) {
      walletUnsubscribe();
      walletUnsubscribe = null;
    }
  }
});

function setupWalletListener(userId) {
  const userDocRef = db.collection('users').doc(userId);

  walletUnsubscribe = userDocRef.onSnapshot(doc => {
    if (doc.exists) {
      userWalletBalance = doc.data().walletBalance || 0;
    } else {
      // Create user profile with initial balance if it doesn't exist
      userWalletBalance = 100;
      userDocRef.set({
        displayName: currentUser.displayName,
        email: currentUser.email,
        walletBalance: userWalletBalance
      });
    }
    updateWalletDisplay();
  }, err => {
    console.error("Error listening to wallet changes:", err);
  });
}

function updateWalletDisplay() {
    const formattedBalance = `₹${userWalletBalance.toFixed(2)}`;
    const sidebarBal = document.getElementById('sidebar-wallet-balance');
    if (sidebarBal) sidebarBal.textContent = formattedBalance;
    if (currentBalance) {
        currentBalance.textContent = formattedBalance;
    }
}

function openWalletModal() {
    walletOverlay.classList.add('show');
    walletModal.classList.add('show');
}
function closeWalletModal() {
    walletOverlay.classList.remove('show');
    walletModal.classList.remove('show');
}
if(walletContainer) walletContainer.addEventListener('click', openWalletModal);
closeWallet.addEventListener('click', closeWalletModal);
walletOverlay.addEventListener('click', closeWalletModal);

if(addMoneyBtn) {
    addMoneyBtn.addEventListener('click', () => {
        if (!currentUser) return;
        const amountToAdd = parseFloat(addMoneyInput.value);
        if (isNaN(amountToAdd) || amountToAdd <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        
        const userDocRef = db.collection('users').doc(currentUser.uid);
        db.runTransaction(transaction => {
          return transaction.get(userDocRef).then(doc => {
            const newBalance = (doc.data().walletBalance || 0) + amountToAdd;
            transaction.update(userDocRef, { walletBalance: newBalance });
            return newBalance;
          });
        }).then(newBalance => {
          console.log(`Transaction successful. New balance: ₹${newBalance}`);
          addMoneyInput.value = '100';
          closeWalletModal();
        }).catch(error => {
          console.error("Transaction failed: ", error);
          alert("Failed to add money. Please try again.");
        });
    });
}

// Ticket Logic
function showVirtualTicket(bookingData, passengers, totalFare, bookingId, customTime = null) {
    document.getElementById('ticket-route').textContent = `${bookingData.fromStop} → ${bookingData.toStop}`;
    document.getElementById('ticket-bus-no').textContent = bookingData.busNum;
    document.getElementById('ticket-passengers').textContent = passengers;
    document.getElementById('ticket-fare').textContent = `₹${totalFare.toFixed(2)}`;

    // Calculate Validity (4 Hours)
    const bookingTime = customTime ? new Date(customTime) : new Date();
    const expiryTime = new Date(bookingTime.getTime() + 4 * 60 * 60 * 1000);
    const now = new Date();
    const isValid = now < expiryTime;

    const expiryStr = expiryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const validityEl = document.getElementById('ticket-validity');
    if (validityEl) {
        validityEl.innerHTML = `
            <div class="validity-status ${isValid ? 'status-valid' : 'status-expired'}">
                <i data-lucide="${isValid ? 'check-circle' : 'x-circle'}"></i>
                <span>${isValid ? 'VALID' : 'EXPIRED'}</span>
            </div>
            <div class="validity-time">Valid until ${expiryStr} today</div>
        `;
    }

    // Generate real QR data
    const qrData = `TICKET-${bookingId || 'TEMP'}-${currentUser.uid}`;
    const qrImg = document.querySelector('.ticket-qr img');
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=150x150`;
    }

    ticketOverlay.classList.add('show');
    ticketModal.classList.add('show');
    lucide.createIcons({ root: validityEl });
}

window.openFullTicket = (dataStr) => {
    const data = JSON.parse(dataStr);
    showVirtualTicket(data, data.passengers, data.totalFare, data.id, data.timestamp);
};

window.deleteTicket = async (ticketId) => {
  if (!confirm("Are you sure you want to remove this ticket from your history?")) return;
  
  try {
    await db.collection('bookings').doc(ticketId).delete();
    console.log("Ticket deleted:", ticketId);
    loadMyTickets(); // Refresh the list
  } catch (e) {
    console.error("Delete failed:", e);
    alert("Failed to delete ticket.");
  }
};

function closeTicketModal() {
    ticketOverlay.classList.remove('show');
    ticketModal.classList.remove('show');
}
closeTicket.addEventListener('click', closeTicketModal);
ticketOverlay.addEventListener('click', closeTicketModal);

// ===== UNIFIED SIDEBAR LOGIC =====
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('main-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const closeSidebar = document.getElementById('close-sidebar');

function toggleSidebar() {
    sidebar.classList.toggle('show');
    sidebarOverlay.classList.toggle('show');
}

menuBtn.addEventListener('click', toggleSidebar);
if(closeSidebar) closeSidebar.addEventListener('click', toggleSidebar);
if(sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

// Sidebar Login/Logout/Nav Update
function updateSidebarUI(user) {
    const authSection = document.getElementById('sidebar-auth-section');
    const navSection = document.getElementById('sidebar-nav-section');
    const logoutFooter = document.getElementById('sidebar-footer-logout');
    
    if (user) {
        document.getElementById('sidebar-username').textContent = user.displayName;
        document.getElementById('sidebar-email').textContent = user.email;
        document.getElementById('sidebar-avatar').style.backgroundImage = `url(${user.photoURL})`;
        
        if(authSection) authSection.style.display = 'none';
        if(navSection) navSection.style.display = 'block';
        if(logoutFooter) logoutFooter.style.display = 'block';
    } else {
        document.getElementById('sidebar-username').textContent = "Guest User";
        document.getElementById('sidebar-email').textContent = "Log in to sync bookings";
        document.getElementById('sidebar-avatar').style.backgroundImage = 'none';
        
        if(authSection) authSection.style.display = 'block';
        if(navSection) navSection.style.display = 'none';
        if(logoutFooter) logoutFooter.style.display = 'none';
    }
}

const sidebarLoginBtn = document.getElementById('sidebar-login-btn');
if(sidebarLoginBtn) {
    sidebarLoginBtn.addEventListener('click', () => {
        openAuthModal();
        toggleSidebar();
    });
}

const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
if(sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', () => {
        if(confirm("Do you want to logout?")) {
            auth.signOut().then(() => {
                toggleSidebar();
            });
        }
    });
}

const sidebarTicketsBtn = document.getElementById('sidebar-tickets-btn');
if(sidebarTicketsBtn) {
    sidebarTicketsBtn.addEventListener('click', () => {
        openDashboard();
        toggleSidebar();
    });
}

const sidebarWalletBtn = document.getElementById('sidebar-wallet-btn');
if(sidebarWalletBtn) {
    sidebarWalletBtn.addEventListener('click', () => {
        openWalletModal();
        toggleSidebar();
    });
}

// Settings in Sidebar
const miniThemeBtns = document.querySelectorAll('.mini-theme-btn');
miniThemeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setTheme(btn.getAttribute('data-theme-val'));
        miniThemeBtns.forEach(b => b.classList.toggle('active', b === btn));
    });
});

function openAuthModal() {
  authOverlay.classList.add('show');
  authModal.classList.add('show');
}
function closeAuthModal() {
  authOverlay.classList.remove('show');
  authModal.classList.remove('show');
}
closeAuth.addEventListener('click', closeAuthModal);
authOverlay.addEventListener('click', closeAuthModal);

googleLoginBtn.addEventListener('click', () => {
  const btnText = document.getElementById('google-btn-text');
  const ogText = btnText.textContent;
  btnText.textContent = 'Signing in...';
  auth.signInWithPopup(googleProvider).catch((error) => {
    alert("Login failed: " + error.message);
    btnText.textContent = ogText;
  });
});

// Booking Modal Logic
window.openBooking = function(busNum, routeName, fromStop, toStop, stopsBetween) {
  if (!currentUser) {
    openAuthModal();
    return;
  }
  currentBookingData = { busNum, routeName, fromStop, toStop, stopsBetween };
  currentPassengers = 1;
  passengerNum.textContent = currentPassengers;
  
  bookingDetails.innerHTML = `
    <div class="route-name">Bus ${busNum} - ${routeName}</div>
    <div class="stops">
      <i data-lucide="map-pin"></i> ${fromStop} <i data-lucide="arrow-right"></i> ${toStop}
    </div>
  `;
  lucide.createIcons({ root: bookingDetails });
  
  bookingOverlay.classList.add('show');
  bookingModal.classList.add('show');
};

function closeBookingModal() {
  bookingOverlay.classList.remove('show');
  bookingModal.classList.remove('show');
}
closeBooking.addEventListener('click', closeBookingModal);
bookingOverlay.addEventListener('click', closeBookingModal);

incPassenger.addEventListener('click', () => {
  if (currentPassengers < 10) {
    currentPassengers++;
    passengerNum.textContent = currentPassengers;
  }
});

decPassenger.addEventListener('click', () => {
  if (currentPassengers > 1) {
    currentPassengers--;
    passengerNum.textContent = currentPassengers;
  }
});

confirmBookBtn.addEventListener('click', () => {
    if (!currentBookingData || !currentUser) return;

    const estimatedFarePerPerson = (currentBookingData.stopsBetween + 1) * 1;
    const totalFare = estimatedFarePerPerson * currentPassengers;

    if (userWalletBalance < totalFare) {
        alert("Insufficient wallet balance. Please add money to your wallet.");
        // Redirect to wallet page instead of opening modal
        window.location.href = 'wallet.html';
        return;
    }

    const userDocRef = db.collection('users').doc(currentUser.uid);
    db.runTransaction(transaction => {
      return transaction.get(userDocRef).then(doc => {
        if (!doc.exists) {
          throw "User document does not exist!";
        }
        const currentDBBalance = doc.data().walletBalance || 0;
        if (currentDBBalance < totalFare) {
          throw "Insufficient wallet balance.";
        }
        const newBalance = currentDBBalance - totalFare;
        transaction.update(userDocRef, { walletBalance: newBalance });

        // Save the booking to Firestore using Local Time
        const bookingRef = db.collection('bookings').doc();
        transaction.set(bookingRef, {
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userEmail: currentUser.email,
            busNum: currentBookingData.busNum,
            routeName: currentBookingData.routeName,
            fromStop: currentBookingData.fromStop,
            toStop: currentBookingData.toStop,
            passengers: currentPassengers,
            totalFare: totalFare,
            timestamp: firebase.firestore.Timestamp.fromDate(new Date()) // Use Local Device Time
        });

        return newBalance;
      });
    }).then(() => {
      console.log("Booking successful. Ticket saved to cloud.");
      closeBookingModal();
      showVirtualTicket(currentBookingData, currentPassengers, totalFare);
    }).catch(error => {
      console.error("Booking transaction failed: ", error);
      alert(`Booking failed: ${error}`);
    });
});

// ===== TICKET DASHBOARD =====
const dashboardOverlay = document.getElementById('dashboard-overlay');
const dashboardModal  = document.getElementById('dashboard-modal');
const closeDashboard  = document.getElementById('close-dashboard');
const myTicketsBtn    = document.getElementById('my-tickets-btn');

function openDashboard() {
  if (dashboardOverlay && dashboardModal) {
    dashboardOverlay.classList.add('show');
    dashboardModal.classList.add('show');
    loadMyTickets();
  }
}
function closeDashboardModal() {
  if (dashboardOverlay && dashboardModal) {
    dashboardOverlay.classList.remove('show');
    dashboardModal.classList.remove('show');
  }
}
if (myTicketsBtn) myTicketsBtn.addEventListener('click', openDashboard);
if (closeDashboard) closeDashboard.addEventListener('click', closeDashboardModal);
if (dashboardOverlay) dashboardOverlay.addEventListener('click', closeDashboardModal);

async function loadMyTickets() {
  const container = document.getElementById('ticket-list-container');
  if (!container || !currentUser) return;

  container.innerHTML = `
    <div class="tickets-loading">
      <i data-lucide="loader-2" class="spin-icon"></i>
      <span>Loading your tickets...</span>
    </div>`;
  lucide.createIcons({ root: container });

  try {
    const snapshot = await db.collection('bookings')
      .where('userId', '==', currentUser.uid)
      .get();

    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="tickets-empty">
          <i data-lucide="ticket-x"></i>
          <span>No bookings yet. Book your first ride!</span>
        </div>`;
      lucide.createIcons({ root: container });
      document.getElementById('stat-total').textContent = '0';
      document.getElementById('stat-spent').textContent = '₹0';
      document.getElementById('stat-passengers').textContent = '0';
      return;
    }

    let totalSpent = 0, totalPassengers = 0;
    const docs = [];
    snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
    
    // Sort client-side
    docs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

    const cards = docs.map((d) => {
      totalSpent += d.totalFare || 0;
      totalPassengers += d.passengers || 1;
      
      const bookingTime = d.timestamp ? d.timestamp.toDate() : new Date();
      const expiryTime = new Date(bookingTime.getTime() + 4 * 60 * 60 * 1000);
      const now = new Date();
      const isValid = now < expiryTime;

      const dateStr = bookingTime.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      const timeStr = bookingTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // Pass the data as a JSON string to the onclick handler
      const ticketData = JSON.stringify({
          busNum: d.busNum,
          routeName: d.routeName,
          fromStop: d.fromStop,
          toStop: d.toStop,
          timestamp: bookingTime.getTime(),
          passengers: d.passengers,
          totalFare: d.totalFare,
          id: d.id
      }).replace(/"/g, '&quot;');

      return `
        <div class="past-ticket-card" onclick="openFullTicket('${ticketData}')">
          <div class="ptc-top">
            <div class="ptc-bus">
              <div class="ptc-bus-num">Bus ${d.busNum || '--'}</div>
              <div class="ptc-route">${d.routeName || '--'}</div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="ptc-badge ${isValid ? 'valid' : 'expired'}">
                ${isValid ? '✓ Valid' : '✕ Expired'}
              </span>
              <button class="ptc-delete" onclick="event.stopPropagation(); deleteTicket('${d.id}')" title="Delete Ticket">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
          <div class="ptc-journey">
            <div class="ptc-stop">
              <span class="ptc-stop-label">From</span>
              <span class="ptc-stop-name">${d.fromStop || '--'}</span>
            </div>
            <div class="ptc-arrow"><i data-lucide="arrow-right"></i></div>
            <div class="ptc-stop right">
              <span class="ptc-stop-label">To</span>
              <span class="ptc-stop-name">${d.toStop || '--'}</span>
            </div>
          </div>
          <div class="ptc-bottom">
            <div class="ptc-meta">
              <div class="ptc-meta-item"><i data-lucide="calendar"></i>${dateStr}, ${timeStr}</div>
              <div class="ptc-meta-item"><i data-lucide="users"></i>${d.passengers || 1} Pass</div>
            </div>
            <div class="ptc-fare">₹${d.totalFare || 0}</div>
          </div>
        </div>`;
    });

    container.innerHTML = cards.join('');
    lucide.createIcons({ root: container });

    document.getElementById('stat-total').textContent = docs.length;
    document.getElementById('stat-spent').textContent = '₹' + totalSpent;
    document.getElementById('stat-passengers').textContent = totalPassengers;

  } catch (e) {
    container.innerHTML = `
      <div class="tickets-empty">
        <i data-lucide="alert-circle"></i>
        <span>Failed to load tickets.</span>
      </div>`;
    lucide.createIcons({ root: container });
    console.error('Firestore error:', e);
  }
}