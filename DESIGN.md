# DESIGN — визитка pyrforos.xyz

> v2: hosting moved to Cloudflare Workers (see HANDOFF.md); design language unchanged.

Трактовка: точный инструмент в тёмном исполнении — «инженер-одиночка при люксовом
трейде часов». Тёмно-графитовый фон, латунный акцент, Instrument Serif как дисплейная
гарнитура и JetBrains Mono для служебных меток (terminal, labels, chips); body — system.

## Ключевые решения
- **Один яркий момент** — терминал-герой (`$ whoami` / `$ cat mission.txt`), с
  мигающим курсором; остальная типографика — тихая редакционная точность.
- **Стат-ряд** («~9 years solo IT / 1 person IT team / 3 open-source repos») —
  крупная серифная цифра + моно-подпись.
- Секционные заголовки — mono-крючки с hairline-чертои; карточки без теней,
  hover = подсветка рамки + подъём на 1px.
- Тёмная тема по умолчанию; светлая через `prefers-color-scheme: light`
  (не инверсия: тёплая бумага + латунь `#a07d17`).
- Один HTML-файл, без сборщиков; Google Fonts (только Instrument Serif + JetBrains Mono).
- Reduced-motion уважается (курсор статичен, hover без транзформа).

## Файлы
- `index.html` — вся страница.
- `CNAME` — pyrforos.xyz.

## Паблишинг
- Репо `pyrforos-site` (публичное), Pages: main / root, домен зарегистрирован.
- Остаток: у регистратора A @ → 4× 185.199.{108..111}.153, CNAME www →
  alexander-pyrforos.github.io; затем Enforce HTTPS (API: `gh api -X PUT
  repos/alexander-pyrforos/pyrforos-site/pages -f https_enforced=true`).
- Локальное превью: `python3 -m http.server 8137` из этой папки.