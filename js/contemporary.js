const contemporary = Array.isArray(window.CONTEMPORARY_MOVIES) ? window.CONTEMPORARY_MOVIES : [];
const cGrid=document.getElementById('contemporaryGrid');
const cSearch=document.getElementById('contemporarySearch');
const cSort=document.getElementById('contemporarySort');
const cFilters=document.getElementById('contemporaryFilters');
const cCount=document.getElementById('contemporaryCount');
const cMore=document.getElementById('contemporaryMore');
let cGenre='Todos';
let cLimit=48;

function cEsc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function cNorm(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function cItems(){
  const q=cNorm(cSearch.value.trim());
  let items=contemporary.filter(x=>{
    if(cGenre!=='Todos' && !(x.genres||[]).includes(cGenre)) return false;
    if(q && !cNorm([x.title,x.originalTitle,x.year,(x.genres||[]).join(' ')].join(' ')).includes(q)) return false;
    return true;
  });
  if(cSort.value==='rating') items.sort((a,b)=>Number(b.publicRating||0)-Number(a.publicRating||0)||Number(b.voteCount||0)-Number(a.voteCount||0));
  else if(cSort.value==='votes') items.sort((a,b)=>Number(b.voteCount||0)-Number(a.voteCount||0));
  else if(cSort.value==='newest') items.sort((a,b)=>Number(b.year||0)-Number(a.year||0)||Number(b.weightedScore||0)-Number(a.weightedScore||0));
  else items.sort((a,b)=>Number(a.rank||999)-Number(b.rank||999));
  return items;
}
function cBlurb(x){
  if(x.blurb) return x.blurb;
  const g=(x.genres||[]).slice(0,2).join(' y ').toLowerCase();
  return g ? 'Una de las películas contemporáneas mejor valoradas dentro de '+g+'.' : 'Una de las películas contemporáneas mejor valoradas por el público.';
}
function cCard(x){
  const poster=x.poster? ' style="background-image:url(\''+cEsc(x.poster)+'\')"' : '';
  const tmdb=x.tmdbUrl?'<a class="contemporary-source" target="_blank" rel="noopener" href="'+cEsc(x.tmdbUrl)+'">TMDB ↗</a>':'';
  return '<article class="contemporary-card">'+
    '<div class="contemporary-poster"'+poster+'>'+
      (x.poster?'':'<span class="top-placeholder">🎬</span>')+
      '<span class="contemporary-rank">#'+cEsc(x.rank)+'</span>'+
      '<span class="contemporary-score">★ '+Number(x.publicRating||0).toFixed(1)+'</span>'+
    '</div>'+
    '<div class="contemporary-body">'+
      '<div class="meta">'+cEsc(x.year)+' · '+cEsc((x.genres||[]).slice(0,2).join(' / '))+'</div>'+
      '<h3>'+cEsc(x.title)+'</h3>'+
      '<p>'+cEsc(cBlurb(x))+'</p>'+
      '<div class="contemporary-foot"><span>'+Number(x.voteCount||0).toLocaleString('es-MX')+' votos</span>'+tmdb+'</div>'+
    '</div>'+
  '</article>';
}
function renderContemporary(){
  const items=cItems(),shown=items.slice(0,cLimit);
  cGrid.innerHTML=shown.length?shown.map(cCard).join(''):'<div class="empty"><strong>No hay coincidencias.</strong></div>';
  cCount.textContent=items.length+' películas';
  cMore.hidden=shown.length>=items.length;
}
cFilters.addEventListener('click',e=>{
  const b=e.target.closest('[data-cgenre]');if(!b)return;
  cGenre=b.dataset.cgenre;cLimit=48;
  document.querySelectorAll('[data-cgenre]').forEach(x=>x.classList.toggle('active',x===b));
  renderContemporary();
});
cSearch.addEventListener('input',()=>{cLimit=48;renderContemporary();});
cSort.addEventListener('change',renderContemporary);
cMore.addEventListener('click',()=>{cLimit+=48;renderContemporary();});
renderContemporary();
