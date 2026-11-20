// Suscripción al boletín (Brevo).
// - Un bloque de suscripción arriba del pie de página, en todas las páginas.
// - requireSubscription(fn): pide suscribirse la primera vez antes de hacer algo (por ejemplo,
//   descargar una imagen). En ese teléfono o computadora ya no lo vuelve a pedir.
// Los datos van directo al formulario de Brevo (NEWSLETTER.action en data.js); la web no los guarda.

import { NEWSLETTER } from './data.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const FLAG = 'lde-suscrito';
const isSubscribed = () => { try { return localStorage.getItem(FLAG) === '1'; } catch (e) { return false; } };
const markSubscribed = () => { try { localStorage.setItem(FLAG, '1'); } catch (e) { /* sin almacenamiento */ } };

let clubNames = [];
let counter = 0;

/* ---------- Envío a Brevo ---------- */

// Teléfono dominicano: Brevo lo guarda como código de país + número (ej. +1 8095551234).
function phoneParts(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (!d) return { code: '', number: '' };
  if (d.length === 11 && d.startsWith('1')) return { code: '+1', number: d.slice(1) };
  return { code: '+1', number: d };
}

async function sendToBrevo(v) {
  const fd = new FormData();
  const ph = phoneParts(v.whatsapp);
  fd.append('EMAIL', v.email);
  fd.append('NOMBRE', v.nombre);
  fd.append('SMS__COUNTRY_CODE', ph.number ? ph.code : '');
  fd.append('SMS', ph.number);
  fd.append('CLUB', v.club);
  fd.append('email_address_check', '');
  fd.append('locale', 'es');
  const r = await fetch(`${NEWSLETTER.action}?isAjax=1`, { method: 'POST', body: fd });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.success) {
    const first = data.errors ? Object.values(data.errors)[0] : '';
    throw new Error(data.message || first || 'No pudimos completar la suscripción.');
  }
}

/* ---------- Formulario (se usa en el pie y en la ventana) ---------- */

function formHTML(id, compact) {
  return `<form class="nl-form${compact ? ' nl-form--compact' : ''}" data-nl novalidate>
    <div class="nl-form__grid">
      <div class="field"><label for="${id}-nombre">Nombre</label>
        <input id="${id}-nombre" type="text" autocomplete="name" required></div>
      <div class="field"><label for="${id}-email">Correo</label>
        <input id="${id}-email" type="email" autocomplete="email" placeholder="nombre@correo.com" required></div>
      <div class="field"><label for="${id}-wa">WhatsApp <span class="field__opt">(opcional)</span></label>
        <input id="${id}-wa" type="tel" inputmode="tel" autocomplete="tel" placeholder="809-000-0000"></div>
      <div class="field"><label for="${id}-club">Club que sigues <span class="field__opt">(opcional)</span></label>
        <input id="${id}-club" type="text" list="nl-clubs" autocomplete="off" placeholder="Ej.: Academia Real Romana"></div>
    </div>
    <label class="consent"><input type="checkbox" id="${id}-ok">
      <span>Soy mayor de 18 años y acepto recibir noticias de la Liga del Este por correo y WhatsApp. Puedo darme de baja cuando quiera. <a href="privacidad.html">Política de privacidad</a>.</span></label>
    <p class="form-dialog__error" role="alert" hidden></p>
    <button type="submit" class="btn btn--red btn--plain nl-form__submit">Suscribirme gratis</button>
  </form>`;
}

function bindForm(form, id, onDone) {
  const err = form.querySelector('.form-dialog__error');
  const btn = form.querySelector('.nl-form__submit');
  form.addEventListener('input', () => { err.hidden = true; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = {
      nombre: form.querySelector(`#${id}-nombre`).value.trim(),
      email: form.querySelector(`#${id}-email`).value.trim(),
      whatsapp: form.querySelector(`#${id}-wa`).value.trim(),
      club: form.querySelector(`#${id}-club`).value.trim()
    };
    const missing = [];
    if (!v.nombre) missing.push('tu nombre');
    if (!v.email || !form.querySelector(`#${id}-email`).checkValidity()) missing.push('un correo válido');
    if (v.whatsapp && v.whatsapp.replace(/\D/g, '').length < 10) missing.push('el WhatsApp completo con 809, 829 u 849');
    if (!form.querySelector(`#${id}-ok`).checked) missing.push('marcar la casilla de aceptación');
    if (missing.length) { err.textContent = `Falta: ${missing.join(', ')}.`; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      await sendToBrevo(v);
      markSubscribed();
      onDone(v);
    } catch (ex) {
      err.textContent = `${ex.message} Revisa tus datos e inténtalo otra vez.`;
      err.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = 'Suscribirme gratis';
    }
  });
}

const doneHTML = (nombre) => `<div class="nl-done" role="status">
  <strong>¡Listo${nombre ? `, ${esc(nombre.split(' ')[0])}` : ''}! Ya estás suscrito.</strong>
  <span>Te enviaremos los resultados, las tablas y las noticias de la liga.</span>
</div>`;

/* ---------- Bloque del pie de página ---------- */

function renderFooterBlock() {
  const inner = document.querySelector('.footer__inner');
  if (!inner || !NEWSLETTER.action) return;
  const id = `nl${++counter}`;
  inner.insertAdjacentHTML('afterbegin', `<section class="nl-band" id="boletin" aria-labelledby="${id}-title">
    <div class="nl-band__text">
      <span class="kicker">BOLETÍN</span>
      <h2 class="nl-band__title" id="${id}-title">Recibe los resultados y noticias de la liga</h2>
      <p>Cada semana: tablas, resultados, próximos partidos y avisos importantes. Gratis.</p>
    </div>
    <div class="nl-band__form">${isSubscribed() ? doneHTML('') : formHTML(id, true)}</div>
  </section>`);
  const form = inner.querySelector('.nl-band [data-nl]');
  if (form) bindForm(form, id, (v) => { form.outerHTML = doneHTML(v.nombre); });
}

/* ---------- Ventana: suscripción antes de descargar ---------- */

const ICON_X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>';

export function requireSubscription(next) {
  if (isSubscribed() || !NEWSLETTER.action) { next(); return; }
  let dlg = document.getElementById('nl-dialog');
  if (dlg) dlg.remove();
  const id = `nl${++counter}`;
  document.body.insertAdjacentHTML('beforeend', `<dialog class="form-dialog" id="nl-dialog" aria-labelledby="${id}-title">
    <button type="button" class="form-dialog__close" data-close aria-label="Cerrar">${ICON_X}</button>
    <div class="form-dialog__form">
      <span class="kicker">DESCARGA GRATIS</span>
      <h2 class="form-dialog__title" id="${id}-title">Suscríbete para descargar</h2>
      <p class="form-dialog__lead">Solo esta vez. Después descargas todas las imágenes que quieras y recibes cada semana los resultados de la liga.</p>
      ${formHTML(id, false)}
      <button type="button" class="nl-skip" data-already>Ya me suscribí antes</button>
    </div>
  </dialog>`);
  dlg = document.getElementById('nl-dialog');
  const go = () => { dlg.close(); dlg.remove(); next(); };
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.querySelector('[data-already]').addEventListener('click', () => { markSubscribed(); go(); });
  bindForm(dlg.querySelector('[data-nl]'), id, go);
  dlg.showModal();
  dlg.querySelector(`#${id}-nombre`).focus();
}

/* ---------- Arranque ---------- */

export function initNewsletter(clubs = []) {
  clubNames = clubs;
  if (!document.getElementById('nl-clubs') && clubNames.length) {
    document.body.insertAdjacentHTML('beforeend',
      `<datalist id="nl-clubs">${clubNames.map((c) => `<option value="${esc(c)}"></option>`).join('')}</datalist>`);
  }
  renderFooterBlock();
}
