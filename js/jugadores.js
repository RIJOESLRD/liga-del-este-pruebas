// Páginas "Jugadores" (buscador) y "Perfil del jugador".
// Datos: data/jugadores.json (lo arma scripts/jugadores.py con la actualización de Dribbli).
// Solo jugadores de la temporada actual, con nombre e iniciales de los apellidos.

import { loadLeague } from './league.js';
import { CONTACT } from './data.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s) => document.querySelector(s);
const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fmt = (n) => Number(n).toLocaleString('es-DO');

const [L, datos] = await Promise.all([
  loadLeague(),
  fetch('data/jugadores.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
]);
const JUG = (datos && datos.jugadores) || [];
const TEMP = (datos && datos.temporadas) || [];
const ACTUAL = datos ? datos.actual : 0;

const logoDe = (j) => (L.teams[j.eq] || {}).logo || '';
const crest = (j, cls = '') => {
  const logo = logoDe(j);
  const ini = j.a.split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w)).map((w) => w[0]).join('').slice(0, 3) || '?';
  return logo
    ? `<span class="crest crest--logo ${cls}"><img src="${esc(logo)}" alt="" loading="lazy"></span>`
    : `<span class="crest ${cls}" style="background:#7A2A55">${esc(ini)}</span>`;
};
const iniciales = (n) => n.split(/\s+/).filter((w) => !w.endsWith('.')).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const totales = (j) => j.t.reduce((a, t) => ({ pj: a.pj + t[4], min: a.min + t[5], g: a.g + t[6] }), { pj: 0, min: 0, g: 0 });
const temporadas = (j) => new Set(j.t.map((t) => t[0])).size;
const actual = (j) => j.t.filter((t) => t[0] === ACTUAL);

/* ---------- Buscador ---------- */

function buscador() {
  const lista = $('#jg-lista');
  const q = $('#jg-q'), fDiv = $('#jg-div'), fCat = $('#jg-cat'), fAca = $('#jg-aca'), cuenta = $('#jg-cuenta'), mas = $('#jg-mas');
  if (!JUG.length) { lista.innerHTML = '<p class="jg-vacio">Todavía no hay jugadores cargados.</p>'; return; }
  const conHistorial = JUG.filter((j) => temporadas(j) > 1).length;
  $('#jg-hero-stats').innerHTML = `<div><b>${fmt(JUG.length)}</b><span>Jugadores activos esta temporada</span></div>
    <div><b>${fmt(conHistorial)}</b><span>Con temporadas anteriores en la liga</span></div>
    <div><b>${new Set(JUG.map((j) => j.a)).size}</b><span>Academias</span></div>`;
  const opciones = (sel, valores) => { sel.insertAdjacentHTML('beforeend', valores.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('')); };
  const orden = (c) => (c === 'Open' ? 99 : parseInt(c.replace(/\D/g, ''), 10) || 50);
  opciones(fDiv, [...new Set(JUG.flatMap((j) => actual(j).map((t) => t[1])))].sort());
  opciones(fCat, [...new Set(JUG.flatMap((j) => actual(j).map((t) => t[2])))].sort((a, b) => orden(a) - orden(b)));
  opciones(fAca, [...new Set(JUG.map((j) => j.a))].sort((a, b) => a.localeCompare(b)));
  const params = new URLSearchParams(location.search);
  if (params.get('q')) q.value = params.get('q');
  if (params.get('academia')) fAca.value = params.get('academia');

  let limite = 48;
  const pinta = () => {
    const texto = sinAcentos(q.value.trim());
    const res = JUG.filter((j) => (!texto || sinAcentos(`${j.n} ${j.a}`).includes(texto))
      && (!fDiv.value || actual(j).some((t) => t[1] === fDiv.value))
      && (!fCat.value || actual(j).some((t) => t[2] === fCat.value))
      && (!fAca.value || j.a === fAca.value));
    cuenta.textContent = `${fmt(res.length)} ${res.length === 1 ? 'jugador' : 'jugadores'}`;
    lista.innerHTML = res.slice(0, limite).map((j) => {
      const tot = totales(j), nt = temporadas(j);
      return `<a class="jg-card" href="jugador.html?id=${esc(j.id)}">
        <span class="jg-av">${esc(iniciales(j.n))}</span>
        <span class="jg-card__txt"><b>${esc(j.n)}</b><span>${esc(j.a)}</span><span class="jg-chip">${esc(j.cat)}</span></span>
        <span class="jg-card__num"><b>${tot.g}</b><small>${tot.g === 1 ? 'gol' : 'goles'}</small><em>${nt} ${nt === 1 ? 'temporada' : 'temporadas'}</em></span>
      </a>`;
    }).join('') || '<p class="jg-vacio">No encontramos jugadores con esa búsqueda.</p>';
    mas.hidden = res.length <= limite;
  };
  [q, fDiv, fCat, fAca].forEach((el) => el.addEventListener('input', () => { limite = 48; pinta(); }));
  mas.addEventListener('click', () => { limite += 48; pinta(); });
  pinta();
}

/* ---------- Perfil ---------- */

function perfil() {
  const box = $('#jg-perfil');
  const id = new URLSearchParams(location.search).get('id');
  const j = JUG.find((x) => x.id === id);
  if (!j) {
    box.innerHTML = `<div class="jg-vacio jg-vacio--grande"><h2>Perfil no disponible</h2>
      <p>Este jugador no está en la temporada actual o su perfil no se muestra.</p>
      <a class="btn btn--dark btn--md" href="jugadores.html"><span class="btn__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>Ver todos los jugadores</a></div>`;
    return;
  }
  document.title = `${j.n} — Jugadores — Liga del Este`;
  const tot = totales(j), nt = temporadas(j);
  const desde = Math.min(...j.t.map((t) => t[0]));
  const desdeTxt = TEMP[desde] ? TEMP[desde][0] : '';
  // Trayectoria de academias, de la más antigua a la actual
  const tray = [];
  [...j.t].sort((a, b) => a[0] - b[0]).forEach((t) => {
    const ult = tray[tray.length - 1];
    if (!ult || ult.a !== t[3]) tray.push({ a: t[3], desde: t[0], hasta: t[0] });
    else ult.hasta = t[0];
  });
  const periodo = (x) => {
    const a = TEMP[x.desde] ? TEMP[x.desde][0] : '', b = TEMP[x.hasta] ? TEMP[x.hasta][0] : '';
    return x.hasta === ACTUAL ? `${a === b ? a : `${a} – hoy`}` : (a === b ? a : `${a} – ${b}`);
  };
  const crestAca = (a) => (a === j.a ? crest(j) : `<span class="crest" style="background:#7A2A55">${esc(a.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase())}</span>`);
  const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hola, soy padre, madre o tutor y quiero pedir que se oculte este perfil de jugador de la web: ${location.href}`)}`;
  box.innerHTML = `
    <section class="jg-head">
      <span class="jg-av jg-av--xl">${esc(iniciales(j.n))}</span>
      <div>
        <span class="jg-kicker">PERFIL DE JUGADOR</span>
        <h1 class="jg-name">${esc(j.n)}</h1>
        <div class="jg-now"><span>${esc(j.a)}</span><span>${esc(j.cat)}</span>${desdeTxt ? `<span>En la liga desde la ${esc(desdeTxt)}</span>` : ''}</div>
      </div>
    </section>
    <div class="jg-stats">
      <div><b>${nt}</b><span>${nt === 1 ? 'Temporada' : 'Temporadas'}</span></div>
      <div><b>${fmt(tot.pj)}</b><span>Partidos</span></div>
      <div><b>${fmt(tot.min)}</b><span>Minutos</span></div>
      <div><b>${fmt(tot.g)}</b><span>${tot.g === 1 ? 'Gol' : 'Goles'}</span></div>
      <div><b>${tray.length > 1 ? new Set(tray.map((x) => x.a)).size : 1}</b><span>${tray.length > 1 ? 'Academias' : 'Academia'}</span></div>
    </div>
    <h2 class="jg-h">Trayectoria</h2>
    <div class="jg-path">${tray.map((x, i) => `${i ? '<i aria-hidden="true">→</i>' : ''}<span class="jg-path__step">${crestAca(x.a)}<span><b>${esc(x.a)}</b><small>${esc(periodo(x))}</small></span></span>`).join('')}</div>
    <h2 class="jg-h">Por temporada</h2>
    <div class="jg-tw"><table class="jg-t">
      <thead><tr><th>Temporada</th><th>Categoría</th><th>Academia</th><th class="n">PJ</th><th class="n">Min.</th><th class="n">Goles</th></tr></thead>
      <tbody>${j.t.map((t) => `<tr><td><b>${esc(TEMP[t[0]] ? TEMP[t[0]][0] : '')}</b><small>${esc(TEMP[t[0]] ? TEMP[t[0]][1] : '')}</small></td>
        <td><span class="jg-chip">${esc(t[1])}</span> ${esc(t[2])}</td><td>${esc(t[3])}</td>
        <td class="n">${t[4]}</td><td class="n">${fmt(t[5])}</td><td class="n g">${t[6]}</td></tr>`).join('')}
      <tr class="jg-t__total"><td><b>Total</b></td><td></td><td></td><td class="n">${fmt(tot.pj)}</td><td class="n">${fmt(tot.min)}</td><td class="n g">${fmt(tot.g)}</td></tr></tbody>
    </table></div>
    <p class="jg-nota">Datos de Dribbli, la plataforma oficial de la liga, desde la 5.ª edición. Para proteger a los menores mostramos solo el nombre y las iniciales de los apellidos, sin foto ni fecha de nacimiento. Si un dato no coincide, puede ser que el jugador esté escrito distinto en alguna temporada.
      ¿Eres padre, madre o tutor y quieres ocultar este perfil? <a href="${wa}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>.</p>`;
}

if ($('#jg-lista')) buscador();
if ($('#jg-perfil')) perfil();
