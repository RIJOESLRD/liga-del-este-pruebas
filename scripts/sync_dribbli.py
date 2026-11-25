#!/usr/bin/env python3
"""
Sincroniza la web de la Liga del Este con Dribbli.

Lee las páginas públicas de cada categoría (calendario, tabla y líderes),
descarga los escudos de los equipos y el logo de la liga, y guarda todo en
data/dribbli.json, que es lo que la web muestra.

Uso:  python3 scripts/sync_dribbli.py
Solo usa la biblioteca estándar de Python 3.9+.
"""
import html
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_JSON = os.path.join(ROOT, 'data', 'dribbli.json')
INC_JSON = os.path.join(ROOT, 'data', 'incidencias.json')
LOGO_DIR = os.path.join(ROOT, 'logos', 'dribbli')
BASE = 'https://app.dribbli.com'
UA = 'Mozilla/5.0 (compatible; LigaDelEste-sitio/1.0)'

# Categorías de la IX edición (id de Dribbli -> división y etiqueta en la web).
CATEGORIES = {
    '3754': ('premier', 'U8'), '3753': ('premier', 'U10'), '3752': ('premier', 'U12'),
    '3751': ('premier', 'U14'), '3750': ('premier', 'U16'), '3719': ('premier', 'U18'),
    '3758': ('super', 'U10'), '3757': ('super', 'U12'), '3756': ('super', 'U14'), '3755': ('super', 'U16'),
    '3717': ('primera', 'Open'),
}

MONTHS = {m: i for i, m in enumerate(
    ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'], 1)}


def fetch(url, binary=False, tries=3):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
                return (data, r.headers.get('Content-Type', '')) if binary else data.decode('utf-8', 'replace')
        except Exception as e:  # noqa: BLE001
            if attempt == tries - 1:
                raise
            print(f'  reintento {url}: {e}', file=sys.stderr)
            time.sleep(3 * (attempt + 1))


def text(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s or ''))).strip()


def num(s):
    s = text(s)
    return int(s) if re.fullmatch(r'-?\d+', s) else None


# ---------- Nombres de equipos ----------

EMOJI = re.compile('[\U0001F000-\U0001FFFF☀-➿️]')


COLORS = r'(azul|rojo|roja|blanco|blanca|amarillo|amarilla|verde|negro|negra|c azul)'
FIXES = {'fc': 'FC', 'dv7': 'DV7', 'ii': 'II', 'iii': 'III'}


def clean_team_name(raw):
    """'⚽U14 Escudefut Jamp⚽ Ix Edition' -> 'Escudefut Jamp'.
    'U14 Azul 2026/2027 Academia Real Romana' -> 'Academia Real Romana Azul'."""
    s = EMOJI.sub(' ', html.unescape(raw))
    s = re.sub(r'\b20\d{2}\s*[/-]?\s*(20)?\d{2}\b', ' ', s)                       # 2026/2027, 2026/27, 2026 2027
    s = re.sub(r'\b(ix|9(\.?\s*ª|na|a|\.)?|novena)\s*(edici[oó]n|edition|edi\.*)', ' ', s, flags=re.I)
    s = re.sub(r'\b(sub|u)\s?-?\s?\d{1,2}\b', ' ', s, flags=re.I)                 # U14, U 18, Sub-12
    s = re.sub(r'\b(premier|s[uú]per\s*copa|supercopa|primera(\s+divisi[oó]n)?)\b', ' ', s, flags=re.I)
    s = re.sub(r'\(\s*\)', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip(' -·.')
    m = re.match(COLORS + r'\s+(.+)$', s, flags=re.I)                           # color al principio -> al final
    if m:
        s = f'{m.group(2)} {m.group(1)}'
    s = re.sub(r'\(\s*' + COLORS + r'\s*\)', lambda x: x.group(1), s, flags=re.I)   # (Amarillo) -> Amarillo
    words = []
    for w in s.split():
        lw = w.lower()
        words.append(FIXES.get(lw) or (w[0].upper() + w[1:] if w.islower() else w))
    s = ' '.join(words).strip()
    return s or text(raw)


def club_name(name):
    """Nombre del club sin el color del equipo: 'Academia Real Romana Azul' -> 'Academia Real Romana'."""
    return re.sub(r'\s+' + COLORS + r'$', '', name, flags=re.I).strip()


def initials(name):
    words = [w for w in re.split(r'[\s\-]+', club_name(name)) if w and w[0].isalnum()]
    stop = {'de', 'del', 'la', 'el', 'los', 'las', 'y'}
    main = [w for w in words if w.lower() not in stop] or words
    if len(main) == 1:
        return main[0][:3].upper()
    return ''.join(w[0] for w in main[:3]).upper() or '?'


# ---------- Fechas ----------

def parse_date(s):
    m = re.match(r'(\d{1,2})\s+([A-Za-z]{3})[a-z]*,?\s+(\d{4})', s.strip())
    if not m:
        return None
    return f'{int(m.group(3)):04d}-{MONTHS[m.group(2).lower()]:02d}-{int(m.group(1)):02d}'


def parse_time(s):
    m = re.search(r'(\d{1,2}):(\d{2})\s*([AP]M)', s, re.I)
    if not m:
        return None
    h = int(m.group(1)) % 12 + (12 if m.group(3).upper() == 'PM' else 0)
    return f'{h:02d}:{m.group(2)}'


# ---------- Páginas ----------

def parse_overview_counts(page):
    body = re.sub(r'<[^>]+>', ' ', page.split('<main', 1)[-1])
    out = {}
    for n, label in re.findall(r'(\d+)\s+(Matches|Referees|Teams|Players)\b', body):
        out.setdefault(label.lower(), int(n))
    return out


def parse_category_name(page):
    m = re.search(r'<title>(.*?)</title>', page, re.S)
    return text(m.group(1)).replace(' - Dribbli', '') if m else ''


def parse_league_logo(page):
    m = re.search(r'<img[^>]+src="([^"]*Liga(?:%20|\s)del(?:%20|\s)Este[^"]*)"', page, re.I)
    return html.unescape(m.group(1)) if m else None


def parse_schedule(page, teams):
    matches = []
    totals = {}
    for label in ('Matches', 'Teams'):
        m = re.search(r'ui-tag green[^>]*>\s*(\d+)\s*</div>\s*</div>\s*<div[^>]*>\s*' + label, page)
        if m:
            totals[label.lower()] = int(m.group(1))
    token = re.compile(
        r'<span class="d-block font-size-14">\s*([^<]+?)\s*</span>|<div class="matches--schedule-match">', re.S)
    starts = [(m.start(), m.group(1)) for m in token.finditer(page)]
    current_date = None
    for i, (pos, date_txt) in enumerate(starts):
        if date_txt is not None:
            current_date = parse_date(date_txt)
            continue
        end = starts[i + 1][0] if i + 1 < len(starts) else len(page)
        block = page[pos:end]
        head = re.search(
            r'href="/matches/(\d+)">\s*<span class="font-size-14">(.*?)</span>\s*'
            r'<span class="font-size-12 color-neutral-90">(.*?)</span>', block, re.S)
        tlinks = re.findall(r'<a title="([^"]*)"[^>]*href="/teams/(\d+)"', block)
        logos = re.findall(r'<img title="[^"]*" data-controller="image-fallback" src="([^"]*)"', block)
        if not head or len(tlinks) < 2:
            continue
        scores = [num(s) for s in re.findall(r'<span class="font-size-16">(.*?)</span>', block, re.S)[:2]]
        pens = [num(s) for s in re.findall(r'<span class="font-size-13 color-neutral-70">(.*?)</span>', block, re.S)[:2]]
        label = text(head.group(2))
        rnd = re.match(r'#(\d+)', label)
        side_ids = []
        for j, (raw, tid) in enumerate(tlinks[:2]):
            t = teams.setdefault(tid, {'raw': html.unescape(raw)})
            if j < len(logos) and logos[j] and 'logo_src' not in t:
                t['logo_src'] = html.unescape(logos[j])
            side_ids.append(tid)
        played = len(scores) == 2 and None not in scores
        matches.append({
            'id': head.group(1),
            'round': int(rnd.group(1)) if rnd else None,
            'date': current_date,
            'time': parse_time(label),
            'venue': text(head.group(3)),
            'home': side_ids[0], 'away': side_ids[1],
            'hs': scores[0] if played else None, 'as': scores[1] if played else None,
            'hp': pens[0] if played and len(pens) == 2 else None,
            'ap': pens[1] if played and len(pens) == 2 else None,
        })
    return matches, totals


def parse_table_rows(table_html):
    rows = []
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', table_html.split('<tbody>', 1)[-1], re.S):
        cells = {}
        for col, body in re.findall(r'<td[^>]*data-column="([^"]*)"[^>]*>(.*?)</td>', tr, re.S):
            cells[col] = body
        team = re.search(r'href="/teams/(\d+)"[^>]*>(.*?)</a>', tr, re.S)
        logo = re.search(r'<img class="logo" src="([^"]*)"', tr)
        rows.append((cells, team, logo, tr))
    return rows


def parse_standings(page, teams):
    groups = []
    parts = re.split(r'<h5[^>]*>', page)[1:]
    for part in parts:
        title = text(part.split('</h5>', 1)[0])
        tbl = re.search(r'<table>(.*?)</table>', part, re.S)
        if not tbl:
            continue
        rows = []
        for cells, team, logo, _ in parse_table_rows(tbl.group(1)):
            if not team:
                continue
            tid = team.group(1)
            t = teams.setdefault(tid, {'raw': text(team.group(2))})
            if logo and 'logo_src' not in t:
                t['logo_src'] = html.unescape(logo.group(1))
            rows.append({
                'team': tid,
                'pos': num(cells.get('', '')),
                'pj': num(cells.get('Matches')), 'g': num(cells.get('W')), 'e': num(cells.get('D')),
                'p': num(cells.get('L')), 'gf': num(cells.get('GF')), 'gc': num(cells.get('GA')),
                'dg': num(cells.get('GD')), 'pts': num(cells.get('Points')),
            })
        if rows:
            groups.append({'name': re.sub(r'^Group\s*-\s*', '', title), 'rows': rows})
    return groups


def parse_leaders(page, teams, limit=10):
    tbl = re.search(r'<table>(.*?)</table>', page, re.S)
    if not tbl:
        return []
    leaders = []
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', tbl.group(1).split('<tbody>', 1)[-1], re.S):
        player = re.search(r'<div class="ps-1">(.*?)</div>', tr, re.S)
        team = re.search(r'href="/teams/(\d+)"[^>]*>(.*?)</a>', tr, re.S)
        counters = [num(c) for c in re.findall(r'<span class="counter[^"]*">(.*?)</span>', tr, re.S)]
        if not player or not team or not counters:
            continue
        teams.setdefault(team.group(1), {'raw': text(team.group(2))})
        leaders.append({
            'player': text(player.group(1)), 'team': team.group(1),
            'goals': counters[0], 'matches': counters[2] if len(counters) > 2 else None,
        })
        if len(leaders) >= limit:
            break
    return leaders


# ---------- Logos ----------

EXT = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/webp': '.webp',
       'image/gif': '.gif', 'image/svg+xml': '.svg'}


def save_logo(src, name):
    """Descarga el logo; si no se puede, deja el enlace de Dribbli."""
    if not src:
        return ''
    url = src if src.startswith('http') else BASE + src
    try:
        data, ctype = fetch(url, binary=True)
        ext = EXT.get(ctype.split(';')[0].strip().lower())
        if not ext or len(data) < 100:
            return url
        os.makedirs(LOGO_DIR, exist_ok=True)
        for old in os.listdir(LOGO_DIR):
            if os.path.splitext(old)[0] == name:
                os.remove(os.path.join(LOGO_DIR, old))
        path = os.path.join(LOGO_DIR, name + ext)
        with open(path, 'wb') as f:
            f.write(data)
        return os.path.relpath(path, ROOT).replace(os.sep, '/')
    except Exception as e:  # noqa: BLE001
        print(f'  no se pudo descargar el logo {name}: {e}', file=sys.stderr)
        return url



# ---------- Club de cada equipo y las incidencias de cada partido ----------

def parse_club_id(page):
    m = re.search(r'href="/clubs/(\d+)"', page)
    return m.group(1) if m else None


# Tipos de incidencia de Dribbli que se muestran en la web (los cambios no se muestran).
EVENT_TYPES = {
    'goal': 'gol', 'penalty goal': 'gol-penal', 'penalty': 'gol-penal', 'own goal': 'autogol',
    'yellow card': 'amarilla', 'red card': 'roja', 'second yellow card': 'roja', 'missed penalty': 'penal-fallado',
}


def short_name(raw):
    """'9 M - Alan Mathias POLANCO SHEFFIELD' -> ('9', 'Alan Mathias P.'): nombre + inicial del primer apellido."""
    raw = text(raw)
    num = None
    # prefijos de Dribbli: dorsal (a veces entre corchetes), posición (una letra) y (C) = capitán
    m = re.match(r'^\s*\[?(\d+)?\]?\s*(?:[A-Z]{1,3}\b)?\s*(?:\(C\))?\s*-\s*(.+)$', raw)
    if m:
        num, raw = m.group(1), m.group(2)
    words = raw.split()
    nombres = [w for w in words if not (w.isupper() and len(w) > 1)]
    apellidos = [w for w in words if w.isupper() and len(w) > 1]
    if not nombres:  # todo en mayúsculas: primera palabra = nombre
        nombres, apellidos = words[:1], words[1:]
    name = ' '.join(w.capitalize() if w.isupper() else w for w in nombres)
    if apellidos:
        name += f' {apellidos[0][0].upper()}.'
    return num, name.strip()


def huella_jugador(raw):
    """Id público del jugador (enlace a su perfil) a partir del nombre completo de Dribbli."""
    from jugadores import huella, normalizar  # import tardío: jugadores.py importa este archivo
    raw = text(raw)
    m = re.match(r'^\s*\[?(\d+)?\]?\s*(?:[A-Z]{1,3}\b)?\s*(?:\(C\))?\s*-\s*(.+)$', raw)
    n = normalizar(m.group(2) if m else raw)
    return huella(n) if n else None


OTHER_EVENTS = set()  # tipos que no se muestran (para revisar en el registro)


def parse_incidents(page):
    """Incidencias de la página de un partido: [[minuto, tipo, lado (0 local / 1 visita), dorsal, nombre], ...]."""
    start = page.find('tw-hidden md:tw-block')
    if start < 0:
        return None
    seg = page[start:]
    end = seg.find('Loading...')
    seg = seg[:end] if end > 0 else seg
    out = []
    rows = re.split(r'<div class="tw-flex tw-flex-row tw-items-center tw-gap-4 tw-py-3', seg)[1:]
    for row in rows:
        left = re.search(r'tw-w-5/12 tw-text-right">(.*?)</div>', row, re.S)
        right = re.search(r'tw-w-5/12 tw-text-left">(.*?)</div>', row, re.S)
        minute = re.search(r'<span class="tw-font-bold tw-text-sm">\s*(\d+)', row)
        title = re.search(r'<img[^>]*title="([^"]+)"', row)
        if not title:
            continue
        tname = html.unescape(title.group(1)).strip()
        kind = EVENT_TYPES.get(tname.lower())
        if not kind:
            OTHER_EVENTS.add(tname)
            continue
        lt, rt = text(left.group(1)) if left else '', text(right.group(1)) if right else ''
        side = 0 if lt else 1
        num, name = short_name(lt or rt)
        out.append([int(minute.group(1)) if minute else None, kind, side, num, name, huella_jugador(lt or rt)])
    return out

# ---------- Principal ----------

def main():
    teams = {}
    out = {'source': 'Dribbli', 'updatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
           'categories': {}, 'teams': {}, 'leagueLogo': ''}
    league_logo_src = None
    errors = 0
    previous = {}
    if os.path.exists(OUT_JSON):
        try:
            with open(OUT_JSON, encoding='utf-8') as f:
                previous = json.load(f)
        except Exception:  # noqa: BLE001
            previous = {}
    for cid, (div, label) in CATEGORIES.items():
        print(f'Categoría {cid} ({div} {label})')
        try:
            overview = fetch(f'{BASE}/categories/{cid}')
            league_logo_src = league_logo_src or parse_league_logo(overview)
            schedule_page = fetch(f'{BASE}/categories/{cid}/schedule')
            matches, totals = parse_schedule(schedule_page, teams)
            standings = parse_standings(fetch(f'{BASE}/categories/{cid}/standings'), teams)
            leaders = parse_leaders(fetch(f'{BASE}/categories/{cid}/leaderboard'), teams)
        except Exception as e:  # noqa: BLE001
            errors += 1
            print(f'  ERROR: {e}', file=sys.stderr)
            old = previous.get('categories', {}).get(cid)
            if old:  # no borrar una categoría por un fallo pasajero: se dejan los datos anteriores
                print('  se mantienen los datos anteriores de esta categoría', file=sys.stderr)
                out['categories'][cid] = old
                for m in old.get('schedule', []):
                    for tid in (m['home'], m['away']):
                        if tid in previous.get('teams', {}):
                            teams.setdefault(tid, {'raw': previous['teams'][tid]['raw']})
            continue
        counts = parse_overview_counts(overview)
        out['categories'][cid] = {
            'division': div, 'label': label, 'name': parse_category_name(overview),
            'teams': counts.get('teams', totals.get('teams')), 'matches': counts.get('matches', totals.get('matches')),
            'players': counts.get('players'), 'referees': counts.get('referees'),
            'schedule': matches, 'standings': standings, 'leaders': leaders,
        }
        print(f'  {len(matches)} partidos, {sum(len(g["rows"]) for g in standings)} filas de tabla, {len(leaders)} líderes')
        time.sleep(1)

    if not out['categories']:
        print('No se pudo leer ninguna categoría; no se modifica data/dribbli.json', file=sys.stderr)
        return 1

    print(f'Descargando {len(teams)} escudos...')
    for tid, t in teams.items():
        name = clean_team_name(t['raw'])
        logo = save_logo(t.get('logo_src'), f'equipo-{tid}') if t.get('logo_src') else \
            previous.get('teams', {}).get(tid, {}).get('logo', '')
        out['teams'][tid] = {
            'name': name, 'club': club_name(name), 'raw': t['raw'], 'ini': initials(name), 'logo': logo,
        }
    out['leagueLogo'] = save_logo(league_logo_src, 'liga')

    # Club de Dribbli de cada equipo (para enlazar el perfil del club). Se guarda y no se vuelve a pedir.
    prev_teams = previous.get('teams', {})
    for tid, t in out['teams'].items():
        club_id = prev_teams.get(tid, {}).get('clubId')
        if not club_id:
            try:
                club_id = parse_club_id(fetch(f'{BASE}/teams/{tid}'))
                time.sleep(0.3)
            except Exception as e:  # noqa: BLE001
                print(f'  no se pudo leer el club del equipo {tid}: {e}', file=sys.stderr)
        if club_id:
            t['clubId'] = club_id

    # Incidencias de los partidos jugados (un partido terminado no cambia: se pide una sola vez).
    incid = {}
    if os.path.exists(INC_JSON):
        try:
            with open(INC_JSON, encoding='utf-8') as f:
                incid = json.load(f)
        except Exception:  # noqa: BLE001
            incid = {}
    played = [m['id'] for c in out['categories'].values() for m in c.get('schedule', []) if m.get('hs') is not None]
    nuevos = [mid for mid in played if mid not in incid or any(len(e) < 6 for e in incid[mid])]
    print(f'Incidencias: {len(nuevos)} partidos nuevos de {len(played)} jugados')
    for mid in nuevos:
        try:
            ev = parse_incidents(fetch(f'{BASE}/matches/{mid}'))
            if ev is not None:
                incid[mid] = ev
            time.sleep(0.3)
        except Exception as e:  # noqa: BLE001
            print(f'  no se pudieron leer las incidencias del partido {mid}: {e}', file=sys.stderr)
    if OTHER_EVENTS:
        print(f'  (no se muestran: {", ".join(sorted(OTHER_EVENTS))})')
    incid = {k: incid[k] for k in sorted(incid, key=int) if k in set(played)}
    with open(INC_JSON, 'w', encoding='utf-8') as f:
        json.dump(incid, f, ensure_ascii=False, separators=(',', ':'))

    # Si nada cambió en Dribbli, se conserva la fecha anterior para no publicar una versión igual.
    # Jugadores activos de la temporada con su historial (data/jugadores.json) y enlace desde Líderes.
    try:
        import jugadores
        ids = jugadores.actualizar(out)
        for c in out['categories'].values():
            for r in c.get('leaders', []):
                pid = ids.get(jugadores.huella(jugadores.normalizar(r.get('player', ''))))
                if pid:
                    r['pid'] = pid
    except Exception as e:  # noqa: BLE001
        print(f'  no se pudieron armar los jugadores: {e}', file=sys.stderr)

    strip = lambda d: {k: v for k, v in d.items() if k != 'updatedAt'}
    if previous and strip(previous) == strip(json.loads(json.dumps(out))):
        out['updatedAt'] = previous.get('updatedAt', out['updatedAt'])
        print('Sin cambios en los datos de Dribbli.')

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f'Listo: {OUT_JSON} ({len(out["categories"])} categorías, {len(out["teams"])} equipos)')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
