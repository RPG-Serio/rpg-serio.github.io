/* Crônicas de Faerûn — campaign chronicle.
   Route ids stay in English so existing #hash links keep working; labels are
   Portuguese because that is what the table reads. */
const ROUTES = [
  {id:'sessions',   label:'Sessões'},
  {id:'map',        label:'Mapa'},
  {id:'materials',  label:'Materiais'},
  {id:'history',    label:'História'},
  {id:'cities',     label:'Cidades'},
  {id:'gods',       label:'Deuses'},
  {id:'characters', label:'Personagens'},
  {id:'magics',     label:'Magias'},
];
const ROUTE_IDS = ROUTES.map(r => r.id);
const STATE = {current:'sessions'};

function qs(sel){ return document.querySelector(sel) }
function labelFor(id){ const r = ROUTES.find(r => r.id === id); return r ? r.label : id }

function el(tag, cls, text){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(text !== undefined && text !== null) n.textContent = text;
  return n;
}

function svgEl(tag){ return document.createElementNS('http://www.w3.org/2000/svg', tag) }

function markSvg(){
  const svg = svgEl('svg');
  svg.setAttribute('aria-hidden','true');
  const use = svgEl('use');
  use.setAttribute('href','#mark-hand');
  svg.appendChild(use);
  return svg;
}

// The masthead burn: an ash copy of the mark under an ember copy. The first
// time it is shown per page load the ember spreads out from the palm;
// returning to Sessões later shows it already lit.
let burnLit = false;
function burnEl(){
  const wrap = el('div', burnLit ? 'burn' : 'burn ignite');
  burnLit = true;
  wrap.setAttribute('aria-hidden','true');
  ['burn-ash','burn-ember'].forEach(cls => {
    const svg = svgEl('svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('viewBox','0 0 24 24');
    const g = svgEl('g');
    g.setAttribute('filter','url(#burn-edge)');
    const use = svgEl('use');
    use.setAttribute('href','#mark-hand');
    g.appendChild(use);
    svg.appendChild(g);
    wrap.appendChild(svg);
  });
  return wrap;
}

// Keeps hyphenated words whole, so "Não-Morte" never breaks across lines.
function appendUnbroken(node, text){
  String(text).split(/(\S+-\S+)/).forEach(part => {
    if(!part) return;
    node.appendChild(/-/.test(part) && !/\s/.test(part) ? el('span','nowrap', part) : document.createTextNode(part));
  });
}

async function fetchJson(path){
  try{
    const res = await fetch(path);
    if(!res.ok) return null;
    return await res.json();
  }catch(e){ return null }
}

function makeImg(src, alt, cls){
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || '';
  if(cls) img.className = cls;
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
// Parsed by hand rather than new Date(str): an ISO date string is parsed as UTC
// and would render as the previous day for anyone west of Greenwich.
function formatDate(iso){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if(!m) return String(iso || '');
  const month = Number(m[2]) - 1;
  if(month < 0 || month > 11) return String(iso);
  return `${Number(m[3])} ${MONTHS_PT[month]} ${m[1]}`;
}

function rise(nodes){
  nodes.forEach((n, i) => {
    n.classList.add('rise');
    n.style.animationDelay = `${Math.min(i, 8) * 0.05}s`;
  });
}

/* ── Chrome ── */
function renderSidebar(){
  const sb = qs('#sidebar');
  sb.innerHTML = '';

  const brand = el('div','brand');
  const mark = el('div','brand-mark');
  mark.appendChild(markSvg());
  const btext = el('div','brand-text');
  btext.appendChild(el('span','brand-title','Crônicas de Faerûn'));
  btext.appendChild(el('span','brand-sub','D&D 5E · 1500 DR'));
  brand.appendChild(mark); brand.appendChild(btext);
  sb.appendChild(brand);

  const ul = el('ul','nav-list');
  ROUTES.forEach(r => {
    const li = document.createElement('li');
    const a = el('a', STATE.current === r.id ? 'active' : '', r.label);
    a.href = `#${r.id}`;
    if(STATE.current === r.id) a.setAttribute('aria-current','page');
    li.appendChild(a);
    ul.appendChild(li);
  });
  sb.appendChild(ul);
}

function renderTopnav(){
  const tn = qs('#topnav');
  tn.innerHTML = '';
  ROUTES.forEach(r => {
    const a = el('a', STATE.current === r.id ? 'active' : '', r.label);
    a.href = `#${r.id}`;
    if(STATE.current === r.id) a.setAttribute('aria-current','page');
    tn.appendChild(a);
  });
}

/* ── Sessions: the chronicle ── */
async function renderSessions(container){
  const [campaign, data] = await Promise.all([
    fetchJson('data/campaign.json'),
    fetchJson('data/sessions.json'),
  ]);
  const sessions = data || [];

  // Order by date rather than trusting file order: prepending a session to the
  // JSON would otherwise renumber every entry and mislabel the latest date.
  const chronological = sessions
    .map((s, i) => ({s, i}))
    .sort((a, b) => String(a.s.date || '').localeCompare(String(b.s.date || '')) || a.i - b.i)
    .map((o, idx) => ({s:o.s, n: idx + 1}));

  if(campaign){
    const mh = el('header','masthead');
    const era = el('div','masthead-era');
    era.appendChild(el('span','eyebrow', campaign.name));
    era.appendChild(el('span','rule'));
    era.appendChild(el('span','eyebrow', campaign.era));
    mh.appendChild(era);

    const body = el('div','masthead-body');
    const text = el('div','masthead-text');
    const h2 = el('h2');
    appendUnbroken(h2, campaign.crisis || '');
    text.appendChild(h2);
    if(campaign.premise) text.appendChild(el('p','lede premise', campaign.premise));

    const stats = el('div','masthead-stats');
    const n = sessions.length;
    const played = el('span'); played.innerHTML = `<b>${n}</b> ${n === 1 ? 'sessão registrada' : 'sessões registradas'}`;
    stats.appendChild(played);
    if(n){
      const last = el('span');
      last.innerHTML = `última em <b>${formatDate(chronological[n - 1].s.date)}</b>`;
      stats.appendChild(last);
    }
    text.appendChild(stats);
    body.appendChild(text);
    body.appendChild(burnEl());
    mh.appendChild(body);
    container.appendChild(mh);
  }

  if(!sessions.length){
    container.appendChild(el('p','empty-state','Nenhuma sessão registrada ainda.'));
    return;
  }

  // Newest first, since "what happened last time" is the reason anyone opens
  // this page. Each mark cools with age: the latest burns, the first is ash.
  const ordered = chronological.slice().reverse();
  const list = el('ol','chronicle');
  const span = Math.max(ordered.length - 1, 1);

  ordered.forEach(({s, n}, idx) => {
    const li = el('li','entry');
    li.style.setProperty('--heat', `${Math.round((1 - idx / span) * 100)}%`);

    const marker = el('div','entry-marker');
    const dot = el('div','entry-mark');
    dot.appendChild(markSvg());
    marker.appendChild(dot);
    li.appendChild(marker);

    // The summary ("Passagem da Montanha") is what the table remembers a
    // session by, so it leads; the ordinal title becomes the label.
    const headline = s.summary || s.title || `Sessão ${n}`;
    const label = s.summary && s.title ? s.title : `Sessão ${n}`;

    const body = el('div','entry-body');
    const meta = el('div','entry-meta');
    meta.appendChild(el('span','eyebrow', label));
    if(s.date){
      meta.appendChild(el('span','eyebrow sep','·'));
      const time = el('time','eyebrow', formatDate(s.date));
      time.dateTime = s.date;
      meta.appendChild(time);
    }
    if(idx === 0) meta.appendChild(el('span','latest-flag','mais recente'));
    body.appendChild(meta);
    body.appendChild(el('h3', null, headline));

    if(s.image){
      const fig = document.createElement('figure');
      fig.appendChild(makeImg(s.image, headline));
      body.appendChild(fig);
    }
    if(s.notes) body.appendChild(el('div','prose', s.notes));

    li.appendChild(body);
    list.appendChild(li);
  });

  container.appendChild(list);
  rise(Array.from(list.children));
}

/* ── History: deep time, grouped into eras ── */
// Years arrive as prose ("c. -3,900 to -3,600 DR"). Pull the first signed
// number out so entries can be bucketed instead of listed flat.
const ROMAN = {I:1, V:5, X:10, L:50, C:100, D:500, M:1000};
function romanToInt(s){
  const t = String(s).toUpperCase();
  let total = 0;
  for(let i = 0; i < t.length; i++){
    const v = ROMAN[t[i]];
    if(!v) return null;
    const next = ROMAN[t[i + 1]];
    total += (next && next > v) ? -v : v;
  }
  return total;
}
function parseYear(str){
  const t = String(str || '');
  // "final do século XV DR" carries no Arabic numerals at all.
  const rom = /s[eé]c(?:ulo)?\.?\s*([IVXLCDM]+)\b/i.exec(t);
  if(rom){
    const century = romanToInt(rom[1]);
    if(century && century >= 1 && century <= 21) return century * 100 - 50;
  }
  // Drop digit-group separators so "-5,000" reads as -5000, not 5.
  const cleaned = t.replace(/(\d)[.,](?=\d{3}\b)/g, '$1');
  const m = /-\s*\d+|\d+/.exec(cleaned);
  if(!m) return null;
  const n = Number(m[0].replace(/\s/g,''));
  return Number.isFinite(n) ? n : null;
}
const ERAS = [
  {label:'Momento atual',   note:'1500 DR',              test:y => y !== null && y >= 1500},
  {label:'História recente', note:'Séc. XIV–XV DR',      test:y => y !== null && y >= 1000 && y < 1500},
  {label:'Eras antigas',     note:'Antes de 1000 DR',       test:y => y !== null && y < 1000},
  {label:'Sem data',         note:'',                    test:() => true},
];

async function renderHistory(container){
  const items = await fetchJson('data/history.json') || [];
  container.appendChild(el('p','lede','A linha do tempo de Faerûn, do momento atual da campanha às eras primordiais.'));

  const buckets = ERAS.map(e => ({era:e, items:[]}));
  items.forEach(h => {
    const y = parseYear(h.year || h.date);
    (buckets.find(b => b.era.test(y)) || buckets[buckets.length - 1]).items.push(h);
  });

  const groups = [];
  buckets.filter(b => b.items.length).forEach(b => {
    const sec = el('section','era');
    const head = el('div','group-head era-head');
    head.appendChild(el('h3', null, b.era.label));
    if(b.era.note) head.appendChild(el('span','eyebrow', b.era.note));
    head.appendChild(el('span','count', `${b.items.length} ${b.items.length === 1 ? 'registro' : 'registros'}`));
    sec.appendChild(head);

    const ul = el('ul','era-list');
    b.items.forEach(h => {
      const li = el('li','era-item');
      li.appendChild(el('div','era-year', h.year || h.date || ''));
      const bd = el('div');
      bd.appendChild(el('h4', null, h.title || ''));
      if(h.text) bd.appendChild(el('div','prose', h.text));
      li.appendChild(bd);
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    container.appendChild(sec);
    groups.push(sec);
  });
  rise(groups);
}

/* ── Gods: grouped by domain rather than 22 stacked cards ── */
const GOD_CLUSTERS = [
  {label:'Magia e saber',          match:/magia|magos|feitiçaria|conhecimento|inspiração|ofício|invenção/i},
  {label:'Luz, lei e proteção',    match:/justiça|retidão|dever|guardiões|proteção|aurora|renovação/i},
  {label:'Natureza e viagem',      match:/natureza|florestas|patrulheiros|lua|navegação|agricultura/i},
  {label:'Forja, arte e beleza',   match:/anões|forja|elfos|arte|amor|beleza/i},
  {label:'Guerra e conquista',     match:/guerra|tirania|conquista/i},
  {label:'Morte, sombra e engano', match:/morte|julgamento|assassinato|aranhas|escuridão|perda|engano|conflito/i},
];

async function renderGods(container){
  const items = await fetchJson('data/gods.json') || [];
  container.appendChild(el('p','lede','O panteão de Faerûn, agrupado por domínio.'));

  const buckets = GOD_CLUSTERS.map(c => ({cluster:c, items:[]}));
  const rest = [];
  items.forEach(g => {
    const b = buckets.find(b => b.cluster.match.test(g.domain || ''));
    (b ? b.items : rest).push(g);
  });
  if(rest.length) buckets.push({cluster:{label:'Outros'}, items:rest});

  const groups = [];
  buckets.filter(b => b.items.length).forEach(b => {
    const sec = el('section','cluster');
    const head = el('div','group-head');
    head.appendChild(el('h3', null, b.cluster.label));
    head.appendChild(el('span','count', String(b.items.length)));
    sec.appendChild(head);

    const grid = el('div','god-grid');
    b.items.forEach(g => {
      const card = el('article','god');
      card.appendChild(el('h4', null, g.name));
      if(g.domain) card.appendChild(el('div','eyebrow domain', g.domain));
      if(g.desc) card.appendChild(el('p', null, g.desc));
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    container.appendChild(sec);
    groups.push(sec);
  });
  rise(groups);
}

/* ── Cities: grouped by region (a field the old build never showed) ── */
async function renderCities(container){
  const items = await fetchJson('data/cities.json') || [];
  container.appendChild(el('p','lede','Os assentamentos que a campanha já cruzou.'));

  const order = [];
  const byRegion = new Map();
  items.forEach(c => {
    const r = c.region || 'Outras regiões';
    if(!byRegion.has(r)){ byRegion.set(r, []); order.push(r); }
    byRegion.get(r).push(c);
  });

  const groups = [];
  order.forEach(region => {
    const list = byRegion.get(region);
    const sec = el('section','region');
    const head = el('div','group-head');
    head.appendChild(el('h3', null, region));
    head.appendChild(el('span','count', `${list.length} ${list.length === 1 ? 'cidade' : 'cidades'}`));
    sec.appendChild(head);

    const grid = el('div','city-grid');
    list.forEach(city => {
      const card = el('article','city');
      if(city.image){
        const wrap = el('div','city-img');
        wrap.appendChild(makeImg(city.image, city.name));
        card.appendChild(wrap);
      }
      card.appendChild(el('h4', null, city.name));
      if(city.popSize) card.appendChild(el('div','datum pop', city.popSize));
      if(city.description) card.appendChild(el('p', null, city.description));
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    container.appendChild(sec);
    groups.push(sec);
  });
  rise(groups);
}

/* ── Map ── */
async function renderMap(container){
  const d = await fetchJson('data/map.json') || {};
  const fig = el('figure','map-figure');
  if(d.image) fig.appendChild(makeImg(d.image, d.alt || 'Mapa da campanha'));
  if(d.description) fig.appendChild(el('figcaption','datum', d.description));
  container.appendChild(fig);
  rise([fig]);
}

/* ── Materials ── */
async function renderMaterials(container){
  const items = await fetchJson('data/materials.json') || [];
  container.appendChild(el('p','lede','Livros e fichas usados na mesa.'));

  const grid = el('div','material-grid');
  items.forEach(m => {
    const card = el('article','material');
    if(m.image){
      const cover = el('div','material-cover');
      cover.appendChild(makeImg(m.image, m.title || ''));
      card.appendChild(cover);
    }
    card.appendChild(el('h3', null, m.title || ''));
    if(m.description) card.appendChild(el('p', null, m.description));
    if(m.pdf){
      const a = el('a','btn','Baixar PDF');
      a.href = m.pdf;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', `Baixar PDF: ${m.title || 'material'}`);
      card.appendChild(a);
    }
    grid.appendChild(card);
  });
  container.appendChild(grid);
  rise(Array.from(grid.children));
}

/* ── Characters ── */
async function renderCharacters(container){
  const items = await fetchJson('data/characters.json') || [];
  container.appendChild(el('p','lede','Os renascidos e quem os interpreta.'));

  const grid = el('div','char-grid');
  items.forEach(ch => {
    const card = el('article','char');
    const portrait = el('div','char-portrait');
    if(ch.portrait){
      const img = makeImg(ch.portrait, ch.name || '');
      // Portraits point at an external placeholder host that may be gone;
      // fall back to a monogram rather than a broken image.
      img.addEventListener('error', () => {
        portrait.innerHTML = '';
        portrait.appendChild(el('div','char-monogram', (ch.name || '?').trim().charAt(0).toUpperCase()));
      });
      portrait.appendChild(img);
    }else{
      portrait.appendChild(el('div','char-monogram', (ch.name || '?').trim().charAt(0).toUpperCase()));
    }
    card.appendChild(portrait);
    card.appendChild(el('h3', null, ch.name || ''));
    if(ch.player) card.appendChild(el('div','eyebrow player', ch.player));
    if(ch.bio) card.appendChild(el('p', null, ch.bio));
    grid.appendChild(card);
  });
  container.appendChild(grid);
  rise(Array.from(grid.children));
}

/* ── Magics (D&D 5e API) ── */
const DND_API = 'https://www.dnd5eapi.co/api';
const spellDetailsCache = new Map();
// ids match the API's English school names; labels are what the table reads.
const SCHOOLS = [
  {id:'abjuration',    label:'Abjuração'},
  {id:'conjuration',   label:'Conjuração'},
  {id:'divination',    label:'Adivinhação'},
  {id:'enchantment',   label:'Encantamento'},
  {id:'evocation',     label:'Evocação'},
  {id:'illusion',      label:'Ilusão'},
  {id:'necromancy',    label:'Necromancia'},
  {id:'transmutation', label:'Transmutação'},
];
const PAGE_SIZE = 60;

function schoolId(d){ return d && d.school ? String(d.school.name).toLowerCase() : '' }
function levelLabel(level){ return Number(level) === 0 ? 'Truque' : `Nível ${level}` }

// Fills the level line and tags the card with its school, which colours the dot.
function describeSpell(card, line, d){
  const id = schoolId(d);
  const school = SCHOOLS.find(s => s.id === id);
  line.textContent = `${levelLabel(d.level)} · ${school ? school.label : (d.school ? d.school.name : '—')}`;
  if(school) card.dataset.school = id;
}

async function fetchSpellList(){
  const json = await fetchJson(`${DND_API}/spells`);
  return (json && json.results) || [];
}
async function fetchSpellDetails(index){
  if(spellDetailsCache.has(index)) return spellDetailsCache.get(index);
  const json = await fetchJson(`${DND_API}/spells/${index}`);
  if(json) spellDetailsCache.set(index, json);
  return json;
}
// The level/school filters need every candidate's details. Run them through a
// small pool so a filter change doesn't fire hundreds of parallel requests.
async function fetchAllDetails(list, onProgress){
  let done = 0;
  const queue = list.slice();
  async function worker(){
    while(queue.length){
      const s = queue.shift();
      await fetchSpellDetails(s.index);
      done++;
      if(onProgress && done % 12 === 0) onProgress(done, list.length);
    }
  }
  await Promise.all(Array.from({length:Math.min(8, list.length)}, worker));
}

function renderSpell(spell, container){
  const card = el('article','spell');
  const head = el('div','spell-head');
  head.appendChild(el('h3', null, spell.name));
  const btn = el('button','btn btn-sm','Detalhes');
  btn.setAttribute('aria-expanded','false');
  head.appendChild(btn);
  card.appendChild(head);

  const cached = spellDetailsCache.get(spell.index);
  const level = el('div','eyebrow level');
  if(cached) describeSpell(card, level, cached);
  card.appendChild(level);

  const pane = el('div','spell-details');
  card.appendChild(pane);

  let open = false;
  btn.addEventListener('click', async () => {
    if(open){
      pane.innerHTML = ''; open = false;
      btn.textContent = 'Detalhes'; btn.setAttribute('aria-expanded','false');
      return;
    }
    btn.disabled = true; btn.textContent = 'Carregando…';
    const d = await fetchSpellDetails(spell.index);
    btn.disabled = false;
    if(!d){
      pane.innerHTML = '';
      pane.appendChild(el('p', null, 'Não foi possível carregar os detalhes.'));
      btn.textContent = 'Detalhes';
      return;
    }
    open = true;
    btn.textContent = 'Ocultar'; btn.setAttribute('aria-expanded','true');
    describeSpell(card, level, d);
    pane.innerHTML = '';
    pane.appendChild(el('p', null, (d.desc || []).join('\n\n') || 'Sem descrição.'));
    const classes = (d.classes || []).map(c => c.name).join(', ');
    if(classes) pane.appendChild(el('div','eyebrow classes', `Classes: ${classes}`));
  });

  container.appendChild(card);
}

async function renderMagics(container){
  const bar = el('div','magics-bar');
  const search = el('input','search-input');
  search.type = 'search';
  search.placeholder = 'Buscar magia pelo nome…';
  search.setAttribute('aria-label','Buscar magia pelo nome');

  const levelSel = el('select','select-filter');
  levelSel.setAttribute('aria-label','Filtrar por nível');
  levelSel.innerHTML = '<option value="">Todos os níveis</option>' +
    Array.from({length:10}, (_, i) => `<option value="${i}">${i === 0 ? 'Truques' : `Nível ${i}`}</option>`).join('');

  const schoolSel = el('select','select-filter');
  schoolSel.setAttribute('aria-label','Filtrar por escola');
  schoolSel.innerHTML = '<option value="">Todas as escolas</option>' +
    SCHOOLS.map(s => `<option value="${s.id}">${s.label}</option>`).join('');

  const count = el('div','magics-count','carregando…');
  bar.append(search, levelSel, schoolSel, count);
  container.appendChild(bar);

  const grid = el('div','spell-grid');
  container.appendChild(grid);
  const status = el('div','magics-status');
  container.appendChild(status);

  const list = await fetchSpellList();
  if(!list.length){
    count.textContent = '';
    status.textContent = 'Não foi possível carregar a lista de magias.';
    return;
  }

  let visible = list.slice();
  let shown = 0;
  let observer = null;

  function paint(reset){
    if(reset){ grid.innerHTML = ''; shown = 0; }
    const next = visible.slice(shown, shown + PAGE_SIZE);
    next.forEach(s => renderSpell(s, grid));
    shown += next.length;
    count.textContent = `${visible.length} de ${list.length} magias`;
    status.textContent = shown < visible.length ? `mostrando ${shown}…` : '';
    if(observer) observer.disconnect();
    if(shown < visible.length && 'IntersectionObserver' in window){
      observer = new IntersectionObserver(entries => {
        if(entries.some(e => e.isIntersecting)) paint(false);
      }, {rootMargin:'400px'});
      observer.observe(status);
    }
    if(!visible.length) status.textContent = 'Nenhuma magia encontrada.';
  }

  let token = 0;
  async function applyFilters(){
    const run = ++token;
    const q = search.value.trim().toLowerCase();
    const level = levelSel.value;
    const school = schoolSel.value;
    const candidates = list.filter(s => s.name.toLowerCase().includes(q));

    if(!level && !school){ visible = candidates; paint(true); return; }

    status.textContent = 'carregando detalhes…';
    await fetchAllDetails(candidates, (d, t) => {
      if(run === token) status.textContent = `carregando detalhes… ${d}/${t}`;
    });
    if(run !== token) return;
    visible = candidates.filter(s => {
      const d = spellDetailsCache.get(s.index);
      if(!d) return false;
      if(level && String(d.level) !== level) return false;
      if(school && schoolId(d) !== school) return false;
      return true;
    });
    paint(true);
  }

  let debounce;
  search.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(applyFilters, 180); });
  levelSel.addEventListener('change', applyFilters);
  schoolSel.addEventListener('change', applyFilters);

  paint(true);
}

/* ── Router ── */
const RENDERERS = {
  sessions:renderSessions, map:renderMap, materials:renderMaterials, history:renderHistory,
  cities:renderCities, gods:renderGods, characters:renderCharacters, magics:renderMagics,
};
let renderToken = 0;

async function render(){
  const run = ++renderToken;
  renderSidebar(); renderTopnav();
  document.body.dataset.section = STATE.current;
  const label = labelFor(STATE.current);
  qs('#page-title').textContent = label;
  document.title = `${label} · Crônicas de Faerûn`;

  const content = qs('#content');
  content.innerHTML = '';

  const fn = RENDERERS[STATE.current];
  if(!fn) return;

  // Build detached, then swap in: two fast route changes would otherwise let the
  // slower render append its sections under the newer page's title.
  const stage = el('div','stage');
  await fn(stage);
  if(run !== renderToken) return;
  content.innerHTML = '';
  content.appendChild(stage);
}

/* ── Theme ── */
function currentTheme(){
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}
// Applies without persisting, so a visitor who never touches the toggle is not
// pinned to today's default.
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  const btn = qs('#theme-toggle');
  if(!btn) return;
  const isLight = theme === 'light';
  btn.setAttribute('aria-pressed', String(isLight));
  btn.setAttribute('aria-label', isLight ? 'Usar tema escuro' : 'Usar tema claro');
  btn.title = isLight ? 'Tema escuro' : 'Tema claro';
}
function setTheme(theme){
  applyTheme(theme);
  try{ localStorage.setItem('theme', theme); }catch(e){}
}
function toggleTheme(){ setTheme(currentTheme() === 'light' ? 'dark' : 'light') }

/* ── Mobile nav ── */
function openMobileNav(){
  const nav = qs('#mobile-nav');
  renderMobileNav();
  nav.classList.add('open');
  document.body.style.overflow = 'hidden';
  const btn = qs('#menu-toggle');
  if(btn) btn.setAttribute('aria-expanded','true');
  const close = qs('#mobile-nav-close');
  if(close) close.focus();
}
function closeMobileNav(){
  const nav = qs('#mobile-nav');
  nav.classList.remove('open');
  document.body.style.overflow = '';
  const btn = qs('#menu-toggle');
  if(btn){ btn.setAttribute('aria-expanded','false'); btn.focus(); }
}
function renderMobileNav(){
  const nav = qs('#mobile-nav');
  nav.querySelectorAll('a').forEach(a => a.remove());
  ROUTES.forEach(r => {
    const a = el('a', STATE.current === r.id ? 'active' : '', r.label);
    a.href = '#' + r.id;
    a.addEventListener('click', closeMobileNav);
    nav.appendChild(a);
  });
}

function init(){
  // The inline head script already resolved and normalised the theme; trust
  // that attribute instead of re-deriving it from storage.
  applyTheme(currentTheme());
  const themeBtn = qs('#theme-toggle');
  if(themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const hash = location.hash.replace('#','');
  STATE.current = ROUTE_IDS.includes(hash) ? hash : 'sessions';

  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#','');
    if(ROUTE_IDS.includes(h) && h !== STATE.current){
      STATE.current = h;
      if(qs('#mobile-nav').classList.contains('open')) closeMobileNav();
      render();
    }
  });

  const menuBtn = qs('#menu-toggle');
  const closeBtn = qs('#mobile-nav-close');
  if(menuBtn) menuBtn.addEventListener('click', openMobileNav);
  if(closeBtn) closeBtn.addEventListener('click', closeMobileNav);
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && qs('#mobile-nav').classList.contains('open')) closeMobileNav();
  });

  render();
}

document.addEventListener('DOMContentLoaded', init);
