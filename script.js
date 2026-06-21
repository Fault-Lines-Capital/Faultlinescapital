/* ═══════════════════════════════════════════════════════════
   FAULT LINES CAPITAL — Core Application
   ═══════════════════════════════════════════════════════════ */

let map, warRoomGlobe, mapLayerGroups = {};
let mapMode = '2d';
let newsPollTimer, marketPollTimer;
let liveNewsStarted = false, marketSensorsStarted = false, chartsInitialized = false;
let earthquakeData = [];

const tabs = ['ai', 'geopolitics', 'finance', 'map'];
let currentTabIndex = 0;
let ALL_POSTS_CACHE = [];
const seenNewsLinks = new Set();

// ── Touch / resize ──
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) document.body.style.cursor = 'auto';

const bgCanvas = document.getElementById('neural-canvas');

window.addEventListener('resize', () => {
    if (bgCanvas) { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; }
    const globe = document.getElementById('ai-globe-canvas');
    if (globe) { const s = Math.min(600, window.innerWidth - 40); globe.width = s; globe.height = s; }
    if (map) map.invalidateSize();
    if (warRoomGlobe) {
        const el = document.getElementById('war-room-globe');
        if (el) warRoomGlobe.width(el.clientWidth).height(el.clientHeight);
    }
});

// ── Mobile menu ──
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('nav-links')?.classList.toggle('open');
});
document.getElementById('layer-open-btn')?.addEventListener('click', () => {
    document.getElementById('layer-panel')?.classList.add('open');
});
document.getElementById('layer-collapse-btn')?.addEventListener('click', () => {
    document.getElementById('layer-panel')?.classList.remove('open');
});

// ═══════════════════════════════════════════════════════════
// LAYER SYSTEM — World Monitor style
// ═══════════════════════════════════════════════════════════

const LAYER_GROUPS = [
    {
        title: 'Geopolitical',
        layers: [
            { id: 'conflict', label: 'Conflict zones', color: '#ff2222', default: true },
            { id: 'intel', label: 'Intel hotspots', color: '#ffcc00', default: true },
            { id: 'unrest', label: 'Social unrest', color: '#ff6600', default: false },
            { id: 'sanctions', label: 'Sanctions regimes', color: '#aa44ff', default: false },
            { id: 'earthquakes', label: 'Earthquakes (live)', color: '#ffaa00', default: true },
        ]
    },
    {
        title: 'Military & Strategic',
        layers: [
            { id: 'military', label: 'Military bases', color: '#00d4ff', default: true },
            { id: 'nuclear', label: 'Nuclear sites', color: '#bc13fe', default: true },
            { id: 'ships', label: 'Naval traffic', color: '#ff8800', default: true },
            { id: 'air', label: 'Air traffic hubs', color: '#00ffff', default: true },
            { id: 'spaceports', label: 'Spaceports', color: '#88aaff', default: false },
        ]
    },
    {
        title: 'Infrastructure',
        layers: [
            { id: 'cables', label: 'Undersea cables', color: '#44ff88', default: false },
            { id: 'pipelines', label: 'Oil & gas pipelines', color: '#ffaa44', default: false },
            { id: 'chokepoints', label: 'Trade chokepoints', color: '#ff4488', default: true },
            { id: 'ports', label: 'Strategic ports', color: '#4488ff', default: false },
        ]
    },
    {
        title: 'Cyber & Signals',
        layers: [
            { id: 'cyber', label: 'Cyber threat IOCs', color: '#ff00ff', default: false },
            { id: 'jamming', label: 'GPS jamming zones', color: '#ff4444', default: false },
        ]
    }
];

const WAR_ROOM_DATA = {
    conflict: [
        { lat: 48.5, lng: 37.5, name: 'Eastern Ukraine', size: 1.2, color: '#ff2222' },
        { lat: 31.5, lng: 34.8, name: 'Gaza Strip', size: 1.0, color: '#ff2222' },
        { lat: 33.3, lng: 44.4, name: 'Iraq/Syria', size: 0.9, color: '#ff2222' },
        { lat: 15.5, lng: 32.5, name: 'Sudan', size: 1.0, color: '#ff2222' },
        { lat: 13.0, lng: 45.0, name: 'Yemen', size: 0.8, color: '#ff2222' },
        { lat: 23.0, lng: 121.0, name: 'Taiwan Strait', size: 0.9, color: '#ff2222' },
        { lat: 38.0, lng: 127.0, name: 'Korean DMZ', size: 0.9, color: '#ff2222' },
    ],
    intel: [
        { lat: 38.9, lng: -77.0, name: 'Washington DC', size: 0.7, color: '#ffcc00' },
        { lat: 55.75, lng: 37.6, name: 'Moscow', size: 0.7, color: '#ffcc00' },
        { lat: 39.9, lng: 116.4, name: 'Beijing', size: 0.7, color: '#ffcc00' },
        { lat: 35.7, lng: 51.4, name: 'Tehran', size: 0.7, color: '#ffcc00' },
        { lat: 28.6, lng: 77.2, name: 'New Delhi', size: 0.7, color: '#ffcc00' },
    ],
    unrest: [
        { lat: -1.3, lng: 36.8, name: 'Nairobi protests', size: 0.6, color: '#ff6600' },
        { lat: 48.85, lng: 2.35, name: 'Paris unrest', size: 0.5, color: '#ff6600' },
        { lat: -23.5, lng: -46.6, name: 'São Paulo', size: 0.5, color: '#ff6600' },
        { lat: 41.0, lng: 28.9, name: 'Istanbul', size: 0.6, color: '#ff6600' },
        { lat: 19.4, lng: -99.1, name: 'Mexico City', size: 0.5, color: '#ff6600' },
    ],
    sanctions: [
        { lat: 35.7, lng: 51.4, name: 'Iran sanctions', size: 0.8, color: '#aa44ff' },
        { lat: 39.0, lng: 125.8, name: 'DPRK sanctions', size: 0.8, color: '#aa44ff' },
        { lat: 55.75, lng: 37.6, name: 'Russia sanctions', size: 0.9, color: '#aa44ff' },
        { lat: 33.3, lng: 44.4, name: 'Syria sanctions', size: 0.7, color: '#aa44ff' },
    ],
    military: [
        { lat: 36.2, lng: -115.0, name: 'Nellis AFB', size: 0.6, color: '#00d4ff' },
        { lat: 35.5, lng: 139.7, name: 'Yokosuka Naval', size: 0.6, color: '#00d4ff' },
        { lat: 49.4, lng: 7.6, name: 'Ramstein AB', size: 0.6, color: '#00d4ff' },
        { lat: 26.3, lng: 50.6, name: 'Al Udeid AB', size: 0.6, color: '#00d4ff' },
        { lat: 21.3, lng: -157.9, name: 'Pearl Harbor', size: 0.6, color: '#00d4ff' },
        { lat: 32.7, lng: -117.2, name: 'San Diego Naval', size: 0.6, color: '#00d4ff' },
        { lat: 51.5, lng: -0.5, name: 'RAF Lakenheath', size: 0.5, color: '#00d4ff' },
        { lat: 35.9, lng: 14.5, name: 'Sigonella NAS', size: 0.5, color: '#00d4ff' },
    ],
    nuclear: [
        { lat: 40.7, lng: -74.0, name: 'Indian Point', size: 0.8, color: '#bc13fe' },
        { lat: 35.0, lng: 51.4, name: 'Natanz', size: 0.9, color: '#bc13fe' },
        { lat: 39.8, lng: 125.8, name: 'Yongbyon', size: 0.9, color: '#bc13fe' },
        { lat: 19.0, lng: 72.9, name: 'Tarapur NPP', size: 0.7, color: '#bc13fe' },
        { lat: 47.5, lng: 1.9, name: 'Belleville NPP', size: 0.7, color: '#bc13fe' },
        { lat: 34.7, lng: -118.4, name: 'Vandenberg', size: 0.8, color: '#bc13fe' },
    ],
    ships: [
        { startLat: 1.3, startLng: 103.8, endLat: 22.3, endLng: 114.2, color: '#ff8800', name: 'SG-HK Lane' },
        { startLat: 30.0, startLng: 32.5, endLat: 12.0, endLng: 43.0, color: '#ff8800', name: 'Suez Corridor' },
        { startLat: 51.9, startLng: 4.5, endLat: 40.7, endLng: -74.0, color: '#ff8800', name: 'Rotterdam-NY' },
        { startLat: 26.5, startLng: 56.0, endLat: 12.0, endLng: 43.0, color: '#ff8800', name: 'Hormuz-Suez' },
        { startLat: 35.0, startLng: 129.0, endLat: 33.7, endLng: -118.2, color: '#ff8800', name: 'Busan-LA' },
    ],
    air: [
        { lat: 25.25, lng: 55.36, name: 'DXB Hub', size: 0.5, color: '#00ffff' },
        { lat: 51.47, lng: -0.46, name: 'LHR Hub', size: 0.5, color: '#00ffff' },
        { lat: 40.64, lng: -73.78, name: 'JFK Hub', size: 0.5, color: '#00ffff' },
        { lat: 1.36, lng: 103.99, name: 'SIN Hub', size: 0.5, color: '#00ffff' },
        { lat: 28.56, lng: 77.10, name: 'DEL Hub', size: 0.5, color: '#00ffff' },
        { lat: 50.04, lng: 8.57, name: 'FRA Hub', size: 0.5, color: '#00ffff' },
    ],
    spaceports: [
        { lat: 28.5, lng: -80.6, name: 'Cape Canaveral', size: 0.7, color: '#88aaff' },
        { lat: 45.9, lng: 63.3, name: 'Baikonur', size: 0.7, color: '#88aaff' },
        { lat: 19.5, lng: -155.6, name: 'Pacific Spaceport', size: 0.6, color: '#88aaff' },
        { lat: 13.7, lng: 80.2, name: 'Sriharikota', size: 0.6, color: '#88aaff' },
    ],
    cables: [
        { startLat: 51.5, startLng: -0.1, endLat: 40.7, endLng: -74.0, color: '#44ff88', name: 'TAT-14' },
        { startLat: 1.3, startLng: 103.8, endLat: 35.7, endLng: 139.7, color: '#44ff88', name: 'SEA-ME-WE' },
        { startLat: 25.0, startLng: 55.0, endLat: 19.0, endLng: 72.9, color: '#44ff88', name: 'IMEWE' },
        { startLat: 50.1, startLng: 8.7, endLat: 22.3, endLng: 114.2, color: '#44ff88', name: 'EIG' },
    ],
    pipelines: [
        { startLat: 55.75, startLng: 37.6, endLat: 48.2, endLng: 16.4, color: '#ffaa44', name: 'Druzhba' },
        { startLat: 26.0, startLng: 50.6, endLat: 31.5, endLng: 34.8, color: '#ffaa44', name: 'Gulf-Red Sea' },
        { startLat: 57.0, startLng: 24.0, endLat: 53.5, endLng: 9.9, color: '#ffaa44', name: 'Nord Stream route' },
    ],
    chokepoints: [
        { lat: 26.5, lng: 56.5, name: 'Strait of Hormuz', size: 1.0, color: '#ff4488' },
        { lat: 12.0, lng: 43.0, name: 'Bab el-Mandeb', size: 0.9, color: '#ff4488' },
        { lat: 30.0, lng: 32.5, name: 'Suez Canal', size: 0.9, color: '#ff4488' },
        { lat: 1.2, lng: 103.8, name: 'Malacca Strait', size: 0.9, color: '#ff4488' },
        { lat: 35.0, lng: -5.5, name: 'Gibraltar', size: 0.8, color: '#ff4488' },
        { lat: 9.0, lng: -79.5, name: 'Panama Canal', size: 0.8, color: '#ff4488' },
    ],
    ports: [
        { lat: 1.26, lng: 103.8, name: 'Singapore', size: 0.6, color: '#4488ff' },
        { lat: 31.2, lng: 121.5, name: 'Shanghai', size: 0.6, color: '#4488ff' },
        { lat: 51.9, lng: 4.5, name: 'Rotterdam', size: 0.6, color: '#4488ff' },
        { lat: 25.0, lng: 55.0, name: 'Jebel Ali', size: 0.6, color: '#4488ff' },
    ],
    cyber: [
        { lat: 39.9, lng: 116.4, name: 'APT cluster — Beijing', size: 0.6, color: '#ff00ff' },
        { lat: 55.75, lng: 37.6, name: 'APT cluster — Moscow', size: 0.6, color: '#ff00ff' },
        { lat: 37.5, lng: 127.0, name: 'APT cluster — Pyongyang', size: 0.6, color: '#ff00ff' },
        { lat: 35.0, lng: 51.0, name: 'APT cluster — Tehran', size: 0.6, color: '#ff00ff' },
    ],
    jamming: [
        { lat: 35.0, lng: 36.0, name: 'E. Mediterranean jamming', maxR: 5, color: 'rgba(255,68,68,0.35)' },
        { lat: 56.0, lng: 20.0, name: 'Baltic jamming', maxR: 4, color: 'rgba(255,68,68,0.35)' },
        { lat: 26.0, lng: 50.0, name: 'Persian Gulf jamming', maxR: 5, color: 'rgba(255,68,68,0.35)' },
    ],
};

const POINT_LAYERS = ['conflict','intel','unrest','sanctions','military','nuclear','air','spaceports','chokepoints','ports','cyber','earthquakes'];
const ARC_LAYERS = ['ships','cables','pipelines'];
const RING_LAYERS = ['conflict','jamming','earthquakes'];

function buildLayerPanel() {
    const container = document.getElementById('map-layers-sidebar');
    if (!container || container.dataset.built) return;
    container.dataset.built = '1';
    container.innerHTML = '';

    LAYER_GROUPS.forEach(group => {
        const gEl = document.createElement('div');
        gEl.className = 'layer-group';
        gEl.innerHTML = `<div class="layer-group-title">${group.title}<button class="layer-group-toggle" type="button" onclick="toggleGroupLayers('${group.title}', true)">all</button></div>`;
        group.layers.forEach(layer => {
            const label = document.createElement('label');
            label.className = 'layer-item';
            label.innerHTML = `
                <input type="checkbox" data-layer="${layer.id}" ${layer.default ? 'checked' : ''}>
                <span class="layer-dot" style="background:${layer.color};box-shadow:0 0 6px ${layer.color}"></span>
                ${layer.label}
            `;
            gEl.appendChild(label);
        });
        container.appendChild(gEl);
    });

    container.querySelectorAll('input[data-layer]').forEach(cb => {
        cb.addEventListener('change', () => { updateMapLayers(); updateGlobeLayers(); updateLayerCount(); });
    });
    updateLayerCount();
}

function getActiveLayers() {
    const active = {};
    document.querySelectorAll('#map-layers-sidebar input[data-layer]').forEach(cb => {
        active[cb.dataset.layer] = cb.checked;
    });
    return active;
}

function toggleAllLayers(on) {
    document.querySelectorAll('#map-layers-sidebar input[data-layer]').forEach(cb => { cb.checked = on; });
    updateMapLayers(); updateGlobeLayers(); updateLayerCount();
}

function toggleGroupLayers(title, on) {
    const group = LAYER_GROUPS.find(g => g.title === title);
    if (!group) return;
    group.layers.forEach(l => {
        const cb = document.querySelector(`input[data-layer="${l.id}"]`);
        if (cb) cb.checked = on;
    });
    updateMapLayers(); updateGlobeLayers(); updateLayerCount();
}

function updateLayerCount() {
    const active = getActiveLayers();
    const count = Object.values(active).filter(Boolean).length;
    const el = document.getElementById('layer-count-label');
    if (el) el.textContent = `${count} layer${count !== 1 ? 's' : ''} active`;
}

function getVisiblePoints() {
    const active = getActiveLayers();
    const points = [];
    POINT_LAYERS.forEach(key => {
        if (!active[key]) return;
        if (key === 'earthquakes') { points.push(...earthquakeData); return; }
        if (WAR_ROOM_DATA[key]) points.push(...WAR_ROOM_DATA[key]);
    });
    return points;
}

function getVisibleArcs() {
    const active = getActiveLayers();
    const arcs = [];
    ARC_LAYERS.forEach(key => { if (active[key] && WAR_ROOM_DATA[key]) arcs.push(...WAR_ROOM_DATA[key]); });
    return arcs;
}

function getVisibleRings() {
    const active = getActiveLayers();
    const rings = [];
    if (active.conflict) {
        WAR_ROOM_DATA.conflict.forEach(p => rings.push({
            lat: p.lat, lng: p.lng, maxR: 4, propagationSpeed: 2, repeatPeriod: 1200, color: 'rgba(255,0,0,0.35)'
        }));
    }
    if (active.jamming) rings.push(...WAR_ROOM_DATA.jamming.map(j => ({ ...j, propagationSpeed: 1.5, repeatPeriod: 1500 })));
    if (active.earthquakes) {
        earthquakeData.forEach(eq => rings.push({
            lat: eq.lat, lng: eq.lng, maxR: eq.mag || 3, propagationSpeed: 3, repeatPeriod: 800, color: 'rgba(255,170,0,0.4)'
        }));
    }
    return rings;
}

// ═══════════════════════════════════════════════════════════
// BOOT & NEURAL BG
// ═══════════════════════════════════════════════════════════

const bootMessages = [
    "Loading global fault line data…",
    "Connecting live conflict feeds…",
    "Syncing market sensors…",
    "Preparing war room layers…",
    "Briefing room ready."
];

function startBoot() {
    const btn = document.getElementById('init-btn');
    const logs = document.getElementById('boot-logs');
    const bar = document.getElementById('progress-bar');
    const title = document.getElementById('typewriter-title');
    btn.style.display = 'none';
    const fullText = "Fault Lines Capital";

    let ci = 0;
    const ti = setInterval(() => {
        title.innerText = fullText.substring(0, ++ci);
        if (ci >= fullText.length) clearInterval(ti);
    }, 80);

    let mi = 0;
    const li = setInterval(() => {
        const p = document.createElement('p');
        p.innerText = bootMessages[mi];
        logs.appendChild(p);
        bar.style.width = (++mi / bootMessages.length * 100) + '%';
        if (mi >= bootMessages.length) { clearInterval(li); setTimeout(executeEntrance, 800); }
    }, 500);
}

function executeEntrance() {
    const splash = document.getElementById('splash-screen');
    splash.classList.add('splash-exit');
    document.body.classList.remove('locked');
    setTimeout(() => {
        splash.style.display = 'none';
        initNeuralBg();
        switchTab('ai', document.querySelector('.nav-item.active'));
    }, 900);
}

const ctx = bgCanvas.getContext('2d');
let particles = [];

function initNeural() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3
    }));
    animateNeural();
}

function animateNeural() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    ctx.fillStyle = 'rgba(100,255,218,0.6)';
    ctx.strokeStyle = 'rgba(100,255,218,0.06)';
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > bgCanvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > bgCanvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            if (Math.hypot(p.x - p2.x, p.y - p2.y) < 120) {
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }
        }
    });
    requestAnimationFrame(animateNeural);
}

function initNeuralBg() { initNeural(); }

// ═══════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════

async function switchTab(type, element, direction) {
    document.getElementById('nav-links')?.classList.remove('open');

    const overlay = document.getElementById('transition-overlay');
    const globeCanvas = document.getElementById('trans-globe');
    const dir = direction !== undefined ? direction : 1;

    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    drawTransitionGlobe(globeCanvas, dir);

    setTimeout(async () => {
        try {
            document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            element.classList.add('active');
            currentTabIndex = tabs.indexOf(type);

            if (type === 'ai') {
                document.getElementById('ai-view').classList.remove('hidden');
                loadHomeFeed();
            } else if (type === 'geopolitics') {
                document.getElementById('geopolitics-view').classList.remove('hidden');
                const posts = await loadPosts();
                renderFeed('geo-feed', posts.filter(p => p.category === 'geopolitics'));
                startLiveNewsFeed();
            } else if (type === 'finance') {
                document.getElementById('finance-view').classList.remove('hidden');
                initCharts();
                startMarketSensors();
                const posts = await loadPosts();
                renderFeed('fin-feed', posts.filter(p => p.category === 'finance'));
            } else if (type === 'map') {
                document.getElementById('map-view').classList.remove('hidden');
                buildLayerPanel();
                await fetchEarthquakes();
                initMap();
                setTimeout(() => {
                    if (map) map.invalidateSize();
                    if (mapMode === '3d') initWarRoomGlobe();
                }, 300);
            }
        } catch (e) { console.error('Tab error:', e); }
        finally {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 400);
        }
    }, 600);
}

function drawTransitionGlobe(canvas, direction) {
    if (!canvas) return;
    const tctx = canvas.getContext('2d');
    canvas.width = 300; canvas.height = 300;
    const cx = 150, cy = 150, r = 120;
    let angle = 0;
    const speed = 0.08 * (direction || 1);

    function render() {
        if (canvas.closest('#transition-overlay').style.display === 'none') return;
        tctx.clearRect(0, 0, 300, 300);
        angle += speed;
        tctx.strokeStyle = 'rgba(100,255,218,0.25)';
        tctx.lineWidth = 0.7;
        for (let lat = -60; lat <= 60; lat += 30) {
            const ry = r * Math.sin(lat * Math.PI / 180);
            const rx = r * Math.cos(lat * Math.PI / 180);
            tctx.beginPath(); tctx.ellipse(cx, cy + ry, rx, rx * 0.15, 0, 0, Math.PI * 2); tctx.stroke();
        }
        for (let lon = 0; lon < 360; lon += 30) {
            const a = (lon * Math.PI / 180) + angle;
            tctx.beginPath(); tctx.ellipse(cx, cy, r * Math.abs(Math.cos(a)), r, 0, 0, Math.PI * 2); tctx.stroke();
        }
        requestAnimationFrame(render);
    }
    render();
}

// ═══════════════════════════════════════════════════════════
// BLOG / POSTS
// ═══════════════════════════════════════════════════════════

async function loadPosts() {
    if (ALL_POSTS_CACHE.length) return ALL_POSTS_CACHE;
    try {
        const res = await fetch('posts.json');
        ALL_POSTS_CACHE = await res.json();
    } catch (e) { console.error('Posts load error:', e); ALL_POSTS_CACHE = []; }
    return ALL_POSTS_CACHE;
}

function makeCardHTML(post, featured = false) {
    const cat = post.category === 'geopolitics' ? 'Geopolitics' : post.category === 'finance' ? 'Finance' : post.category;
    const readMin = post.content ? Math.max(3, Math.round(post.content.split(' ').length / 200)) : 5;
    return `
        <div class="card-category">${cat}</div>
        <h${featured ? '2' : '3'}>${post.title}</h${featured ? '2' : '3'}>
        <p>${post.excerpt}</p>
        <div class="card-footer">
            <span><strong>${post.author || 'Editorial'}</strong> · ${post.date}</span>
            <span>${readMin} min read</span>
            ${featured ? '<span class="read-link">Read briefing →</span>' : ''}
        </div>
    `;
}

async function loadHomeFeed() {
    const posts = await loadPosts();
    const geoPosts = posts.filter(p => p.category === 'geopolitics');
    const allSorted = [...posts].sort((a, b) => (b.id || 0) - (a.id || 0));

    const featured = document.getElementById('featured-article');
    const featuredPost = geoPosts[0] || allSorted[0];
    if (featured && featuredPost) {
        featured.innerHTML = makeCardHTML(featuredPost, true);
        featured.onclick = () => openArticle(featuredPost);
    }

    const homeFeed = document.getElementById('home-feed');
    const countEl = document.getElementById('home-post-count');
    if (countEl) countEl.textContent = `${allSorted.length} articles`;
    if (homeFeed && homeFeed.children.length === 0) {
        allSorted.forEach((post, i) => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = makeCardHTML(post);
            card.onclick = () => openArticle(post);
            homeFeed.appendChild(card);
            setTimeout(() => card.classList.add('reveal'), i * 80);
        });
    }
}

function renderFeed(id, posts) {
    const feed = document.getElementById(id);
    if (!feed || feed.children.length > 0) return;
    posts.forEach((post, i) => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = makeCardHTML(post);
        card.onclick = () => openArticle(post);
        feed.appendChild(card);
        setTimeout(() => card.classList.add('reveal'), i * 80);
    });
}

function openArticle(post) {
    if (!post) return;
    const viewer = document.getElementById('article-viewer');
    const articleReader = document.getElementById('article-reader');
    const isPdf = post.file?.endsWith('.pdf');

    document.body.style.overflow = 'hidden';
    viewer.style.display = 'block';
    viewer.classList.add('active');
    viewer.classList.toggle('viewer--pdf', isPdf);

    document.getElementById('art-title').innerText = post.title;
    document.getElementById('art-category').innerText = (post.category || '').toUpperCase();
    document.getElementById('art-date').innerText = post.date;
    document.getElementById('art-author-line').innerHTML =
        `By <strong>${post.author || 'Editorial'}</strong>${post.role ? ` · ${post.role}` : ''}`;

    const body = document.getElementById('art-body');
    body.className = isPdf ? 'art-body pdf-body' : 'art-body prose';

    if (isPdf) {
        articleReader?.classList.remove('has-watermark');
        renderPdfDocument(post.file, body);
    } else if (post.content) {
        articleReader?.classList.add('has-watermark');
        body.innerHTML = post.content.split('\n').map(p =>
            p.trim() ? `<p>${p}</p>` : ''
        ).join('');
    } else if (post.file) {
        articleReader?.classList.add('has-watermark');
        fetch(post.file).then(r => r.text()).then(h => { body.innerHTML = h; });
    } else {
        articleReader?.classList.add('has-watermark');
        body.innerHTML = `<p>${post.excerpt}</p>`;
    }
}

async function renderPdfDocument(url, container) {
    container.innerHTML = `
        <div class="pdf-wrapper">
            <div class="pdf-toolbar">
                <a class="pdf-open-native" href="${url}" target="_blank" rel="noopener">↗ Open in browser</a>
                <span class="pdf-page-count" id="pdf-page-count">Loading…</span>
            </div>
            <div class="pdf-pages" id="pdf-pages"><div class="pdf-loading">Rendering document…</div></div>
        </div>`;

    const pagesEl = document.getElementById('pdf-pages');
    const countEl = document.getElementById('pdf-page-count');

    if (typeof pdfjsLib === 'undefined') {
        pagesEl.innerHTML = `<iframe src="${url}" width="100%" style="min-height:80vh;border:none;border-radius:8px;background:#fff"></iframe>`;
        if (countEl) countEl.textContent = 'Scroll to read';
        return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        pagesEl.innerHTML = '';
        if (countEl) countEl.textContent = `${pdf.numPages} page${pdf.numPages !== 1 ? 's' : ''} — scroll to read`;

        const scale = window.innerWidth < 640 ? 1.15 : window.innerWidth < 900 ? 1.35 : 1.5;

        for (let n = 1; n <= pdf.numPages; n++) {
            const page = await pdf.getPage(n);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.className = 'pdf-page-canvas';
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            pagesEl.appendChild(canvas);
        }
    } catch (e) {
        console.error('PDF render error:', e);
        pagesEl.innerHTML = `
            <div class="pdf-loading">Could not render inline. Use the button above to open the full PDF.</div>
            <iframe src="${url}" width="100%" style="min-height:70vh;border:none;border-radius:8px;background:#fff"></iframe>`;
        if (countEl) countEl.textContent = 'Tap link above';
    }
}

function closeArticle() {
    const viewer = document.getElementById('article-viewer');
    document.getElementById('article-reader')?.classList.remove('has-watermark');
    viewer.classList.remove('active', 'viewer--pdf');
    viewer.style.display = 'none';
    document.body.style.overflow = '';
    document.getElementById('art-body').innerHTML = '';
}

// ═══════════════════════════════════════════════════════════
// WAR NEWS FILTER
// ═══════════════════════════════════════════════════════════

const WAR_KEYWORDS = [
    'war','conflict','military','invasion','strike','missile','troops','army','nato',
    'ukraine','gaza','israel','palestine','iran','houthi','ceasefire','artillery',
    'drone','defense','defence','pentagon','weapons','sanctions','hostage','battle',
    'frontline','airstrike','bombardment','nuclear','hamas','hezbollah','taliban',
    'korea','taiwan','hormuz','syria','yemen','sudan','russia','putin','zelensky',
    'idf','shelling','rocket','fighter','naval','submarine','carrier','mobilization',
    'killed','casualties','occupation','insurgent','terror','militia','coup','rebel',
    'armed','combat','offensive','siege','bombing','warplane','battalion','regime',
    'red sea','middle east','defence','defense minister','armed forces','war crime'
];

const NEWS_FEEDS = [
    { source: 'WAR DESK', url: 'https://news.google.com/rss/search?q=war+OR+conflict+OR+military+OR+strike+when:1d&hl=en-US&gl=US&ceid=US:en' },
    { source: 'CNN', url: 'https://news.google.com/rss/search?q=site:cnn.com+(war+OR+conflict+OR+military)&hl=en-US&gl=US&ceid=US:en' },
    { source: 'AL JAZEERA', url: 'https://news.google.com/rss/search?q=site:aljazeera.com+(war+OR+conflict+OR+military)&hl=en-US&gl=US&ceid=US:en' },
];

const CACHE_TTL_MS = 90000;

function getCache(key) {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        return Date.now() - ts < CACHE_TTL_MS ? data : null;
    } catch { return null; }
}

function setCache(key, data) {
    try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
}

function isWarNews(title, desc = '') {
    const text = (title + ' ' + desc).toLowerCase();
    return WAR_KEYWORDS.some(kw => text.includes(kw));
}

async function fetchViaProxy(url, timeoutMs = 6000) {
    const builders = [
        u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    ];

    const fetchOne = async (build) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
            const res = await fetch(build(url), { signal: ctrl.signal });
            if (!res.ok) throw new Error('bad status');
            const text = await res.text();
            if (!text || text.includes('Access Denied')) throw new Error('blocked');
            return text;
        } finally { clearTimeout(timer); }
    };

    const results = await Promise.allSettled(builders.map(fetchOne));
    for (const r of results) if (r.status === 'fulfilled') return r.value;
    throw new Error('Proxy failed');
}

function parseRSS(xmlText) {
    const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
    return Array.from(xml.querySelectorAll('item')).map(item => ({
        title: item.querySelector('title')?.textContent?.trim() || '',
        link: item.querySelector('link')?.textContent?.trim() || '',
        desc: item.querySelector('description')?.textContent?.trim() || '',
        date: new Date(item.querySelector('pubDate')?.textContent || Date.now()),
    })).filter(i => i.link && i.title);
}

async function fetchAllNews() {
    const results = await Promise.allSettled(
        NEWS_FEEDS.map(async (feed) => {
            const items = parseRSS(await fetchViaProxy(feed.url, 5000))
                .filter(i => isWarNews(i.title, i.desc))
                .map(i => ({ ...i, source: feed.source }));
            return items;
        })
    );

    const seen = new Set();
    const all = [];
    results.forEach(r => {
        if (r.status !== 'fulfilled') return;
        r.value.forEach(item => {
            if (seen.has(item.link)) return;
            seen.add(item.link);
            all.push(item);
        });
    });

    const sorted = all.sort((a, b) => b.date - a.date);
    if (sorted.length) setCache('flc_news', sorted);
    return sorted;
}

function renderNewsItems(items) {
    const feed = document.getElementById('geo-news-feed');
    if (!feed || !items.length) return;
    feed.querySelector('.news-empty')?.remove();
    items.slice(0, 20).forEach(item => { if (!seenNewsLinks.has(item.link)) addNewsItem(item); });
}

function formatNewsTime(date) {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false, day: '2-digit', month: 'short'
    }).format(date);
}

function addNewsItem(item) {
    const feed = document.getElementById('geo-news-feed');
    if (!feed || seenNewsLinks.has(item.link)) return;
    seenNewsLinks.add(item.link);

    const el = document.createElement('div');
    el.className = 'geo-news-item';
    const srcClass = item.source === 'CNN' ? 'source-cnn' : item.source === 'AL JAZEERA' ? 'source-aj' : 'source-war';
    el.innerHTML = `
        <span class="geo-time">${formatNewsTime(item.date)}</span>
        <span class="geo-region ${srcClass}">${item.source}</span>
        <a class="geo-link" href="${item.link}" target="_blank" rel="noopener">${item.title}</a>
    `;
    feed.insertBefore(el, feed.firstChild);
    while (feed.children.length > 25) {
        const last = feed.lastChild;
        const link = last.querySelector('.geo-link');
        if (link) seenNewsLinks.delete(link.href);
        feed.removeChild(last);
    }
}

async function refreshLiveNews() {
    const status = document.getElementById('news-sync-status');
    const feed = document.getElementById('geo-news-feed');

    const cached = getCache('flc_news');
    if (cached?.length && feed && !feed.querySelector('.geo-news-item')) {
        renderNewsItems(cached);
        if (status) { status.textContent = `${cached.length} headlines (cached)`; status.classList.add('synced'); }
    }

    try {
        const items = await fetchAllNews();
        if (items.length === 0) {
            if (feed && !feed.querySelector('.geo-news-item')) {
                feed.innerHTML = '<div class="news-empty">No war headlines right now. Refreshing every 2 min.</div>';
            }
            if (status) status.textContent = 'No matches';
            return;
        }
        renderNewsItems(items);
        if (status) { status.textContent = `${items.length} war headlines`; status.classList.add('synced'); }
    } catch (e) {
        console.error('News error:', e);
        if (status && !feed?.querySelector('.geo-news-item')) status.textContent = 'Retrying…';
    }
}

function startLiveNewsFeed() {
    if (liveNewsStarted) { refreshLiveNews(); return; }
    liveNewsStarted = true;
    const feed = document.getElementById('geo-news-feed');
    const cached = getCache('flc_news');
    if (cached?.length) {
        renderNewsItems(cached);
        document.getElementById('news-sync-status').textContent = `${cached.length} headlines`;
        document.getElementById('news-sync-status')?.classList.add('synced');
    } else if (feed) {
        feed.innerHTML = '<div class="news-empty">Loading war headlines…</div>';
    }
    refreshLiveNews();
    newsPollTimer = setInterval(refreshLiveNews, 120000);
}

// ═══════════════════════════════════════════════════════════
// MARKETS
// ═══════════════════════════════════════════════════════════

const stockAssets = [
    { id: 'gold', label: 'Gold (XAU)', symbol: 'GC=F' },
    { id: 'btc', label: 'Bitcoin', symbol: 'bitcoin', type: 'crypto' },
    { id: 'usdinr', label: 'USD/INR', symbol: 'USDINR', type: 'forex' },
    { id: 'sp500', label: 'S&P 500', symbol: '^GSPC' },
    { id: 'oil', label: 'Brent Oil', symbol: 'BZ=F' },
    { id: 'nasdaq', label: 'NASDAQ', symbol: '^NDX' },
];

const YAHOO_SYMBOLS = { gold: 'GC=F', sp500: '^GSPC', oil: 'BZ=F', nasdaq: '^NDX' };

async function fetchYahooBatch() {
    const symList = Object.values(YAHOO_SYMBOLS).map(encodeURIComponent).join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symList}`;
    const data = JSON.parse(await fetchViaProxy(url, 7000));
    const map = {};
    (data.quoteResponse?.result || []).forEach(q => {
        map[q.symbol] = {
            price: q.regularMarketPrice,
            prev: q.regularMarketPreviousClose || q.regularMarketPrice,
        };
    });
    return map;
}

async function fetchCryptoPrice() {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    const d = await res.json();
    return { price: d.bitcoin.usd, prev: d.bitcoin.usd / (1 + (d.bitcoin.usd_24h_change || 0) / 100) };
}

async function fetchForexUSDINR() {
    try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
        const d = await res.json();
        return { price: d.rates.INR, prev: d.rates.INR };
    } catch (_) {
        const map = await fetchYahooBatch();
        const q = map['USDINR=X'] || map['INR=X'];
        if (q) return q;
        throw new Error('forex failed');
    }
}

function applyMarketQuote(assetId, r, el) {
    if (!el || !r) return;
    const prev = parseFloat(el.dataset.prev) || r.prev;
    const change = r.price - prev;
    el.dataset.prev = r.price;
    const priceEl = el.querySelector('.price');
    const changeEl = el.querySelector('.change');
    const dec = assetId === 'btc' ? 0 : 2;
    priceEl.textContent = r.price.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const pct = prev ? ((change / prev) * 100).toFixed(2) : '0.00';
    changeEl.textContent = `${change >= 0 ? '+' : ''}${pct}%`;
    changeEl.className = `change ${change >= 0 ? 'stock-up' : 'stock-down'}`;
    el.classList.add(change >= 0 ? 'flash-up' : 'flash-down');
    setTimeout(() => el.classList.remove('flash-up', 'flash-down'), 600);
}

async function fetchAllMarketData() {
    const [cryptoR, forexR, yahooR] = await Promise.allSettled([
        fetchCryptoPrice(),
        fetchForexUSDINR(),
        fetchYahooBatch(),
    ]);

    const data = {};
    if (cryptoR.status === 'fulfilled') data.btc = cryptoR.value;
    if (forexR.status === 'fulfilled') data.usdinr = forexR.value;
    if (yahooR.status === 'fulfilled') {
        const y = yahooR.value;
        if (y['GC=F']) data.gold = y['GC=F'];
        if (y['^GSPC']) data.sp500 = y['^GSPC'];
        if (y['BZ=F']) data.oil = y['BZ=F'];
        if (y['^NDX']) data.nasdaq = y['^NDX'];
    }
    if (Object.keys(data).length) setCache('flc_markets', data);
    return data;
}

function renderMarketData(data) {
    Object.entries(data).forEach(([id, r]) => {
        applyMarketQuote(id, r, document.getElementById(`stock-${id}`));
    });
}

async function refreshMarketData() {
    const status = document.getElementById('market-sync-status');
    const cached = getCache('flc_markets');

    try {
        const data = await fetchAllMarketData();
        renderMarketData(data);
        if (status) { status.textContent = 'Live'; status.classList.add('synced'); }
    } catch (e) {
        console.error('Market error:', e);
        if (cached) renderMarketData(cached);
        if (status) status.textContent = cached ? 'Cached' : 'Retrying…';
    }
}

function startMarketSensors() {
    const grid = document.getElementById('fin-stock-grid');
    if (!grid) return;
    if (!marketSensorsStarted) {
        marketSensorsStarted = true;
        stockAssets.forEach(a => {
            const div = document.createElement('div');
            div.className = 'stock-item';
            div.id = `stock-${a.id}`;
            div.innerHTML = `<span class="stock-label">${a.label}</span><div class="stock-values"><span class="price">—</span><span class="change">—</span></div>`;
            grid.appendChild(div);
        });
    }
    const cached = getCache('flc_markets');
    if (cached) {
        renderMarketData(cached);
        document.getElementById('market-sync-status').textContent = 'Updating…';
        document.getElementById('market-sync-status')?.classList.add('synced');
    }
    refreshMarketData();
    if (!marketPollTimer) marketPollTimer = setInterval(refreshMarketData, 30000);
}

function initCharts() {
    if (chartsInitialized || typeof TradingView === 'undefined') return;
    chartsInitialized = true;
    new TradingView.widget({ width: '100%', height: '100%', symbol: 'TVC:GOLD', interval: 'D', timezone: 'Asia/Kolkata', theme: 'dark', container_id: 'tv_chart1' });
    new TradingView.widget({ width: '100%', height: '100%', symbol: 'FX:USDINR', interval: 'D', timezone: 'Asia/Kolkata', theme: 'dark', container_id: 'tv_chart2' });
}

// ═══════════════════════════════════════════════════════════
// EARTHQUAKES (USGS live)
// ═══════════════════════════════════════════════════════════

async function fetchEarthquakes() {
    try {
        const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
        const data = await res.json();
        earthquakeData = data.features.map(f => ({
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            name: f.properties.title,
            size: Math.min(1.5, f.properties.mag / 5),
            mag: f.properties.mag,
            color: f.properties.mag >= 6 ? '#ff4400' : '#ffaa00',
        }));
        updateMapLayers();
        updateGlobeLayers();
    } catch (e) { console.warn('USGS error:', e); }
}

// ═══════════════════════════════════════════════════════════
// WAR ROOM MAP
// ═══════════════════════════════════════════════════════════

function initMap() {
    if (map) { setTimeout(() => map.invalidateSize(), 200); return; }

    map = L.map('map-canvas', { center: [25, 20], zoom: 2, zoomControl: true, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);

    mapLayerGroups = {};
    const allLayerIds = [...POINT_LAYERS.filter(l => l !== 'earthquakes'), ...ARC_LAYERS];

    allLayerIds.forEach(key => {
        mapLayerGroups[key] = L.layerGroup();
        if (!WAR_ROOM_DATA[key]) return;

        if (ARC_LAYERS.includes(key)) {
            WAR_ROOM_DATA[key].forEach(route => {
                L.polyline([[route.startLat, route.startLng], [route.endLat, route.endLng]], {
                    color: route.color, weight: 2, opacity: 0.75, dashArray: '6 4'
                }).bindPopup(`<b>${route.name}</b>`).addTo(mapLayerGroups[key]);
            });
        } else {
            WAR_ROOM_DATA[key].forEach(p => {
                L.circleMarker([p.lat, p.lng], {
                    color: p.color, fillColor: p.color, fillOpacity: 0.8,
                    radius: (p.size || 0.5) * 8, weight: 2
                }).bindPopup(`<b>${p.name}</b>`).addTo(mapLayerGroups[key]);
            });
        }
    });

    mapLayerGroups.earthquakes = L.layerGroup();
    updateEarthquakeMarkers();

    const active = getActiveLayers();
    Object.keys(mapLayerGroups).forEach(key => {
        if (active[key] !== false) mapLayerGroups[key].addTo(map);
    });
}

function updateEarthquakeMarkers() {
    if (!mapLayerGroups.earthquakes) return;
    mapLayerGroups.earthquakes.clearLayers();
    earthquakeData.forEach(eq => {
        L.circleMarker([eq.lat, eq.lng], {
            color: eq.color, fillColor: eq.color, fillOpacity: 0.9,
            radius: eq.mag * 2, weight: 2
        }).bindPopup(`<b>${eq.name}</b><br>Magnitude ${eq.mag}`).addTo(mapLayerGroups.earthquakes);
    });
}

function updateMapLayers() {
    if (!map) return;
    updateEarthquakeMarkers();
    const active = getActiveLayers();
    Object.keys(mapLayerGroups).forEach(key => {
        if (active[key]) { if (!map.hasLayer(mapLayerGroups[key])) map.addLayer(mapLayerGroups[key]); }
        else { if (map.hasLayer(mapLayerGroups[key])) map.removeLayer(mapLayerGroups[key]); }
    });
    updateLayerCount();
}

function toggleMapMode(mode) {
    mapMode = mode;
    const mapEl = document.getElementById('map-canvas');
    const globeEl = document.getElementById('war-room-globe');
    const btn2d = document.getElementById('btn-2d');
    const btn3d = document.getElementById('btn-3d');
    const label = document.getElementById('map-mode-label');

    if (mode === '2d') {
        mapEl.classList.remove('map-mode-hidden');
        mapEl.classList.add('map-mode-active');
        globeEl.classList.remove('map-mode-active');
        globeEl.classList.add('map-mode-hidden');
        btn2d.classList.add('active'); btn3d.classList.remove('active');
        if (label) label.textContent = '2D tactical view';
        setTimeout(() => map?.invalidateSize(), 200);
    } else {
        mapEl.classList.remove('map-mode-active');
        mapEl.classList.add('map-mode-hidden');
        globeEl.classList.remove('map-mode-hidden');
        globeEl.classList.add('map-mode-active');
        btn2d.classList.remove('active'); btn3d.classList.add('active');
        if (label) label.textContent = '3D strategic globe';
        initWarRoomGlobe();
    }
}

function initWarRoomGlobe() {
    const el = document.getElementById('war-room-globe');
    if (!el || typeof Globe === 'undefined') return;

    if (!warRoomGlobe) {
        warRoomGlobe = Globe()(el)
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundColor('rgba(5,10,20,0)')
            .showAtmosphere(true).atmosphereColor('#64ffda').atmosphereAltitude(0.15)
            .pointLat('lat').pointLng('lng').pointColor('color')
            .pointAltitude(d => (d.size || 0.5) * 0.06)
            .pointRadius(d => (d.size || 0.5) * 0.35)
            .pointLabel(d => d.name || '')
            .arcStartLat('startLat').arcStartLng('startLng')
            .arcEndLat('endLat').arcEndLng('endLng')
            .arcColor(d => [d.color, d.color])
            .arcAltitude(0.12).arcStroke(0.5)
            .arcDashLength(0.4).arcDashGap(0.3).arcDashAnimateTime(3000)
            .ringLat('lat').ringLng('lng').ringColor('color')
            .ringMaxRadius('maxR').ringPropagationSpeed('propagationSpeed').ringRepeatPeriod('repeatPeriod');
        warRoomGlobe.controls().autoRotate = true;
        warRoomGlobe.controls().autoRotateSpeed = 0.35;
    }
    warRoomGlobe.width(el.clientWidth).height(el.clientHeight);
    updateGlobeLayers();
}

function updateGlobeLayers() {
    if (!warRoomGlobe) return;
    warRoomGlobe.pointsData(getVisiblePoints()).arcsData(getVisibleArcs()).ringsData(getVisibleRings());
    updateLayerCount();
}

// ═══════════════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════════════

function updateClock() {
    const opts = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true };
    const clock = document.getElementById('live-clock');
    if (clock) clock.textContent = new Intl.DateTimeFormat('en-IN', opts).format(new Date()) + ' IST';
}

window.onload = () => {
    setInterval(updateClock, 1000);
    updateClock();
    prefetchLiveData();
};

function prefetchLiveData() {
    fetchAllNews().then(items => {
        if (items.length) setCache('flc_news', items);
    }).catch(() => {});
    fetchAllMarketData().then(data => {
        if (Object.keys(data).length) setCache('flc_markets', data);
    }).catch(() => {});
};
