const original = JSON.parse(JSON.stringify(window.RECOMENDACIONES || []));
let items = JSON.parse(localStorage.getItem('cine-recomendaciones-admin') || 'null') || original;

const form = document.getElementById('recommendationForm');
const list = document.getElementById('adminItems');

function save(){
  localStorage.setItem('cine-recomendaciones-admin', JSON.stringify(items));
  render();
}

function slugify(text){
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

function render(){
  list.innerHTML = items.map((item, idx) => `
    <div class="admin-item">
      <div>
        <strong>${item.title}</strong>
        <p>${item.type} · ${item.year || 's/a'} · ${(item.genres || []).join(', ')} · ★ ${Number(item.rating || 0).toFixed(1)}</p>
      </div>
      <button class="delete-btn" data-delete="${idx}">Eliminar</button>
    </div>
  `).join('') || '<p>No hay recomendaciones.</p>';
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const item = {
    id: slugify(`${title}-${document.getElementById('yearField').value}`),
    title,
    type: document.getElementById('type').value,
    year: Number(document.getElementById('yearField').value) || '',
    genres: document.getElementById('genres').value.split(',').map(x => x.trim()).filter(Boolean),
    tagline: document.getElementById('tagline').value.trim(),
    reason: document.getElementById('reason').value.trim(),
    idealFor: document.getElementById('idealFor').value.trim(),
    rating: Number(document.getElementById('rating').value) || 0,
    emoji: document.getElementById('emoji').value.trim() || '🎬',
    image: document.getElementById('image').value.trim(),
    videoUrl: document.getElementById('videoUrl').value.trim(),
    featured: items.length === 0
  };
  items.unshift(item);
  save();
  form.reset();
  document.getElementById('rating').value = '8.5';
  document.getElementById('emoji').value = '🎬';
  alert('Recomendación agregada al borrador local.');
});

list.addEventListener('click', e => {
  const btn = e.target.closest('[data-delete]');
  if(!btn) return;
  items.splice(Number(btn.dataset.delete),1);
  save();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if(!confirm('¿Restaurar las recomendaciones originales de esta versión?')) return;
  items = JSON.parse(JSON.stringify(original));
  save();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const content = 'window.RECOMENDACIONES = ' + JSON.stringify(items, null, 2) + ';\n';
  const blob = new Blob([content], {type:'text/javascript;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'recomendaciones.js';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
});

render();