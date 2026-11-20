# Liga del Este — web

Sitio de la Liga del Este (fútbol formativo, región este de República Dominicana).
HTML, CSS y JavaScript sin dependencias; se publica en Netlify.

- `index.html`, `historia.html`: páginas.
- `js/data.js`: contenido que se edita a mano (fotos, videos, patrocinadores, redes, contacto).
- `data/dribbli.json` y `logos/dribbli/`: resultados, tablas, líderes y escudos; los genera `scripts/sync_dribbli.py`.
- `.github/workflows/actualizar-dribbli.yml`: actualiza los datos de Dribbli cada lunes y martes.

Guía paso a paso: [COMO-ACTUALIZAR.md](COMO-ACTUALIZAR.md).
