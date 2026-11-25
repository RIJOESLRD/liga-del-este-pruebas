#!/usr/bin/env python3
"""
Jugadores de la Liga del Este: perfil de cada jugador ACTIVO (inscrito en la temporada actual)
con su historial de temporadas anteriores en Dribbli.

Privacidad (son menores de edad):
- En la web solo se publica el nombre y las iniciales de los apellidos ("Juan Andrés J. S."),
  sin foto ni fecha de nacimiento.
- El historial de temporadas pasadas se guarda SIN nombres (data/historial-jugadores.json):
  cada jugador se identifica con una huella (hash) de su nombre, que no permite recuperarlo.
- Un perfil se puede ocultar escribiendo su id en contenido/jugadores-ocultos.txt.

Uso:
  python3 scripts/jugadores.py historial   → descarga UNA vez las temporadas pasadas (no cambian)
  La actualización semanal (sync_dribbli.py) llama a actualizar() para la temporada actual.
Solo usa la biblioteca estándar de Python 3.9+.
"""
import hashlib
import html
import json
import os
import re
import sys
import time
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sync_dribbli import fetch, BASE, ROOT  # noqa: E402

HIST_JSON = os.path.join(ROOT, 'data', 'historial-jugadores.json')
OUT_JSON = os.path.join(ROOT, 'data', 'jugadores.json')
OCULTOS = os.path.join(ROOT, 'contenido', 'jugadores-ocultos.txt')

# Competiciones de la liga en Dribbli: la actual (incluye la 8.ª) y las de Premier y Super Copa 2024–2025.
COMPETICIONES = (1845, 263, 264)
# Temporadas: (texto que la identifica en Dribbli, nombre en la web, año de referencia de las categorías)
TEMPORADAS = [
    ('5ta', '5.ª Edición', 'sep–dic 2024', 2025),
    ('6t', '6.ª Edición', 'feb–jun 2025', 2025),
    ('7ma', '7.ª Edición', 'sep–dic 2025', 2026),
    ('8va', '8.ª Edición', 'feb–jun 2026', 2026),
    ('ix', 'IX Edición', '2026–27', 2027),
]
ACTUAL = len(TEMPORADAS) - 1

# Nombres de academia (por id de club en Dribbli y por palabras del nombre del equipo)
CLUB_POR_ID = {'1966': 'Academia Real Romana', '1956': 'Downtown Soccer Academy', '1958': 'Escudefut Jamp',
               '1964': 'Spado Soccer Academy', '2120': 'Atlético Romana Junior', '2186': 'Romana FC', '1983': 'Romana FC',
               '1980': 'Elite Football Academy', '4034': 'Deportivo Santo Domingo', '1973': 'Deportivo Santo Domingo'}
CLUB_POR_PALABRA = [('real romana', 'Academia Real Romana'), ('atletico romana', 'Atlético Romana Junior'),
                    ('downtown', 'Downtown Soccer Academy'), ('spado', 'Spado Soccer Academy'), ('jamp', 'Escudefut Jamp'),
                    ('escudefut', 'Escudefut Jamp'), ('elite', 'Elite Football Academy'), ('ramsar', 'FC Ramsar'),
                    ('higueyanos', 'Higueyanos FC'), ('higuey', 'Higuey FC'), ('dv7', 'DV7 Academy'), ('yess', 'Yess Sport Academy'),
                    ('garrincha', 'Garrincha FC'), ('rayos', 'Rayos del Este'), ('richard', 'Richard FC'),
                    ('san pedro', 'Deportivo San Pedro'), ('santo domingo', 'Deportivo Santo Domingo'), ('romana fc', 'Romana FC'),
                    ('barca', 'Barca Academy')]
PARTICULAS = {'de', 'del', 'la', 'las', 'los', 'y', 'san', 'santa'}


def sin_acentos(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def normalizar(nombre):
    """'Agustin "Agus" Marí (C)' -> 'agustin mari' (para comparar nombres entre temporadas)."""
    n = re.sub(r'"[^"]*"|\([^)]*\)', ' ', nombre)
    return ' '.join(re.findall(r'[a-zñ]+', sin_acentos(n.lower())))


def huella(nombre_normalizado):
    """Identificador público del jugador: no permite recuperar el nombre."""
    return hashlib.sha256(('liga-del-este|' + nombre_normalizado).encode()).hexdigest()[:12]


def nombre_publico(nombre):
    """Nombre(s) + iniciales de los apellidos: 'Juan Andres Jimenez Salcedo' -> 'Juan Andres J. S.'.
    Dribbli no separa nombres y apellidos: con 3 palabras se toma 1 nombre y 2 apellidos;
    con 4 o más, las dos últimas son los apellidos. 'De la Cruz' cuenta como un solo apellido."""
    n = re.sub(r'"[^"]*"|\([^)]*\)', ' ', nombre)
    palabras = [p for p in n.split() if re.search(r'\w', p)]
    partes = []
    for p in palabras:  # une partículas al apellido que sigue: "De La Cruz"
        if partes and sin_acentos(partes[-1].split()[-1].lower()) in PARTICULAS:
            partes[-1] += ' ' + p
        else:
            partes.append(p)
    cap = lambda s: ' '.join(w[:1].upper() + w[1:].lower() if not w.isupper() or len(w) > 1 else w for w in s.split())
    partes = [cap(p) for p in partes]
    ini = lambda s: next((w[0].upper() for w in s.split() if sin_acentos(w.lower()) not in PARTICULAS), s[0].upper()) + '.'
    if len(partes) <= 1:
        return ' '.join(partes)
    if len(partes) == 2:
        return f'{partes[0]} {ini(partes[1])}'
    if len(partes) == 3:
        return f'{partes[0]} {ini(partes[1])} {ini(partes[2])}'
    return f'{" ".join(partes[:-2])} {ini(partes[-2])} {ini(partes[-1])}'


def temporada_de(texto):
    t = texto.lower()
    for i, (clave, *_rest) in enumerate(TEMPORADAS):
        if clave in t:
            return i
    return None


def division_de(cat):
    s = (cat['season'] + ' ' + cat['name'] + ' ' + cat['competition']).lower()
    if 'primera' in s or cat['age'] == 'Open':
        return 'Primera División'
    if 'génesis' in s or 'genesis' in s:
        return 'Génesis'
    if 'super' in s:
        return 'Super Copa'
    return 'Premier'


def edad_de(age):
    m = re.search(r'(\d+)', age or '')
    return int(m.group(1)) if m else None


def club_de(team_title, club_id=None, club_name=None):
    if club_id in CLUB_POR_ID:
        return CLUB_POR_ID[club_id]
    if club_name:
        return re.sub(r'[^\w&. ]', '', club_name).strip()
    low = sin_acentos(team_title.lower())
    for palabra, club in CLUB_POR_PALABRA:
        if palabra in low:
            return club
    return 'Academia sin identificar'


def lineas(page):
    s = re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S)
    return [x.strip() for x in html.unescape(re.sub(r'<[^>]+>', '\n', s)).splitlines() if x.strip()]


def estadisticas_equipo(team_id):
    """[(nombre, goles, minutos, partidos)] de la página de estadísticas del equipo en Dribbli."""
    t = lineas(fetch(f'{BASE}/teams/{team_id}/statistics'))
    filas = []
    if 'Matches' in t:
        k = t.index('Matches') + 1
        es_num = lambda x: re.fullmatch(r'-?\d+', x or '') is not None
        while k + 3 < len(t) and es_num(t[k + 1]) and es_num(t[k + 2]) and es_num(t[k + 3]):
            filas.append((t[k], int(t[k + 1]), int(t[k + 2]), int(t[k + 3])))
            k += 4
    return filas, (t[2] if len(t) > 2 else '')


def club_del_equipo(team_id):
    s = fetch(f'{BASE}/teams/{team_id}')
    m = re.search(r'href="/clubs/(\d+)"[^>]*>(.*?)</a>', s, re.S)
    if not m:
        return None, None
    return m.group(1), re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', m.group(2)))).strip()


def nacimiento(temporada, edad, age):
    """Años de nacimiento posibles según la categoría (None en Open)."""
    if not edad or age == 'Open':
        return None
    ref = TEMPORADAS[temporada][3]
    return (ref - edad - 1, ref - edad)


# ---------- Historial (temporadas pasadas): se descarga una vez ----------

def descargar_historial():
    cats = set()
    for comp in COMPETICIONES:
        cats |= set(re.findall(r'href="/categories/(\d+)"', fetch(f'{BASE}/competitions/{comp}')))
    # Primero: en qué categorías aparece cada equipo. Dribbli a veces reutiliza un equipo en dos
    # temporadas y sus estadísticas no se pueden separar: cuenta solo en la temporada más reciente.
    categorias, equipo_en = {}, {}
    for cid in sorted(cats, key=int):
        t = lineas(fetch(f'{BASE}/categories/{cid}'))
        i = t.index('Sign into your account') if 'Sign into your account' in t else 0
        cat = {'name': t[i + 1], 'age': t[i + 2], 'competition': t[i + 3], 'meta': t[i + 4]}
        cat['season'] = cat['meta'].strip('• ').split('•')[0].strip()
        cat['temporada'] = temporada_de(cat['season'])
        if cat['temporada'] is None:
            continue
        categorias[cid] = cat
        for tid in set(re.findall(r'href="/teams/(\d+)"', fetch(f'{BASE}/categories/{cid}/teams'))):
            if tid not in equipo_en or cat['temporada'] > categorias[equipo_en[tid]]['temporada']:
                equipo_en[tid] = cid
    registros = []
    for cid, cat in categorias.items():
        temporada = cat['temporada']
        if temporada == ACTUAL:
            continue
        equipos = sorted((tid for tid, c in equipo_en.items() if c == cid), key=int)
        print(f'  {cid} {TEMPORADAS[temporada][1]} · {cat["name"]} {cat["age"]}: {len(equipos)} equipos', flush=True)
        for tid in equipos:
            filas, titulo = estadisticas_equipo(tid)
            club_id, club_nombre = club_del_equipo(tid)
            club = club_de(titulo, club_id, club_nombre)
            for nombre, goles, minutos, partidos in filas:
                if partidos == 0 and minutos == 0:
                    continue
                n = normalizar(nombre)
                if not n:
                    continue
                registros.append({'h': huella(n), 'p': len(n.split()), 's': temporada, 'd': division_de(cat),
                                  'c': cat['age'].replace('U-', 'U'), 'e': edad_de(cat['age']), 'a': club,
                                  'pj': partidos, 'min': minutos, 'g': goles})
            time.sleep(0.2)
    with open(HIST_JSON, 'w', encoding='utf-8') as f:
        json.dump({'nota': 'Historial sin nombres: cada jugador es una huella (hash) de su nombre.',
                   'registros': registros}, f, ensure_ascii=False, separators=(',', ':'))
    print(f'Historial: {len(registros)} registros → {HIST_JSON}')


# ---------- Jugadores activos (temporada actual) ----------

def actualizar(dribbli):
    """Arma data/jugadores.json con los jugadores de la temporada actual y su historial.
    `dribbli` es el contenido de data/dribbli.json (ya actualizado). Devuelve {huella: id}."""
    historial = {}
    if os.path.exists(HIST_JSON):
        with open(HIST_JSON, encoding='utf-8') as f:
            for r in json.load(f)['registros']:
                historial.setdefault(r['h'], []).append(r)
    ocultos = set()
    if os.path.exists(OCULTOS):
        with open(OCULTOS, encoding='utf-8') as f:
            ocultos = {l.split('#')[0].strip() for l in f if l.split('#')[0].strip()}

    # Jugadores de cada equipo de la temporada actual
    actuales = {}  # huella -> lista de registros de esta temporada
    nombres = {}   # huella -> nombre público
    for cid, c in dribbli['categories'].items():
        equipos = {m['home'] for m in c.get('schedule', [])} | {m['away'] for m in c.get('schedule', [])}
        equipos |= {r['team'] for g in c.get('standings', []) for r in g.get('rows', []) if r.get('team')}
        division = {'premier': 'Premier', 'super': 'Super Copa', 'primera': 'Primera División'}.get(c.get('division'), 'Premier')
        categoria = c.get('label', '')
        for tid in sorted(e for e in equipos if e and e in dribbli['teams']):
            team = dribbli['teams'][tid]
            club = club_de(team.get('raw', ''), team.get('clubId'), team.get('club'))
            try:
                filas, _ = estadisticas_equipo(tid)
            except Exception as e:  # noqa: BLE001
                print(f'  jugadores: no se pudo leer el equipo {tid}: {e}', file=sys.stderr)
                continue
            for nombre, goles, minutos, partidos in filas:
                n = normalizar(nombre)
                if not n:
                    continue
                h = huella(n)
                actuales.setdefault(h, []).append({'s': ACTUAL, 'd': division, 'c': categoria, 'e': edad_de(categoria),
                                                   'a': club, 'pj': partidos, 'min': minutos, 'g': goles, 'p': len(n.split()),
                                                   'eq': tid})
                nombres.setdefault(h, nombre_publico(nombre))
            time.sleep(0.2)

    jugadores, ids = [], {}
    for h, act in actuales.items():
        # Mismo nombre en dos academias distintas esta temporada: son niños distintos, perfiles separados.
        por_club = {}
        for r in act:
            por_club.setdefault(r['a'], []).append(r)
        for i, (club, regs) in enumerate(sorted(por_club.items(), key=lambda kv: -sum(r['pj'] for r in kv[1]))):
            pid = h if i == 0 else huella(f'{h}|{club}')
            if pid in ocultos or h in ocultos:
                continue
            pasado = [] if len(por_club) > 1 else unir_historial(regs, historial.get(h, []))
            temporadas = sorted(regs + pasado, key=lambda r: (-r['s'], r['d'], r['c']))
            jugadores.append({
                'id': pid, 'n': nombres[h], 'a': club, 'eq': regs[0]['eq'],
                'cat': f"{regs[0]['d']} {regs[0]['c']}".strip(),
                't': [[r['s'], r['d'], r['c'], r['a'], r['pj'], r['min'], r['g']] for r in temporadas],
            })
            if i == 0:
                ids[h] = pid
    jugadores.sort(key=lambda j: j['n'])
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump({'temporadas': [[t[1], t[2]] for t in TEMPORADAS], 'actual': ACTUAL, 'jugadores': jugadores},
                  f, ensure_ascii=False, separators=(',', ':'))
    con_historial = sum(1 for j in jugadores if len({t[0] for t in j['t']}) > 1)
    print(f'Jugadores activos: {len(jugadores)} ({con_historial} con temporadas anteriores)')
    return ids


def unir_historial(actual, pasado):
    """Decide qué temporadas pasadas son del mismo niño (mismas reglas de la prueba de unión)."""
    if not pasado:
        return []
    clubes_actuales = {r['a'] for r in actual}
    # Un nombre en dos academias distintas en una misma temporada pasada: dudoso, no se une.
    por_temporada = {}
    for r in pasado:
        por_temporada.setdefault(r['s'], set()).add(r['a'])
    if any(len(v) > 1 for v in por_temporada.values()):
        return []
    # Las edades de las categorías tienen que cuadrar (con margen por jugar una categoría arriba).
    rangos = [nacimiento(r['s'], r['e'], r['c']) for r in actual + pasado]
    rangos = [x for x in rangos if x]
    if rangos and max(x[0] for x in rangos) > min(x[1] for x in rangos) + 2:
        return []
    # Nombre corto (2 palabras, p. ej. "Kevin García"): solo se une dentro de la misma academia.
    if actual[0]['p'] < 3:
        return [r for r in pasado if r['a'] in clubes_actuales]
    return pasado


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'historial':
        descargar_historial()
    else:
        with open(os.path.join(ROOT, 'data', 'dribbli.json'), encoding='utf-8') as f:
            actualizar(json.load(f))
