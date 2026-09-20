const source = Array.isArray(window.RECOMENDACIONES) ? window.RECOMENDACIONES : [];
const grid = document.getElementById('recommendationGrid');
const input = document.getElementById('searchInput');
const filters = document.getElementById('filters');
const editorialFilters = document.getElementById('editorialFilters');
const sortSelect = document.getElementById('sortSelect');
const hero = document.getElementById('heroFeatured');
const resultCount = document.getElementById('resultCount');
const dialog = document.getElementById('detailDialog');
const dialogContent = document.getElementById('dialogContent');

let activeFilter = 'Todos';
let activeEditorial = 'Todos';

function escapeHtml(value){
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
  });
}

function normalize(value){
  return String(value == null ? '' : value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

function includesFilter(item){
  if(activeFilter !== 'Todos'){
    if(item.type !== activeFilter && !(item.genres || []).includes(activeFilter)) return false;
  }
  if(activeEditorial !== 'Todos' && !(item.editorial || []).includes(activeEditorial)) return false;
  return true;
}

function matchesSearch(item){
  const q = normalize(input.value.trim());
  if(!q) return true;
  const haystack = normalize([
    item.title,item.type,item.year,(item.genres||[]).join(' '),
    (item.editorial||[]).join(' '),item.tagline,item.reason,item.idealFor
  ].join(' '));
  return haystack.includes(q);
}

function sorted(items){
  const list = items.slice();
  const mode = sortSelect.value;
  if(mode === 'rating') list.sort(function(a,b){ return Number(b.rating||0)-Number(a.rating||0); });
  if(mode === 'newest') list.sort(function(a,b){ return Number(b.year||0)-Number(a.year||0); });
  if(mode === 'title') list.sort(function(a,b){ return String(a.title).localeCompare(String(b.title),'es'); });
  if(mode === 'featured') list.sort(function(a,b){ return Number(Boolean(b.featured))-Number(Boolean(a.featured)); });
  return list;
}

function posterStyle(item){
  return item.image ? ' style="background-image:url(\'' + escapeHtml(item.image) + '\')"' : '';
}

function badgeList(item){
  return (item.editorial || []).slice(0,2).map(function(tag){
    return '<span class="editorial-badge">' + escapeHtml(tag) + '</span>';
  }).join('');
}

function cardTemplate(item){
  return '<article class="card" data-id="' + escapeHtml(item.id) + '">' +
    '<button class="card-open" type="button" data-open="' + escapeHtml(item.id) + '" aria-label="Abrir ' + escapeHtml(item.title) + '"></button>' +
    '<div class="poster"' + posterStyle(item) + '>' +
      (item.image ? '' : '<span class="poster-symbol">' + escapeHtml(item.emoji || '🎬') + '</span>') +
      '<span class="rating">★ ' + Number(item.rating || 0).toFixed(1) + '</span>' +
      '<div class="poster-badges">' + badgeList(item) + '</div>' +
    '</div>' +
    '<div class="card-body">' +
      '<div class="meta">' + escapeHtml(item.type) + ' · ' + escapeHtml(item.year) + '</div>' +
      '<h3>' + escapeHtml(item.title) + '</h3>' +
      '<p class="tagline">' + escapeHtml(item.tagline) + '</p>' +
      '<div class="genre-line">' + escapeHtml((item.genres||[]).join(' · ')) + '</div>' +
      '<button class="text-button" type="button" data-open="' + escapeHtml(item.id) + '">Ver por qué la recomiendo →</button>' +
    '</div>' +
  '</article>';
}

function render(){
  const visible = sorted(source.filter(function(item){ return includesFilter(item) && matchesSearch(item); }));
  grid.innerHTML = visible.length ? visible.map(cardTemplate).join('') :
    '<div class="empty"><strong>No encontré nada con esos filtros.</strong><span>Prueba otra búsqueda o limpia las categorías.</span></div>';
  resultCount.textContent = visible.length + (visible.length === 1 ? ' recomendación' : ' recomendaciones');
}

function renderEditorialFilters(){
  const tags = Array.from(new Set(source.flatMap(function(item){ return item.editorial || []; }))).sort();
  editorialFilters.innerHTML = tags.length
    ? '<span class="filter-label">También puedes explorar por:</span>' +
      tags.map(function(tag){ return '<button class="micro-chip" data-editorial="' + escapeHtml(tag) + '">' + escapeHtml(tag) + '</button>'; }).join('')
    : '';
}

function renderStats(){
  const movies = source.filter(function(x){return x.type === 'Película';}).length;
  const series = source.filter(function(x){return x.type === 'Serie';}).length;
  const avg = source.length ? source.reduce(function(s,x){return s+Number(x.rating||0);},0)/source.length : 0;
  document.getElementById('heroStats').innerHTML =
    '<span><strong>' + source.length + '</strong> recomendaciones</span>' +
    '<span><strong>' + movies + '</strong> películas</span>' +
    '<span><strong>' + series + '</strong> series</span>' +
    '<span><strong>' + avg.toFixed(1) + '</strong> nota media</span>';
}

function renderHero(){
  const item = source.find(function(x){ return x.featured; }) || source[0];
  if(!item) return;
  if(item.image){
    hero.style.backgroundImage = 'linear-gradient(to top,rgba(6,8,12,.97),rgba(6,8,12,.06)),url("' + item.image + '")';
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
  }
  hero.innerHTML =
    '<span class="mini-label">RECOMENDACIÓN DESTACADA · ' + escapeHtml(item.type) + '</span>' +
    '<div class="featured-placeholder">' + (item.image ? '' : escapeHtml(item.emoji || '🎬')) + '</div>' +
    '<div class="hero-card-tags">' + badgeList(item) + '</div>' +
    '<h2>' + escapeHtml(item.title) + '</h2>' +
    '<p>' + escapeHtml(item.tagline) + '</p>' +
    '<button class="button secondary hero-detail-btn" type="button" data-open="' + escapeHtml(item.id) + '">Ver recomendación</button>';
}

function detailMarkup(item){
  const video = item.videoUrl
    ? '<a class="button primary" target="_blank" rel="noopener" href="' + escapeHtml(item.videoUrl) + '">▶ Ver reseña en video</a>'
    : '';
  return '<div class="detail-hero"' + posterStyle(item) + '>' +
      '<div class="detail-symbol">' + (item.image ? '' : escapeHtml(item.emoji || '🎬')) + '</div>' +
    '</div>' +
    '<div class="detail-body">' +
      '<div class="detail-topline"><span>' + escapeHtml(item.type) + ' · ' + escapeHtml(item.year) + '</span><strong>★ ' + Number(item.rating||0).toFixed(1) + '</strong></div>' +
      '<h2>' + escapeHtml(item.title) + '</h2>' +
      '<p class="detail-tagline">' + escapeHtml(item.tagline) + '</p>' +
      '<div class="dialog-badges">' + badgeList(item) + '</div>' +
      '<div class="detail-section"><span class="detail-label">POR QUÉ LA RECOMIENDO</span><p>' + escapeHtml(item.reason) + '</p></div>' +
      (item.idealFor ? '<div class="detail-section"><span class="detail-label">IDEAL PARA</span><p>' + escapeHtml(item.idealFor) + '</p></div>' : '') +
      '<div class="detail-section"><span class="detail-label">GÉNEROS</span><p>' + escapeHtml((item.genres||[]).join(' · ')) + '</p></div>' +
      '<div class="detail-actions">' + video + '<button class="button ghost" id="shareCurrent" type="button">↗ Compartir</button></div>' +
    '</div>';
}

function openDetail(id, updateHash){
  const item = source.find(function(x){ return x.id === id; });
  if(!item) return;
  dialogContent.innerHTML = detailMarkup(item);
  if(typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open','');
  if(updateHash !== false) history.replaceState(null,'','#r=' + encodeURIComponent(item.id));
  const share = document.getElementById('shareCurrent');
  if(share) share.addEventListener('click', function(){ shareItem(item); });
}

function closeDetail(clearHash){
  if(dialog.open && typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  if(clearHash !== false && location.hash.indexOf('#r=') === 0){
    history.replaceState(null,'',location.pathname + location.search);
  }
}

async function shareItem(item){
  const url = location.origin + location.pathname + '#r=' + encodeURIComponent(item.id);
  const payload = {title:item.title,text:item.tagline,url:url};
  try{
    if(navigator.share) await navigator.share(payload);
    else{
      await navigator.clipboard.writeText(url);
      alert('Enlace copiado al portapapeles.');
    }
  }catch(err){}
}

filters.addEventListener('click', function(e){
  const btn = e.target.closest('[data-filter]');
  if(!btn) return;
  activeFilter = btn.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(function(x){ x.classList.toggle('active', x === btn); });
  render();
});

editorialFilters.addEventListener('click', function(e){
  const btn = e.target.closest('[data-editorial]');
  if(!btn) return;
  const selected = btn.dataset.editorial;
  activeEditorial = activeEditorial === selected ? 'Todos' : selected;
  document.querySelectorAll('[data-editorial]').forEach(function(x){ x.classList.toggle('active', x.dataset.editorial === activeEditorial); });
  render();
});

document.addEventListener('click', function(e){
  const btn = e.target.closest('[data-open]');
  if(btn) openDetail(btn.dataset.open);
});

document.getElementById('dialogClose').addEventListener('click', function(){ closeDetail(); });
dialog.addEventListener('click', function(e){ if(e.target === dialog) closeDetail(); });
input.addEventListener('input', render);
sortSelect.addEventListener('change', render);

document.getElementById('surpriseBtn').addEventListener('click', function(){
  if(!source.length) return;
  const item = source[Math.floor(Math.random()*source.length)];
  openDetail(item.id);
});

document.getElementById('year').textContent = new Date().getFullYear();
renderEditorialFilters();
renderStats();
renderHero();
render();

if(location.hash.indexOf('#r=') === 0){
  const id = decodeURIComponent(location.hash.slice(3));
  setTimeout(function(){ openDetail(id,false); }, 0);
}