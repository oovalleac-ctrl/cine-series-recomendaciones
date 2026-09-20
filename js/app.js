const source = Array.isArray(window.RECOMENDACIONES) ? window.RECOMENDACIONES : [];
const grid = document.getElementById('recommendationGrid');
const input = document.getElementById('searchInput');
const filters = document.getElementById('filters');
const hero = document.getElementById('heroFeatured');
let activeFilter = 'Todos';

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function includesFilter(item){
  if(activeFilter === 'Todos') return true;
  if(item.type === activeFilter) return true;
  return (item.genres || []).includes(activeFilter);
}

function matchesSearch(item){
  const q = input.value.trim().toLowerCase();
  if(!q) return true;
  const haystack = [
    item.title,item.type,item.year,(item.genres||[]).join(' '),
    item.tagline,item.reason,item.idealFor
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

function cardTemplate(item){
  const imageStyle = item.image ? `style="background-image:url('${escapeHtml(item.image)}')"` : '';
  const video = item.videoUrl
    ? `<a class="video-link" target="_blank" rel="noopener" href="${escapeHtml(item.videoUrl)}">▶ Ver reseña en video</a>`
    : '';
  return `
    <article class="card">
      <div class="poster" ${imageStyle}>
        ${item.image ? '' : `<span>${escapeHtml(item.emoji || '🎬')}</span>`}
        <span class="rating">★ ${Number(item.rating || 0).toFixed(1)}</span>
      </div>
      <div class="card-body">
        <div class="meta">${escapeHtml(item.type)} · ${escapeHtml(item.year)} · ${escapeHtml((item.genres||[]).join(' / '))}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="tagline">${escapeHtml(item.tagline)}</p>
        <p class="reason">${escapeHtml(item.reason)}</p>
        ${item.idealFor ? `<div class="ideal"><strong>Ideal para:</strong> ${escapeHtml(item.idealFor)}</div>` : ''}
        ${video}
      </div>
    </article>
  `;
}

function render(){
  const visible = source.filter(item => includesFilter(item) && matchesSearch(item));
  grid.innerHTML = visible.length ? visible.map(cardTemplate).join('') :
    `<div class="empty">No encontré recomendaciones con esos filtros.</div>`;
}

function renderHero(){
  const item = source.find(x => x.featured) || source[0];
  if(!item) return;
  if(item.image){
    hero.style.backgroundImage = `linear-gradient(to top,rgba(6,8,12,.96),rgba(6,8,12,.05)),url("${item.image}")`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
  }
  hero.innerHTML = `
    <span class="mini-label">DESTACADA · ${escapeHtml(item.type)}</span>
    <div class="featured-placeholder">${item.image ? '' : escapeHtml(item.emoji || '🎬')}</div>
    <h2>${escapeHtml(item.title)}</h2>
    <p>${escapeHtml(item.tagline)}</p>
  `;
}

filters.addEventListener('click', e => {
  const btn = e.target.closest('[data-filter]');
  if(!btn) return;
  activeFilter = btn.dataset.filter;
  document.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === btn));
  render();
});
input.addEventListener('input', render);
document.getElementById('year').textContent = new Date().getFullYear();
renderHero();
render();