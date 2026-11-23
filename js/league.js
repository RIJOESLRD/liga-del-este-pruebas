// Carga los datos de la liga y los deja en un solo formato para la web.
// Fuente principal: data/dribbli.json (generado por scripts/sync_dribbli.py).
// Si no se puede cargar, usa los datos de muestra de data.js.

import {
  TEAMS, team as sampleTeam, CATEGORY_DATA, CATEGORY_META, DIVISIONS,
  CLUB_LOGOS, TEAM_NAMES
} from './data.js';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

const PALETTE = ['#1F4FD1', '#C8102E', '#0E1B3D', '#047857', '#7C3AED', '#B7791F', '#9D174D', '#0F766E', '#C2410C', '#334155'];

const toDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const dateLabel = (iso) => {
  if (!iso) return 'Fecha por definir';
  const d = toDate(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const dateLong = (iso) => {
  const d = toDate(iso);
  return `${DAYS_LONG[d.getDay()]} ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
};
const timeLabel = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addDays = (iso, n) => {
  const d = toDate(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const hashColor = (id) => {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const clubKey = (name) => fold(name).replace(/\bfc\b/g, '').replace(/\s+/g, ' ').trim();

// "La estación, La Romana" -> "La estación (La Romana)"
export const isTBD = (v) => !v || /^(tbd|tba|por definir|n\/a|-)$/i.test(String(v).trim());
export const venueShort = (v) => {
  if (isTBD(v)) return 'Sede por definir';
  const fixCaps = (x) => (x === x.toUpperCase() && /[A-Z]{3}/.test(x)
    ? x.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()).replace(/\bFc\b/g, 'FC')
    : x);
  const [place, city] = String(v).split(',').map((x) => fixCaps(x.trim()));
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  return city ? `${cap(place)} (${city})` : cap(place);
};

const sortKey = (m) => `${m.date || '9999-99-99'} ${m.time || '99:99'}`;

/* ---------- Desde Dribbli ---------- */

function fromDribbli(json) {
  const teams = {};
  for (const [id, t] of Object.entries(json.teams)) {
    const name = TEAM_NAMES[id] || t.name;
    const club = t.club || name;
    const manual = Object.entries(CLUB_LOGOS).find(([k]) => clubKey(k) === clubKey(club));
    teams[id] = {
      id, name, club, ini: t.ini || '?', color: hashColor(id),
      logo: (manual && manual[1]) || t.logo || '',
      url: `https://app.dribbli.com/teams/${id}`,
      clubUrl: t.clubId ? `https://app.dribbli.com/clubs/${t.clubId}` : ''
    };
  }
  const today = todayISO();
  const categories = {};
  for (const [id, c] of Object.entries(json.categories)) {
    const all = c.schedule.map((m) => ({
      ...m, played: m.hs !== null && m.hs !== undefined,
      dateLabel: dateLabel(m.date), timeLabel: timeLabel(m.time)
    }));
    const results = all.filter((m) => m.played).sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
    let upcoming = all.filter((m) => !m.played && (!m.date || m.date >= today));
    upcoming.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    categories[id] = {
      results, upcoming,
      standings: c.standings || [],
      leaders: c.leaders || [],
      teams: c.teams, players: c.players, matches: c.matches
    };
  }
  return {
    live: true,
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : null,
    leagueLogo: json.leagueLogo || '',
    teams, categories
  };
}

/* ---------- Desde los datos de muestra ---------- */

function fromSample() {
  const teams = {};
  for (const k of Object.keys(TEAMS)) {
    const t = sampleTeam(k);
    teams[k] = { id: k, name: t.name, club: t.name, ini: t.ini, color: t.color, logo: '', url: '' };
  }
  const conv = (m) => ({
    home: m[0], away: m[3], hs: m[1], as: m[2], played: m[1] !== null,
    dateLabel: m[4], timeLabel: m[5], venue: m[6]
  });
  const categories = {};
  for (const d of DIVISIONS) {
    for (const [id] of d.cats) {
      const cd = CATEGORY_DATA[id];
      const meta = CATEGORY_META[id] || [];
      categories[id] = {
        results: cd ? cd.res.map(conv) : [],
        upcoming: cd ? cd.prox.map(conv) : [],
        standings: cd && cd.tabla ? [{
          name: '',
          rows: cd.tabla.map((r, i) => ({
            team: r[0], pos: i + 1, pj: r[1], g: r[2], e: r[3], p: r[4], gf: r[5], gc: r[6], dg: r[5] - r[6], pts: r[7]
          }))
        }] : [],
        leaders: [],
        teams: meta[0], players: meta[1], matches: meta[2]
      };
    }
  }
  return { live: false, updatedAt: new Date(2026, 10, 19), leagueLogo: '', teams, categories };
}

/* ---------- Cálculos para la portada ---------- */

export function catLabel(catId) {
  for (const d of DIVISIONS) {
    const c = d.cats.find((x) => x[0] === catId);
    if (c) return { division: d, label: c[1], text: d.id === 'primera' ? 'PRIMERA' : `${d.name} ${c[1]}`.toUpperCase() };
  }
  return { division: DIVISIONS[0], label: '', text: '' };
}

// Resultados de las últimas jornadas en todas las categorías (para el cintillo).
export function recentResults(L, max = 24) {
  const all = [];
  for (const [id, c] of Object.entries(L.categories)) c.results.forEach((m) => all.push({ ...m, cat: id }));
  if (!L.live) return all;
  const last = all.reduce((acc, m) => (m.date && m.date > acc ? m.date : acc), '');
  const from = last ? addDays(last, -9) : '';
  return all.filter((m) => !from || (m.date && m.date >= from))
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a))).slice(0, max);
}

// Próximo fin de semana con partidos (para el aviso rojo).
export function nextMatchday(L) {
  const all = [];
  for (const [id, c] of Object.entries(L.categories)) c.upcoming.forEach((m) => m.date && all.push({ ...m, cat: id }));
  if (!all.length) return null;
  all.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const first = all[0].date;
  const end = addDays(first, 2);
  const matches = all.filter((m) => m.date <= end);
  const venues = [];
  const seen = new Set();
  matches.forEach((m) => {
    const k = fold(m.venue);
    if (!isTBD(m.venue) && !seen.has(k)) { seen.add(k); venues.push(venueShort(m.venue)); }
  });
  const divisions = DIVISIONS.filter((d) => matches.some((m) => d.cats.some((c) => c[0] === m.cat)));
  return { first, matches, venues, divisions };
}

// Un equipo por club, con la cantidad de equipos que tiene en la liga.
export function clubs(L) {
  const map = new Map();
  for (const t of Object.values(L.teams)) {
    if (t.id === 'tbd') continue;
    const k = clubKey(t.club);
    const cur = map.get(k);
    // El escudo lleva al perfil del club en Dribbli; si Dribbli no tiene el club, al perfil del equipo.
    if (!cur) map.set(k, { name: t.club, logo: t.logo, color: t.color, ini: t.ini, url: t.clubUrl || t.url, hasClub: !!t.clubUrl, count: 1 });
    else {
      cur.count += 1;
      if (!cur.logo && t.logo) cur.logo = t.logo;
      if (!cur.hasClub && t.clubUrl) { cur.url = t.clubUrl; cur.hasClub = true; }
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function totals(L) {
  const sum = (key, ids) => ids.reduce((acc, id) => acc + (L.categories[id] ? L.categories[id][key] || 0 : 0), 0);
  const allIds = Object.keys(L.categories);
  return {
    teams: L.live ? Object.keys(L.teams).length : sum('teams', allIds),
    players: sum('players', allIds),
    categories: allIds.length,
    byDivision: Object.fromEntries(DIVISIONS.map((d) => {
      const ids = d.cats.map((c) => c[0]);
      return [d.id, [sum('teams', ids), sum('players', ids), sum('matches', ids)]];
    }))
  };
}

export function updatedLabel(L) {
  if (!L.updatedAt) return '';
  const d = L.updatedAt;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/* ---------- Carga ---------- */

export async function loadLeague() {
  if (typeof window !== 'undefined' && window.__DRIBBLI__) return fromDribbli(window.__DRIBBLI__);
  try {
    const r = await fetch('data/dribbli.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    return fromDribbli(await r.json());
  } catch (e) {
    console.warn('No se pudo cargar data/dribbli.json; se usan los datos de muestra.', e);
    return fromSample();
  }
}
