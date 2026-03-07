const STATE = {current: 'sessions'};
const routes = ['sessions','map','materials','history','cities','regions','gods','characters'];

function qs(sel){return document.querySelector(sel)}
function navLink(name){
  const a = document.createElement('a');
  a.href = `#${name}`;
  a.textContent = name[0].toUpperCase()+name.slice(1);
  a.onclick = ()=>{setRoute(name)};
  return a;
}

async function fetchJson(path){
  const res = await fetch(path);
  if(!res.ok) return null;
  return res.json();
}

function renderSidebar(){
  const sb = qs('#sidebar');
  sb.innerHTML = '';
  const ul = document.createElement('ul'); ul.className='nav-list';
  routes.forEach(r=>{
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${r}`; a.textContent = r[0].toUpperCase()+r.slice(1);
    a.className = (STATE.current===r)?'active':'';
    a.onclick = ()=>setRoute(r);
    li.appendChild(a);
    ul.appendChild(li);
  });
  sb.appendChild(ul);
}

function renderTopnav(){
  const tn = qs('#topnav'); tn.innerHTML='';
  routes.forEach(r=> tn.appendChild(navLink(r)));
}

function animateCards(container){
  const cards = container.querySelectorAll('.card');
  cards.forEach((c,i)=>{c.classList.add('card-animate'); c.style.animationDelay=`${i*0.06}s`;});
}

async function render(){
  renderSidebar(); renderTopnav();
  qs('#page-title').textContent = STATE.current[0].toUpperCase()+STATE.current.slice(1);
  const content = qs('#content'); content.innerHTML='';
  switch(STATE.current){
    case 'sessions': return renderSessions(content);
    case 'map': return renderMap(content);
    case 'materials': return renderMaterials(content);
    case 'history': return renderHistory(content);
    case 'cities': return renderCities(content);
    case 'regions': return renderRegions(content);
    case 'gods': return renderGods(content);
    case 'characters': return renderCharacters(content);
  }
}

function setRoute(r){
  // update desired route and change the hash — the 'hashchange' handler
  // will perform the actual render. This avoids double-rendering when
  // both onclick and the hashchange event would trigger renders.
  if(STATE.current === r) return;
  STATE.current = r;
  location.hash = '#'+r;
}

async function renderSessions(container){
  const data = await fetchJson('data/sessions.json') || [];
  const grid = document.createElement('div'); grid.className='grid';
  data.forEach(s=>{
    const c = document.createElement('div'); c.className='card';
    const h = document.createElement('h3'); h.textContent = `${s.date} — ${s.title}`; c.appendChild(h);
    if(s.image) { const img = document.createElement('img'); img.src = s.image; img.className='thumb'; c.appendChild(img); }
    if(s.summary){ const p = document.createElement('p'); p.textContent = s.summary; c.appendChild(p); }
    if(s.notes){ const pre = document.createElement('div'); pre.className='muted'; pre.textContent = s.notes; c.appendChild(pre); }
    grid.appendChild(c);
  });
  container.appendChild(grid);
  animateCards(container);
}

async function renderMap(container){
  const d = await fetchJson('data/map.json') || {};
  // ensure we only have one map card in the container (avoid duplicates on reload)
  const existing = container.querySelector('#map-card');
  if(existing) existing.remove();
  const c = document.createElement('div'); c.className='card'; c.id = 'map-card';
  if(d.image) { const img = document.createElement('img'); img.src = d.image; img.alt = d.alt||'Map'; img.className='thumb'; c.appendChild(img); }
  if(d.description) { const p = document.createElement('p'); p.textContent = d.description; c.appendChild(p);} 
  container.appendChild(c);
  animateCards(container);
}

async function renderMaterials(container){
  const items = await fetchJson('data/materials.json') || [];
  // remove any existing materials grid to prevent duplicates
  const existingGrid = container.querySelector('#materials-grid');
  if(existingGrid) existingGrid.remove();
  const grid = document.createElement('div'); grid.className='grid'; grid.id = 'materials-grid';
  items.forEach(m=>{
    const c = document.createElement('div'); c.className='card';
    const h = document.createElement('h3'); h.textContent = m.title; c.appendChild(h);
    if(m.image){ const img = document.createElement('img'); img.src = m.image; img.className='thumb'; c.appendChild(img); }
    if(m.description){ const p = document.createElement('p'); p.textContent = m.description; c.appendChild(p); }
    if(m.pdf){ const a = document.createElement('a'); a.href = m.pdf; a.textContent = 'Download PDF'; a.className='material-link'; a.target='_blank'; c.appendChild(a); }
    grid.appendChild(c);
  });
  container.appendChild(grid);
  animateCards(container);
}

async function renderHistory(container){
  const items = await fetchJson('data/history.json') || [];
  items.forEach(h=>{
    const c = document.createElement('div'); c.className='card';
    const t = document.createElement('h4'); t.textContent = `${h.year || h.date} — ${h.title}`; c.appendChild(t);
    if(h.text){ const p = document.createElement('p'); p.textContent = h.text; c.appendChild(p); }
    container.appendChild(c);
  });
  animateCards(container);
}

async function renderCities(container){
  const items = await fetchJson('data/cities.json') || [];
  const grid = document.createElement('div'); grid.className='grid';
  items.forEach(city=>{
    const c = document.createElement('div'); c.className='card';
    const h = document.createElement('h3'); h.textContent = city.name; c.appendChild(h);
    if(city.image){ const img = document.createElement('img'); img.src = city.image; img.className='thumb'; c.appendChild(img); }
    if(city.desc){ const p = document.createElement('p'); p.textContent = city.desc; c.appendChild(p); }
    grid.appendChild(c);
  });
  container.appendChild(grid);
  animateCards(container);
}

async function renderRegions(container){
  const items = await fetchJson('data/regions.json') || [];
  items.forEach(r=>{
    const c = document.createElement('div'); c.className='card';
    const h = document.createElement('h3'); h.textContent = r.name; c.appendChild(h);
    if(r.cities && r.cities.length){ const p = document.createElement('p'); p.textContent = 'Cities: '+r.cities.join(', '); c.appendChild(p); }
    if(r.desc){ const p2 = document.createElement('p'); p2.textContent = r.desc; c.appendChild(p2); }
    container.appendChild(c);
  });
  animateCards(container);
}

async function renderGods(container){
  const items = await fetchJson('data/gods.json') || [];
  items.forEach(g=>{
    const c = document.createElement('div'); c.className='card';
    const h = document.createElement('h3'); h.textContent = g.name; c.appendChild(h);
    if(g.domain){ const d = document.createElement('p'); d.textContent = 'Domain: '+g.domain; c.appendChild(d); }
    if(g.desc){ const p = document.createElement('p'); p.textContent = g.desc; c.appendChild(p); }
    container.appendChild(c);
  });
  animateCards(container);
}

async function renderCharacters(container){
  const items = await fetchJson('data/characters.json') || [];
  const grid = document.createElement('div'); grid.className='grid';
  items.forEach(ch=>{
    const c = document.createElement('div'); c.className='card';
    const h = document.createElement('h3'); h.textContent = ch.name + (ch.player?` — ${ch.player}`:''); c.appendChild(h);
    if(ch.portrait){ const img = document.createElement('img'); img.src = ch.portrait; img.className='thumb'; c.appendChild(img); }
    if(ch.bio){ const p = document.createElement('p'); p.textContent = ch.bio; c.appendChild(p); }
    container.appendChild(c);
    grid.appendChild(c);
  });
  container.appendChild(grid);
  animateCards(container);
}

function init(){
  const hash = location.hash.replace('#','') || 'sessions';
  STATE.current = routes.includes(hash)?hash:'sessions';
  window.addEventListener('hashchange', ()=>{ const h = location.hash.replace('#',''); if(routes.includes(h)){STATE.current=h; render();}});
  render();
}

document.addEventListener('DOMContentLoaded', init);
