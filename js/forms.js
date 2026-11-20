// Formularios que arman un mensaje y lo abren en WhatsApp (patrocinio e inscripciones).
// Se usan desde cualquier página con un botón o enlace:  data-form="patrocinio"  o  data-form="inscripcion".
// La web no guarda estos datos: solo prepara el mensaje; la persona lo envía desde su WhatsApp.

import { CONTACT, DIVISIONS } from './data.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export const waLink = (text) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;

const ICON_WA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.5-.3z"/></svg>';
const ICON_X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>';

// Categorías de todas las divisiones, sin repetir (U8, U10 … Open).
const ALL_CATS = [...new Set(DIVISIONS.flatMap((d) => d.cats.map((c) => c[1])))]
  .sort((a, b) => (parseInt(a.slice(1), 10) || 99) - (parseInt(b.slice(1), 10) || 99));

/* ---------- Definición de cada formulario ---------- */

const FORMS = {
  patrocinio: {
    kicker: 'PATROCINIOS',
    title: 'Pon tu marca en la Liga del Este',
    lead: 'Déjanos tus datos y se abre WhatsApp con el mensaje listo para enviarlo a la liga.',
    intro: 'Hola, quiero ser patrocinador de la Liga del Este.',
    fields: [
      { id: 'nombre', label: 'Nombre', type: 'text', required: true, autocomplete: 'name' },
      { id: 'empresa', label: 'Empresa o marca', type: 'text', required: true, autocomplete: 'organization' },
      { id: 'telefono', label: 'Teléfono', type: 'tel', required: true, half: true },
      { id: 'correo', label: 'Correo', type: 'email', half: true, placeholder: 'nombre@empresa.com' },
      { id: 'mensaje', label: 'Mensaje', type: 'textarea', placeholder: 'Ej.: me interesa patrocinar una categoría o la transmisión en vivo' }
    ]
  },
  inscripcion: {
    kicker: 'INSCRIPCIONES',
    title: 'Inscríbete en la Liga del Este',
    lead: 'Llena estos datos y se abre WhatsApp con tu solicitud lista para enviarla a la liga. Te contactamos para completar la inscripción.',
    intro: 'Hola, quiero información para inscribirme en la Liga del Este.',
    fields: [
      { id: 'tipo', label: 'Quiero inscribir', type: 'radio', required: true,
        options: ['Un club o academia', 'Un jugador (busca equipo)'] },
      { id: 'nombre', label: 'Nombre del responsable', type: 'text', required: true, autocomplete: 'name',
        hint: 'Persona adulta: director, entrenador, padre, madre o tutor.' },
      { id: 'club', label: 'Club o academia', type: 'text', autocomplete: 'organization',
        requiredWhen: { field: 'tipo', value: 'Un club o academia' } },
      { id: 'division', label: 'División', type: 'checks',
        options: [...DIVISIONS.map((d) => d.name), 'No sé todavía'] },
      { id: 'categorias', label: 'Categorías', type: 'checks', options: ALL_CATS },
      { id: 'ciudad', label: 'Ciudad o provincia', type: 'text', required: true, autocomplete: 'address-level2', placeholder: 'Ej.: La Romana' },
      { id: 'telefono', label: 'Teléfono (WhatsApp)', type: 'tel', required: true, half: true },
      { id: 'correo', label: 'Correo', type: 'email', half: true, placeholder: 'nombre@correo.com' },
      { id: 'mensaje', label: 'Mensaje', type: 'textarea', placeholder: 'Ej.: tenemos 3 equipos (U10, U12 y U14) y queremos entrar en la Super Copa' },
      { id: 'adulto', label: 'Soy mayor de 18 años (responsable del club, o padre, madre o tutor del jugador).', type: 'check', required: true }
    ]
  }
};

/* ---------- Construcción del HTML ---------- */

function fieldHTML(key, f) {
  const id = `${key}-${f.id}`;
  const opt = f.required ? '' : ' <span class="field__opt">(opcional)</span>';
  const hint = f.hint ? `<span class="field__hint" id="${id}-hint">${esc(f.hint)}</span>` : '';
  const desc = f.hint ? ` aria-describedby="${id}-hint"` : '';
  if (f.type === 'radio' || f.type === 'checks') {
    const kind = f.type === 'radio' ? 'radio' : 'checkbox';
    const opts = f.options.map((o, i) =>
      `<label class="choice"><input type="${kind}" name="${id}" id="${id}-${i}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('');
    return `<fieldset class="field field--choices" data-field="${f.id}">
      <legend>${esc(f.label)}${f.type === 'checks' ? ' <span class="field__opt">(marca todas las que apliquen)</span>' : ''}</legend>
      <div class="choices">${opts}</div>
    </fieldset>`;
  }
  if (f.type === 'check') {
    return `<label class="consent" data-field="${f.id}"><input type="checkbox" id="${id}" name="${id}"><span>${esc(f.label)}</span></label>`;
  }
  const common = `id="${id}" name="${id}"${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ''}${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}${desc}`;
  const input = f.type === 'textarea'
    ? `<textarea ${common} rows="3"></textarea>`
    : f.type === 'tel'
      ? `<input ${common} type="tel" inputmode="tel" placeholder="809-000-0000" autocomplete="tel">`
      : `<input ${common} type="${f.type}">`;
  const req = f.requiredWhen ? ' <span class="field__opt" data-opt-label>(opcional)</span>' : opt;
  return `<div class="field${f.half ? ' field--half' : ''}" data-field="${f.id}"><label for="${id}">${esc(f.label)}${req}</label>${input}${hint}</div>`;
}

function dialogHTML(key, cfg) {
  return `<dialog class="form-dialog" id="form-${key}" aria-labelledby="form-${key}-title">
  <button type="button" class="form-dialog__close" data-close aria-label="Cerrar">${ICON_X}</button>
  <form class="form-dialog__form" novalidate>
    <span class="kicker">${cfg.kicker}</span>
    <h2 class="form-dialog__title" id="form-${key}-title">${esc(cfg.title)}</h2>
    <p class="form-dialog__lead">${esc(cfg.lead)}</p>
    <div class="form-grid">${cfg.fields.map((f) => fieldHTML(key, f)).join('')}</div>
    <p class="form-dialog__error" role="alert" hidden></p>
    <button type="submit" class="btn btn--wa">${ICON_WA} Enviar por WhatsApp</button>
    <p class="form-dialog__alt">¿Prefieres escribir directo? WhatsApp <a href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener">${CONTACT.phone}</a> · Correo <span style="user-select:all">${esc(CONTACT.email)}</span></p>
  </form>
  <div class="form-dialog__done" hidden>
    <span class="kicker">CASI LISTO</span>
    <h2 class="form-dialog__title">Falta enviar el mensaje</h2>
    <p class="form-dialog__lead" data-done-text></p>
    <a class="btn btn--wa" data-wa-link href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener">${ICON_WA} Abrir WhatsApp</a>
  </div>
</dialog>`;
}

/* ---------- Lectura, validación y mensaje ---------- */

function readValues(dlg, key, cfg) {
  const vals = {};
  for (const f of cfg.fields) {
    const id = `${key}-${f.id}`;
    if (f.type === 'radio') vals[f.id] = (dlg.querySelector(`input[name="${id}"]:checked`) || {}).value || '';
    else if (f.type === 'checks') vals[f.id] = [...dlg.querySelectorAll(`input[name="${id}"]:checked`)].map((i) => i.value);
    else if (f.type === 'check') vals[f.id] = dlg.querySelector(`#${id}`).checked;
    else vals[f.id] = dlg.querySelector(`#${id}`).value.trim();
  }
  return vals;
}

function isRequired(f, vals) {
  return f.required || (f.requiredWhen && vals[f.requiredWhen.field] === f.requiredWhen.value);
}

function validate(dlg, key, cfg, vals) {
  const missing = [];
  for (const f of cfg.fields) {
    const v = vals[f.id];
    const empty = Array.isArray(v) ? !v.length : !v;
    if (isRequired(f, vals) && empty) {
      missing.push(f.type === 'check' ? 'confirmar que eres mayor de 18 años' : f.label.charAt(0).toLowerCase() + f.label.slice(1));
      continue;
    }
    if (f.type === 'tel' && v && v.replace(/\D/g, '').length < 7) missing.push('un teléfono válido');
    if (f.type === 'email' && v && !dlg.querySelector(`#${key}-${f.id}`).checkValidity()) missing.push('un correo válido');
  }
  return missing;
}

function buildMessage(cfg, vals) {
  const lines = [cfg.intro];
  for (const f of cfg.fields) {
    const v = vals[f.id];
    if (f.type === 'check' || (Array.isArray(v) ? !v.length : !v)) continue;
    lines.push(`${f.label}: ${Array.isArray(v) ? v.join(', ') : v}`);
  }
  return lines.join('\n');
}

/* ---------- Arranque ---------- */

// Crea la ventana del formulario la primera vez que se pide (sirve también para
// botones que aparecen después, como el del pop-up).
function ensureFormDialog(key) {
  const existing = document.getElementById(`form-${key}`);
  if (existing) return existing;
  const cfg = FORMS[key];
  document.body.insertAdjacentHTML('beforeend', dialogHTML(key, cfg));
  const dlg = document.getElementById(`form-${key}`);
  const form = dlg.querySelector('form');
  const done = dlg.querySelector('.form-dialog__done');
  const err = dlg.querySelector('.form-dialog__error');

  // "Club o academia" pasa a obligatorio solo si se inscribe un club.
  const syncOptional = () => {
    const vals = readValues(dlg, key, cfg);
    cfg.fields.filter((f) => f.requiredWhen).forEach((f) => {
      const lbl = dlg.querySelector(`[data-field="${f.id}"] [data-opt-label]`);
      if (lbl) lbl.hidden = isRequired(f, vals);
    });
  };
  form.addEventListener('change', syncOptional);
  form.addEventListener('input', () => { err.hidden = true; });

  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const vals = readValues(dlg, key, cfg);
    const missing = validate(dlg, key, cfg, vals);
    if (missing.length) {
      err.textContent = `Falta: ${missing.join(', ')}.`;
      err.hidden = false;
      return;
    }
    const url = waLink(buildMessage(cfg, vals));
    dlg.querySelector('[data-wa-link]').href = url;
    const w = window.open(url, '_blank');
    if (w) w.opener = null;
    dlg.querySelector('[data-done-text]').textContent = w
      ? 'Se abrió WhatsApp con tu mensaje listo. Toca Enviar en WhatsApp para que llegue a la liga.'
      : 'Toca el botón para abrir WhatsApp con tu mensaje listo, y luego toca Enviar.';
    form.hidden = true;
    done.hidden = false;
  });
  return dlg;
}

export function openForm(key) {
  if (!FORMS[key]) return;
  const dlg = ensureFormDialog(key);
  dlg.querySelector('form').hidden = false;
  dlg.querySelector('.form-dialog__done').hidden = true;
  dlg.querySelector('.form-dialog__error').hidden = true;
  if (!dlg.open) dlg.showModal();
  const first = dlg.querySelector('input, textarea');
  if (first) first.focus();
}

export function initForms() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-form]');
    if (!trigger || !FORMS[trigger.dataset.form]) return;
    e.preventDefault();
    openForm(trigger.dataset.form);
  });
}
