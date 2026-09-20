const topAll = Array.isArray(window.TOP_ALL_TIME) ? window.TOP_ALL_TIME : [];
const topGrid = document.getElementById('topAllGrid');
const topTabs = document.getElementById('topAllTabs');
const topSearch = document.getElementById('topAllSearch');
const topCount = document.getElementById('topAllCount');
const topMore = document.getElementById('topAllMore');
let topType = 'Película';
let topLimit = 24;

function topEsc(v=''){
  return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function topNorm(v=''){
  return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function topBlurb(item){
  if(item.blurb) return item.blurb;
  const genres=(item.genres||[]).slice(0,2).join(' y ').toLowerCase();
  if(item.rank<=10) return 'Una obra fundamental del canon audiovisual y una referencia habitual en listas históricas.';
  if(item.rank<=35) return genres ? 'Una referencia muy influyente de '+genres+', ampliamente reconocida por crítica y público.' : 'Una de las obras más influyentes y reconocidas de su medio.';
  return genres ? 'Una recomendación esencial para explorar '+genres+' y ampliar tu cultura audiovisual.' : 'Una recomendación esencial para ampliar tu cultura audiovisual.';
}
function topCard(item){
  const style=item.poster ? ' style="background-image:url(\''+topEsc(item.poster)+'\')"' : '';
  const rating=item.publicRating!=null ? '<span class="top-score">★ '+Number(item.publicRating).toFixed(1)+' <small>TMDB</small></span>' : '';
  const source=item.tmdb && item.tmdb.url ? '<a class="top-source" href="'+topEsc(item.tmdb.url)+'" target="_blank" rel="noopener">TMDB ↗</a>' : '';
  return '<article class="top-card">'+
    '<div class="top-poster"'+style+'>'+
      (item.poster?'':'<span class="top-placeholder">🎞️</span>')+
      '<span class="top-rank">#'+item.rank+'</span>'+rating+
    '</div>'+
    '<div class="top-card-body">'+
      '<div class="meta">'+topEsc(item.type)+' · '+topEsc(item.year)+'</div>'+
      '<h3>'+topEsc(item.title)+'</h3>'+
      '<p>'+topEsc(topBlurb(item))+'</p>'+
      '<div class="top-meta-line">'+
        '<span>'+topEsc((item.genres||[]).slice(0,3).join(' · '))+'</span>'+source+
      '</div>'+
    '</div>'+
  '</article>';
}
function renderTopAll(){
  const q=topNorm(topSearch.value.trim());
  const filtered=topAll.filter(x=>x.type===topType && (!q || topNorm([x.title,x.year,(x.genres||[]).join(' ')].join(' ')).includes(q)));
  const shown=filtered.slice(0,topLimit);
  topGrid.innerHTML=shown.map(topCard).join('');
  topCount.textContent=filtered.length+' '+(topType==='Película'?'películas':'series');
  topMore.hidden=shown.length>=filtered.length;
}
topTabs.addEventListener('click',e=>{
  const b=e.target.closest('[data-top-type]');
  if(!b)return;
  topType=b.dataset.topType;
  topLimit=24;
  document.querySelectorAll('[data-top-type]').forEach(x=>x.classList.toggle('active',x===b));
  renderTopAll();
});
topSearch.addEventListener('input',()=>{topLimit=24;renderTopAll();});
topMore.addEventListener('click',()=>{topLimit+=24;renderTopAll();});
renderTopAll();
