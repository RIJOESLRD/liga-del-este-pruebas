// Imágenes para Instagram: dibuja la tabla, los resultados, los próximos partidos o los líderes
// de una categoría en un lienzo (canvas) y la deja lista para compartir o descargar.
//   Feed 4:5  -> 1080 × 1350      Historias 9:16 -> 1080 × 1920

import { SHARE_SPONSOR, SITE_URL } from './data.js';

const SIZES = { feed: [1080, 1350], story: [1080, 1920] };
const C = {
  navy: '#0E1B3D', navyDeep: '#0B1530', red: '#D7263D', white: '#FFFFFF',
  ink: '#0E1B3D', muted: '#5B6B8C', soft: '#C9D5F0', tick: '#9FB4E8', line: '#E6EBF4', bgRow: '#F3F6FD'
};
const DISPLAY = '"Barlow Condensed", "Arial Narrow", sans-serif';
const BODY = 'Inter, system-ui, sans-serif';

/* ---------- Utilidades de dibujo ---------- */

const imgCache = new Map();
function loadImg(src) {
  if (!src) return Promise.resolve(null);
  if (!imgCache.has(src)) {
    imgCache.set(src, new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => resolve(null);
      im.src = src;
    }));
  }
  return imgCache.get(src);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fit(ctx, text, maxW) {
  let t = String(text);
  if (ctx.measureText(t).width <= maxW) return t;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}

// Nombre de equipo que cabe en el ancho: primero baja un poco la letra, luego abrevia
// palabras comunes (sin tocar el color del equipo, que es lo que distingue Azul de Rojo)
// y solo al final corta con "…".
const ABBR = [[/\bAcademia\b/g, 'Acad.'], [/\bSoccer Academy\b/g, 'SA'], [/\bFootball Academy\b/g, 'FA'],
  [/\bDeportivo\b/g, 'Dep.'], [/\bAcademy\b/g, 'Acad.']];
function fitTeam(ctx, name, maxW, size, weight = 700, family = BODY) {
  const setSize = (fs) => { ctx.font = `${weight} ${fs}px ${family}`; };
  setSize(size);
  if (ctx.measureText(name).width <= maxW) return name;
  let t = name;
  for (const [re, rep] of ABBR) {
    t = t.replace(re, rep);
    if (ctx.measureText(t).width <= maxW) return t;
  }
  for (let fs = size - 1; fs >= Math.round(size * 0.72); fs -= 1) {
    setSize(fs);
    if (ctx.measureText(t).width <= maxW) return t;
  }
  return fit(ctx, t, maxW);
}

function containImg(ctx, im, x, y, w, h) {
  const s = Math.min(w / im.width, h / im.height);
  const dw = im.width * s, dh = im.height * s;
  ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

async function crest(ctx, t, cx, cy, d) {
  const im = await loadImg(t.logo);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.fillStyle = im ? C.white : (t.color || C.navy); ctx.fill();
  if (im) {
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
    ctx.clip();
    containImg(ctx, im, cx - d * 0.39, cy - d * 0.39, d * 0.78, d * 0.78);
  } else {
    ctx.fillStyle = C.white; ctx.font = `800 ${Math.round(d * 0.36)}px ${DISPLAY}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t.ini || '?', cx, cy + 1);
  }
  ctx.restore();
}

/* ---------- Partes comunes: cabecera, pie y patrocinador ---------- */

async function drawFrame(ctx, W, H, info) {
  ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
  // Corte en diagonal de la marca (esquina superior derecha) en el color de la división.
  ctx.fillStyle = info.color === C.navy ? C.red : info.color;
  ctx.beginPath(); ctx.moveTo(W - 300, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 300); ctx.closePath(); ctx.fill();

  const pad = 64;
  const logo = await loadImg(info.leagueLogo);
  ctx.save();
  ctx.beginPath(); ctx.arc(pad + 52, 64 + 52, 52, 0, Math.PI * 2); ctx.fillStyle = C.white; ctx.fill(); ctx.clip();
  if (logo) containImg(ctx, logo, pad + 8, 64 + 8, 88, 88);
  ctx.restore();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.white; ctx.font = `800 46px ${DISPLAY}`;
  ctx.fillText('LIGA DEL ESTE', pad + 128, 64 + 48);
  ctx.fillStyle = C.tick; ctx.font = `600 22px ${BODY}`;
  ctx.fillText('IX EDICIÓN · FÚTBOL FORMATIVO · RD', pad + 130, 64 + 84);

  // Etiqueta del tipo de imagen y título de la categoría.
  const chipY = 228;
  ctx.font = `700 24px ${BODY}`;
  const chipW = ctx.measureText(info.kind).width + 44;
  rr(ctx, pad, chipY, chipW, 50, 25); ctx.fillStyle = info.color === C.navy ? C.red : info.color; ctx.fill();
  ctx.fillStyle = C.white; ctx.textBaseline = 'middle'; ctx.fillText(info.kind, pad + 22, chipY + 26);
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 118px ${DISPLAY}`; ctx.fillStyle = C.white;
  ctx.fillText(fit(ctx, info.title.toUpperCase(), W - pad * 2), pad, chipY + 160);

  // Pie: fecha de actualización y web.
  const sponsorH = info.sponsor ? 120 : 0;
  const footY = H - pad - sponsorH - (info.sponsor ? 28 : 0);
  ctx.font = `600 24px ${BODY}`; ctx.fillStyle = C.soft;
  ctx.textAlign = 'left'; ctx.fillText(info.updated ? `Actualizado: ${info.updated} · Datos: Dribbli` : 'Datos: Dribbli', pad, footY);
  ctx.textAlign = 'right'; ctx.fillStyle = C.white; ctx.font = `700 24px ${BODY}`;
  ctx.fillText(SITE_URL, W - pad, footY);
  ctx.textAlign = 'left';

  if (info.sponsor) {
    const sy = H - pad - sponsorH;
    rr(ctx, pad, sy, W - pad * 2, sponsorH, 22); ctx.fillStyle = C.white; ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = `700 22px ${BODY}`; ctx.textBaseline = 'middle';
    ctx.fillText('PATROCINADO POR', pad + 36, sy + sponsorH / 2);
    const sl = await loadImg(info.sponsor.logo);
    if (sl) containImg(ctx, sl, W - pad - 36 - 300, sy + 18, 300, sponsorH - 36);
    else { ctx.textAlign = 'right'; ctx.fillStyle = C.ink; ctx.font = `800 40px ${DISPLAY}`; ctx.fillText(info.sponsor.name.toUpperCase(), W - pad - 36, sy + sponsorH / 2); ctx.textAlign = 'left'; }
    ctx.textBaseline = 'alphabetic';
  }
  // Zona libre para el contenido.
  return { x: pad, y: chipY + 205, w: W - pad * 2, bottom: footY - 46 };
}

/* ---------- Contenidos ---------- */

async function drawTable(ctx, box, rows, info) {
  const headH = 64;
  const rowH = Math.min(info.story ? 150 : 118, (box.bottom - box.y - headH) / Math.max(rows.length, 1));
  const h = headH + rowH * rows.length;
  if (info.story) box = { ...box, y: box.y + Math.max(0, (box.bottom - box.y - h) / 2) };
  rr(ctx, box.x, box.y, box.w, h, 28); ctx.fillStyle = C.white; ctx.fill();
  ctx.save(); rr(ctx, box.x, box.y, box.w, h, 28); ctx.clip();
  const cols = [['PTS', 92], ['DG', 84], ['P', 64], ['E', 64], ['G', 64], ['PJ', 70]];
  let cx = box.x + box.w - 24; const colX = {};
  for (const [k, w] of cols) { colX[k] = cx - w / 2; cx -= w; }
  const teamRight = cx - 12;
  ctx.fillStyle = C.navyDeep; ctx.fillRect(box.x, box.y, box.w, headH);
  ctx.fillStyle = C.tick; ctx.font = `700 21px ${BODY}`; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; ctx.fillText('#', box.x + 34, box.y + headH / 2); ctx.fillText('EQUIPO', box.x + 100, box.y + headH / 2);
  ctx.textAlign = 'center'; for (const [k] of cols) ctx.fillText(k, colX[k], box.y + headH / 2);

  const d = Math.min(rowH * 0.62, 66);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]; const y = box.y + headH + i * rowH; const mid = y + rowH / 2;
    if (i % 2 === 1) { ctx.fillStyle = C.bgRow; ctx.fillRect(box.x, y, box.w, rowH); }
    const pos = r.pos || i + 1;
    rr(ctx, box.x + 18, mid - 22, 44, 44, 10); ctx.fillStyle = pos <= 4 ? info.color : '#EEF2F8'; ctx.fill();
    ctx.fillStyle = pos <= 4 ? C.white : C.ink; ctx.font = `800 28px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(String(pos), box.x + 40, mid + 1);
    const t = info.team(r.team);
    await crest(ctx, t, box.x + 100 + d / 2, mid, d);
    ctx.textAlign = 'left'; ctx.fillStyle = C.ink;
    ctx.fillText(fitTeam(ctx, t.name, teamRight - (box.x + 116 + d), rowH > 110 ? 32 : 28), box.x + 116 + d, mid + 1);
    ctx.textAlign = 'center'; ctx.font = `600 27px ${BODY}`; ctx.fillStyle = C.ink;
    const dg = r.dg ?? (r.gf - r.gc);
    for (const [k, v] of [['PJ', r.pj], ['G', r.g], ['E', r.e], ['P', r.p], ['DG', dg > 0 ? `+${dg}` : String(dg)]]) ctx.fillText(String(v), colX[k], mid + 1);
    ctx.font = `800 44px ${DISPLAY}`; ctx.fillText(String(r.pts), colX.PTS, mid + 2);
    if (i > 0) { ctx.fillStyle = C.line; ctx.fillRect(box.x, y, box.w, 2); }
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
}

async function drawMatches(ctx, box, rows, info) {
  const gap = 16;
  const rowH = Math.min(info.story ? 190 : 150, (box.bottom - box.y - gap * (rows.length - 1)) / Math.max(rows.length, 1));
  const total = rows.length * rowH + gap * (rows.length - 1);
  if (info.story) box = { ...box, y: box.y + Math.max(0, (box.bottom - box.y - total) / 2) };
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i]; const y = box.y + i * (rowH + gap); const mid = y + rowH / 2 + 12;
    rr(ctx, box.x, y, box.w, rowH, 24); ctx.fillStyle = C.white; ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = `700 19px ${BODY}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    const meta = [m.dateLabel, m.timeLabel, m.round ? `J${m.round}` : ''].filter(Boolean).join(' · ').toUpperCase();
    ctx.fillText(fit(ctx, meta + (m.venue ? `  ·  ${m.venue.split(',')[0].toUpperCase()}` : ''), box.w - 60), box.x + box.w / 2, y + 26);
    const d = Math.min(rowH * 0.5, 64);
    const scoreW = 170; const cx = box.x + box.w / 2;
    rr(ctx, cx - scoreW / 2, mid - 34, scoreW, 68, 16); ctx.fillStyle = m.played ? C.navy : '#EEF2F8'; ctx.fill();
    ctx.fillStyle = m.played ? C.white : C.ink; ctx.font = `800 50px ${DISPLAY}`;
    ctx.fillText(m.played ? `${m.hs} – ${m.as}` : 'VS', cx, mid + 2);
    const side = (box.w - scoreW) / 2 - 24;
    const h = info.team(m.home), a = info.team(m.away);
    await crest(ctx, h, cx - scoreW / 2 - 18 - d / 2, mid, d);
    await crest(ctx, a, cx + scoreW / 2 + 18 + d / 2, mid, d);
    ctx.fillStyle = C.ink;
    const nameW = side - d - 40; const ns = rowH > 120 ? 27 : 24;
    ctx.textAlign = 'right'; ctx.fillText(fitTeam(ctx, h.name, nameW, ns), cx - scoreW / 2 - 36 - d, mid + 1);
    ctx.textAlign = 'left'; ctx.fillText(fitTeam(ctx, a.name, nameW, ns), cx + scoreW / 2 + 36 + d, mid + 1);
  }
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
}

async function drawLeaders(ctx, box, rows, info) {
  const headH = 64;
  const rowH = Math.min(info.story ? 130 : 110, (box.bottom - box.y - headH) / Math.max(rows.length, 1));
  const h = headH + rowH * rows.length;
  if (info.story) box = { ...box, y: box.y + Math.max(0, (box.bottom - box.y - h) / 2) };
  rr(ctx, box.x, box.y, box.w, h, 28); ctx.fillStyle = C.white; ctx.fill();
  ctx.save(); rr(ctx, box.x, box.y, box.w, h, 28); ctx.clip();
  ctx.fillStyle = C.navyDeep; ctx.fillRect(box.x, box.y, box.w, headH);
  ctx.fillStyle = C.tick; ctx.font = `700 21px ${BODY}`; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; ctx.fillText('#', box.x + 34, box.y + headH / 2); ctx.fillText('JUGADOR', box.x + 100, box.y + headH / 2);
  ctx.textAlign = 'center'; ctx.fillText('GOLES', box.x + box.w - 80, box.y + headH / 2);
  const d = Math.min(rowH * 0.52, 52);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]; const y = box.y + headH + i * rowH; const mid = y + rowH / 2;
    if (i % 2 === 1) { ctx.fillStyle = C.bgRow; ctx.fillRect(box.x, y, box.w, rowH); }
    rr(ctx, box.x + 18, mid - 22, 44, 44, 10); ctx.fillStyle = i < 3 ? info.color : '#EEF2F8'; ctx.fill();
    ctx.fillStyle = i < 3 ? C.white : C.ink; ctx.font = `800 28px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), box.x + 40, mid + 1);
    const t = info.team(r.team);
    await crest(ctx, t, box.x + 100 + d / 2, mid, d);
    const tx = box.x + 116 + d; const maxW = box.w - (tx - box.x) - 160;
    ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = `700 ${rowH > 90 ? 28 : 25}px ${BODY}`;
    ctx.fillText(fit(ctx, r.player, maxW), tx, mid - 13);
    ctx.fillStyle = C.muted;
    ctx.fillText(fitTeam(ctx, t.name, maxW, 20, 500), tx, mid + 17);
    ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.font = `800 48px ${DISPLAY}`;
    ctx.fillText(String(r.goals), box.x + box.w - 80, mid + 2);
    if (i > 0) { ctx.fillStyle = C.line; ctx.fillRect(box.x, y, box.w, 2); }
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
}

const KINDS = {
  tabla: { kind: 'TABLA DE POSICIONES', draw: drawTable, max: { feed: 8, story: 12 } },
  res: { kind: 'RESULTADOS', draw: drawMatches, max: { feed: 5, story: 8 } },
  prox: { kind: 'PRÓXIMOS PARTIDOS', draw: drawMatches, max: { feed: 5, story: 8 } },
  lideres: { kind: 'LÍDERES DE GOLEO', draw: drawLeaders, max: { feed: 8, story: 12 } }
};

export async function renderShareImage(opts, format = 'feed') {
  const [W, H] = SIZES[format];
  const k = KINDS[opts.tab];
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  try {
    await Promise.all([
      document.fonts.load(`800 100px ${DISPLAY}`), document.fonts.load(`700 24px ${BODY}`),
      document.fonts.load(`600 24px ${BODY}`), document.fonts.load(`500 20px ${BODY}`)
    ]);
  } catch (e) { /* si las letras no cargan, se usa la de respaldo */ }
  const info = { ...opts, kind: k.kind, sponsor: SHARE_SPONSOR, story: format === 'story' };
  const box = await drawFrame(ctx, W, H, info);
  await k.draw(ctx, box, opts.rows.slice(0, k.max[format]), info);
  return canvas;
}

/* ---------- Ventana para ver, compartir o descargar ---------- */

const ICON_X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>';

function ensureDialog() {
  let dlg = document.getElementById('share-dialog');
  if (dlg) return dlg;
  document.body.insertAdjacentHTML('beforeend', `<dialog class="form-dialog share-dialog" id="share-dialog" aria-labelledby="share-title">
  <button type="button" class="form-dialog__close" data-close aria-label="Cerrar">${ICON_X}</button>
  <div class="share-dialog__body">
    <span class="kicker">INSTAGRAM</span>
    <h2 class="form-dialog__title" id="share-title">Imagen lista para publicar</h2>
    <div class="share-formats" role="group" aria-label="Formato">
      <button type="button" class="view-tab" data-format="feed" aria-pressed="true">Feed 4:5</button>
      <button type="button" class="view-tab" data-format="story" aria-pressed="false">Historia 9:16</button>
    </div>
    <div class="share-preview"><img alt="Vista previa de la imagen para Instagram"><span class="share-preview__loading">Preparando la imagen…</span></div>
    <div class="share-actions">
      <button type="button" class="btn btn--wa share-btn" data-share hidden>Compartir</button>
      <button type="button" class="btn btn--dark btn--plain share-btn" data-download>Descargar imagen</button>
    </div>
    <p class="form-dialog__alt" data-share-tip>En el celular también puedes mantener presionada la imagen para guardarla.</p>
  </div>
</dialog>`);
  dlg = document.getElementById('share-dialog');
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  return dlg;
}

export async function openShare(opts) {
  const dlg = ensureDialog();
  const img = dlg.querySelector('.share-preview img');
  const loading = dlg.querySelector('.share-preview__loading');
  let format = 'feed';
  let current = null;

  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fileName = () => `liga-del-este-${slug(opts.title)}-${slug(KINDS[opts.tab].kind)}-${format === 'feed' ? 'feed' : 'historia'}.png`;

  const draw = async () => {
    loading.hidden = false; img.style.opacity = '.3';
    dlg.querySelectorAll('[data-format]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.format === format)));
    const canvas = await renderShareImage(opts, format);
    current = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
    img.dataset.url = URL.createObjectURL(current);
    img.src = img.dataset.url;
    img.className = format === 'story' ? 'is-story' : '';
    loading.hidden = true; img.style.opacity = '1';
    const file = new File([current], fileName(), { type: 'image/png' });
    dlg.querySelector('[data-share]').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
  };

  dlg.querySelectorAll('[data-format]').forEach((b) => { b.onclick = () => { format = b.dataset.format; draw(); }; });
  dlg.querySelector('[data-share]').onclick = async () => {
    try { await navigator.share({ files: [new File([current], fileName(), { type: 'image/png' })], title: opts.title }); } catch (e) { /* cancelado */ }
  };
  dlg.querySelector('[data-download]').onclick = () => {
    const a = document.createElement('a');
    a.href = img.dataset.url; a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove();
  };
  if (!dlg.open) dlg.showModal();
  await draw();
}
