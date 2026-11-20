// Pop-up: una tarjeta que aparece abajo (no tapa la página) a los pocos segundos,
// una vez cada POPUP.everyDays días por persona.
// Muestra el anuncio del patrocinador activo o, si no hay, la invitación al Instagram de la liga.

import { POPUP, SOCIAL } from './data.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const KEY = 'lde-popup-visto';
const ICON_X = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>';
const ICON_IG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"></circle></svg>';

const today = () => new Date().toISOString().slice(0, 10);

function sponsorIsActive(s) {
  if (!s || !s.active || !s.url) return false;
  const d = today();
  return (!s.desde || d >= s.desde) && (!s.hasta || d <= s.hasta);
}

function recentlySeen() {
  try {
    const t = Number(localStorage.getItem(KEY) || 0);
    return t && (Date.now() - t) < POPUP.everyDays * 86400000;
  } catch (e) { return false; }
}
function markSeen() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* sin almacenamiento */ } }

function cardHTML(leagueLogo) {
  const s = POPUP.sponsor;
  if (sponsorIsActive(s)) {
    return {
      kind: 'patrocinador',
      html: `<span class="popup__kicker">PATROCINADOR OFICIAL</span>
        <div class="popup__logo popup__logo--sponsor"><img src="${esc(s.logo)}" alt="${esc(s.name)}"></div>
        <p class="popup__text">${esc(s.text)}</p>
        <a class="btn btn--dark btn--plain popup__cta" href="${esc(s.url)}" target="_blank" rel="noopener">${ICON_IG} ${esc(s.button)}</a>
        <button type="button" class="popup__link" data-form="patrocinio">¿Quieres anunciarte aquí? Hazte patrocinador</button>`
    };
  }
  if (!SOCIAL.instagram) return null;
  const ig = POPUP.instagram;
  return {
    kind: 'instagram',
    html: `<div class="popup__head">
        ${leagueLogo ? `<span class="popup__logo popup__logo--league"><img src="${esc(leagueLogo)}" alt=""></span>` : ''}
        <span class="popup__kicker">LIGA DEL ESTE</span>
      </div>
      <p class="popup__title">${esc(ig.title)}</p>
      <p class="popup__text">${esc(ig.text)}</p>
      <a class="btn btn--red btn--plain popup__cta" href="${esc(SOCIAL.instagram)}" target="_blank" rel="noopener">${ICON_IG} ${esc(ig.button)}</a>
      <button type="button" class="popup__link" data-form="patrocinio">¿Quieres anunciarte aquí? Hazte patrocinador</button>`
  };
}

function show(leagueLogo) {
  // No interrumpir si hay otra ventana abierta (un formulario, una foto, una imagen).
  if (document.querySelector('dialog[open]')) { setTimeout(() => show(leagueLogo), 4000); return; }
  const card = cardHTML(leagueLogo);
  if (!card) return;
  document.body.insertAdjacentHTML('beforeend', `<aside class="popup popup--${card.kind}" role="dialog" aria-label="${card.kind === 'patrocinador' ? 'Patrocinador oficial' : 'Instagram de la liga'}">
    <button type="button" class="popup__close" aria-label="Cerrar">${ICON_X}</button>
    ${card.html}
  </aside>`);
  const el = document.querySelector('.popup');
  markSeen();
  const close = () => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 250); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  el.querySelector('.popup__close').addEventListener('click', close);
  el.querySelectorAll('a, [data-form]').forEach((a) => a.addEventListener('click', () => setTimeout(close, 100)));
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => el.classList.add('is-in'));
}

export function initPopup(leagueLogo) {
  if (!POPUP.enabled || recentlySeen()) return;
  if (/privacidad/.test(location.pathname)) return;
  let done = false;
  const go = () => { if (done) return; done = true; window.removeEventListener('scroll', onScroll); show(leagueLogo); };
  const onScroll = () => { if (window.scrollY > 900) go(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  setTimeout(go, POPUP.delaySeconds * 1000);
}
