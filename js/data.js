// Configuración y contenido de la web de la Liga del Este.
//
// Los resultados, partidos, tablas, líderes y escudos salen de
// data/dribbli.json, que se actualiza solo con scripts/sync_dribbli.py.
// Los datos de muestra de abajo (TEAMS, CATEGORY_DATA) solo se usan si
// ese archivo no se puede cargar.

export const TEAMS = {
  rra: ['Real Romana Azul', 'RR', '#1F4FD1'],
  rrr: ['Real Romana Rojo', 'RR', '#C8102E'],
  rrp: ['Real Romana', 'RR', '#1F4FD1'],
  efa: ['Elite Football Academy', 'EF', '#111827'],
  dsa: ['Downtown Amarillo', 'DS', '#B7791F'],
  dsz: ['Downtown Azul', 'DS', '#1E3A8A'],
  dsu: ['Downtown Soccer Academy', 'DS', '#1E3A8A'],
  dsd: ['Deportivo Santo Domingo', 'DSD', '#047857'],
  esc: ['Escudefut Jamp', 'EJ', '#7C3AED'],
  spa: ['Spado Soccer Academy', 'SP', '#B91C1C'],
  spr: ['Spado Rojo', 'SP', '#B91C1C'],
  spb: ['Spado Blanco', 'SP', '#475569'],
  rfc: ['Romana FC', 'RFC', '#9D174D'],
  ray: ['Rayos del Este', 'RE', '#CA8A04'],
  gar: ['Garrincha FC', 'GFC', '#15803D'],
  ram: ['FC Ramsar', 'FCR', '#0F766E'],
  ric: ['Richard FC', 'RIC', '#7F1D1D'],
  hig: ['Higüeyanos FC', 'HFC', '#C2410C'],
  dv7: ['DV7 Academy', 'DV7', '#334155'],
  tbd: ['Por definir', '?', '#94A3B8']
};

export const team = (k) => {
  const t = TEAMS[k] || TEAMS.tbd;
  return { name: t[0], ini: t[1], color: t[2], logo: '' };
};

/* =========================================================
   ESCUDOS Y NOMBRES DE LOS EQUIPOS
   Los escudos y nombres salen SOLOS de Dribbli. Usa esto solo para
   corregir algo:

   CLUB_LOGOS: poner un escudo mejor para un club (vale para todos sus
   equipos). Copia el archivo a  logos/equipos/  y escribe el nombre del
   club tal como sale en la web:
     'Academia Real Romana': 'logos/equipos/real-romana.png',

   TEAM_NAMES: cambiar cómo se ve el nombre de un equipo. El número es el
   que sale en el enlace del equipo en Dribbli (app.dribbli.com/teams/24179):
     '24179': 'Real Romana Rojo',
   ========================================================= */
export const CLUB_LOGOS = {
};

export const TEAM_NAMES = {
};

/* =========================================================
   LOGO DE LA LIGA
   Copia el logo a  logos/liga.png  (o .svg) y escribe la ruta aquí.
   Reemplaza el círculo "LDE" del menú y del pie de página.
   ========================================================= */
export const LEAGUE_LOGO = 'logos/liga.png'; // logo en alta resolución (si se deja vacío, se usa el de Dribbli)

/* =========================================================
   REDES SOCIALES Y CANAL DE YOUTUBE
   Pega el enlace completo de cada perfil. Los que queden vacíos
   no se muestran en el pie de página.
   ========================================================= */
export const SOCIAL = {
  youtube: 'https://www.youtube.com/@ligadeleste',
  instagram: 'https://www.instagram.com/ligadeleste_rd/',
  tiktok: 'https://www.tiktok.com/@ligadeleste',
  facebook: 'https://www.facebook.com/ligadelesterd/'
};

const LE = 'La Estación, La Romana';

// Partido: [local, golesLocal, golesVisita, visita, fecha, hora, sede]
// Tabla:   [equipo, PJ, G, E, P, GF, GC, PTS]
export const CATEGORY_DATA = {
  '3719': {
    res: [['efa', 1, 3, 'rra', 'Sáb 14 nov', '12:30 PM', LE], ['dsa', 3, 1, 'efa', 'Vie 30 oct', '6:10 PM', LE]],
    prox: [['rra', null, null, 'tbd', 'Sáb 28 nov', '12:50 PM', LE]],
    tabla: null
  },
  '3751': {
    res: [['rrr', 0, 2, 'dsd', 'Dom 15 nov', '12:20 PM', LE], ['efa', 1, 1, 'rra', 'Dom 15 nov', '10:00 AM', LE], ['esc', 2, 0, 'dsz', 'Sáb 14 nov', '11:40 AM', 'Cancha de Fútbol, Seibo']],
    prox: [['rra', null, null, 'rrr', 'Sáb 28 nov', '10:10 AM', LE], ['spa', null, null, 'efa', 'Sáb 28 nov', '11:10 AM', 'La Salle, Higüey'], ['dsa', null, null, 'dsz', 'Sáb 28 nov', '2:35 PM', LE]],
    tabla: [['dsd', 2, 2, 0, 0, 10, 1, 6], ['esc', 2, 1, 0, 1, 2, 1, 3], ['dsa', 1, 1, 0, 0, 1, 0, 3], ['rrr', 2, 1, 0, 1, 1, 2, 3], ['rra', 1, 0, 1, 0, 1, 1, 1], ['efa', 2, 0, 1, 1, 1, 2, 1], ['spa', 0, 0, 0, 0, 0, 0, 0], ['dsz', 2, 0, 0, 2, 1, 10, 0]]
  },
  '3754': {
    res: [['efa', 7, 0, 'rra', 'Dom 15 nov', '9:00 AM', LE], ['ric', 0, 7, 'spb', 'Sáb 14 nov', '10:40 AM', 'Cancha de Fútbol, Seibo']],
    prox: [['spr', null, null, 'efa', 'Sáb 28 nov', '9:00 AM', 'La Salle, Higüey'], ['rra', null, null, 'rrr', 'Sáb 28 nov', '9:00 AM', LE], ['dsa', null, null, 'spr', 'Sáb 28 nov', '9:00 AM', 'Ciudad Deportiva Downtown, Punta Cana']],
    tabla: null
  },
  '3757': {
    res: [['rfc', 8, 2, 'ram', 'Sáb 31 oct', '12:30 PM', LE], ['dsu', 8, 1, 'spa', 'Sáb 31 oct', '11:45 AM', LE], ['gar', 11, 0, 'rra', 'Sáb 31 oct', '11:05 AM', LE]],
    prox: [['rfc', null, null, 'ray', 'Sáb 21 nov', '9:00 AM', LE], ['dsu', null, null, 'gar', 'Sáb 21 nov', '9:00 AM', 'Ciudad Deportiva Downtown, Punta Cana'], ['ram', null, null, 'rra', 'Sáb 21 nov', '9:00 AM', 'FC Ramsar']],
    tabla: [['gar', 2, 2, 0, 0, 18, 2, 6], ['dsu', 2, 2, 0, 0, 12, 2, 6], ['rfc', 2, 1, 0, 1, 9, 6, 3], ['ray', 2, 1, 0, 1, 10, 9, 3], ['rra', 2, 1, 0, 1, 2, 12, 3], ['spa', 2, 0, 0, 2, 2, 10, 0], ['ram', 2, 0, 0, 2, 4, 16, 0]]
  },
  '3717': {
    res: [['efa', 2, 0, 'hig', 'Dom 15 nov', '5:30 PM', LE], ['rrp', 0, 2, 'dsd', 'Dom 15 nov', '1:30 PM', LE]],
    prox: [['hig', null, null, 'rrp', 'Vie 20 nov', '7:30 PM', LE], ['dv7', null, null, 'efa', 'Sáb 21 nov', '10:00 PM', 'Cancha Banreserva, Santo Domingo'], ['dsd', null, null, 'hig', 'Sáb 5 dic', '11:00 AM', 'UAS, Santo Domingo']],
    tabla: null
  }
};

// [equipos, jugadores, partidos] por categoría
export const CATEGORY_META = {
  '3750': [7, 189, 42], '3751': [8, 231, 53], '3752': [7, 126, 42], '3753': [6, 104, 30],
  '3754': [8, 90, 56], '3719': [5, 156, 20], '3755': [6, 98, 27], '3756': [6, 112, 26],
  '3757': [7, 113, 42], '3758': [7, 104, 44], '3717': [5, 176, 20]
};

export const DIVISIONS = [
  { id: 'premier', name: 'Premier', color: '#1F4FD1', short: 'PR', kicker: 'DIVISIÓN DE ÉLITE', totals: [41, 896, 243],
    cats: [['3754', 'U8'], ['3753', 'U10'], ['3752', 'U12'], ['3751', 'U14'], ['3750', 'U16'], ['3719', 'U18']] },
  { id: 'super', name: 'Super Copa', color: '#D7263D', short: 'SC', kicker: 'COMPETENCIA FORMATIVA', totals: [26, 427, 139],
    cats: [['3758', 'U10'], ['3757', 'U12'], ['3756', 'U14'], ['3755', 'U16']] },
  { id: 'primera', name: 'Primera División', color: '#0E1B3D', short: '1D', kicker: 'CATEGORÍA ABIERTA', totals: [5, 176, 20],
    cats: [['3717', 'Open']] }
];

export const TICKER_ORDER = [
  ['3751', 'PREMIER U14'], ['3717', 'PRIMERA'], ['3719', 'PREMIER U18'], ['3754', 'PREMIER U8'], ['3757', 'SUPER COPA U12']
];

export const HERO_CRESTS = ['rra', 'efa', 'dsd', 'gar', 'rfc'];

export const STATS = [
  { num: '72', label: 'Equipos' },
  { num: '1.5k+', label: 'Jugadores' },
  { num: '11', label: 'Categorías' }
];

/* =========================================================
   VIDEOS DE YOUTUBE (sección "Liga del Este TV")
   Para cada video pega el enlace de YouTube en  url  (sirve cualquier
   forma: youtube.com/watch?v=…, youtu.be/…, youtube.com/live/…).
   La miniatura sale sola desde YouTube y el video se ve dentro de la
   página. Para un partido en vivo, pega el enlace de la transmisión
   y pon  live: true  (sale la etiqueta roja EN VIVO).
   Se muestran los primeros 4.
   ========================================================= */
export const VIDEOS = [
  { title: 'Downtown Soccer Academy vs Élite Football · Jornada 1 · Premier U18', tag: 'PARTIDO COMPLETO', url: 'https://www.youtube.com/watch?v=pIB70FOTW2w' },
  { title: 'Resumen: Downtown SA 5–2 Aspiras · Jornada 4 · Premier U18', tag: 'RESUMEN', url: 'https://www.youtube.com/watch?v=xLgd1QKaoe4' },
  { title: 'Final Primera División: Atlético Romana Jr vs Real Romana FC', tag: 'FINAL', url: 'https://www.youtube.com/watch?v=manYSR8KTN8' },
  // Tarjeta fija que lleva a la lista de transmisiones del canal (no hay que cambiarla cada semana):
  { title: 'Todas las transmisiones en vivo de la liga', tag: 'EN VIVO', live: true, url: 'https://www.youtube.com/@ligadeleste/streams' }
];

export const CLUBS = ['rrp', 'efa', 'dsu', 'dsd', 'spa', 'rfc', 'gar', 'ray', 'ram', 'ric', 'hig', 'dv7', 'esc'];

/* =========================================================
   PATROCINADORES
   1. Copia el logo a  logos/patrocinadores/  (PNG transparente o SVG,
      horizontal, de unos 400×160 px).
   2. Agrega una línea con el nombre, el logo y (si quieres) su página web.
   Si hay menos patrocinadores que espacios, el resto dice "TU MARCA AQUÍ".
   ========================================================= */
export const SPONSORS = [
  // { name: 'Nombre de la marca', logo: 'logos/patrocinadores/marca.png', url: 'https://www.marca.com' },
  { name: 'Rijo Forchue', logo: 'logos/patrocinadores/rijo-forchue.png', url: 'https://www.instagram.com/rijoforchuestudio/' },
];

/* =========================================================
   POP-UP (ventana que aparece una vez cada pocos días)
   - Si hay un patrocinador activo (active: true y dentro de las fechas "desde"/"hasta",
     si se ponen), sale su anuncio. Si no, sale la invitación al Instagram de la liga.
   - Para apagar el pop-up del todo: enabled: false
   - Fechas en formato 'AAAA-MM-DD'. Vacías = sin límite.
   ========================================================= */
export const POPUP = {
  enabled: true,
  delaySeconds: 9,      // segundos antes de aparecer
  everyDays: 3,         // no vuelve a salir a la misma persona antes de estos días
  sponsor: {
    active: true,
    name: 'Rijo Forchue',
    logo: 'logos/patrocinadores/rijo-forchue.png',
    text: 'Rijo Forchue apoya el fútbol formativo del este. Conoce su trabajo.',
    button: 'Ver en Instagram',
    url: 'https://www.instagram.com/rijoforchuestudio/',
    desde: '',
    hasta: ''
  },
  instagram: {
    title: 'Síguenos en Instagram',
    text: 'Resultados, fotos y videos de cada jornada en @ligadeleste_rd.',
    button: 'Seguir en Instagram'
  }
};

/* =========================================================
   CONTACTO DE LA LIGA
   whatsapp: el mismo número con el código del país (1) y sin guiones.
   ========================================================= */
/* Enlaces que usan los botones de la web. El reglamento debe estar compartido en
   Google Drive como "Cualquier persona con el enlace" para que los padres lo puedan abrir. */
/* =========================================================
   IMÁGENES PARA INSTAGRAM (botón "Descargar para Instagram")
   SHARE_SPONSOR: el patrocinador que sale en la franja de abajo de cada imagen.
   Para quitar la franja, deja:  export const SHARE_SPONSOR = null;
   SITE_URL: la dirección que aparece abajo en las imágenes.
   ========================================================= */
export const SHARE_SPONSOR = { name: 'Rijo Forchue', logo: 'logos/patrocinadores/rijo-forchue.png' };
export const SITE_URL = 'rijoeslrd.github.io/liga-del-este-web';

/* =========================================================
   BOLETÍN (Brevo)
   action: la dirección del formulario "Web Liga del Este" en Brevo
   (Marketing → Formularios → Compartir → código HTML, el action="..." del <form>).
   Si se deja vacío, el bloque de suscripción no aparece y las descargas no la piden.
   ========================================================= */
export const NEWSLETTER = {
  action: 'https://8263d021.sibforms.com/serve/MUIFAHltghgP_6Ukeq21lfprEw1eyxtMQNVVQyA0rtOtaILEH-6JJC4wwuvKUqEX9VQWHrtMOKskV5JKu_T7zsUQEUXgV3d5mp3VvcIG2E7wq426-0wsVZfVO9wd55A4uI92_Kce6wwMsf_Er8W2Cx3VY1I2mPjzlifDqi_J-j0R4u1wm7EkmVK6TlVpJAIs01w8qOu9EemnHQpYVQ=='
};

export const LINKS = {
  reglamento: 'https://drive.google.com/drive/folders/1HwOxD4nwaL37IVl1x7W2x7lbtNRferh2?usp=sharing'
};

export const CONTACT = {
  phone: '809-790-6157',
  whatsapp: '18097906157',
  email: 'cm@eslrd.com'
};

export const SPONSOR_SLOTS = 5;

/* =========================================================
   FOTOS DE JORNADA
   Para agregar una foto:
   1. Copia la imagen a la carpeta  fotos/  (ej. fotos/jornada-21-nov-01.jpg)
   2. Agrega una línea aquí abajo con su nombre, una descripción (alt) y,
      si quieres, un pie de foto.
   Las más recientes arriba. Las primeras 6 salen en la portada;
   todas salen en la página Historia.
   Mientras no haya ninguna foto, se muestran espacios vacíos de muestra.
   ========================================================= */
export const GALLERY = [
  // { src: 'fotos/jornada-21-nov-01.jpg', alt: 'Gol de Garrincha FC en la Super Copa U12', caption: 'Super Copa U12 · 21 nov 2026' },
  { src: 'fotos/arbitros-y-capitanes.jpg', alt: 'Los capitanes de ambos equipos junto al trío arbitral en el centro del campo antes del partido' },
  { src: 'fotos/celebracion-spado.jpg', alt: 'Jugadores de Spado Soccer celebran con un compañero arrodillado en la grama' },
  { src: 'fotos/duelo-frente-al-arco.jpg', alt: 'Dos niños disputan el balón frente al arco' },
  { src: 'fotos/pase-en-el-mediocampo.jpg', alt: 'Jugadores de amarillo y azul pelean un balón dividido con un rival' },
  { src: 'fotos/jornada-estadio-presentacion.jpg', alt: 'Equipos formados en la cancha frente a la tribuna llena de familias antes de iniciar la jornada' },
];

/* FOTO DE PORTADA: la foto grande al lado del titular en la página de inicio. */
export const HERO_PHOTO = {
  src: 'fotos/jornada-estadio-presentacion.jpg',
  alt: 'Presentación de equipos en la cancha, con la tribuna llena de familias',
  position: '38% center' // qué parte de la foto se ve cuando se recorta (horizontal vertical)
};

export const GALLERY_SLOTS_HOME = 6;
export const GALLERY_SLOTS_HISTORY = 14;

/* =========================================================
   HISTORIA: línea del tiempo de la página Historia.
   Cada tarjeta: num (lo grande), label (lo pequeño de arriba), dates, note.
   current: true resalta la tarjeta en rojo (la edición actual).
   ========================================================= */
export const EDITIONS = [
  { num: '2021', label: 'EL INICIO', dates: 'Nace la Liga del Este', note: 'La primera competición organizada de fútbol para niños y jóvenes de la región este del país.' },
  { num: 'I–VIII', label: 'EDICIONES', dates: 'Crecer junto a las academias', note: 'Con academias de fútbol colaboradoras, la liga se consolida y gana popularidad en las comunidades del este.' },
  { num: 'IX', label: 'EDICIÓN ACTUAL', dates: '24 oct 2026 — 19 jun 2027', note: '72 equipos en 3 divisiones y 11 categorías.', current: true }
];

export const VENUES = [
  { name: 'La Estación', place: 'La Romana' },
  { name: 'Ciudad Deportiva Downtown', place: 'Punta Cana' },
  { name: 'FC Ramsar', place: 'Región Este' },
  { name: 'La Salle', place: 'Higüey' },
  { name: 'Cancha de Fútbol', place: 'Seibo' },
  { name: 'Cancha Banreserva', place: 'Santo Domingo' },
  { name: 'UAS', place: 'Santo Domingo' }
];
