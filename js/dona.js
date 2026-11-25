// Página "Dona / Patrocina": tarjetas de las academias y cambio de idioma español / inglés.
// El texto en español está en dona.html; aquí solo está la traducción al inglés (EN).
// Para traducir otra página: poner data-i18n="clave" en cada texto y agregar la clave en EN.

import { loadLeague, clubs } from './league.js';

const EN = {
  chip: 'DONATE · SPONSOR',
  chip2: '9TH EDITION',
  h1: 'Every ball <span class="accent-red">changes</span> a <span class="accent-blue">life</span>.',
  lead: 'Support more than 1,500 children and young people who learn values through football in the east of the Dominican Republic.',
  btnDonar: 'Donate now',
  btnPatro: 'Become a sponsor',
  ph: 'Photo of the kids',
  qsK: 'WHO WE ARE',
  qsT: 'Youth football built on <span class="accent-blue">fair play</span>',
  qsP1: 'Liga del Este is a youth development league focused on fair play. In its 9th edition it brings together <b>72 teams</b>, more than <b>1,500 players</b> and <b>11 categories</b>, from the youngest kids up to U18 and the First Division.',
  qsP2: 'The academies that make up the league are non-profit organizations (NGOs).',
  stEd: 'Edition', stEq: 'Teams', stJu: 'Players', stCa: 'Categories',
  pqK: 'WHY DONATE',
  pqT: 'Your support reaches the <span class="accent-red">pitch</span>',
  pq1t: 'Sport and discipline', pq1: 'Kids learn respect, teamwork and perseverance.',
  pq2t: 'Opportunities', pq2: 'Many talented kids cannot afford uniforms, transport or registration fees.',
  pq3t: 'Community', pq3: 'Football keeps them active and off the streets.',
  pq4t: 'Transparency', pq4: 'Your gift goes to a registered NGO and you receive a donation receipt.',
  faK: 'WAYS TO HELP',
  faT: 'Choose <span class="accent-blue">how</span> you want to help',
  fa0t: 'Money', fa0: 'One-time or monthly donation.',
  fa1t: 'Balls and equipment', fa1: 'Balls, cones, bibs, goals and nets.',
  fa2t: 'Uniforms', fa2: 'Full kits for a team.',
  fa3t: 'Operating costs', fa3: 'Help cover part of what it costs to run the season.',
  fa4t: 'League registration', fa4: 'Sponsor a team’s participation.',
  fa5t: 'Player scholarships', fa5: 'Cover a child’s monthly fee at their academy.',
  fa6t: 'Transport and meals', fa6: 'For match days.',
  inK: 'WHAT DOES THE LEAGUE SPEND EACH YEAR?',
  inT: 'Running a season has a <span class="accent-red">real cost</span>',
  inP: 'These are the league’s main costs each season:',
  g0t: 'Referees', g0: 'Referees and assistants for every matchday',
  g1t: 'Hydration', g1: 'Water and drinks for players and officials',
  g2t: 'Medical service', g2: 'Doctor or paramedic at the pitch and first-aid kit',
  g3t: 'Player insurance', g3: 'Injury coverage',
  g4t: 'Per diems', g4: 'Meals and support for referees, officials and staff',
  g5t: 'Fuel and transport', g5: 'Travel for teams and staff',
  g6t: 'Pitches', g6: 'Rental, lighting and maintenance',
  g7t: 'Registration and ID cards', g7: 'Player registration and competition platform',
  g8t: 'Awards', g8: 'Trophies, medals and recognitions',
  g9t: 'Communications', g9: 'Photography, live streaming and design',
  inTotK: 'Investment for the 9th edition', inTotP: 'per season',
  tdK: 'YOUR DONATION IN PRACTICE',
  tdT: 'What your gift <span class="accent-blue">makes possible</span>',
  tdP: 'Approximate amounts.',
  td0: 'an official match ball', td1: 'a full uniform for one player',
  td2: 'one academy team’s registration for the whole season', td3: 'uniforms for a full team of 18 players',
  becaK: 'MONTHLY SCHOLARSHIP FOR ONE CHILD',
  becaP: 'Between <b>USD 15 and USD 80 per month</b>, depending on the academy (about <b>USD 50</b> on average).',
  becaB: 'Sponsor a child',
  aqK: 'WHO TO SUPPORT',
  aqT: 'You choose <span class="accent-red">who</span> to support',
  aqLigaT: 'Liga del Este as a whole',
  aqLiga: 'Your gift goes wherever it is needed most, channeled through an NGO so you receive your benefits.',
  aqLigaB: 'Support the league',
  aqAcT: 'A specific academy',
  aqAc: 'Choose one of the league’s academies and support its kids directly.',
  aqAcB: 'See the academies ↓',
  aqNota: 'Number of kids and needs of each academy: to be completed.',
  npK: 'SPONSORSHIP LEVELS',
  npT: 'Put your brand next to <span class="accent-blue">youth football</span>',
  desde: 'from',
  np0t: 'Bronze', np0b0: 'Mention on social media and on the website.',
  np1t: 'Silver', np1b0: 'Everything in Bronze.', np1b1: 'Logo on the matchday posters.',
  np2t: 'Gold', np2b0: 'Everything in Silver.', np2b1: 'Logo on a banner or backdrop at the pitch.', np2b2: 'Presence at the grand final.',
  np3t: 'Official sponsor', np3b0: 'Everything in Gold.', np3b1: 'Logo on the league jerseys (printing included).', np3b2: 'Your name on a tournament or category.',
  npB: 'I want this level',
  npC: 'Looking for something different? We’ll build a custom plan with you.',
  npCB: 'Let’s talk →',
  cdK: 'HOW TO DONATE',
  cdT: 'Helping is <span class="accent-red">easy</span>',
  cd1: 'Choose what you want to give and to whom.',
  cd2: 'Write to us or fill out the form.',
  cd3: 'We send you the NGO details and payment methods.',
  cd4: 'You receive your donation receipt and photos of the impact.',
  cdInfT: 'Impact report (optional):',
  cdInf: 'at the end of the season we send you a report with photos showing how your donation was used.',
  cdForm: 'Fill out the form', cdTel: 'WhatsApp and phone:', cdMail: 'Email:',
  gaK: 'GALLERY AND TESTIMONIALS',
  gaT: 'The <span class="accent-blue">stars</span>',
  te1: '“[Testimonial from a parent: to be completed]”', te1a: '— Parent of a U12 player',
  te2: '“[Testimonial from a coach: to be completed]”', te2a: '— Academy coach',
  ciT: 'Together we develop players and <span class="accent-red">better people</span>.',
  ciB: 'I want to help'
};

// Textos de las tarjetas de academias (las arma este archivo)
const ACAD = {
  es: { equipos: (n) => `${n} ${n === 1 ? 'equipo' : 'equipos'} en la liga`, ninos: 'Niños: por completar', nec: 'Necesidades: por completar', btn: 'Apoyar a esta academia', perfil: 'Ver en Dribbli' },
  en: { equipos: (n) => `${n} ${n === 1 ? 'team' : 'teams'} in the league`, ninos: 'Kids: to be completed', nec: 'Needs: to be completed', btn: 'Support this academy', perfil: 'View on Dribbli' }
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'lde-idioma';
let lang = 'es';
try { lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'es'; } catch (e) { /* sin almacenamiento */ }

// Guarda el español original de cada texto para poder volver a él.
const ES = new Map();
document.querySelectorAll('[data-i18n]').forEach((el) => ES.set(el, el.innerHTML));

let academias = [];
function renderAcademias() {
  const box = document.getElementById('academias');
  if (!box) return;
  const t = ACAD[lang];
  box.innerHTML = academias.map((c) => {
    const crest = c.logo
      ? `<span class="crest crest--logo"><img src="${esc(c.logo)}" alt="" loading="lazy"></span>`
      : `<span class="crest" style="background:${c.color}">${esc(c.ini)}</span>`;
    const prefill = esc(JSON.stringify({ tipo: 'Donar', destino: c.name }));
    return `<article class="dn-acad">
      <div class="dn-acad__head">${crest}<div><h3>${esc(c.name)}</h3><span>${t.equipos(c.count)}</span></div></div>
      <ul><li>${t.ninos}</li><li>${t.nec}</li></ul>
      <div class="dn-acad__actions">
        <a class="btn btn--dark btn--plain" href="#donar" data-form="donacion" data-prefill="${prefill}">${t.btn}</a>
        ${c.url ? `<a class="dn-link" href="${esc(c.url)}" target="_blank" rel="noopener">${t.perfil} ↗</a>` : ''}
      </div>
    </article>`;
  }).join('');
}

function setLang(l) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch (e) { /* sin almacenamiento */ }
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    el.innerHTML = l === 'en' && EN[k] !== undefined ? EN[k] : ES.get(el);
  });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  renderAcademias();
}

document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

const L = await loadLeague();
academias = clubs(L);
setLang(lang);
