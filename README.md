# Liga del Este — web

Sitio de la Liga del Este (fútbol formativo, región este de República Dominicana).
HTML, CSS y JavaScript sin dependencias; se publica en GitHub Pages con `.github/workflows/publicar.yml`.

- `index.html`, `historia.html`: páginas.
- `js/data.js`: contenido que se edita a mano (fotos, videos, patrocinadores, redes, contacto).
- `data/dribbli.json` y `logos/dribbli/`: resultados, tablas, líderes y escudos; los genera `scripts/sync_dribbli.py`.
- `.github/workflows/publicar.yml`: publica la web en cada cambio y, lunes y martes, actualiza antes los datos de Dribbli.
- `admin/`: panel de noticias. Guarda cada noticia en `contenido/noticias/*.json` y sus fotos en `fotos/noticias/`.
- `scripts/build_site.py`: arma la carpeta `_site` (lo que se publica) y genera `data/noticias.json` y `noticia-*.html`.

Guía paso a paso: [COMO-ACTUALIZAR.md](COMO-ACTUALIZAR.md).
