# Cómo actualizar la web de la Liga del Este

**Dirección de la web:** https://rijoeslrd.github.io/liga-del-este-web/
**Panel de noticias:** https://rijoeslrd.github.io/liga-del-este-web/admin/

## Noticias (desde el panel, sin tocar código)
1. Entra al panel de noticias desde el celular o la computadora.
2. La primera vez pega tu clave de acceso de GitHub (el panel explica cómo crearla).
3. Toca **Nueva noticia**: título, fecha, tipo, resumen, texto y fotos. Toca **Publicar**.
4. La noticia sale en la web en 1 o 2 minutos. Las 3 más recientes salen en la portada.
5. **Aviso urgente:** marca la casilla y elige hasta qué fecha se ve la franja roja arriba de la web.
Para corregir o borrar una noticia, tócala en la lista del panel y usa **Guardar cambios** o **Borrar noticia**.

Todo lo que cambia se edita en **un solo archivo: `js/data.js`**. Las imágenes van en estas carpetas:

| Qué | Carpeta | Formato recomendado |
|---|---|---|
| Logo de la liga | `logos/` | PNG transparente o SVG, cuadrado |
| Escudos de equipos | `logos/equipos/` | PNG transparente o SVG, cuadrado (~300×300 px) |
| Logos de patrocinadores | `logos/patrocinadores/` | PNG transparente o SVG, horizontal (~400×160 px) |
| Fotos de jornada | `fotos/` | JPG, de unos 1600 px de ancho y menos de 500 KB |

Nombres de archivo: en minúsculas, sin espacios ni tildes (ej. `real-romana.png`, `jornada-21-nov-01.jpg`).

## Logo de la liga
Sale solo de Dribbli. Si quieres usar otra versión: copia el archivo a `logos/liga.png` y en `js/data.js` escribe `export const LEAGUE_LOGO = 'logos/liga.png';`

## Escudos y nombres de los equipos
**Salen solos de Dribbli.** No hay que hacer nada.
Solo si quieres corregir algo, en `js/data.js`:
- `CLUB_LOGOS`: poner un escudo mejor para un club (vale para todos sus equipos):
  `'Academia Real Romana': 'logos/equipos/real-romana.png',`
- `TEAM_NAMES`: cambiar el nombre que se ve de un equipo. El número es el del enlace del equipo en Dribbli:
  `'24179': 'Real Romana Rojo',`

## Patrocinadores
1. Copia el logo a `logos/patrocinadores/`.
2. En `js/data.js` busca `SPONSORS` y agrega una línea:
   `{ name: 'Marca', logo: 'logos/patrocinadores/marca.png', url: 'https://www.marca.com' },`

## Videos y partidos en vivo de YouTube
En `js/data.js` busca `VIDEOS` y pega el enlace en `url`:
`{ title: 'En vivo: Super Copa U12', tag: 'EN VIVO', live: true, url: 'https://www.youtube.com/live/XXXXXXXXXXX' },`
- La miniatura sale sola y el video se ve dentro de la página.
- Para una transmisión en vivo: crea el evento en YouTube Studio, copia su enlace y ponlo aquí antes del partido. Pon `live: true`.
- Se muestran los primeros 4: pon el más nuevo arriba.

## Canal y redes sociales
En `js/data.js` busca `SOCIAL` y pega el enlace de cada perfil. El botón "Ir al canal" usa el de YouTube. Los íconos de redes que estén vacíos no se muestran.

## Fotos de jornada
1. Copia las fotos a `fotos/`.
2. En `js/data.js` busca `GALLERY` y agrega una línea por foto (la más nueva arriba):
   `{ src: 'fotos/jornada-21-nov-01.jpg', alt: 'Qué se ve en la foto', caption: 'Super Copa U12 · 21 nov 2026' },`
Las primeras 6 salen en la portada; todas salen en la página Historia.

## Resultados, partidos, tablas y líderes (automático)
Salen de Dribbli. El programa `scripts/sync_dribbli.py` lee las 11 categorías de la IX edición,
descarga los escudos y guarda todo en `data/dribbli.json`.

- **Automático:** en GitHub, `.github/workflows/publicar.yml` lo corre cada **lunes y martes a las 6:00 a. m.**
  y vuelve a publicar la web. Si nada cambió en Dribbli, la publica igual con los datos que ya tenía.
- **A mano (cuando quieras, ej. el domingo en la noche):** en GitHub → pestaña *Actions* → *Publicar la web* → *Run workflow*.
  O en una computadora con Python: `python3 scripts/sync_dribbli.py`
- El aviso rojo de "Próxima jornada", el cintillo, los números de la portada y la lista de clubes también se calculan solos.

**Para la próxima temporada (X edición):** cambian los números de categoría de Dribbli. Se actualizan en
`CATEGORIES` dentro de `scripts/sync_dribbli.py` y en `DIVISIONS` dentro de `js/data.js`.

**Si Dribbli cambia el diseño de sus páginas**, el programa puede dejar de leerlas. En ese caso no borra nada:
la web sigue mostrando los últimos datos buenos, y en *Actions* aparece la ejecución en rojo.