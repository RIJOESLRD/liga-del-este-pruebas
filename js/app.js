import {
  DIVISIONS, HERO_CRESTS, STATS, VIDEOS, SPONSOR_SLOTS, SPONSORS, LEAGUE_LOGO, SOCIAL,
  GALLERY, GALLERY_SLOTS_HOME, GALLERY_SLOTS_HISTORY, HERO_PHOTO, LINKS, EDITIONS, VENUES
} from './data.js';
import {
  loadLeague, catLabel, recentResults, nextMatchday, clubs, totals, updatedLabel, dateLong, venueShort
} from './league.js';
import { initForms, waLink } from './forms.js';
import { openShare } from './share.js';
import { initNewsletter, requireSubscription } from './newsletter.js';
import { initPopup } from './popup.js';

const L = await loadLeague();
const team = (id) => L.teams[id] || { name: 'Por definir', ini: '?', color: '#94A3B8', logo: '' };

const $ = (sel, root = document) => root.querySelector(sel);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const crestOf = (t, cls = '') => {
  if (t.logo) {
    return `<span class="crest crest--logo ${cls}" aria-hidden="true"><img src="${esc(t.logo)}" alt=""></span>`;
  }
  return `<span class="crest ${cls}" style="background:${t.color}" aria-hidden="true">${esc(t.ini)}</span>`;
};
const crest = (id, cls = '') => crestOf(team(id), cls);

// Saca el código del video de cualquier enlace de YouTube.
const youtubeId = (url) => {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|\/live\/|\/shorts\/|\/embed\/)([\w-]{11})/);
  return m ? m[1] : '';
};

const ICON_PIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6B8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.5"></circle></svg>';
const ICON_INFO = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1F4FD1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v4M12 16h.01"></path></svg>';
const ICON_PLAY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#D7263D" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>';
const ICON_OUT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"></path></svg>';

/* ---------- Secciones estáticas (se generan una vez) ---------- */

function renderTicker() {
  const html = recentResults(L).map((m) =>
    `<div class="ticker__item">
      <span class="ticker__cat">${esc(catLabel(m.cat).text)}</span>
      <span class="ticker__team">${esc(team(m.home).name)}</span>
      <span class="ticker__score">${m.hs} – ${m.as}</span>
      <span class="ticker__team">${esc(team(m.away).name)}</span>
    </div>`).join('');
  // Duplicado para que el desplazamiento sea continuo; la copia se oculta a lectores de pantalla.
  $('#ticker-track').innerHTML = html + `<div style="display:contents" aria-hidden="true">${html}</div>`;
}

const shortNum = (n) => (n >= 1000 ? `${(Math.floor(n / 100) / 10).toString().replace('.0', '')}k+` : String(n));

function renderHero() {
  const T = totals(L);
  const crestList = L.live
    ? clubs(L).filter((c) => c.logo).slice(0, 5).map((c) => crestOf(c))
    : HERO_CRESTS.map((k) => crest(k));
  $('#hero-crests').innerHTML = crestList.join('');
  $('#hero-teams').textContent = `+${T.teams} equipos`;
  const stats = L.live
    ? [{ num: String(T.teams), label: 'Equipos' }, { num: shortNum(T.players), label: 'Jugadores' }, { num: String(T.categories), label: 'Categorías' }]
    : STATS;
  $('#hero-stats').insertAdjacentHTML('afterbegin', stats.map((s) =>
    `<div class="stat">
      <div class="stat__body"><span class="stat__num">${s.num}</span><span class="stat__label">${s.label}</span></div>
      <span class="stat__ring" aria-hidden="true"></span>
    </div>`).join(''));
}

function renderBanner() {
  const next = nextMatchday(L);
  if (!L.live || !next) return;
  const names = next.divisions.map((d) => d.name);
  const list = (arr) => (arr.length > 1 ? `${arr.slice(0, -1).join(', ')} y ${arr[arr.length - 1]}` : arr[0] || '');
  const venues = next.venues.length > 4 ? [...next.venues.slice(0, 3), `${next.venues.length - 3} sedes más`] : next.venues;
  $('#banner-kicker').textContent = 'PRÓXIMA JORNADA';
  $('#banner-title').textContent = `${list(names)} en acción`;
  $('#banner-lead').textContent = `${dateLong(next.first)} · ${next.matches.length} partidos · ${list(venues)}.`;
}

function renderDivisionCards() {
  const T = totals(L);
  $('#div-grid').innerHTML = DIVISIONS.map((d) => { const n = T.byDivision[d.id]; return
    `<article class="div-card card">
      <div class="div-card__head" style="background:${d.color}">
        <span class="div-card__kicker">${d.kicker}</span>
        <span class="div-card__name">${d.name}</span>
      </div>
      <div class="div-card__body">
        <div class="div-card__cats">${d.cats.map((c) => `<span>${c[1]}</span>`).join('')}</div>
        <div class="div-card__nums">
          <div><strong>${n[0]}</strong><span>equipos</span></div>
          <div><strong>${n[1]}</strong><span>jugadores</span></div>
          <div><strong>${n[2]}</strong><span>partidos</span></div>
        </div>
      </div>
    </article>`; }).join('');
}

// En la vista previa (archivo único) YouTube no se puede incrustar: los videos abren en YouTube.
const PREVIEW = typeof window !== 'undefined' && !!window.__PREVIEW__;
const thumbUrl = (id) => (typeof window !== 'undefined' && window.__THUMBS__ && window.__THUMBS__[id]) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const ICON_LIVE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D7263D" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="2.5" fill="#D7263D"></circle><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"></path></svg>';

function renderVideos() {
  const BG = ['#1A44B8', '#26365F', '#2C3E6E', '#1E2F57'];
  $('#tv-grid').innerHTML = VIDEOS.slice(0, 4).map((v, i) => {
    const id = youtubeId(v.url);
    const tagBg = v.live ? '#D7263D' : '#0E1B3D';
    const inner = (icon) => `<span class="video__play">${icon}</span>
        <span class="video__tag" style="background:${tagBg}">${esc(v.tag)}</span>`;
    let thumb;
    if (id && !PREVIEW) {
      thumb = `<button type="button" class="video__thumb video__thumb--real" data-video="${id}" data-title="${esc(v.title)}"
           style="background-image:url(${thumbUrl(id)})" aria-label="Ver video: ${esc(v.title)}">${inner(ICON_PLAY)}</button>`;
    } else if (v.url) {
      // Enlace a YouTube (lista de transmisiones, o cualquier video en la vista previa).
      const img = id ? `background-image:url(${thumbUrl(id)});` : '';
      thumb = `<a class="video__thumb video__thumb--real" href="${esc(v.url)}" target="_blank" rel="noopener"
           style="${img}background-color:${BG[i % 4]}" aria-label="Ver en YouTube: ${esc(v.title)}">${inner(id ? ICON_PLAY : ICON_LIVE)}</a>`;
    } else {
      thumb = `<div class="video__thumb" style="background:${BG[i % 4]}" role="img" aria-label="Espacio para video de YouTube">${inner(ICON_PLAY)}</div>`;
    }
    return `<div class="video">${thumb}<span class="video__title">${esc(v.title)}</span></div>`;
  }).join('');
}

function bindVideoDialog() {
  const dlg = $('#video-dialog');
  if (!dlg) return;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-video]');
    if (!b) return;
    $('#video-frame').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.video}?autoplay=1&rel=0"
      title="${esc(b.dataset.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"></iframe>`;
    dlg.showModal();
  });
  const close = () => { $('#video-frame').innerHTML = ''; dlg.close(); };
  $('#video-close').addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', () => { $('#video-frame').innerHTML = ''; });
}

/* ---------- Logo de la liga, redes y canal ---------- */

function applyBrandAndLinks() {
  const logo = LEAGUE_LOGO || L.leagueLogo;
  if (logo) {
    document.querySelectorAll('.brand__badge').forEach((el) => {
      el.classList.add('brand__badge--logo');
      el.innerHTML = `<img src="${esc(logo)}" alt="Logo de la Liga del Este">`;
    });
  }
  document.querySelectorAll('[data-social]').forEach((a) => {
    const url = SOCIAL[a.dataset.social];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; } else { a.hidden = true; }
  });
  const channel = $('#youtube-channel');
  if (channel && SOCIAL.youtube) { channel.href = SOCIAL.youtube; channel.target = '_blank'; channel.rel = 'noopener'; }
}

function renderClubs() {
  $('#club-grid').innerHTML = clubs(L).map((c) => {
    const inner = `${crestOf(c)}<span>${esc(c.name)}</span>${c.count > 1 ? `<span class="club__count">${c.count} equipos</span>` : ''}`;
    return c.url
      ? `<a class="club card" href="${esc(c.url)}" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="club card">${inner}</div>`;
  }).join('');
}

function renderSponsors() {
  const n = Math.max(SPONSOR_SLOTS, SPONSORS.length);
  $('#sponsor-row').innerHTML = Array.from({ length: n }, (_, i) => {
    const s = SPONSORS[i];
    if (!s) return '<div class="sponsor-slot">TU MARCA AQUÍ</div>';
    const img = `<img src="${esc(s.logo)}" alt="${esc(s.name)}">`;
    return s.url
      ? `<a class="sponsor-slot sponsor-slot--logo" href="${esc(s.url)}" target="_blank" rel="noopener">${img}</a>`
      : `<div class="sponsor-slot sponsor-slot--logo">${img}</div>`;
  }).join('');
}

/* ---------- Centro de competición (interactivo) ---------- */

const state = { div: 'premier', cat: '3751', tab: 'res' };

const TABS = [['res', 'Resultados'], ['prox', 'Próximos'], ['tabla', 'Tabla'], ['lideres', 'Líderes']];
const MAX_MATCHES = 6;

function matchCard(m) {
  const upcoming = !m.played;
  const pens = m.hp !== null && m.hp !== undefined ? `<span class="match__pens">(${m.hp}) pen. (${m.ap})</span>` : '';
  return `<article class="match card">
    <div class="match__top">
      <span>${esc(m.dateLabel)}${m.timeLabel ? ` · ${esc(m.timeLabel)}` : ''}${m.round ? ` · J${m.round}` : ''}</span>
      <span class="match__tag ${upcoming ? 'match__tag--sched' : 'match__tag--final'}">${upcoming ? 'PROGRAMADO' : 'FINAL'}</span>
    </div>
    <div class="match__teams">
      <div class="match__team">${crest(m.home)}<span>${esc(team(m.home).name)}</span></div>
      <div class="match__score">${upcoming ? 'VS' : `${m.hs} – ${m.as}`}${pens}</div>
      <div class="match__team">${crest(m.away)}<span>${esc(team(m.away).name)}</span></div>
    </div>
    <div class="match__venue">${ICON_PIN}${esc(venueShort(m.venue || 'Sede por definir'))}</div>
  </article>`;
}

const signed = (n) => (n > 0 ? `+${n}` : String(n));

function standingsTable(group, showName) {
  const body = group.rows.map((r, i) => {
    const pos = r.pos || i + 1;
    return `<tr>
      <td><span class="standings__pos${pos <= 4 ? ' standings__pos--top' : ''}">${pos}</span></td>
      <td><div class="standings__team">${crest(r.team)}${esc(team(r.team).name)}</div></td>
      <td>${r.pj}</td><td>${r.g}</td><td>${r.e}</td><td>${r.p}</td>
      <td>${r.gf}</td><td>${r.gc}</td><td>${signed(r.dg ?? r.gf - r.gc)}</td>
      <td class="standings__pts">${r.pts}</td>
    </tr>`;
  }).join('');
  return `${showName && group.name ? `<h3 class="standings__group">${esc(group.name)}</h3>` : ''}
  <div class="standings-wrap"><table class="standings">
    <thead><tr>
      <th scope="col">#</th><th scope="col">EQUIPO</th><th scope="col"><abbr title="Partidos jugados">PJ</abbr></th>
      <th scope="col"><abbr title="Ganados">G</abbr></th><th scope="col"><abbr title="Empatados">E</abbr></th>
      <th scope="col"><abbr title="Perdidos">P</abbr></th><th scope="col"><abbr title="Goles a favor">GF</abbr></th>
      <th scope="col"><abbr title="Goles en contra">GC</abbr></th><th scope="col"><abbr title="Diferencia de goles">DG</abbr></th>
      <th scope="col">PTS</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

function leadersTable(rows) {
  const body = rows.map((r, i) => `<tr>
      <td><span class="standings__pos${i < 3 ? ' standings__pos--top' : ''}">${i + 1}</span></td>
      <td class="leaders__player">${esc(r.player)}</td>
      <td><div class="standings__team">${crest(r.team)}${esc(team(r.team).name)}</div></td>
      <td>${r.matches ?? ''}</td>
      <td class="standings__pts">${r.goals}</td>
    </tr>`).join('');
  return `<div class="standings-wrap"><table class="standings leaders">
    <thead><tr>
      <th scope="col">#</th><th scope="col">JUGADOR</th><th scope="col">EQUIPO</th>
      <th scope="col"><abbr title="Partidos jugados">PJ</abbr></th><th scope="col">GOLES</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

function emptyState(title) {
  return `<div class="empty">${ICON_INFO}
    <strong>${esc(title)}</strong>
    <span>${L.live ? 'Cuando se carguen en Dribbli, aparecen aquí en la próxima actualización.' : 'Por ahora puedes consultarlo directo en Dribbli.'}</span>
  </div>`;
}

function renderCompetition() {
  const cur = DIVISIONS.find((d) => d.id === state.div) || DIVISIONS[0];
  const [catId, catName] = cur.cats.find((c) => c[0] === state.cat) || cur.cats[0];
  const cd = L.categories[catId];
  const root = $('#competicion');
  root.style.setProperty('--cur', cur.color);

  $('#div-tabs').innerHTML = DIVISIONS.map((d) =>
    `<button type="button" role="tab" class="pill pill--div" data-div="${d.id}" aria-selected="${d.id === cur.id}">
      <span class="pill__dot" style="background:${d.color}" aria-hidden="true"></span>${d.name}
    </button>`).join('');

  $('#cat-pills').innerHTML = cur.cats.map((c) =>
    `<button type="button" class="pill pill--cat" data-cat="${c[0]}" aria-pressed="${c[0] === catId}">${c[1]}</button>`).join('');

  $('#view-tabs').innerHTML = TABS.map(([id, label]) =>
    `<button type="button" role="tab" class="view-tab" data-tab="${id}" aria-selected="${id === state.tab}">${label}</button>`).join('');

  $('#panel-badge').textContent = cur.short;
  $('#panel-title').textContent = `${cur.name} · ${catName}`;
  const meta = [];
  if (cd && cd.teams) meta.push(`${cd.teams} equipos`);
  if (cd && cd.players) meta.push(`${cd.players} jugadores`);
  if (cd && cd.matches) meta.push(`${cd.matches} partidos en la temporada`);
  $('#panel-meta').textContent = meta.join(' · ');

  const where = `${cur.name} ${catName}`;
  let body;
  if (state.tab === 'res') {
    body = cd && cd.results.length
      ? `<div class="matches">${cd.results.slice(0, MAX_MATCHES).map(matchCard).join('')}</div>`
      : emptyState(`Todavía no hay resultados de ${where}`);
  } else if (state.tab === 'prox') {
    body = cd && cd.upcoming.length
      ? `<div class="matches">${cd.upcoming.slice(0, MAX_MATCHES).map(matchCard).join('')}</div>`
      : emptyState(`No hay partidos programados de ${where}`);
  } else if (state.tab === 'tabla') {
    body = cd && cd.standings.length
      ? cd.standings.map((g) => standingsTable(g, cd.standings.length > 1)).join('')
      : emptyState(`La tabla de ${where} todavía no está disponible`);
  } else {
    body = cd && cd.leaders.length
      ? leadersTable(cd.leaders)
      : emptyState(`Todavía no hay goleadores en ${where}`);
  }
  $('#panel-body').innerHTML = body;

  const paths = { res: '/schedule', prox: '/schedule', tabla: '/standings', lideres: '/leaderboard' };
  const labels = { res: 'Calendario completo en Dribbli', prox: 'Calendario completo en Dribbli', tabla: 'Tabla completa en Dribbli', lideres: 'Estadísticas completas en Dribbli' };
  const link = $('#dribbli-link');
  link.href = `https://app.dribbli.com/categories/${catId}${paths[state.tab]}`;
  link.innerHTML = `${labels[state.tab]}${ICON_OUT}`;
  // Botón "Descargar para Instagram": solo si hay algo que mostrar en esta vista.
  const shareRows = !cd ? [] : state.tab === 'res' ? cd.results : state.tab === 'prox' ? cd.upcoming
    : state.tab === 'tabla' ? ((cd.standings[0] || {}).rows || []) : cd.leaders;
  const shareBtn = $('#share-ig');
  shareBtn.hidden = !shareRows.length;
  shareBtn.onclick = () => requireSubscription(() => openShare({
    tab: state.tab,
    title: cur.id === 'primera' ? cur.name : `${cur.name} ${catName}`,
    color: cur.color,
    updated: updatedLabel(L),
    leagueLogo: LEAGUE_LOGO || L.leagueLogo,
    team,
    rows: shareRows
  }));

  const upd = updatedLabel(L);
  $('#panel-source').textContent = `Fuente: Dribbli · Liga del Este RD${upd ? ` · Actualizado ${upd}` : ''}`;
}

function bindCompetition() {
  $('#competicion').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.div) {
      const d = DIVISIONS.find((x) => x.id === btn.dataset.div);
      state.div = d.id;
      // Al cambiar de división, ir a la primera categoría que tenga datos.
      const hasData = (id) => { const c = L.categories[id]; return c && (c.results.length || c.upcoming.length); };
      state.cat = (d.cats.find((c) => hasData(c[0])) || d.cats[0])[0];
    } else if (btn.dataset.cat) {
      state.cat = btn.dataset.cat;
    } else if (btn.dataset.tab) {
      state.tab = btn.dataset.tab;
    } else {
      return;
    }
    renderCompetition();
  });
}

/* ---------- Menú móvil ---------- */

function bindMenu() {
  const nav = $('.nav');
  const btn = $('.nav__menubtn');
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  $('.nav__links').addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir menú');
    }
  });
}

/* ---------- Enlaces de WhatsApp y enlaces configurables ---------- */

function bindWhatsappLinks() {
  document.querySelectorAll('[data-whatsapp]').forEach((a) => { a.href = waLink(a.dataset.whatsapp); });
}

// Enlaces que se configuran en data.js (LINKS), por ejemplo el reglamento en Google Drive.
function bindConfigLinks() {
  document.querySelectorAll('[data-link]').forEach((a) => {
    const url = LINKS[a.dataset.link];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
  });
}

/* ---------- Galería de fotos ---------- */

const ICON_CAMERA = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8A9AC0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="12" cy="12" r="3.5"></circle><path d="M8 5l1.5-2h5L16 5"></path></svg>';

function photoHTML(p, i, label) {
  if (!p) return `<div class="photo photo--empty">${ICON_CAMERA}<span>${label} ${i + 1}</span></div>`;
  return `<figure class="photo">
    <button type="button" class="photo__btn" data-photo="${i}" aria-label="Ampliar foto: ${esc(p.alt)}">
      <img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy">
    </button>
    ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}
  </figure>`;
}

// Con fotos: se muestran solo las fotos reales (en portada, hasta `max`).
// Sin fotos: espacios vacíos de muestra.
function renderGallery(el, slots, max = Infinity) {
  const n = GALLERY.length ? Math.min(GALLERY.length, max) : slots;
  el.innerHTML = Array.from({ length: n }, (_, i) => photoHTML(GALLERY[i], i, 'Foto de jornada')).join('');
}

function renderHeroPhoto() {
  const box = $('#hero-photo');
  if (!box || !HERO_PHOTO || !HERO_PHOTO.src) return;
  box.removeAttribute('role');
  box.removeAttribute('aria-label');
  box.innerHTML = `<img src="${esc(HERO_PHOTO.src)}" alt="${esc(HERO_PHOTO.alt || '')}"
    style="object-position:${esc(HERO_PHOTO.position || 'center')}" fetchpriority="high">`;
}

function renderCollage(el) {
  el.innerHTML = [0, 1, 2].map((i) => photoHTML(GALLERY[i], i, 'Foto')).join('');
}

function bindLightbox() {
  const dlg = $('#lightbox');
  if (!dlg) return;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-photo]');
    if (!b) return;
    const p = GALLERY[Number(b.dataset.photo)];
    $('#lightbox-img').src = p.src;
    $('#lightbox-img').alt = p.alt;
    $('#lightbox-caption').textContent = p.caption || '';
    dlg.showModal();
  });
  $('#lightbox-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Historia ---------- */

function renderEditions() {
  $('#editions-grid').innerHTML = EDITIONS.map((ed) =>
    `<article class="edition${ed.current ? ' edition--current' : ''}">
      <span class="edition__label">${ed.current ? 'EDICIÓN ACTUAL' : 'EDICIÓN'}</span>
      <span class="edition__num">${ed.num}</span>
      <span class="edition__dates">${esc(ed.dates)}</span>
      <span class="edition__note">${esc(ed.note)}</span>
    </article>`).join('');
}

function renderVenues() {
  $('#venues-grid').innerHTML = VENUES.map((v) =>
    `<div class="venue">
      <span class="venue__icon">${ICON_PIN}</span>
      <div><strong>${esc(v.name)}</strong><span>${esc(v.place)}</span></div>
    </div>`).join('');
}

/* ---------- Arranque (cada parte solo si existe en la página) ---------- */

const has = (id) => document.getElementById(id);

if (has('ticker-track')) renderTicker();
if (has('hero-crests')) renderHero();
if (has('banner-title')) renderBanner();
if (has('div-tabs')) { renderCompetition(); bindCompetition(); }
if (has('div-grid')) renderDivisionCards();
if (has('tv-grid')) renderVideos();
if (has('club-grid')) renderClubs();
if (has('sponsor-row')) renderSponsors();
if (has('gallery-home')) renderGallery(has('gallery-home'), GALLERY_SLOTS_HOME, GALLERY_SLOTS_HOME);
if (has('hero-photo')) renderHeroPhoto();
if (has('gallery-full')) renderGallery(has('gallery-full'), GALLERY_SLOTS_HISTORY);
if (has('collage')) renderCollage(has('collage'));
if (has('editions-grid')) renderEditions();
if (has('venues-grid')) renderVenues();
applyBrandAndLinks();
bindMenu();
bindLightbox();
bindVideoDialog();
bindWhatsappLinks();
bindConfigLinks();
initForms();
initNewsletter(clubs(L).map((c) => c.name));
initPopup(LEAGUE_LOGO || L.leagueLogo);
