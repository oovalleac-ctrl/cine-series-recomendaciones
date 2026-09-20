# Cine & Series — Recomendaciones (V1)

Sitio estático gratuito para publicar recomendaciones de películas y series.

## Abrirlo
Haz doble clic en `index.html`.

## Agregar recomendaciones
1. Abre `admin.html`.
2. Llena el formulario.
3. Pulsa **Agregar recomendación**.
4. Cuando termines, pulsa **Exportar archivo**.
5. Reemplaza `data/recomendaciones.js` con el archivo exportado.
6. Vuelve a publicar/subir el sitio.

El panel guarda un borrador en el `localStorage` del navegador. Esto significa que el contenido capturado queda guardado en ese navegador, pero para publicarlo para todos debes exportar y reemplazar el archivo.

## Publicación gratis
Opción recomendada: GitHub Pages.

## Estructura
- `index.html`: página pública
- `admin.html`: panel local
- `css/styles.css`: estilos
- `js/app.js`: buscador, filtros y tarjetas
- `js/admin.js`: captura y exportación
- `data/recomendaciones.js`: base de contenido
