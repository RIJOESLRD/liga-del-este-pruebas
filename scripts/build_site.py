#!/usr/bin/env python3
"""
Arma la web para publicarla en GitHub Pages.

1. Lee las noticias de contenido/noticias/*.json (las crea el panel /admin).
2. Genera data/noticias.json (la lista que usan la portada y la página de Noticias)
   y una página por noticia: noticia-<nombre>.html, con su vista previa para WhatsApp.
3. Copia todo lo público a la carpeta _site, que es lo que se publica.

Uso:  python3 scripts/build_site.py            (SITE_BASE opcional, ej. https://ligadeleste.eslrd.com/)
Solo usa la biblioteca estándar de Python 3.9+.
"""
import html
import json
import os
import re
import shutil
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '_site')
NEWS_DIR = os.path.join(ROOT, 'contenido', 'noticias')
TEMPLATE = os.path.join(ROOT, 'plantillas', 'noticia.html')
MODO_PRUEBA = os.environ.get('MODO_PRUEBA') == '1'  # copia de pruebas: franja de aviso y sin Google
SITE_BASE = os.environ.get('SITE_BASE', 'https://rijoeslrd.github.io/liga-del-este-web/').rstrip('/') + '/'

# Lo que se publica (todo lo demás —scripts, contenido, plantillas— se queda fuera).
PUBLIC_DIRS = ['css', 'js', 'data', 'fotos', 'logos', 'admin', 'icons']
PUBLIC_FILES_RE = re.compile(r'^[\w-]+\.html$')

MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
          'septiembre', 'octubre', 'noviembre', 'diciembre']
TIPOS = {'aviso': 'Aviso', 'jornada': 'Jornada', 'evento': 'Evento', 'institucional': 'La liga'}


def fecha_larga(iso):
    try:
        y, m, d = (int(x) for x in iso.split('-'))
        return f'{d} de {MONTHS[m - 1]} de {y}'
    except Exception:  # noqa: BLE001
        return iso


def texto_a_html(texto):
    """Texto del panel -> HTML: párrafos (línea en blanco), saltos de línea,
    **negrita**, *cursiva* y enlaces automáticos."""
    out = []
    for parrafo in re.split(r'\n\s*\n', (texto or '').strip()):
        if not parrafo.strip():
            continue
        t = html.escape(parrafo.strip())
        t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
        t = re.sub(r'(?<![\*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)', r'<em>\1</em>', t)
        t = re.sub(r'(https?://[^\s<]+)', r'<a href="\1" target="_blank" rel="noopener">\1</a>', t)
        t = t.replace('\n', '<br>\n')
        out.append(f'<p>{t}</p>')
    return '\n'.join(out)


def leer_noticias():
    noticias = []
    if not os.path.isdir(NEWS_DIR):
        return noticias
    for nombre in sorted(os.listdir(NEWS_DIR)):
        if not nombre.endswith('.json'):
            continue
        slug = nombre[:-5]
        if not re.fullmatch(r'[a-z0-9-]+', slug):
            print(f'  se ignora {nombre}: el nombre solo puede tener letras, números y guiones', file=sys.stderr)
            continue
        try:
            with open(os.path.join(NEWS_DIR, nombre), encoding='utf-8') as f:
                n = json.load(f)
        except Exception as e:  # noqa: BLE001
            print(f'  se ignora {nombre}: {e}', file=sys.stderr)
            continue
        if not n.get('titulo') or not n.get('fecha'):
            print(f'  se ignora {nombre}: falta título o fecha', file=sys.stderr)
            continue
        n['slug'] = slug
        noticias.append(n)
    noticias.sort(key=lambda n: (n.get('fecha', ''), n['slug']), reverse=True)
    return noticias


def articulo_html(n):
    tipo = TIPOS.get(n.get('tipo', ''), 'Noticia')
    portada = n.get('portada') or ''
    fotos = [f for f in (n.get('fotos') or []) if f]
    partes = [
        '<article class="container noticia">',
        '  <a class="noticia__volver" href="noticias.html">← Todas las noticias</a>',
        f'  <div class="noticia__meta"><span class="chip chip--{html.escape(n.get("tipo", ""))}">{tipo}</span>'
        f'<time datetime="{html.escape(n["fecha"])}">{fecha_larga(n["fecha"])}</time></div>',
        f'  <h1 class="noticia__titulo">{html.escape(n["titulo"])}</h1>',
    ]
    if n.get('resumen'):
        partes.append(f'  <p class="noticia__resumen">{html.escape(n["resumen"])}</p>')
    if portada:
        partes.append(f'  <figure class="noticia__portada"><img src="{html.escape(portada)}" alt="{html.escape(n["titulo"])}"></figure>')
    partes.append(f'  <div class="noticia__texto">{texto_a_html(n.get("texto", ""))}</div>')
    if fotos:
        imgs = ''.join(
            f'<button type="button" class="noticia__foto" data-foto="{html.escape(f)}" aria-label="Ampliar foto {i + 1}">'
            f'<img src="{html.escape(f)}" alt="Foto {i + 1} de la noticia" loading="lazy"></button>'
            for i, f in enumerate(fotos))
        partes.append(f'  <div class="noticia__galeria">{imgs}</div>')
    url = SITE_BASE + f'noticia-{n["slug"]}.html'
    wa = html.escape('https://wa.me/?text=' + urllib.parse.quote(f'{n["titulo"]} {url}'))
    partes.append(
        '  <div class="noticia__compartir">'
        '<span>Compartir:</span>'
        f'<a class="btn btn--wa btn--plain" href="{wa}" target="_blank" rel="noopener">WhatsApp</a>'
        f'<button type="button" class="btn btn--plain btn--ig" data-copiar="{html.escape(url)}">Copiar enlace</button>'
        '</div>')
    partes.append('</article>')
    return '\n'.join(partes)


def pagina_noticia(plantilla, n):
    imagen = SITE_BASE + (n.get('portada') or 'logos/liga.png')
    reemplazos = {
        '{{TITULO}}': html.escape(n['titulo']),
        '{{DESCRIPCION}}': html.escape(n.get('resumen') or n['titulo']),
        '{{IMAGEN}}': html.escape(imagen),
        '{{URL}}': html.escape(SITE_BASE + f'noticia-{n["slug"]}.html'),
        '{{ARTICULO}}': articulo_html(n),
    }
    out = plantilla
    for k, v in reemplazos.items():
        out = out.replace(k, v)
    return out


FRANJA_PRUEBA = ('<div style="position:sticky;top:0;z-index:9999;background:#F4C430;color:#0E1B3D;'
                 'text-align:center;font:700 14px/1.2 Inter,system-ui,sans-serif;padding:8px 12px;letter-spacing:.06em">'
                 'VERSIÓN DE PRUEBA · Los cambios aquí no afectan la web oficial</div>')


def marcar_prueba(texto):
    """Copia de pruebas: que Google no la indexe y que se vea la franja de aviso."""
    texto = texto.replace('<head>', '<head>\n<meta name="robots" content="noindex, nofollow">', 1)
    return re.sub(r'(<body[^>]*>)', r'\1' + FRANJA_PRUEBA.replace('\\', '\\\\'), texto, count=1)


def main():
    noticias = leer_noticias()
    print(f'{len(noticias)} noticias')

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    paginas = []
    for nombre in sorted(os.listdir(ROOT)):
        if PUBLIC_FILES_RE.match(nombre) and not nombre.startswith('vista-previa'):
            # %SITE_BASE% = dirección completa de la web (vista previa en WhatsApp, página 404).
            with open(os.path.join(ROOT, nombre), encoding='utf-8') as f:
                texto = f.read().replace('%SITE_BASE%', SITE_BASE)
            if MODO_PRUEBA:
                texto = marcar_prueba(texto)
            with open(os.path.join(OUT, nombre), 'w', encoding='utf-8') as f:
                f.write(texto)
            if nombre != '404.html':
                paginas.append(nombre)
    for d in PUBLIC_DIRS:
        if os.path.isdir(os.path.join(ROOT, d)):
            shutil.copytree(os.path.join(ROOT, d), os.path.join(OUT, d))

    indice = [{
        'slug': n['slug'], 'url': f'noticia-{n["slug"]}.html', 'titulo': n['titulo'], 'fecha': n['fecha'],
        'tipo': n.get('tipo', ''), 'resumen': n.get('resumen', ''), 'portada': n.get('portada', ''),
        'urgente': bool(n.get('urgente')), 'urgente_hasta': n.get('urgente_hasta', ''),
    } for n in noticias]
    os.makedirs(os.path.join(OUT, 'data'), exist_ok=True)
    with open(os.path.join(OUT, 'data', 'noticias.json'), 'w', encoding='utf-8') as f:
        json.dump(indice, f, ensure_ascii=False, indent=1)

    with open(TEMPLATE, encoding='utf-8') as f:
        plantilla = f.read()
    if MODO_PRUEBA:
        plantilla = marcar_prueba(plantilla)
    for n in noticias:
        with open(os.path.join(OUT, f'noticia-{n["slug"]}.html'), 'w', encoding='utf-8') as f:
            f.write(pagina_noticia(plantilla, n))

    # Para Google: lista de páginas (sitemap.xml) y reglas para buscadores (robots.txt).
    urls = [(SITE_BASE + ('' if p == 'index.html' else p), '') for p in paginas]
    urls += [(SITE_BASE + f'noticia-{n["slug"]}.html', n['fecha']) for n in noticias]
    with open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for loc, fecha in urls:
            f.write(f'  <url><loc>{html.escape(loc)}</loc>{f"<lastmod>{fecha}</lastmod>" if fecha else ""}</url>\n')
        f.write('</urlset>\n')
    with open(os.path.join(OUT, 'robots.txt'), 'w', encoding='utf-8') as f:
        if MODO_PRUEBA:
            f.write('User-agent: *\nDisallow: /\n')
        else:
            f.write(f'User-agent: *\nDisallow: /admin/\nSitemap: {SITE_BASE}sitemap.xml\n')

    # GitHub Pages: servir los archivos tal cual (sin Jekyll).
    open(os.path.join(OUT, '.nojekyll'), 'w').close()
    print(f'Listo: {OUT}')


if __name__ == '__main__':
    main()
