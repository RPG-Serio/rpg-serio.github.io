const STATE = {current: 'sessions'};
const routes = ['sessions','map','materials','history','cities','regions','gods','characters','magics'];

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
    case 'magics': return renderMagics(content);
  }
}

// -- Magics (D&D 5e API) --
const DND_API = 'https://www.dnd5eapi.co/api';
const spellDetailsCache = new Map();

async function fetchSpellList(){
  try{
    const res = await fetch(`${DND_API}/spells`);
    if(!res.ok) return [];
    const json = await res.json();
    return json.results || [];
  }catch(e){ return [] }
}

async function fetchSpellDetails(index){
  if(spellDetailsCache.has(index)) return spellDetailsCache.get(index);
  try{
    const res = await fetch(`${DND_API}/spells/${index}`);
    if(!res.ok) return null;
    const json = await res.json();
    spellDetailsCache.set(index,json);
    return json;
  }catch(e){ return null }
}

function createMagicsControls(){
  const wrap = document.createElement('div'); wrap.className='magics-controls card';
  const search = document.createElement('input'); search.placeholder='Search spells by name...'; search.className='search-input';
  const levelSel = document.createElement('select'); levelSel.className='select-filter';
  const schoolSel = document.createElement('select'); schoolSel.className='select-filter';
  const fetchDetailsBtn = document.createElement('button'); fetchDetailsBtn.className='btn'; fetchDetailsBtn.textContent='Fetch details for visible';

  levelSel.innerHTML = `<option value="">All Levels</option>` + Array.from({length:10}).map((_,i)=>`<option value="${i}">${i}</option>`).join('');
  schoolSel.innerHTML = `<option value="">All Schools</option>`;

  wrap.appendChild(search);
  wrap.appendChild(levelSel);
  wrap.appendChild(schoolSel);
  wrap.appendChild(fetchDetailsBtn);

  return {wrap,search,levelSel,schoolSel,fetchDetailsBtn};
}

function renderSpellCard(spell,container){
  const c = document.createElement('div'); c.className='card magic-card';
  const h = document.createElement('h3'); h.textContent = spell.name; c.appendChild(h);
  const meta = document.createElement('div'); meta.className='muted magic-meta'; c.appendChild(meta);
  const btn = document.createElement('button'); btn.className='magic-toggle btn'; btn.textContent='Details';
  c.appendChild(btn);
  const detailsPane = document.createElement('div'); detailsPane.className='magic-details'; c.appendChild(detailsPane);

  let detailsLoaded = false;
  btn.onclick = async ()=>{
    if(detailsLoaded){ detailsPane.innerHTML=''; detailsLoaded=false; btn.textContent='Details'; return; }
    btn.disabled = true; btn.textContent='Loading...';
    const d = await fetchSpellDetails(spell.index);
    btn.disabled = false; detailsLoaded = !!d; btn.textContent = detailsLoaded?'Hide':'Details';
    if(!d){ detailsPane.textContent='(failed to load details)'; return }
    meta.textContent = `Level ${d.level} — ${d.school?.name || 'Unknown'}`;
    const p = document.createElement('div'); p.className='muted';
    const desc = (d.desc || []).join('\n\n');
    p.textContent = desc || (d.short_description || 'No description');
    const classes = (d.classes||[]).map(c=>c.name).join(', ');
    const more = document.createElement('div'); more.className='muted'; more.textContent = `Classes: ${classes}`;
    detailsPane.innerHTML='';
    detailsPane.appendChild(p);
    detailsPane.appendChild(more);
  };

  container.appendChild(c);
}

async function renderMagics(container){
  container.innerHTML='';
  const controls = createMagicsControls();
  container.appendChild(controls.wrap);

  const grid = document.createElement('div'); grid.className='grid'; grid.id='magics-grid';
  container.appendChild(grid);

  const list = await fetchSpellList();
  let visible = list.slice();

  function updateGrid(){
    grid.innerHTML='';
    visible.forEach(s=> renderSpellCard(s,grid));
    animateCards(container);
  }

  function applyFilters(){
    const q = controls.search.value.trim().toLowerCase();
    const level = controls.levelSel.value;
    const school = controls.schoolSel.value;
    if(!level && !school){
      visible = list.filter(s=> s.name.toLowerCase().includes(q));
      updateGrid();
      return;
    }
    // when level or school filter present, ensure details are loaded for candidates
    const candidates = list.filter(s=> s.name.toLowerCase().includes(q));
    Promise.all(candidates.map(async s=>{ const d = await fetchSpellDetails(s.index); return {s,d}; }))
      .then(arr=>{
        visible = arr.filter(item=>{
          if(!item.d) return false;
          if(level && String(item.d.level)!==level) return false;
          if(school && (item.d.school?.name||'').toLowerCase()!==school) return false;
          return true;
        }).map(it=>it.s);
        updateGrid();
      });
  }

  controls.search.addEventListener('input', ()=>{ applyFilters(); });
  controls.levelSel.addEventListener('change', ()=>{ applyFilters(); });
  controls.schoolSel.addEventListener('change', ()=>{ applyFilters(); });

  controls.fetchDetailsBtn.addEventListener('click', async ()=>{
    controls.fetchDetailsBtn.disabled = true; controls.fetchDetailsBtn.textContent='Fetching...';
    const currentlyVisible = Array.from(grid.querySelectorAll('.card h3')).map(h=>h.textContent);
    const toFetch = list.filter(s=> currentlyVisible.includes(s.name));
    await Promise.all(toFetch.map(s=>fetchSpellDetails(s.index)));
    controls.fetchDetailsBtn.disabled = false; controls.fetchDetailsBtn.textContent='Fetch details for visible';
    // populate school options from loaded details
    const schools = new Set();
    spellDetailsCache.forEach(d=>{ if(d && d.school && d.school.name) schools.add(d.school.name); });
    const sorted = Array.from(schools).sort();
    controls.schoolSel.innerHTML = `<option value="">All Schools</option>` + sorted.map(s=>`<option value="${s.toLowerCase()}">${s}</option>`).join('');
  });

  // show initial list (names only) first
  updateGrid();
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
