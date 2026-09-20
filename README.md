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


## V2.2 — Lista personal y TMDb

La lista personal original vive en `data/lista_personal_raw.txt`. Un workflow la normaliza y elimina duplicados exactos, generando `data/watchlist.js`.

La página pública `lista.html` incluye:
- búsqueda y filtros;
- estado "Por ver" / "Vista";
- agrupaciones de la lista original;
- prioridad;
- soporte para portada;
- calificación pública;
- reseña de consenso original;
- enlaces de fuente.

El workflow **Enrich watchlist with TMDb** usa el secret `TMDB_API_TOKEN`. Cuando se ejecuta:
1. busca cada título en TMDb;
2. asigna portada y ficha;
3. incorpora el promedio de usuarios de TMDb como "Calificación pública";
4. genera un texto breve de consenso con redacción original a partir del nivel de valoración y géneros;
5. unifica alias que resuelvan al mismo ID de TMDb;
6. guarda los títulos no identificados en `data/watchlist_unmatched.json`.

### Configuración de TMDb

Crear en GitHub el repository secret `TMDB_API_TOKEN` con un API Read Access Token de TMDb y luego ejecutar manualmente el workflow **Enrich watchlist with TMDb**.

No se realiza scraping de Rotten Tomatoes. El campo está reservado para una futura integración únicamente si existe autorización/licencia adecuada.
