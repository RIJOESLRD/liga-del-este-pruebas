// Noticias: franja de aviso urgente (todas las páginas), últimas 3 en la portada,
// lista con filtros en noticias.html y extras de cada noticia (copiar enlace, fotos).
// Los datos salen de data/noticias.json, que arma scripts/build_site.py al publicar.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export const TIPOS = { aviso: 'Aviso', jornada: 'Jornada', evento: 'Evento', institucional: 'La liga' };
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fechaCorta = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return d ? `${d} ${MONTHS[m - 1]} ${y}` : '';
};
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export async function loadNews() {
  if (typeof window !== 'undefined' && window.__NOTICIAS__) return window.__NOTICIAS__;
  try {
    const r = await fetch('data/noticias.json', { cache: 'no-cache' });
    if (!r.ok) return [];
    const list = await r.json();
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function card(n) {
  const img = n.portada
    ? `<img src="${esc(n.portada)}" alt="" loading="lazy">`
    : '<span class="news-card__noimg" aria-hidden="true">LDE</span>';
  return `<article class="news-card card">
    <a class="news-card__link" href="${esc(n.url)}">
      <div class="news-card__img">${img}</div>
      <div class="news-card__body">
        <div class="news-card__meta"><span class="chip chip--${esc(n.tipo)}">${esc(TIPOS[n.tipo] || 'Noticia')}</span><time datetime="${esc(n.fecha)}">${fechaCorta(n.fecha)}</time></div>
        <h3 class="news-card__title">${esc(n.titulo)}</h3>
        ${n.resumen ? `<p class="news-card__summary">${esc(n.resumen)}</p>` : ''}
      </div>
    </a>
  </article>`;
}

/* ---------- Franja de aviso urgente ---------- */

const DISMISS = 'lde-aviso-cerrado';
function renderUrgent(list) {
  const d = hoy();
  const n = list.find((x) => x.urgente && x.fecha <= d && (!x.urgente_hasta || d <= x.urgente_hasta));
  if (!n) return;
  try { if (localStorage.getItem(DISMISS) === n.slug) return; } catch (e) { /* sin almacenamiento */ }
  document.body.insertAdjacentHTML('afterbegin', `<div class="aviso-urgente" role="status">
    <div class="aviso-urgente__inner">
      <span class="aviso-urgente__tag">AVISO</span>
      <a class="aviso-urgente__text" href="${esc(n.url)}">${esc(n.titulo)} <span>Leer más →</span></a>
      <button type="button" class="aviso-urgente__close" aria-label="Cerrar aviso">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
      </button>
    </div>
  </div>`);
  const el = document.querySelector('.aviso-urgente');
  el.querySelector('.aviso-urgente__close').addEventListener('click', () => {
    try { localStorage.setItem(DISMISS, n.slug); } catch (e) { /* sin almacenamiento */ }
    el.remove();
  });
}

/* ---------- Portada y página de noticias ---------- */

function renderHome(list) {
  const sec = document.getElementById('noticias-home');
  if (!sec || !list.length) return;
  document.getElementById('noticias-home-lista').innerHTML = list.slice(0, 3).map(card).join('');
  sec.hidden = false;
}

function renderPage(list) {
  const box = document.getElementById('noticias-lista');
  if (!box) return;
  const filtros = document.getElementById('noticias-filtros');
  if (!list.length) {
    box.innerHTML = '<p class="news-empty">Todavía no hay noticias publicadas. Vuelve pronto.</p>';
    return;
  }
  const tipos = Object.keys(TIPOS).filter((t) => list.some((n) => n.tipo === t));
  let actual = 'todas';
  const draw = () => {
    const vis = actual === 'todas' ? list : list.filter((n) => n.tipo === actual);
    box.innerHTML = vis.map(card).join('');
    filtros.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === actual)));
  };
  if (tipos.length > 1) {
    filtros.innerHTML = [['todas', 'Todas'], ...tipos.map((t) => [t, TIPOS[t]])]
      .map(([k, v]) => `<button type="button" class="pill pill--cat" data-tipo="${k}" aria-pressed="false">${v}</button>`).join('');
    filtros.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tipo]');
      if (b) { actual = b.dataset.tipo; draw(); }
    });
  }
  draw();
}

/* ---------- Página de una noticia ---------- */

function bindArticle() {
  document.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copiar); b.textContent = '¡Enlace copiado!'; } catch (e) { window.prompt('Copia este enlace:', b.dataset.copiar); }
  }));
  const dlg = document.getElementById('lightbox');
  if (!dlg) return;
  document.querySelectorAll('[data-foto]').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('lightbox-img').src = b.dataset.foto;
    document.getElementById('lightbox-img').alt = '';
    document.getElementById('lightbox-caption').textContent = '';
    dlg.showModal();
  }));
}

export async function initNews() {
  const list = await loadNews();
  renderUrgent(list);
  renderHome(list);
  renderPage(list);
  bindArticle();
}
