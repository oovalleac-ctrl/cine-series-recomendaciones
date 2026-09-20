const allItems = Array.isArray(window.WATCHLIST) ? window.WATCHLIST : [];
const grid = document.getElementById('watchGrid');
const search = document.getElementById('watchSearch');
const sort = document.getElementById('watchSort');
const groupFilter = document.getElementById('groupFilter');
const filterWrap = document.getElementById('watchFilters');
const count = document.getElementById('watchCount');
const loadMore = document.getElementById('loadMoreBtn');
let activeStatus = 'todos';
let limit = 48;

function esc(v){
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function norm(v){
  return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function hasData(item){
  return Boolean(item.poster || item.tmdb || item.publicRating || item.review);
}
function visibleItems(){
  const q = norm(search.value.trim());
  const group = groupFilter.value;
  let items = allItems.filter(item => {
    if(activeStatus === 'por-ver' && item.status !== 'por-ver') return false;
    if(activeStatus === 'vista' && item.status !== 'vista') return false;
    if(activeStatus === 'con-datos' && !hasData(item)) return false;
    if(group !== 'todos' && !(item.groups || []).includes(group)) return false;
    if(q){
      const hay = norm([item.title,(item.groups||[]).join(' '),item.note,item.review].join(' '));
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  if(sort.value === 'title') items.sort((a,b) => a.title.localeCompare(b.title,'es'));
  if(sort.value === 'group') items.sort((a,b) => ((a.groups||[])[0]||'').localeCompare(((b.groups||[])[0]||''),'es') || a.title.localeCompare(b.title,'es'));
  if(sort.value === 'rating') items.sort((a,b) => Number(b.publicRating||0)-Number(a.publicRating||0) || a.title.localeCompare(b.title,'es'));
  return items;
}
function card(item){
  const image = item.poster ? ' style="background-image:url(\'' + esc(item.poster) + '\')"' : '';
  const rating = item.publicRating != null ? '<span class="watch-rating">★ ' + Number(item.publicRating).toFixed(1) + ' <small>TMDb</small></span>' : '<span class="watch-rating muted">Sin calificar</span>';
  const status = item.status === 'vista' ? '<span class="seen-badge">✓ Vista</span>' : '<span class="todo-badge">Por ver</span>';
  const review = item.review ? '<p class="watch-review">' + esc(item.review) + '</p>' : '';
  const note = item.note ? '<p class="watch-note">' + esc(item.note) + '</p>' : '';
  return '<article class="watch-card">' +
    '<div class="watch-poster"' + image + '>' +
      (item.poster ? '' : '<span>🎬</span>') +
      status +
    '</div>' +
    '<div class="watch-card-body">' +
      '<div class="watch-group">' + esc((item.groups||[]).join(' · ')) + '</div>' +
      '<h3>' + esc(item.title) + (item.year ? ' <small>(' + esc(item.year) + ')</small>' : '') + '</h3>' +
      rating +
      review + note +
      (item.priority ? '<span class="priority-badge">★ Prioridad</span>' : '') +
    '</div>' +
  '</article>';
}
function render(){
  const items = visibleItems();
  const shown = items.slice(0,limit);
  grid.innerHTML = shown.length ? shown.map(card).join('') :
    '<div class="empty"><strong>No hay resultados.</strong><span>Prueba otro filtro o término de búsqueda.</span></div>';
  count.textContent = items.length + (items.length === 1 ? ' título' : ' títulos');
  loadMore.hidden = shown.length >= items.length;
}
function init(){
  const groups = Array.from(new Set(allItems.flatMap(x => x.groups || []))).sort((a,b) => a.localeCompare(b,'es'));
  groupFilter.innerHTML += groups.map(g => '<option value="' + esc(g) + '">' + esc(g) + '</option>').join('');
  const seen = allItems.filter(x => x.status === 'vista').length;
  const enriched = allItems.filter(hasData).length;
  document.getElementById('watchStats').innerHTML =
    '<span><strong>' + allItems.length + '</strong> títulos únicos</span>' +
    '<span><strong>' + (allItems.length-seen) + '</strong> por ver</span>' +
    '<span><strong>' + seen + '</strong> vistos</span>' +
    '<span><strong>' + enriched + '</strong> fichas enriquecidas</span>';
  document.getElementById('year').textContent = new Date().getFullYear();
  render();
}
filterWrap.addEventListener('click', e => {
  const b = e.target.closest('[data-status]');
  if(!b) return;
  activeStatus = b.dataset.status;
  limit = 48;
  document.querySelectorAll('[data-status]').forEach(x => x.classList.toggle('active',x===b));
  render();
});
search.addEventListener('input', () => {limit=48;render();});
sort.addEventListener('change', render);
groupFilter.addEventListener('change', () => {limit=48;render();});
loadMore.addEventListener('click', () => {limit += 48;render();});
init();