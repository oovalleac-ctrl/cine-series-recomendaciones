const original = JSON.parse(JSON.stringify(window.RECOMENDACIONES || []));
let items = JSON.parse(localStorage.getItem('cine-recomendaciones-admin-v2') || 'null') || original;
let editingIndex = -1;

const form = document.getElementById('recommendationForm');
const list = document.getElementById('adminItems');
const statusLine = document.getElementById('statusLine');

function save(){
  localStorage.setItem('cine-recomendaciones-admin-v2', JSON.stringify(items));
  render();
}

function slugify(text){
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

function escapeHtml(value){
  return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
  });
}

function generatedFile(){
  return 'window.RECOMENDACIONES = ' + JSON.stringify(items, null, 2) + ';\n';
}

function render(){
  document.getElementById('adminCounter').textContent =
    items.length + (items.length === 1 ? ' elemento en el borrador' : ' elementos en el borrador');

  list.innerHTML = items.map(function(item,idx){
    const tags = (item.editorial || []).join(', ');
    return '<div class="admin-item">' +
      '<div><strong>' + escapeHtml(item.title) + (item.featured ? ' ★' : '') + '</strong>' +
      '<p>' + escapeHtml(item.type) + ' · ' + escapeHtml(item.year || 's/a') + ' · ★ ' +
      Number(item.rating || 0).toFixed(1) + (tags ? ' · ' + escapeHtml(tags) : '') + '</p></div>' +
      '<div class="admin-item-actions">' +
        '<button class="mini-btn" type="button" data-edit="' + idx + '">Editar</button>' +
        '<button class="mini-btn delete-btn" type="button" data-delete="' + idx + '">Eliminar</button>' +
      '</div></div>';
  }).join('') || '<p>No hay recomendaciones.</p>';
}

function field(id){ return document.getElementById(id); }

function clearForm(){
  form.reset();
  field('rating').value = '8.5';
  field('emoji').value = '🎬';
  editingIndex = -1;
  field('editingBanner').classList.remove('show');
  field('cancelEditBtn').hidden = true;
  field('saveBtn').textContent = 'Agregar recomendación';
}

function loadForEdit(index){
  const item = items[index];
  if(!item) return;
  editingIndex = index;
  field('title').value = item.title || '';
  field('type').value = item.type || 'Película';
  field('yearField').value = item.year || '';
  field('genres').value = (item.genres || []).join(', ');
  field('editorial').value = (item.editorial || []).join(', ');
  field('tagline').value = item.tagline || '';
  field('reason').value = item.reason || '';
  field('idealFor').value = item.idealFor || '';
  field('rating').value = item.rating || 0;
  field('emoji').value = item.emoji || '🎬';
  field('image').value = item.image || '';
  field('videoUrl').value = item.videoUrl || '';
  field('featured').checked = Boolean(item.featured);
  field('editingTitle').textContent = item.title;
  field('editingBanner').classList.add('show');
  field('cancelEditBtn').hidden = false;
  field('saveBtn').textContent = 'Guardar cambios';
  window.scrollTo({top:0,behavior:'smooth'});
}

function collectItem(){
  const title = field('title').value.trim();
  const year = Number(field('yearField').value) || '';
  return {
    id: editingIndex >= 0 && items[editingIndex].id ? items[editingIndex].id : slugify(title + '-' + year),
    title:title,
    type:field('type').value,
    year:year,
    genres:field('genres').value.split(',').map(function(x){return x.trim();}).filter(Boolean),
    editorial:field('editorial').value.split(',').map(function(x){return x.trim();}).filter(Boolean),
    tagline:field('tagline').value.trim(),
    reason:field('reason').value.trim(),
    idealFor:field('idealFor').value.trim(),
    rating:Number(field('rating').value) || 0,
    emoji:field('emoji').value.trim() || '🎬',
    image:field('image').value.trim(),
    videoUrl:field('videoUrl').value.trim(),
    featured:field('featured').checked
  };
}

form.addEventListener('submit', function(e){
  e.preventDefault();
  const item = collectItem();

  if(item.featured){
    items.forEach(function(x){ x.featured = false; });
  }

  if(editingIndex >= 0) items[editingIndex] = item;
  else items.unshift(item);

  save();
  clearForm();
  statusLine.textContent = 'Borrador guardado en este navegador.';
});

list.addEventListener('click', function(e){
  const edit = e.target.closest('[data-edit]');
  if(edit){
    loadForEdit(Number(edit.dataset.edit));
    return;
  }

  const del = e.target.closest('[data-delete]');
  if(!del) return;
  const index = Number(del.dataset.delete);
  if(!confirm('¿Eliminar "' + items[index].title + '" del borrador?')) return;
  items.splice(index,1);
  if(editingIndex === index) clearForm();
  save();
});

field('cancelEditBtn').addEventListener('click', clearForm);

field('resetBtn').addEventListener('click', function(){
  if(!confirm('¿Descartar el borrador y volver a las recomendaciones publicadas?')) return;
  items = JSON.parse(JSON.stringify(original));
  localStorage.removeItem('cine-recomendaciones-admin-v2');
  clearForm();
  render();
  statusLine.textContent = 'Borrador restaurado a la versión publicada.';
});

field('copyBtn').addEventListener('click', async function(){
  try{
    await navigator.clipboard.writeText(generatedFile());
    statusLine.textContent = 'Archivo copiado. Ahora pégalo en GitHub y confirma el commit.';
  }catch(err){
    statusLine.textContent = 'El navegador no permitió copiar automáticamente. Usa Descargar .js.';
  }
});

field('exportBtn').addEventListener('click', function(){
  const blob = new Blob([generatedFile()], {type:'text/javascript;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'recomendaciones.js';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
  statusLine.textContent = 'Archivo descargado.';
});

render();