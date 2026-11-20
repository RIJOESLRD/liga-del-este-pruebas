// Panel de noticias de la Liga del Este.
// Guarda cada noticia como contenido/noticias/<nombre>.json y sus fotos en fotos/noticias/,
// directamente en el repositorio de GitHub, en un solo cambio. Al guardarse, GitHub vuelve
// a publicar la web sola (.github/workflows/publicar.yml) en 1 o 2 minutos.

const OWNER = 'RIJOESLRD';
const REPO = 'liga-del-este-web';
const BRANCH = 'main';
const NEWS_DIR = 'contenido/noticias';
const PHOTO_DIR = 'fotos/noticias';
const TOKEN_KEY = 'lde-admin-clave';          // versión anterior: clave sin cifrar (se migra al PIN)
const PIN_KEY = 'lde-admin-clave-cifrada';     // clave de GitHub cifrada con el PIN
const TRIES_KEY = 'lde-admin-intentos';
const MAX_TRIES = 5;
const TIPOS = { aviso: 'Aviso', jornada: 'Jornada', evento: 'Evento', institucional: 'La liga' };

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const masDias = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); const t = new Date(y, m - 1, d + n); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

let token = '';
let noticias = [];        // [{slug, path, sha, data}]
let editando = null;      // noticia que se edita, o null si es nueva
let portada = null;       // {path} existente o {file, url} nueva, o null
let fotos = [];           // [{path}] o [{file, url}]
let quitadas = [];        // rutas de fotos existentes que se quitaron

/* ---------- GitHub ---------- */

class ErrorGH extends Error { constructor(status, msg) { super(msg); this.status = status; } }

async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {})
    }
  });
  if (r.status === 204) return null;
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErrorGH(r.status, data.message || `Error ${r.status}`);
  return data;
}

const b64Texto = (txt) => {
  const bytes = new TextEncoder().encode(txt);
  let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
};
const textoDeB64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
const b64Blob = (blob) => new Promise((res, rej) => {
  const fr = new FileReader();
  fr.onload = () => res(String(fr.result).split(',')[1]);
  fr.onerror = rej;
  fr.readAsDataURL(blob);
});

// Sube varios archivos (y borra otros) en un solo cambio.
async function guardarCambios(mensaje, archivos, intento = 0) {
  try {
    const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const base = await gh(`/repos/${OWNER}/${REPO}/git/commits/${ref.object.sha}`);
    const tree = [];
    for (const a of archivos) {
      if (a.borrar) { tree.push({ path: a.path, mode: '100644', type: 'blob', sha: null }); continue; }
      const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: a.base64, encoding: 'base64' }) });
      tree.push({ path: a.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const nuevoArbol = await gh(`/repos/${OWNER}/${REPO}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
    const commit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, { method: 'POST', body: JSON.stringify({ message: mensaje, tree: nuevoArbol.sha, parents: [ref.object.sha] }) });
    await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
  } catch (e) {
    // Si alguien publicó al mismo tiempo (por ejemplo, la actualización de Dribbli), se reintenta.
    if (e.status === 422 && intento < 2) return guardarCambios(mensaje, archivos, intento + 1);
    throw e;
  }
}

/* ---------- Fotos: se achican antes de subir ---------- */

async function achicar(file, max = 1600, calidad = 0.82) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { bmp = await createImageBitmap(file); }
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', calidad));
}

/* ---------- Vistas ---------- */

function ver(nombre) {
  ['entrar', 'pin-crear', 'pin', 'lista', 'editor'].forEach((v) => { $(`#vista-${v}`).hidden = v !== nombre; });
  $('#salir').hidden = !['lista', 'editor'].includes(nombre);
  window.scrollTo(0, 0);
}

function mensajeError(e) {
  if (e.status === 401) return 'La clave no es válida o ya venció. Sal y vuelve a entrar con una clave nueva.';
  if (e.status === 403 || e.status === 404) return 'La clave no tiene permiso para guardar en la web. Revisa que tenga el repositorio liga-del-este-web y el permiso Contents: Read and write.';
  if (e instanceof TypeError) return 'No hay conexión a internet. Revisa tu conexión e inténtalo otra vez.';
  return `No se pudo guardar: ${e.message}`;
}

/* ---------- PIN: la clave de GitHub se guarda cifrada con el PIN ---------- */

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } }
};
const aB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function llaveDePin(pin, sal) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal, iterations: 310000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function cifrar(texto, pin) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const datos = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await llaveDePin(pin, sal), new TextEncoder().encode(texto));
  return JSON.stringify({ sal: aB64(sal), iv: aB64(iv), datos: aB64(datos) });
}
async function descifrar(guardado, pin) {
  const g = JSON.parse(guardado);
  const datos = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(g.iv) }, await llaveDePin(pin, deB64(g.sal)), deB64(g.datos));
  return new TextDecoder().decode(datos);
}

// Revisa que la clave de GitHub funcione y tenga permiso para guardar.
async function validarClave(clave) {
  token = clave.trim();
  const repo = await gh(`/repos/${OWNER}/${REPO}`);
  if (repo.permissions && !repo.permissions.push) throw new ErrorGH(403, 'sin permiso de escritura');
}

function volverAClave(aviso) {
  store.del(PIN_KEY); store.del(TOKEN_KEY); store.del(TRIES_KEY);
  token = ''; $('#token').value = '';
  $('#entrar-aviso').textContent = aviso || '';
  $('#entrar-aviso').hidden = !aviso;
  ver('entrar');
}

async function entrar(clave) {
  const err = $('#entrar-error');
  err.hidden = true;
  if (!clave.trim()) { err.textContent = 'Pega tu clave de acceso.'; err.hidden = false; return; }
  $('#entrar').disabled = true; $('#entrar').textContent = 'Revisando…';
  try {
    await validarClave(clave);
    $('#pin-nuevo').value = ''; $('#pin-nuevo2').value = ''; $('#pin-crear-error').hidden = true;
    ver('pin-crear');
    $('#pin-nuevo').focus();
  } catch (e) {
    token = '';
    err.textContent = e.status === 401 ? 'Esa clave no es válida o ya venció.' : mensajeError(e);
    err.hidden = false;
  } finally {
    $('#entrar').disabled = false; $('#entrar').textContent = 'Entrar';
  }
}

async function crearPin(e) {
  e.preventDefault();
  const err = $('#pin-crear-error');
  const pin = $('#pin-nuevo').value;
  err.hidden = true;
  if (pin.length < 6) { err.textContent = 'El PIN debe tener al menos 6 caracteres.'; err.hidden = false; return; }
  if (pin !== $('#pin-nuevo2').value) { err.textContent = 'Los dos no coinciden. Escríbelo otra vez.'; err.hidden = false; return; }
  if (!window.crypto || !crypto.subtle) { err.textContent = 'Abre el panel desde la dirección segura (que empieza con https://).'; err.hidden = false; return; }
  $('#pin-guardar').disabled = true;
  try {
    store.set(PIN_KEY, await cifrar(token, pin));
    store.del(TOKEN_KEY); store.del(TRIES_KEY);
    await cargarLista();
    ver('lista');
  } catch (ex) {
    err.textContent = mensajeError(ex); err.hidden = false;
  } finally {
    $('#pin-guardar').disabled = false;
  }
}

async function entrarConPin(e) {
  e.preventDefault();
  const err = $('#pin-error');
  err.hidden = true;
  const pin = $('#pin').value;
  if (!pin) { err.textContent = 'Escribe tu PIN.'; err.hidden = false; return; }
  $('#pin-entrar').disabled = true; $('#pin-entrar').textContent = 'Revisando…';
  try {
    let clave;
    try {
      clave = await descifrar(store.get(PIN_KEY), pin);
    } catch (ex) {
      const n = Number(store.get(TRIES_KEY) || 0) + 1;
      if (n >= MAX_TRIES) {
        volverAClave(`Por seguridad, después de ${MAX_TRIES} intentos se borró el acceso guardado. Pega tu clave de GitHub otra vez y crea un PIN nuevo.`);
        return;
      }
      store.set(TRIES_KEY, String(n));
      err.textContent = `PIN incorrecto. Te quedan ${MAX_TRIES - n} intentos.`; err.hidden = false;
      $('#pin').value = ''; $('#pin').focus();
      return;
    }
    store.del(TRIES_KEY);
    try {
      await validarClave(clave);
    } catch (ex) {
      if (ex.status === 401) { volverAClave('Tu clave de GitHub venció o fue borrada. Crea una nueva (abajo explica cómo), pégala y elige tu PIN.'); return; }
      throw ex;
    }
    $('#pin').value = '';
    await cargarLista();
    ver('lista');
  } catch (ex) {
    err.textContent = mensajeError(ex); err.hidden = false;
  } finally {
    $('#pin-entrar').disabled = false; $('#pin-entrar').textContent = 'Entrar';
  }
}

async function cargarLista() {
  $('#lista').innerHTML = '<p class="adm-help">Cargando…</p>';
  let archivos = [];
  try {
    archivos = await gh(`/repos/${OWNER}/${REPO}/contents/${NEWS_DIR}?ref=${BRANCH}`);
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  const json = (Array.isArray(archivos) ? archivos : []).filter((a) => a.name.endsWith('.json'));
  noticias = await Promise.all(json.map(async (a) => {
    const f = await gh(`/repos/${OWNER}/${REPO}/contents/${a.path}?ref=${BRANCH}`);
    return { slug: a.name.slice(0, -5), path: a.path, data: JSON.parse(textoDeB64(f.content)) };
  }));
  noticias.sort((a, b) => String(b.data.fecha).localeCompare(String(a.data.fecha)));
  pintarLista();
}

function pintarLista() {
  if (!noticias.length) {
    $('#lista').innerHTML = '<p class="adm-help">Todavía no hay noticias. Toca "Nueva noticia" para publicar la primera.</p>';
    return;
  }
  $('#lista').innerHTML = noticias.map((n, i) => `<div class="adm-item">
      ${n.data.portada ? `<img src="../${esc(n.data.portada)}" alt="">` : '<span class="adm-noimg"></span>'}
      <div class="adm-item__txt"><strong>${esc(n.data.titulo)}</strong><span>${esc(TIPOS[n.data.tipo] || 'Noticia')} · ${esc(n.data.fecha)}${n.data.urgente ? ' · aviso urgente' : ''}</span></div>
      <button type="button" class="btn btn--plain adm-btn adm-btn--ghost" data-editar="${i}">Editar</button>
    </div>`).join('');
}

/* ---------- Editor ---------- */

function pintarFotos() {
  const src = (f) => f.url || `../${f.path}`;
  $('#portada-prev').innerHTML = portada
    ? `<div class="adm-thumb"><img src="${esc(src(portada))}" alt="Portada"><button type="button" data-quitar-portada aria-label="Quitar portada">×</button></div>` : '';
  $('#fotos-prev').innerHTML = fotos.map((f, i) =>
    `<div class="adm-thumb"><img src="${esc(src(f))}" alt="Foto ${i + 1}"><button type="button" data-quitar-foto="${i}" aria-label="Quitar foto ${i + 1}">×</button></div>`).join('');
}

function abrirEditor(n) {
  editando = n;
  quitadas = [];
  const d = n ? n.data : {};
  $('#editor-titulo').textContent = n ? 'Editar noticia' : 'Nueva noticia';
  $('#publicar').textContent = n ? 'Guardar cambios' : 'Publicar';
  $('#borrar').hidden = !n;
  $('#confirmar-borrar').hidden = true;
  $('#f-titulo').value = d.titulo || '';
  $('#f-fecha').value = d.fecha || hoy();
  $('#f-tipo').value = d.tipo || 'jornada';
  $('#f-resumen').value = d.resumen || '';
  $('#f-texto').value = d.texto || '';
  $('#f-urgente').checked = !!d.urgente;
  $('#f-hasta').value = d.urgente_hasta || masDias($('#f-fecha').value, 3);
  $('#f-hasta-box').hidden = !d.urgente;
  portada = d.portada ? { path: d.portada } : null;
  fotos = (d.fotos || []).map((p) => ({ path: p }));
  $('#editor-error').hidden = true;
  $('#editor-progreso').hidden = true;
  contar();
  pintarFotos();
  ver('editor');
  $('#f-titulo').focus();
}

function contar() { $('#f-resumen-n').textContent = `${$('#f-resumen').value.length} / 220`; }

function nombreDe(titulo, fecha) {
  const base = titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '') || 'noticia';
  let slug = `${fecha.slice(0, 7)}-${base}`;
  let i = 2;
  while (noticias.some((n) => n.slug === slug)) slug = `${fecha.slice(0, 7)}-${base}-${i++}`;
  return slug;
}

async function publicar(e) {
  e.preventDefault();
  const err = $('#editor-error');
  const prog = $('#editor-progreso');
  err.hidden = true;
  const titulo = $('#f-titulo').value.trim();
  const fecha = $('#f-fecha').value;
  const falta = [];
  if (!titulo) falta.push('el título');
  if (!fecha) falta.push('la fecha');
  if (!$('#f-texto').value.trim() && !$('#f-resumen').value.trim()) falta.push('el texto o el resumen');
  if (falta.length) { err.textContent = `Falta ${falta.join(', ')}.`; err.hidden = false; return; }

  const slug = editando ? editando.slug : nombreDe(titulo, fecha);
  const btn = $('#publicar');
  btn.disabled = true;
  try {
    const archivos = [];
    const stamp = Date.now().toString(36);
    const subir = async (f, i) => {
      if (f.path) return f.path;
      prog.textContent = `Preparando foto ${i + 1}…`; prog.hidden = false;
      let blob = await achicar(f.file);
      // Si la foto ya era liviana (JPG), se sube tal cual.
      if (/jpe?g/i.test(f.file.type) && f.file.size <= blob.size) blob = f.file;
      const path = `${PHOTO_DIR}/${slug}-${stamp}-${i + 1}.jpg`;
      archivos.push({ path, base64: await b64Blob(blob) });
      return path;
    };
    const rutaPortada = portada ? await subir(portada, 0) : '';
    const rutasFotos = [];
    for (let i = 0; i < fotos.length; i++) rutasFotos.push(await subir(fotos[i], i + 1));
    quitadas.filter((p) => p.startsWith(`${PHOTO_DIR}/`)).forEach((p) => archivos.push({ path: p, borrar: true }));

    const data = {
      titulo,
      fecha,
      tipo: $('#f-tipo').value,
      resumen: $('#f-resumen').value.trim(),
      texto: $('#f-texto').value.trim(),
      portada: rutaPortada,
      fotos: rutasFotos,
      urgente: $('#f-urgente').checked,
      urgente_hasta: $('#f-urgente').checked ? $('#f-hasta').value : ''
    };
    archivos.push({ path: `${NEWS_DIR}/${slug}.json`, base64: b64Texto(`${JSON.stringify(data, null, 1)}\n`) });

    prog.textContent = 'Guardando en la web…'; prog.hidden = false;
    await guardarCambios(`${editando ? 'Noticia editada' : 'Noticia nueva'}: ${titulo}`, archivos);
    await cargarLista();
    ver('lista');
    const ok = $('#lista-ok');
    ok.innerHTML = `Listo. La noticia sale en la web en 1 o 2 minutos: <a href="../noticia-${esc(slug)}.html" target="_blank" rel="noopener">ver noticia</a>.`;
    ok.hidden = false;
  } catch (ex) {
    err.textContent = mensajeError(ex);
    err.hidden = false;
  } finally {
    btn.disabled = false;
    prog.hidden = true;
  }
}

async function borrar() {
  const n = editando;
  const err = $('#editor-error');
  $('#borrar-si').disabled = true;
  try {
    const archivos = [{ path: n.path, borrar: true }];
    [n.data.portada, ...(n.data.fotos || [])].filter((p) => p && p.startsWith(`${PHOTO_DIR}/`))
      .forEach((p) => archivos.push({ path: p, borrar: true }));
    await guardarCambios(`Noticia borrada: ${n.data.titulo}`, archivos);
    await cargarLista();
    ver('lista');
    const ok = $('#lista-ok');
    ok.textContent = 'Noticia borrada. La web se actualiza en 1 o 2 minutos.';
    ok.hidden = false;
  } catch (ex) {
    err.textContent = mensajeError(ex);
    err.hidden = false;
  } finally {
    $('#borrar-si').disabled = false;
  }
}

/* ---------- Eventos ---------- */

$('#entrar').addEventListener('click', () => entrar($('#token').value));
$('#token').addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar($('#token').value); });
// Salir: cierra la sesión pero deja el PIN guardado en este dispositivo.
$('#salir').addEventListener('click', () => {
  token = ''; $('#lista-ok').hidden = true;
  ver(store.get(PIN_KEY) ? 'pin' : 'entrar');
});
$('#vista-pin-crear').addEventListener('submit', crearPin);
$('#vista-pin').addEventListener('submit', entrarConPin);
$('#pin-olvide').addEventListener('click', () => volverAClave('Pega tu clave de GitHub y elige un PIN nuevo.'));
$('#nueva').addEventListener('click', () => { $('#lista-ok').hidden = true; abrirEditor(null); });
$('#lista').addEventListener('click', (e) => {
  const b = e.target.closest('[data-editar]');
  if (b) { $('#lista-ok').hidden = true; abrirEditor(noticias[Number(b.dataset.editar)]); }
});
$('#cancelar').addEventListener('click', () => ver('lista'));
$('#editor').addEventListener('submit', publicar);
$('#editor').addEventListener('input', () => { $('#editor-error').hidden = true; });
$('#f-resumen').addEventListener('input', contar);
$('#f-urgente').addEventListener('change', () => { $('#f-hasta-box').hidden = !$('#f-urgente').checked; });
$('#f-portada').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (portada && portada.path) quitadas.push(portada.path);
  portada = { file: f, url: URL.createObjectURL(f) };
  e.target.value = '';
  pintarFotos();
});
$('#f-fotos').addEventListener('change', (e) => {
  [...e.target.files].forEach((f) => fotos.push({ file: f, url: URL.createObjectURL(f) }));
  e.target.value = '';
  pintarFotos();
});
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-quitar-portada]')) {
    if (portada && portada.path) quitadas.push(portada.path);
    portada = null; pintarFotos();
  }
  const q = e.target.closest('[data-quitar-foto]');
  if (q) {
    const [f] = fotos.splice(Number(q.dataset.quitarFoto), 1);
    if (f && f.path) quitadas.push(f.path);
    pintarFotos();
  }
});
$('#borrar').addEventListener('click', () => { $('#confirmar-borrar').hidden = false; });
$('#borrar-no').addEventListener('click', () => { $('#confirmar-borrar').hidden = true; });
$('#borrar-si').addEventListener('click', borrar);

/* ---------- Inicio ---------- */

const anterior = store.get(TOKEN_KEY);   // quien ya entró antes del PIN: se le pide crear uno
if (store.get(PIN_KEY)) {
  ver('pin');
  $('#pin').focus();
} else if (anterior) {
  validarClave(anterior)
    .then(() => { ver('pin-crear'); $('#pin-nuevo').focus(); })
    .catch(() => volverAClave(''));
} else {
  ver('entrar');
}
