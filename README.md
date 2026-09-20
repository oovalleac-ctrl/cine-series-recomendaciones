# Cine & Series — Recomendaciones V2

Sitio estático gratuito publicado con GitHub Pages para reunir recomendaciones personales de películas y series.

## V2
- Diseño responsive renovado.
- Buscador por título, género, comentario y etiquetas.
- Filtros por películas, series y categorías editoriales.
- Orden por recomendación, calificación, año y título.
- Recomendación aleatoria con “Sorpréndeme”.
- Vista detallada en modal.
- Enlaces directos compartibles a cada recomendación mediante hash.
- Panel V2 para crear, editar y eliminar recomendaciones.
- Una sola recomendación destacada.
- Copiar o descargar recomendaciones.js listo para publicar.

## Administración
Abre admin.html.

El borrador del panel vive únicamente en el localStorage del navegador. Para publicar:
1. Crea o edita las recomendaciones.
2. Pulsa **Copiar archivo**.
3. Pulsa **Abrir archivo en GitHub**.
4. Selecciona todo el contenido del archivo, reemplázalo por el contenido copiado y confirma el commit.
5. GitHub Pages vuelve a desplegar el sitio automáticamente.

También puedes usar **Descargar .js** y sustituir data/recomendaciones.js desde GitHub Desktop.

## Estructura
- index.html — sitio público.
- admin.html — panel de contenido.
- css/styles.css — identidad visual y responsive.
- js/app.js — catálogo, filtros, modal, compartir y búsqueda.
- js/admin.js — edición local y exportación.
- data/recomendaciones.js — contenido publicado.
