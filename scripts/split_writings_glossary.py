#!/usr/bin/env python3
"""Split inline articles from writings/index.html and glossary/index.html into standalone pages."""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

WRITING_SHELL = """<!DOCTYPE html>
<html lang="en" class="page-writings">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>{title_esc} - Efe Bakır</title>
  <link rel="icon" href="/star-black.svg?v=3" type="image/svg+xml" sizes="any">
  <link rel="shortcut icon" href="/star-black.svg?v=3" type="image/svg+xml">
  <link rel="mask-icon" href="/star-black.svg?v=3" color="#141414">
  <script>try{{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}</script>
  <link rel="stylesheet" href="/design-system.css">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="nav-overlay" id="nav-overlay" aria-hidden="true" hidden></div>
  <header class="header" style="opacity:0;transform:translateY(14px)">
    <div class="header-content">
      <div class="brand-group">
        <a href="/" class="logo-btn" aria-label="Go to work">
          <img src="/star.svg" alt="" class="logo-star" width="16" height="16">
          Efe Bakır
        </a>
      </div>
      <button type="button" class="nav-toggle" id="nav-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="nav-sheet">
        <span class="nav-toggle-label">NAVIGATE</span>
      </button>
      <div class="header-status">
        <span id="header-status-text" class="header-status-text"></span>
      </div>
      <div class="nav-sheet" id="nav-sheet" hidden>
        <div class="nav-sheet-status">
          <span class="header-status-text" data-header-status-text></span>
        </div>
        <nav class="main-nav" id="main-nav">
          <a href="/" class="nav-link">WORK</a>
          <a href="/writings/" class="nav-link active">WRITING</a>
          <a href="/glossary/" class="nav-link">GLOSSARY</a>
        </nav>
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
          <span class="theme-label inactive">MOON</span>
          <span class="theme-label active">SUN</span>
        </button>
      </div>
    </div>
  </header>
  <main class="page-content" style="opacity:0;transform:translateY(14px)">
    <div class="article-inner">
      <p class="section-detail-back">
        <a class="section-detail-back-link" href="/writings/" aria-label="Back to writing index"><svg class="section-detail-back-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.5 9.5L3.5 5.5L7.5 1.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>Back</a>
      </p>
{article_block}
{pagination}
    </div>
  </main>
  <script src="/nav.js"></script>
  <script src="/site.js"></script>
  <script>
    window.va = window.va || function () {{
      (window.vaq = window.vaq || []).push(arguments);
    }};
  </script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
"""

GLOSSARY_SHELL = """<!DOCTYPE html>
<html lang="en" class="page-glossary">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>{title_esc} - Glossary - Efe Bakır</title>
  <link rel="icon" href="/star-black.svg?v=3" type="image/svg+xml" sizes="any">
  <link rel="shortcut icon" href="/star-black.svg?v=3" type="image/svg+xml">
  <link rel="mask-icon" href="/star-black.svg?v=3" color="#141414">
  <script>try{{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}</script>
  <link rel="stylesheet" href="/design-system.css">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="nav-overlay" id="nav-overlay" aria-hidden="true" hidden></div>
  <header class="header" style="opacity:0;transform:translateY(14px)">
    <div class="header-content">
      <div class="brand-group">
        <a href="/" class="logo-btn" aria-label="Go to work">
          <img src="/star.svg" alt="" class="logo-star" width="16" height="16">
          Efe Bakır
        </a>
      </div>
      <button type="button" class="nav-toggle" id="nav-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="nav-sheet">
        <span class="nav-toggle-label">NAVIGATE</span>
      </button>
      <div class="header-status">
        <span id="header-status-text" class="header-status-text"></span>
      </div>
      <div class="nav-sheet" id="nav-sheet" hidden>
        <div class="nav-sheet-status">
          <span class="header-status-text" data-header-status-text></span>
        </div>
        <nav class="main-nav" id="main-nav">
          <a href="/" class="nav-link">WORK</a>
          <a href="/writings/" class="nav-link">WRITING</a>
          <a href="/glossary/" class="nav-link active">GLOSSARY</a>
        </nav>
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
          <span class="theme-label inactive">MOON</span>
          <span class="theme-label active">SUN</span>
        </button>
      </div>
    </div>
  </header>
  <main class="page-content" style="opacity:0;transform:translateY(14px)">
    <div class="article-inner">
      <p class="section-detail-back">
        <a class="section-detail-back-link" href="/glossary/" aria-label="Back to glossary index"><svg class="section-detail-back-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.5 9.5L3.5 5.5L7.5 1.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>Back</a>
      </p>
{article_block}
{pagination}
    </div>
  </main>
  <script src="/nav.js"></script>
  <script src="/site.js"></script>
  <script>
    window.va = window.va || function () {{
      (window.vaq = window.vaq || []).push(arguments);
    }};
  </script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
"""

NAV_RE_W = re.compile(r'<nav class="writing-article-nav[^"]*"[^>]*>.*?</nav>', re.DOTALL)
NAV_RE_G = re.compile(r'<nav class="glossary-article-nav[^"]*"[^>]*>.*?</nav>', re.DOTALL)


def writing_pagination(nav_blob: str) -> str:
    prev_m = None
    next_m = None
    for b in re.finditer(
        r'<button class="writing-article-nav-item( writing-article-nav-next)?"[^>]*data-writing-id="([^"]+)"[^>]*>([\s\S]*?)</button>',
        nav_blob,
    ):
        is_next = b.group(1) and b.group(1).strip()
        sid = b.group(2)
        title_m = re.search(r'writing-article-nav-title">([^<]*)<', b.group(3))
        label = title_m.group(1).strip() if title_m else ""
        if is_next:
            next_m = (sid, label)
        else:
            prev_m = (sid, label)
    lines = ['      <nav class="writing-article-nav writing-detail-pagination" aria-label="Article navigation">']
    if prev_m:
        sid, lab = prev_m
        lines.append(
            f'        <a class="writing-article-nav-item" href="/writings/{sid}/">'
            f'<span class="writing-article-nav-label">PREVIOUS</span>'
            f'<span class="writing-article-nav-title">{lab}</span></a>'
        )
    else:
        lines.append('        <div class="writing-article-nav-placeholder"></div>')
    if next_m:
        sid, lab = next_m
        lines.append(
            f'        <a class="writing-article-nav-item writing-article-nav-next" href="/writings/{sid}/">'
            f'<span class="writing-article-nav-label">NEXT</span>'
            f'<span class="writing-article-nav-title">{lab}</span></a>'
        )
    else:
        lines.append('        <div class="writing-article-nav-placeholder"></div>')
    lines.append("      </nav>")
    return "\n".join(lines)


def glossary_pagination(nav_blob: str) -> str:
    prev_m = None
    next_m = None
    for b in re.finditer(
        r'<button class="glossary-article-nav-item( glossary-article-nav-next)?"[^>]*data-glossary-id="([^"]+)"[^>]*>([\s\S]*?)</button>',
        nav_blob,
    ):
        is_next = b.group(1) and b.group(1).strip()
        sid = b.group(2)
        title_m = re.search(r'glossary-article-nav-title">([^<]*)<', b.group(3))
        label = title_m.group(1).strip() if title_m else ""
        if is_next:
            next_m = (sid, label)
        else:
            prev_m = (sid, label)
    lines = ['      <nav class="glossary-article-nav writing-detail-pagination" aria-label="Glossary navigation">']
    if prev_m:
        sid, lab = prev_m
        lines.append(
            f'        <a class="glossary-article-nav-item" href="/glossary/{sid}/">'
            f'<span class="glossary-article-nav-label">PREVIOUS</span>'
            f'<span class="glossary-article-nav-title">{lab}</span></a>'
        )
    else:
        lines.append('        <div class="glossary-article-nav-placeholder"></div>')
    if next_m:
        sid, lab = next_m
        lines.append(
            f'        <a class="glossary-article-nav-item glossary-article-nav-next" href="/glossary/{sid}/">'
            f'<span class="glossary-article-nav-label">NEXT</span>'
            f'<span class="glossary-article-nav-title">{lab}</span></a>'
        )
    else:
        lines.append('        <div class="glossary-article-nav-placeholder"></div>')
    lines.append("      </nav>")
    return "\n".join(lines)


def split_writings():
    src_path = ROOT / "writings" / "index.html"
    src = src_path.read_text()
    dates = {
        "dont-let-your-light-die": "MAR 16 2026",
        "freedom": "MAR 13 2026",
        "completely-different": "MAR 11 2026",
        "the-right-people": "MAR 7 2026",
        "regret": "FEB 14 2026",
        "how-other-people-control-emotions": "FEB 13 2026",
        "weight-of-not-knowing": "FEB 8 2026",
        "hindu-cows": "JAN 15 2026",
        "barriers-of-calling": "DEC 17 2025",
        "voice-of-calling": "DEC 14 2025",
    }
    art_re = re.compile(
        r'<article class="writing-article" id="article-([^"]+)"(?: hidden)?>([\s\S]*?)</article>',
    )
    for m in art_re.finditer(src):
        slug = m.group(1)
        block = m.group(2)
        nav_m = NAV_RE_W.search(block)
        pag = writing_pagination(nav_m.group(0)) if nav_m else ""
        inner = NAV_RE_W.sub("", block).strip()
        title_m = re.search(r'<h2 class="writing-article-title">([^<]*)</h2>', inner)
        title_plain = title_m.group(1).strip() if title_m else slug
        inner = re.sub(
            r'(<div class="writing-article-header">\s*)<h2 class="writing-article-title">',
            r'\1<span class="article-date">' + dates.get(slug, "") + r'</span>\n            <h2 class="writing-article-title">',
            inner,
            count=1,
        )
        article_block = '      <article class="writing-article writing-article--standalone writing-article-paras--armed">\n' + inner + "\n      </article>"
        page = WRITING_SHELL.format(
            title_esc=html.escape(title_plain, quote=True),
            article_block=article_block,
            pagination=pag,
        )
        out_dir = ROOT / "writings" / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(page)
        print("wrote", out_dir / "index.html")


def split_glossary():
    src_path = ROOT / "glossary" / "index.html"
    src = src_path.read_text().replace("</article>q", "</article>")
    art_re = re.compile(
        r'<article class="glossary-article" id="glossary-article-([^"]+)"(?: hidden)?>([\s\S]*?)</article>',
    )
    for m in art_re.finditer(src):
        slug = m.group(1)
        block = m.group(2)
        nav_m = NAV_RE_G.search(block)
        pag = glossary_pagination(nav_m.group(0)) if nav_m else ""
        inner = NAV_RE_G.sub("", block).strip()
        title_m = re.search(r'<h2 class="writing-article-title">([^<]*)</h2>', inner)
        title_plain = title_m.group(1).strip() if title_m else slug
        article_block = '      <article class="glossary-article glossary-article--standalone">\n' + inner + "\n      </article>"
        page = GLOSSARY_SHELL.format(
            title_esc=html.escape(title_plain, quote=True),
            article_block=article_block,
            pagination=pag,
        )
        out_dir = ROOT / "glossary" / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(page)
        print("wrote glossary", out_dir / "index.html")


if __name__ == "__main__":
    split_writings()
    split_glossary()
