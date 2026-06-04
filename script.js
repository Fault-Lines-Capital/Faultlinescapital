let map;
const tabs = ['ai', 'geopolitics', 'finance', 'map'];
let currentTabIndex = 0;

// ==========================================
// CURSOR & PARALLAX
// ==========================================
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
const bgCanvas = document.getElementById('neural-canvas');

window.addEventListener('mousemove', (e) => {
dot.style.left = e.clientX + 'px';
dot.style.top = e.clientY + 'px';
setTimeout(() => {
ring.style.left = (e.clientX - 12) + 'px';
ring.style.top = (e.clientY - 12) + 'px';
}, 50);
const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
bgCanvas.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

// ==========================================
// CINEMATIC BOOT & ENTRANCE
// ==========================================
const bootMessages = [
"Establishing secure connection...",
"Loading Global Fault Line Data...",
"Connecting to Finance Database...",
"Authenticating Security Clearance...",
"Bypassing Firewalls...",
"System Online. Welcome, Operator."
];

function startBoot() {
const btn = document.getElementById('init-btn');
const logs = document.getElementById('boot-logs');
const bar = document.getElementById('progress-bar');
const title = document.getElementById('typewriter-title');
const fullText = "FAULT LINES CAPITAL";

btn.style.display = 'none';

let charIndex = 0;
const typeInterval = setInterval(() => {
if (Math.random() > 0.8) {
title.innerText = fullText.substring(0, charIndex) + String.fromCharCode(33 + Math.random() * 40);
} else {
title.innerText = fullText.substring(0, charIndex);
}
charIndex++;
if (charIndex > fullText.length) {
clearInterval(typeInterval);
title.innerText = fullText;
}
}, 100);

let msgIndex = 0;
const logInterval = setInterval(() => {
const p = document.createElement('p');
p.innerText = `> ${bootMessages[msgIndex]}`;
logs.appendChild(p);
msgIndex++;
bar.style.width = (msgIndex / bootMessages.length * 100) + '%';
if (msgIndex === bootMessages.length) {
clearInterval(logInterval);
setTimeout(executeEntrance, 1000);
}
}, 600);
}

function executeEntrance() {
const splashLogo = document.getElementById('splash-logo');
const splash = document.getElementById('splash-screen');

// ANIMATION: Shrink logo and move to AI Hub position
splashLogo.style.transition = "all 1s cubic-bezier(0.7, 0, 0.3, 1)";
splashLogo.style.transform = "translate(300px, 100px) scale(0.3)";
splashLogo.style.opacity = "0";

setTimeout(() => {
splash.classList.add('splash-exit');
document.body.classList.remove('locked');
setTimeout(() => {
splash.style.display = 'none';
initNeuralBg();
switchTab('ai', document.querySelector('.nav-item.active'));
}, 1000);
}, 1000);
}

// ==========================================
// NEURAL BG & GLOBE
// ==========================================
const ctx = bgCanvas.getContext('2d');
let particles = [];

function initNeural() {
bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;
particles = [];
for (let i = 0; i < 80; i++) {
particles.push({
x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height,
vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
});
}
animateNeural();
}

function animateNeural() {
ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
ctx.fillStyle = '#64ffda';
ctx.strokeStyle = 'rgba(100, 255, 218, 0.1)';
particles.forEach((p, i) => {
p.x += p.vx; p.y += p.vy;
if (p.x < 0 || p.x > bgCanvas.width) p.vx *= -1;
if (p.y < 0 || p.y > bgCanvas.height) p.vy *= -1;
ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
for (let j = i + 1; j < particles.length; j++) {
const p2 = particles[j];
if (Math.hypot(p.x - p2.x, p.y - p2.y) < 150) {
ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
}
}
});
requestAnimationFrame(animateNeural);
}

function drawGlobe() {
const gC = document.getElementById('globe-canvas');
if (!gC) return;
const gCtx = gC.getContext('2d');
let angle = 0;
function render() {
gCtx.clearRect(0, 0, 600, 600);
const cx = 300, cy = 300, r = 220;
angle += 0.003;
gCtx.strokeStyle = 'rgba(14,240,228,0.3)';
gCtx.lineWidth = 0.8;
for (let lat = -80; lat <= 80; lat += 20) {
const lr = r * Math.cos(lat * Math.PI / 180);
const ly = cy + r * Math.sin(lat * Math.PI / 180);
gCtx.beginPath(); gCtx.ellipse(cx, ly, lr, lr * 0.18, 0, 0, Math.PI * 2); gCtx.stroke();
}
for (let lon = 0; lon < 180; lon += 20) {
const a = (lon + angle * 180 / Math.PI) * Math.PI / 180;
gCtx.beginPath(); gCtx.ellipse(cx, cy, r * Math.abs(Math.cos(a)), r, 0, 0, Math.PI * 2); gCtx.stroke();
}
requestAnimationFrame(render);
}
render();
}

// ==========================================
// TAB TRANSITION (Rotating Globe)
// ==========================================

async function switchTab(type, element, direction) {
const overlay = document.getElementById('transition-overlay');
const globeCanvas = document.getElementById('trans-globe');
const dir = direction !== undefined ? direction : 1;

overlay.style.display = 'flex';
overlay.style.opacity = '1';
drawTransitionGlobe(globeCanvas, dir);

setTimeout(async () => {
try {
// 1. Hide all sections and reset nav items
document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

// 2. Activate current tab
element.classList.add('active');
currentTabIndex = tabs.indexOf(type);

if (type === 'ai') {
document.getElementById('ai-view').classList.remove('hidden');
document.getElementById('current-tab-title').innerText = "AI INTELLIGENCE HUB";
drawGlobe();
}
else if (type === 'geopolitics') {
document.getElementById('geopolitics-view').classList.remove('hidden');
document.getElementById('current-tab-title').innerText = "GEOPOLITICAL DATABASE";
loadPosts().then(posts => {
renderFeed('geo-feed', posts.filter(p => p.category === 'geopolitics'));
});
startGeoFeed();
}
else if (type === 'finance') {
document.getElementById('finance-view').classList.remove('hidden');
document.getElementById('current-tab-title').innerText = "FINANCIAL DATABASE";
initCharts();
startMarketSensors();
loadPosts().then(posts => {
renderFeed('fin-feed', posts.filter(p => p.category === 'finance'));
});
}
else if (type === 'map') {
document.getElementById('map-view').classList.remove('hidden');
document.getElementById('current-tab-title').innerText = "STRATEGIC WAR ROOM";
initMap();
}
} catch (e) {
console.error("Tab Error:", e);
} finally {
overlay.style.opacity = '0';
setTimeout(() => {
overlay.style.display = 'none';
}, 500);
}
}, 800);
}



let transGlobeDir = 1; // 1 = right, -1 = left
let transGlobeRAF = null;

function drawTransitionGlobe(canvas, direction) {
if (transGlobeRAF) cancelAnimationFrame(transGlobeRAF);
transGlobeDir = direction || 1;
const ctx = canvas.getContext('2d');
canvas.width = 400; canvas.height = 400;
const cx = 200, cy = 200, r = 160;
let angle = 0;
const speed = 0.09 * transGlobeDir;

// Direction hint text
const hint = document.getElementById('trans-hint');
if (hint) hint.textContent = transGlobeDir > 0 ? '▶ NAVIGATING RIGHT' : '◀ NAVIGATING LEFT';

function render() {
if (canvas.closest('#transition-overlay').style.display === 'none') return;
ctx.clearRect(0, 0, 400, 400);
angle += speed;

// Outer glow rim
const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r);
rimGrad.addColorStop(0, 'transparent');
rimGrad.addColorStop(1, 'rgba(100,255,218,0.12)');
ctx.fillStyle = rimGrad;
ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

// Clip to sphere
ctx.save();
ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

// Latitude lines
ctx.lineWidth = 0.7;
for (let lat = -80; lat <= 80; lat += 20) {
const ry = r * Math.sin(lat * Math.PI / 180);
const rx = r * Math.cos(lat * Math.PI / 180);
const fade = Math.max(0.05, Math.abs(Math.cos(lat * Math.PI / 180)) * 0.4);
ctx.strokeStyle = `rgba(100,255,218,${fade})`;
ctx.beginPath();
ctx.ellipse(cx, cy + ry, rx, rx * 0.15, 0, 0, Math.PI * 2);
ctx.stroke();
}

// Longitude lines — spin on Y axis, giving 3D depth via ellipse X-radius
for (let lon = 0; lon < 360; lon += 20) {
const a = (lon * Math.PI / 180) + angle;
const cosA = Math.cos(a);
const xRadius = r * Math.abs(cosA);
if (xRadius < 2) continue;
// Fade lines on the "back" side
const fade = (cosA + 1) / 2 * 0.45;
ctx.strokeStyle = `rgba(100,255,218,${fade})`;
ctx.lineWidth = cosA > 0 ? 1 : 0.4;
ctx.beginPath();
ctx.ellipse(cx, cy, xRadius, r, 0, 0, Math.PI * 2);
ctx.stroke();
}

// Equator highlight
ctx.strokeStyle = 'rgba(100,255,218,0.6)';
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.ellipse(cx, cy, r, r * 0.15, 0, 0, Math.PI * 2);
ctx.stroke();

// Prime meridian highlight (rotates with globe)
const pmCosA = Math.cos(angle);
ctx.strokeStyle = `rgba(100,255,218,${Math.max(0, pmCosA) * 0.7})`;
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.ellipse(cx, cy, r * Math.abs(pmCosA), r, 0, 0, Math.PI * 2);
ctx.stroke();

ctx.restore();

// Outer border ring
ctx.strokeStyle = 'rgba(100,255,218,0.5)';
ctx.lineWidth = 1.5;
ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

// Pole dots
ctx.fillStyle = 'rgba(100,255,218,0.8)';
ctx.beginPath(); ctx.arc(cx, cy - r, 4, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.arc(cx, cy + r, 4, 0, Math.PI * 2); ctx.fill();

transGlobeRAF = requestAnimationFrame(render);
}
render();
}


function cycleTab(dir) {
currentTabIndex += dir;
if (currentTabIndex < 0) currentTabIndex = tabs.length - 1;
if (currentTabIndex >= tabs.length) currentTabIndex = 0;
const type = tabs[currentTabIndex];
const btn = document.querySelector(`.nav-item[onclick*="${type}"]`);
switchTab(type, btn, dir);
}


// [Slightly shortened for space, but keep your loadPosts, renderFeed, openArticle, closeArticle, initMap, generateTensionMarkers, initCharts, updateClock from the previous Elite version]

// Global variable to hold all posts so they never disappear
// 1. GLOBAL DATABASE: This stores your posts so they never disappear or get mixed up

let ALL_POSTS_CACHE = [];
async function loadPosts() {
try {
const response = await fetch('posts.json');
const data = await response.json();
ALL_POSTS_CACHE = data; // Save to global cache
return data;
} catch (e) {
console.error("JSON Load Error:", e);
return [];
}
}
function renderFeed(id, posts) {
const feed = document.getElementById(id);
if (!feed) return;

// FIX: If the feed already has cards, STOP. Do not clear them.
// This prevents the "disappearing content" bug.
if (feed.children.length > 0) return;

posts.forEach((post, index) => {
const card = document.createElement('div');
card.className = 'post-card';

// Link card to ID for 100% accuracy
card.setAttribute('data-id', post.id);
card.onclick = () => openArticle(post);

card.innerHTML = `<h3>${post.title}</h3><p>${post.excerpt}</p>`;
feed.appendChild(card);
setTimeout(() => { card.classList.add('reveal'); }, index * 100);
});
}
function openArticle(post) {
if (!post) return;
const viewer = document.getElementById('article-viewer');
const body = document.getElementById('art-body');
const meta = document.querySelector('.article-meta');

document.body.classList.add('viewer-open');
viewer.style.display = "block";
viewer.classList.add('active');
viewer.style.zIndex = "100000";
viewer.style.opacity = "1";
viewer.style.pointerEvents = "all";

body.innerHTML = "";
document.getElementById('art-title').innerText = post.title;

// Keep #art-category and #art-date in the DOM (meta.innerHTML used to remove them after first open)
meta.innerHTML = `<span id="art-category" class="tag">${post.category.toUpperCase()}</span><span id="art-date" class="date">${post.date}</span><span class="author-tag">Analyst: <strong>${post.author || 'Internal Intel'}</strong> (${post.role || 'Strategic Dept.'})</span>`;

if (post.content) {
const formattedText = post.content.split('\n').map(para => para.trim() ? `<p style="margin-bottom: 1.5rem; line-height: 1.8; color: #ccd6f6;">${para}</p>` : '').join('');
body.innerHTML = `<div class="intel-report">${formattedText}<div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid var(--navy-light); font-family: var(--font-code); font-size: 0.7rem; color: var(--text-dim); text-align: center;">CLASSIFICATION: UNCLASSIFIED // SIGNED: ${post.author || 'OFFICE OF ANALYTICS'}</div></div>`;
} else if (post.file) {
if (post.file.endsWith('.pdf')) {
body.innerHTML = `<div class="pdf-wrapper"><div class="pdf-container"><iframe src="${post.file}#toolbar=0&navpanes=0&view=FitH" width="100%" height="100%" style="border:none;"></iframe></div></div>`;
} else {
fetch(post.file).then(r => r.text()).then(h => { body.innerHTML = h; });
}
}
}
function closeArticle() {
const viewer = document.getElementById('article-viewer');

document.body.classList.remove('viewer-open');
viewer.classList.remove('active');
viewer.style.display = "none";
viewer.style.opacity = "0";
viewer.style.pointerEvents = "none";

document.getElementById('art-body').innerHTML = "";
document.getElementById('art-title').innerText = "";
}



function initMap() {
if (map) return;
map = L.map('map-canvas', {
center: [20, 0],
zoom: 2,
zoomControl: false,
attributionControl: false
});
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
generateTensionMarkers();
}

function generateTensionMarkers() {
const hotspots = [
{ name: "S. CHINA SEA", coords: [12, 114] },
{ name: "EASTERN EUROPE", coords: [48, 31] },
{ name: "MIDDLE EAST", coords: [31, 34] },
{ name: "TAIWAN STRAIT", coords: [23, 120] },
{ name: "KOREA", coords: [38, 126] }
];

hotspots.forEach(spot => {
L.circleMarker(spot.coords, {
color: 'red',
fillColor: '#ff0000',
fillOpacity: 0.8,
radius: 6,
weight: 2
}).addTo(map).bindPopup(`<b>${spot.name}</b>`);
});
}


function initCharts() {
new TradingView.widget({ "width": "100%", "height": "100%", "symbol": "NASDAQ:AAPL", "interval": "D", "timezone": "Asia/Kolkata", "theme": "dark", "container_id": "tv_chart1" });
new TradingView.widget({ "width": "100%", "height": "100%", "symbol": "FX:USDINR", "interval": "D", "timezone": "Asia/Kolkata", "theme": "dark", "container_id": "tv_chart2" });
}

function updateClock() {
const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
document.getElementById('live-clock').innerText = "IST: " + new Intl.DateTimeFormat('en-IN', options).format(new Date());
}
// ==========================================
// MOLECULE ANIMATION (AI Hub)
// ==========================================
function initMolecules() {
const canvas = document.getElementById('molecule-canvas');
if (!canvas) return;
const parent = canvas.parentElement;
canvas.width = parent.offsetWidth || 600;
canvas.height = parent.offsetHeight || 600;
const ctx = canvas.getContext('2d');

const ATOM_COUNT = 18;
const atoms = [];
const cx = canvas.width / 2;
const cy = canvas.height / 2;

// Create atoms in orbital shells
const shells = [
{ count: 1, r: 0, speed: 0 },
{ count: 5, r: 100, speed: 0.008 },
{ count: 7, r: 170, speed: 0.005 },
{ count: 5, r: 240, speed: 0.003 },
];
shells.forEach(shell => {
for (let i = 0; i < shell.count; i++) {
const angle = (i / shell.count) * Math.PI * 2;
atoms.push({
angle,
radius: shell.r,
speed: shell.speed * (Math.random() > 0.5 ? 1 : -1),
size: shell.r === 0 ? 8 : Math.random() * 3 + 2,
orbitTilt: Math.random() * Math.PI * 0.5,
pulse: Math.random() * Math.PI * 2,
});
}
});

function drawMolecules() {
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Update angles
atoms.forEach(a => {
a.angle += a.speed;
a.pulse += 0.04;
});

// Compute screen positions
const positions = atoms.map(a => ({
x: cx + Math.cos(a.angle) * a.radius * Math.cos(a.orbitTilt),
y: cy + Math.sin(a.angle) * a.radius,
size: a.size,
pulse: a.pulse,
radius: a.radius,
}));

// Draw orbit rings (ellipses)
shells.forEach((shell, si) => {
if (shell.r === 0) return;
ctx.beginPath();
ctx.ellipse(cx, cy, shell.r, shell.r * 0.55, 0, 0, Math.PI * 2);
ctx.strokeStyle = `rgba(100,255,218,0.06)`;
ctx.lineWidth = 1;
ctx.stroke();
});

// Draw bonds between nearby atoms
for (let i = 0; i < positions.length; i++) {
for (let j = i + 1; j < positions.length; j++) {
const dx = positions[i].x - positions[j].x;
const dy = positions[i].y - positions[j].y;
const dist = Math.sqrt(dx * dx + dy * dy);
if (dist < 160) {
const alpha = (1 - dist / 160) * 0.35;
ctx.beginPath();
ctx.moveTo(positions[i].x, positions[i].y);
ctx.lineTo(positions[j].x, positions[j].y);
ctx.strokeStyle = `rgba(100,255,218,${alpha})`;
ctx.lineWidth = 0.8;
ctx.stroke();
}
}
}

// Draw atoms
positions.forEach((p, idx) => {
const glow = 0.6 + 0.4 * Math.sin(p.pulse);
// Glow halo
const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
grad.addColorStop(0, `rgba(100,255,218,${0.25 * glow})`);
grad.addColorStop(1, 'transparent');
ctx.beginPath();
ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
ctx.fillStyle = grad;
ctx.fill();

// Core dot
ctx.beginPath();
ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
ctx.fillStyle = p.radius === 0
? `rgba(100,255,218,1)`
: `rgba(100,255,218,${0.5 + 0.5 * glow})`;
ctx.fill();

// Inner bright spot
if (p.radius === 0) {
ctx.beginPath();
ctx.arc(p.x - 2, p.y - 2, 3, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(255,255,255,0.8)';
ctx.fill();
}
});

requestAnimationFrame(drawMolecules);
}
drawMolecules();
}

// ==========================================
// LIVE GEO INTEL FEED
// ==========================================
const geoIntelData = [
{ region: 'E.EUROPE', text: 'Frontline activity reported near Kherson — artillery exchanges ongoing' },
{ region: 'S.CHINA SEA',text: 'PLA naval exercises extend into disputed waters — 3rd carrier group deployed' },
{ region: 'MIDDLE EAST',text: 'Drone strike intercepted near Red Sea corridor — Houthi escalation flagged' },
{ region: 'CENTRAL ASIA',text: 'SCO emergency session called — cross-border skirmish reported on Tajik border' },
{ region: 'W.AFRICA', text: 'Coup government in Burkina Faso expels French military advisors — vacuum developing' },
{ region: 'INDO-PAC', text: 'US 7th Fleet repositioning — joint exercises announced with Japan & Philippines' },
{ region: 'BALKANS', text: 'Serbian troop buildup near Kosovo border — NATO monitoring with concern' },
{ region: 'ARCTIC', text: 'Russian icebreaker fleet expansion signals resource claim escalation' },
{ region: 'TAIWAN STR.',text: 'PLA air sorties breach ADIZ — 24 aircraft recorded in 48-hour window' },
{ region: 'HORN/AFRICA',text: 'Al-Shabaab offensive in Mogadishu — AU peacekeepers taking casualties' },
{ region: 'VENEZUELA', text: 'Opposition leaders detained — Maduro government cracks down post-election' },
{ region: 'CAUCASUS', text: 'Azeri infrastructure investment in reclaimed territories accelerating' },
{ region: 'BLACK SEA', text: 'Grain corridor tensions resurface — Turkish mediation requested' },
{ region: 'KOREA', text: 'DPRK missile test detected — trajectory analysis: ICBM class suspected' },
{ region: 'SAHEL', text: 'Wagner successor forces active in Mali — civilian casualties rising' },
];

function getTime() {
return new Intl.DateTimeFormat('en-IN', {
timeZone: 'Asia/Kolkata',
hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
}).format(new Date());
}

function startGeoFeed() {
const feed = document.getElementById('geo-news-feed');
if (!feed) return;
feed.innerHTML = '';
let index = 0;

function addLine() {
if (!document.getElementById('geo-news-feed')) return;
const item = geoIntelData[index % geoIntelData.length];
index++;

const el = document.createElement('div');
el.className = 'geo-news-item';
el.innerHTML = `
<span class="geo-time">${getTime()}</span>
<span class="geo-region">[${item.region}]</span>
<span class="geo-text">${item.text}</span>
`;
feed.appendChild(el);

// Keep only last 20 items
while (feed.children.length > 20) {
feed.removeChild(feed.firstChild);
}
feed.scrollTop = feed.scrollHeight;
}

// Immediate first item then stagger
addLine();
setInterval(addLine, 3200);
}

// ==========================================
// PATCH initNeuralBg to also init molecules & geo feed
// ==========================================
function initNeuralBg() {
initNeural();
setTimeout(() => {
initMolecules();
}, 200);
}

// Patch geopolitics tab to start feed
const _origSwitchTab = switchTab;
// Override: auto-start geo feed when geopolitics tab loads
// (already handled inside switchTab via renderFeed — we hook startGeoFeed there)
// Add startGeoFeed call inside the geopolitics branch of switchTab:
// Find the line: renderFeed('geo-feed', posts.filter(...))
// and add startGeoFeed() after it — OR patch here:
document.addEventListener('DOMContentLoaded', () => {
// Observe when geo-news-feed becomes visible and start the feed
const observer = new MutationObserver(() => {
const geoView = document.getElementById('geopolitics-view');
if (geoView && !geoView.classList.contains('hidden')) {
const feed = document.getElementById('geo-news-feed');
if (feed && feed.children.length === 0) startGeoFeed();
}
});
const geoView = document.getElementById('geopolitics-view');
if (geoView) observer.observe(geoView, { attributes: true, attributeFilter: ['class'] });
});

window.onload = () => {
setInterval(updateClock, 1000);
};
const stockAssets = [
{ symbol: 'XAU/USD (GOLD)', price: 2034.50 },
{ symbol: 'BTC/USD', price: 64210.00 },
{ symbol: 'USD/INR', price: 83.12 },
{ symbol: 'S&P 500', price: 5120.30 },
{ symbol: 'BRENT OIL', price: 82.40 },
{ symbol: 'NASDAQ 100', price: 17800.10 }
];

function startMarketSensors() {
const grid = document.getElementById('fin-stock-grid');
if (!grid || grid.innerHTML !== "") return; // Prevent duplicating markers

stockAssets.forEach(asset => {
const div = document.createElement('div');
div.className = 'stock-item';
div.id = `stock-${asset.symbol.replace(/\s+/g, '')}`;
div.innerHTML = `<span>${asset.symbol}</span><span class="price">${asset.price}</span>`;
grid.appendChild(div);
});

setInterval(() => {
stockAssets.forEach(asset => {
const el = document.getElementById(`stock-${asset.symbol.replace(/\s+/g, '')}`);
if (!el) return;
const change = (Math.random() - 0.5) * 2;
asset.price += change;
const priceEl = el.querySelector('.price');
priceEl.innerText = asset.price.toFixed(2);

// Flash effect
el.classList.add(change > 0 ? 'flash-up' : 'flash-down');
setTimeout(() => el.classList.remove('flash-up', 'flash-down'), 500);
});
}, 2000);
}

