// Страница-конфигуратор Aegis (index.html). Отдельным файлом: CSP страницы запрещает встроенные скрипты.
'use strict';
// Файлы — с raw.githubusercontent.com: он отдаёт свежий коммит сразу, а страница
// на Pages обновляется только при правке самой страницы. Локально — файлы рядом.
// Всё на странице строится через createElement и textContent: строк HTML нет.
const PUB = 'https://raw.githubusercontent.com/anten-ka/aegis/main/';
const RAW = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? './' : PUB;
// Порядок — как в сборке: из него складываются имена файлов наборов (yandex_ru-services_vk).
const LISTS = { yandex: 'Яндекс', 'ru-services': 'Российские сервисы', vk: 'ВК' };
const NOM = { yandex: 'Яндекс', 'ru-services': 'российские сервисы', vk: 'ВК' };
const GEN = { yandex: 'Яндекса', 'ru-services': 'российских сервисов', vk: 'ВК' };
const ACTS = {
  direct: { label: 'Напрямую', hint: 'мимо VPN' },
  block: { label: 'Блокировать', hint: 'не открывать' },
};
// Где официальной документации нет, ссылаемся на код приложения на закреплённом коммите.
const SRC = {
  v2rayNBin: 'https://github.com/2dust/v2rayN/blob/e3457fa4b4776d380d3bac271e63eeb42847ebaa/v2rayN/ServiceLib/Manager/CoreInfoManager.cs#L168',
  v2rayNGAsset: 'https://github.com/2dust/v2rayNG/blob/1fa257fab9f6eacd1b05b50b49834d5bbe5a6980/V2rayNG/app/src/main/java/com/v2ray/ang/ui/userasset/UserAssetViewModel.kt#L114-L115',
  v2rayNGTag: 'https://github.com/2dust/v2rayNG/blob/1fa257fab9f6eacd1b05b50b49834d5bbe5a6980/V2rayNG/app/src/main/java/com/v2ray/ang/AppConfig.kt#L113-L114',
  karingLines: 'https://github.com/KaringX/karing/blob/02df19a29007e727fd53d2e041282bbef6134f04/lib/screens/diversion_group_custom_edit_screen.dart#L1397-L1401',
  karingDay: 'https://github.com/KaringX/karing/blob/02df19a29007e727fd53d2e041282bbef6134f04/lib/app/modules/setting_manager.dart#L1410',
};
const SRV_WHY = 'На сервере «напрямую» — это и есть выход через VPN: сервис увидит адрес сервера. Мимо VPN — настройте приложение на устройстве.';
// Docs links are listed under the «Документация» heading, so labels no longer repeat the word.
const APPS = {
  xray: { side: 'c', label: 'Xray', hint: 'v2rayN, v2rayNG и др.', acts: ['direct', 'block'],
    docs: [['Xray: маршрутизация', 'https://xtls.github.io/ru/config/routing.html'],
      ['каталог ресурсов', 'https://xtls.github.io/ru/config/env.html'],
      ['вики v2rayN: свои правила', 'https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules']] },
  mihomo: { side: 'c', label: 'mihomo', hint: 'Clash Verge, FlClash и др.', acts: ['direct', 'block'],
    docs: [['mihomo: rule-providers', 'https://wiki.metacubex.one/config/rule-providers/']] },
  happ: { side: 'c', label: 'Happ', hint: 'профиль маршрутизации', acts: ['direct', 'block'],
    docs: [['Happ: маршрутизация', 'https://www.happ.su/main/ru/dev-docs/routing'],
      ['на английском', 'https://www.happ.su/main/dev-docs/routing']] },
  incy: { side: 'c', label: 'INCY', hint: 'обновляется сам', acts: ['direct', 'block'],
    docs: [['INCY: автомаршрутизация', 'https://incy.gitbook.io/docs/docs-en/autorouting.en'],
      ['маршрутизация', 'https://incy.gitbook.io/docs/docs-en/routing']] },
  hiddify: { side: 'c', label: 'Hiddify', hint: 'правила sing-box', acts: ['direct', 'block'],
    docs: [['Hiddify на GitHub', 'https://github.com/hiddify/hiddify-app'],
      ['история версий', 'https://github.com/hiddify/hiddify-app/blob/main/HISTORY.md']] },
  karing: { side: 'c', label: 'Karing', hint: 'правила sing-box', acts: ['direct', 'block'],
    docs: [['Karing: свои правила', 'https://karing.app/en/tutorial/custom-diversion'],
      ['поле Rule Set', 'https://karing.app/en/app-manual/diversion-rule-edit'],
      ['действия группы', 'https://karing.app/en/app-manual/diversion-rule']] },
  shadowrocket: { side: 'c', label: 'Shadowrocket', hint: 'iPhone, iPad, Mac', acts: ['direct', 'block'],
    docs: [['Shadowrocket в App Store', 'https://apps.apple.com/us/app/shadowrocket/id932747118'],
      ['руководство сообщества (неофициальное)', 'https://github.com/LOWERTOP/Shadowrocket']] },
  amnezia: { side: 'c', label: 'AmneziaVPN', hint: 'приложение', acts: ['direct'],
    why: { block: 'В AmneziaVPN список только пускает сайты мимо VPN или только через VPN — блокировки нет.' },
    docs: [['AmneziaVPN: раздельное туннелирование', 'https://docs.amnezia.org/ru/documentation/instructions/vpn-split-tunneling']] },
  wg: { side: 'c', label: 'WireGuard / AmneziaWG', hint: 'файл .conf', acts: ['direct'],
    why: { block: 'WireGuard решает только, что пускать в туннель, — блокировать он не умеет.' },
    docs: [['WireGuard', 'https://www.wireguard.com/quickstart/'], ['AmneziaWG', 'https://docs.amnezia.org/documentation/amnezia-wg'],
      ['man wg-quick', 'https://git.zx2c4.com/wireguard-tools/about/src/man/wg-quick.8'],
      ['код wg-quick', 'https://github.com/WireGuard/wireguard-tools/blob/ba8556ce45c230906041a1a04450b7b638057917/src/wg-quick/linux.bash#L168-L180']] },
  '3xui': { side: 's', label: '3X-UI', hint: 'панель', acts: ['block'], why: { direct: SRV_WHY },
    docs: [['3X-UI на GitHub', 'https://github.com/MHSanaei/3x-ui'], ['маршрутизация Xray', 'https://xtls.github.io/ru/config/routing.html']] },
  'xray-s': { side: 's', label: 'Xray', hint: 'config.json', acts: ['block'], why: { direct: SRV_WHY },
    docs: [['Xray: маршрутизация', 'https://xtls.github.io/ru/config/routing.html']] },
  goinst: { side: 's', label: 'goInstaller', hint: 'готовится', acts: ['block'], why: { direct: SRV_WHY }, docs: [] },
};
// Apps whose rules can match by domains and/or by networks (the two checkboxes in step 3).
const DOMIP = ['xray', 'mihomo', '3xui', 'xray-s'];
// Club dog: the cat stickers (ch-*) link to the hosting partner, the dog-only sticker (fi-top) to the club.
const CLUB = 'https://boosty.to/anten-ka/purchase/3134076?ssource=DIRECT&share=subscription_link';
const HOST = 'https://my.adminvps.ru/aff.php?aff=27997';
const STICKERS = ['fi-top', 'ch-letaet', 'ch-tashchit', 'ch-sladka', 'ch-stabilna', 'ch-online', 'ch-tochna', 'ch-na_stile'];
const st = { lists: ['yandex'], app: 'xray', act: 'direct', dom: true, ip: true, wg: 'compact', xray: 'ext' };
// Время обновления на сервере — случайное, один раз на открытие страницы: чтобы не все
// серверы шли за файлами в одну минуту.
const CRON = { m: Math.floor(Math.random() * 60), h: 4 + Math.floor(Math.random() * 3) };
let stats = null;
let statsDone = false;  // stats.json answered (or failed): only then the stats card is redrawn
let gen = 0;  // номер отрисовки: ответ от прежней не должен лечь в новую
let resEmpty = false, resBelow = false;  // for the phone bar «Правила готовы»

const $ = (id) => document.getElementById(id);
const MQ = {
  phone: matchMedia('(max-width: 767.98px)'),
  laptop: matchMedia('(min-width: 1024px) and (max-width: 1199.98px)'),
  full: matchMedia('(min-width: 1436px)'),
  calm: matchMedia('(prefers-reduced-motion: reduce)'),
};
const isPhone = () => MQ.phone.matches;

async function getText(f) {
  const r = await fetch(RAW + f, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v; else e.setAttribute(k, v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== '' && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
const iconCls = (name, sm) => 'gm gm--' + name + (sm ? ' gm--sm' : '');
const icon = (name, sm) => el('i', { class: iconCls(name, sm), 'aria-hidden': 'true' });
function copyBtn(label, getValue, cls) {
  const sm = cls.includes('ga-btn--copy');
  const ic = icon('copy', sm), t = el('span', {}, label);
  const b = el('button', { class: cls, type: 'button' }, ic, t);
  let timer = 0;
  const show = (done, text) => { b.classList.toggle('is-done', done); ic.className = iconCls(done ? 'check' : 'copy', sm); t.textContent = text; };
  b.addEventListener('click', async () => {
    clearTimeout(timer);
    try { await navigator.clipboard.writeText(await getValue()); show(true, 'Скопировано'); }
    catch (e) { show(false, 'Не вышло — выделите и скопируйте'); }
    timer = setTimeout(() => show(false, label), 2000);
  });
  return b;
}
function code(text) {
  return el('div', { class: 'gx-code' }, el('code', {}, text), copyBtn('Копировать', () => text, 'ga-btn ga-btn--copy'));
}
// Скачивание: raw.githubusercontent.com — другой адрес, там атрибут download не работает, и
// вместо файла открывался текст. Поэтому файл берём fetch и отдаём как Blob; не вышло — ссылка.
function dl(file, label) {
  const name = file.split('/').pop();
  const a = el('a', { class: 'ga-btn ga-btn--tertiary', href: PUB + file, download: name }, icon('download'), label || ('Скачать ' + name));
  a.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(RAW + file, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const u = URL.createObjectURL(new Blob([await r.arrayBuffer()], { type: 'application/octet-stream' }));
      const t = el('a', { href: u, download: name });
      document.body.append(t); t.click(); t.remove();
      setTimeout(() => URL.revokeObjectURL(u), 30000);
    } catch (err) {
      window.open(PUB + file, '_blank', 'noopener');
    }
  });
  return a;
}
const link = (text, href) => el('a', { href, target: '_blank', rel: 'noopener' }, text);
const linkBtn = (text, href) => el('a', { class: 'ga-btn ga-btn--link', href, target: '_blank', rel: 'noopener' }, text, icon('external', true));
const linksRow = (list) => el('div', { class: 'ae-links' }, list.map(([t, h]) => linkBtn(t, h)));
// go DS alert: tone success | warning | plain, b = bold lead (may be empty), rest = text and nodes.
function al(tone, ic, b, ...rest) {
  return el('div', { class: 'gx-al gx-al--' + tone },
    el('span', { class: 'gx-al__icon' }, icon(ic, true)),
    el('div', { class: 'gx-al__body' }, el('p', { class: 'gx-al__text' }, b ? el('b', {}, b) : null, b && rest.length ? ' ' : null, rest)));
}
const note = (...t) => al('plain', 'info', '', ...t);
const kv = (rows) => el('div', { class: 'gx-kv ae-kv' }, rows.map(([k, v]) => el('div', { class: 'gx-kv__row' },
  el('div', { class: 'gx-kv__k' }, k),
  el('div', { class: 'gx-kv__v gx-kv__v--mono gx-kv__v--wrap' }, el('span', { class: 'gx-kv__text' }, v)),
  el('div', { class: 'gx-kv__end' }))));
// С какими подключениями (WireGuard, AmneziaWG) действуют правила — по документации и коду приложений,
// проверено на устройстве только INCY (iPhone, 12.11.2026). Текст и источники для каждой карточки.
const PROTO = {
  xray: ['По документации правила Xray действуют на все его подключения, включая WireGuard. AmneziaWG в Xray нет: файл AmneziaWG ' +
    'v2rayN и v2rayNG откроют как обычный WireGuard без маскировки — подключится ли он, мы не проверяли.',
    [['Xray: WireGuard', 'https://github.com/XTLS/Xray-docs-next/blob/44ed2e81cce3e0d134b901907aba75503abd82df/docs/en/config/outbounds/wireguard.md?plain=1#L3'],
      ['v2rayN', 'https://github.com/2dust/v2rayN/blob/e3457fa4b4776d380d3bac271e63eeb42847ebaa/v2rayN/ServiceLib/Handler/Fmt/WireguardFmt.cs#L103-L162'],
      ['v2rayNG', 'https://github.com/2dust/v2rayNG/blob/1fa257fab9f6eacd1b05b50b49834d5bbe5a6980/V2rayNG/app/src/main/java/com/v2ray/ang/fmt/WireguardFmt.kt#L48-L89']]],
  mihomo: ['В mihomo это такие же прокси, как VLESS, и правила действуют и на них (по документации; на устройстве ' +
    'не проверяли). AmneziaWG задаётся только в профиле YAML (amnezia-wg-option).',
    [['mihomo: WireGuard', 'https://wiki.metacubex.one/en/config/proxies/wg/'],
      ['код', 'https://github.com/MetaCubeX/mihomo/blob/0455d0d28c4526937380505153e65a843d8612e8/adapter/outbound/wireguard.go#L105-L143']]],
  happ: ['В документации Happ нет ни WireGuard, ни AmneziaWG, а на устройстве Happ мы не проверяли; в INCY такой же профиль ' +
    'с подключением AmneziaWG не действует.',
    [['Happ: протоколы', 'https://www.happ.su/main/faq/adding-configuration-subscription']]],
  incy: ['На iPhone с действием «Напрямую» профиль сработал с подключением VLESS и не сработал с AmneziaWG — для AmneziaWG берите ' +
    'карточки «AmneziaVPN» или «WireGuard / AmneziaWG». WireGuard, «Блокировать» и другие устройства мы не проверяли.',
    [['INCY: протоколы', 'https://github.com/INCY-DEV/incy-platforms/blob/cc03fd036deb272191bb3c23aacf67a6dbc1a092/README.md?plain=1#L72']]],
  hiddify: ['Hiddify запускает их в том же ядре sing-box, что и VLESS, поэтому правила должны действовать и для них — ' +
    'так по коду, на устройстве не проверяли.',
    [['код', 'https://github.com/hiddify/hiddify-core/blob/b32da5d975a3ffab6ed706173839b5d0ffc55c6c/v2/config/parser.go#L158-L206'],
      ['код', 'https://github.com/hiddify/hiddify-core/blob/b32da5d975a3ffab6ed706173839b5d0ffc55c6c/v2/config/builder.go#L234-L284']]],
  karing: ['По заметкам к выпускам Karing запускает их в своём ядре sing-box, поэтому правила должны действовать ' +
    'и для них — на устройстве не проверяли.',
    [['выпуск 2906', 'https://github.com/KaringX/karing/releases/tag/v1.2.26.2906'],
      ['выпуск 2916', 'https://github.com/KaringX/karing/releases/tag/v1.2.26.2916']]],
  shadowrocket: ['По истории версий Shadowrocket их умеет (какие версии AmneziaWG — неизвестно); действуют ли с ними ' +
    'правила, мы не проверяли.',
    [['история версий', 'https://apps.apple.com/us/app/shadowrocket/id932747118']]],
  amnezia: ['С WireGuard и AmneziaWG список действует, только если в конфигурации AllowedIPs = 0.0.0.0/0, ::/0; иначе приложение ' +
    'показывает «Раздельное туннелирование на сервере» и список не применяет (по коду приложения, на устройстве не проверяли).',
    [['документация', 'https://docs.amnezia.org/documentation/instructions/vpn-split-tunneling'],
      ['код', 'https://github.com/amnezia-vpn/amnezia-client/blob/864c1faab81166579a43a06fde9dbc9076b0be92/client/vpnConnection.cpp#L412-L458']]],
  wg: ['Строка AllowedIPs работает и с WireGuard, и с AmneziaWG. Конфигурацию AmneziaWG открывайте в приложении AmneziaWG: ' +
    'приложение WireGuard её не примет (iOS, macOS и Android — по коду).',
    [['AmneziaWG', 'https://docs.amnezia.org/documentation/amnezia-wg'],
      ['WireGuard для iOS и macOS', 'https://github.com/WireGuard/wireguard-apple/blob/2fec12a6e1f6e3460b6ee483aa00ad29cddadab1/Sources/Shared/Model/TunnelConfiguration%2BWgQuickConfig.swift#L74-L83'],
      ['для Android', 'https://github.com/WireGuard/wireguard-android/blob/e7b3a3c118836e112620b1302a8ba1873ad4daac/tunnel/src/main/java/com/wireguard/config/Interface.java#L98-L100']]],
};
const protoNote = (app) => {
  const p = PROTO[app];
  if (!p) return null;
  const refs = [];
  p[1].forEach(([t, u], i) => { if (i) refs.push(', '); refs.push(link(t, u)); });
  return note(el('b', {}, 'WireGuard и AmneziaWG.'), ' ', p[0], ' Источники: ', refs, '.');
};
const count = (f) => (stats && stats.files && stats.files[f]) ? stats.files[f].count : null;
const n = (x) => (x == null ? '—' : Number(x).toLocaleString('ru-RU'));
const sel = () => Object.keys(LISTS).filter((k) => st.lists.includes(k));
const combo = () => sel().join('_');
const joinRu = (a) => (a.length < 3 ? a.join(' и ') : a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1]);
const plural = (x, one, few, many) => {
  const m10 = x % 10, m100 = x % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many;
};

// ── Step tiles: built once, render() only updates their state, so focus never jumps. ──────
function buildTiles() {
  $('lists').replaceChildren(...Object.entries(LISTS).map(([k, v]) => {
    const b = el('button', { type: 'button', class: 'ae-pick ae-pick--list', role: 'checkbox', 'data-k': k },
      el('span', { class: 'ae-pick__box', 'aria-hidden': 'true' }, icon('check', true)),
      el('span', { class: 'ae-pick__txt' }, el('span', { class: 'ae-pick__t' }, v), el('span', { class: 'ae-pick__h', hidden: '' })));
    b.addEventListener('click', () => {
      st.lists = st.lists.includes(k) ? st.lists.filter((x) => x !== k) : [...st.lists, k];
      render();
    });
    return b;
  }));
  for (const side of ['c', 's']) {
    $('apps-' + side).replaceChildren(...Object.entries(APPS).filter(([, v]) => v.side === side).map(([k, v]) => {
      const b = el('button', { type: 'button', class: 'ae-pick', role: 'radio', 'data-k': k },
        el('span', { class: 'ae-pick__t' }, v.label), el('span', { class: 'ae-pick__h' }, v.hint));
      b.addEventListener('click', () => chooseApp(k));
      return b;
    }));
  }
  $('action').replaceChildren(...Object.entries(ACTS).map(([k, v]) => {
    const b = el('button', { type: 'button', class: 'ae-pick', role: 'radio', 'data-k': k },
      el('span', { class: 'ae-pick__t' }, v.label), el('span', { class: 'ae-pick__h' }, v.hint));
    b.addEventListener('click', () => chooseAct(k));
    return b;
  }));
  radioKeys($('apps'), chooseApp);
  radioKeys($('action'), chooseAct);
}
function chooseApp(k) {
  st.app = k;
  if (!APPS[k].acts.includes(st.act)) st.act = APPS[k].acts[0];
  render();
}
function chooseAct(k) {
  if (!APPS[st.app].acts.includes(k)) return;
  st.act = k;
  render();
}
// Radio groups behave like native radios: arrows move and select, disabled tiles are skipped.
function radioKeys(group, choose) {
  group.addEventListener('keydown', (e) => {
    const all = [...group.querySelectorAll('[role="radio"]')];
    const i = all.indexOf(e.target);
    if (i < 0) return;
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const ok = (b) => b.getAttribute('aria-disabled') !== 'true';
    let next = null;
    if (e.key === 'Home') next = all.find(ok);
    else if (e.key === 'End') next = [...all].reverse().find(ok);
    else if (dir) for (let s = 1; s <= all.length; s++) { const b = all[(i + dir * s + all.length * s) % all.length]; if (ok(b)) { next = b; break; } }
    if (!next) return;
    e.preventDefault();
    choose(next.dataset.k);
    next.focus();
  });
}

// ── Step 3 extras: checkboxes and segmented choices, also built once. ─────────────────────
const X = {};
function buildExtra() {
  const chk = (key, label, hint) => {
    const i = el('input', { type: 'checkbox' });
    i.addEventListener('change', () => { st[key] = i.checked; render(); });
    X[key] = i;
    return el('label', { class: 'gx-check' }, i, el('span', {}, label, el('small', {}, hint)));
  };
  const seg = (key, label, opts) => {
    const hint = el('span', { class: 'gx-hint', id: 'seg-' + key + '-h' });
    const btns = opts.map(([v, t]) => {
      const b = el('button', { type: 'button', 'data-v': v }, t);
      b.addEventListener('click', () => { st[key] = v; render(); });
      return b;
    });
    X[key] = { btns, hint, opts };
    return el('div', { class: 'ae-segbox' }, el('span', { class: 'ae-seglabel', id: 'seg-' + key }, label),
      el('div', { class: 'gx-seg', role: 'group', 'aria-labelledby': 'seg-' + key, 'aria-describedby': 'seg-' + key + '-h' }, btns), hint);
  };
  X.domip = el('div', { class: 'ae-checks' }, chk('dom', 'По доменам', 'точнее, нужен sniffing'), chk('ip', 'По сетям', 'подключения по адресу'));
  X.xrayBox = seg('xray', 'Как подключить списки', [['ext', 'Файлы geo', 'ext:aegis-*.dat — файлы в каталоге ресурсов Xray'],
    ['inline', 'Правило целиком', 'если приложение не берёт свои .dat']]);
  X.wgBox = seg('wg', 'Вариант строки AllowedIPs', [['compact', 'Короткий', 'для телефона'], ['full', 'Полный', 'для компьютера и роутера']]);
  $('extra').replaceChildren(X.domip, X.xrayBox, X.wgBox);
}

function render() {
  const app = APPS[st.app];
  for (const b of $('lists').querySelectorAll('[data-k]')) b.setAttribute('aria-checked', String(st.lists.includes(b.dataset.k)));
  for (const b of $('apps').querySelectorAll('[data-k]')) {
    const on = b.dataset.k === st.app;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  }
  for (const b of $('action').querySelectorAll('[data-k]')) {
    const k = b.dataset.k, ok = app.acts.includes(k), on = st.act === k;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
    if (ok) { b.removeAttribute('aria-disabled'); b.removeAttribute('aria-describedby'); }
    else { b.setAttribute('aria-disabled', 'true'); b.setAttribute('aria-describedby', 'why-' + k); }
    b.querySelector('.ae-pick__h').textContent = ok ? ACTS[k].hint : 'недоступно';
  }
  const off = Object.keys(ACTS).filter((k) => !app.acts.includes(k));
  $('whys').hidden = !off.length;
  $('whys').replaceChildren(...off.map((k) => el('p', { class: 'ae-why', id: 'why-' + k }, icon('info', true),
    el('span', {}, el('b', {}, ACTS[k].label + ' недоступно.'), ' ', (app.why && app.why[k]) || ''))));

  const domip = DOMIP.includes(st.app);
  X.domip.hidden = !domip;
  X.xrayBox.hidden = st.app !== 'xray';
  X.wgBox.hidden = st.app !== 'wg';
  $('extra').hidden = !(domip || st.app === 'wg');
  X.dom.checked = st.dom;
  X.ip.checked = st.ip;
  for (const key of ['xray', 'wg']) {
    for (const b of X[key].btns) b.setAttribute('aria-pressed', String(b.dataset.v === st[key]));
    X[key].hint.textContent = X[key].opts.find((o) => o[0] === st[key])[2];
  }
  renderOut();
}

// One step = li.gx-step; parts go in a fixed order: text, links, kv, text2, buttons, note, code, node, note2.
function steps(...list) {
  return el('ol', { class: 'ae-steps' }, list.filter(Boolean).map((s, i) => el('li', { class: 'gx-step' },
    el('span', { class: 'gx-step__n' }, String(i + 1)),
    el('div', { class: 'gx-step__b' },
      el('p', {}, s.t),
      s.links ? linksRow(s.links) : null,
      s.kv ? kv(s.kv) : null,
      s.t2 ? el('p', {}, s.t2) : null,
      s.btns ? el('div', { class: 'ae-btns' }, s.btns) : null,
      s.note ? el('p', { class: 'ae-note' }, s.note) : null,
      s.code != null ? code(s.code) : null,
      s.node || null,
      s.note2 ? el('p', { class: 'ae-note' }, s.note2) : null))));
}

function xrayRules(outbound) {
  const r = [];
  if (st.dom) r.push({ type: 'field', domain: sel().map((t) => 'ext:aegis-site.dat:' + t), outboundTag: outbound });
  if (st.ip) r.push({ type: 'field', ip: sel().map((t) => 'ext:aegis-ip.dat:' + t), outboundTag: outbound });
  return r.map((o) => JSON.stringify(o)).join(',\n');
}
function mihomoYaml(action) {
  const prov = [], rules = [];
  for (const t of sel()) {
    for (const [kind, beh] of [['domain', 'domain'], ['ip', 'ipcidr']]) {
      if ((kind === 'domain' && !st.dom) || (kind === 'ip' && !st.ip)) continue;
      const name = 'aegis-' + t + '-' + kind;
      prov.push('  ' + name + ':\n    type: http\n    behavior: ' + beh + '\n    format: text\n    url: ' + PUB + 'mihomo/' + t + '-' + kind +
        '.txt\n    path: ./rule-set/' + name + '.txt\n    interval: 86400');
      rules.push('  - RULE-SET,' + name + ',' + action + (kind === 'ip' ? ',no-resolve' : ''));
    }
  }
  return 'rule-providers:\n' + prov.join('\n') + '\n\nrules:\n' + rules.join('\n') + '\n  # ...дальше ваши правила';
}
// Async parts go into a display:contents box, so they line up in the step like its other parts.
const asyncBox = () => el('div', { class: 'ae-contents' });
async function inlineXray(box, outbound, my) {
  box.replaceChildren(el('p', { class: 'ae-loading' }, 'Собираю правило из свежих списков…'));
  try {
    const dom = [], ip = [];
    for (const t of sel()) {
      if (st.dom) dom.push(...(await getText('mihomo/' + t + '-domain.txt')).split('\n').filter(Boolean).map((d) => 'domain:' + d.replace(/^\+\./, '')));
      if (st.ip) ip.push(...(await getText('mihomo/' + t + '-ip.txt')).split('\n').filter(Boolean));
    }
    if (my !== gen) return;
    const r = [];
    if (dom.length) r.push(JSON.stringify({ type: 'field', domain: dom, outboundTag: outbound }));
    if (ip.length) r.push(JSON.stringify({ type: 'field', ip, outboundTag: outbound }));
    box.replaceChildren(code(r.join(',\n')),
      el('p', { class: 'ae-note' }, 'В правиле ' + n(dom.length) + ' доменов и ' + n(ip.length) + ' сетей. Оно не обновляется само — пересоберите раз в неделю-две.'));
  } catch (e) {
    if (my === gen) box.replaceChildren(note('Не удалось скачать списки. Обновите страницу или возьмите файлы geo.'));
  }
}

// QR — библиотекой qrcode-generator (vendor/, MIT) и своим SVG: только модули, без строк HTML.
// Paper and ink are hex inside the SVG: the QR stays dark on light even where the page's colour tokens
// (oklch, color-mix) are unknown. Default = go DS --qr-paper / --qr-ink as Chrome resolves them; club: white / purple.
const NS = 'http://www.w3.org/2000/svg';
function qrSvg(text, ecl, label, paper = '#cfdade', ink = '#111114') {
  const q = qrcode(0, ecl);
  q.addData(text, 'Byte');
  q.make();
  const m = q.getModuleCount(), pad = 4, size = m + pad * 2;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
  svg.setAttribute('shape-rendering', 'crispEdges');
  if (label) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label); } else svg.setAttribute('aria-hidden', 'true');
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', String(size)); bg.setAttribute('height', String(size)); bg.setAttribute('fill', paper);
  const d = [];
  for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) if (q.isDark(r, c)) d.push('M' + (c + pad) + ' ' + (r + pad) + 'h1v1h-1z');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d.join(''));
  p.setAttribute('fill', ink);
  svg.append(bg, p);
  return svg;
}
function linkBlock(box, url, appName, ecl, my) {
  if (my !== gen) return;
  let qr = null;
  try { qr = typeof qrcode === 'function' ? qrSvg(url, ecl, 'QR-код ссылки') : null; } catch (e) { qr = null; }
  box.replaceChildren(
    el('div', { class: 'ae-link' },
      el('div', { class: 'ae-link__btns' },
        el('a', { class: 'ga-btn ga-btn--primary ga-btn--full', href: url }, icon('phone'), 'Открыть в ' + appName),
        copyBtn('Копировать ссылку', () => url, 'ga-btn ga-btn--tertiary ga-btn--full')),
      qr ? el('div', { class: 'ae-link__qr' }, el('div', { class: 'gx-qr' }, qr)) : null,
      el('p', { class: 'gx-hint ae-link__cap' }, qr ? 'На другом устройстве: отсканируйте камерой или сканером в ' + appName + '.'
        : 'QR не построился — откройте ссылку или скопируйте её.')),
    el('details', { class: 'ae-full' }, el('summary', {}, 'Ссылка целиком'), el('div', { class: 'gx-code' }, el('code', {}, url))));
}
async function happBlock(box, file, my) {
  box.replaceChildren(el('p', { class: 'ae-loading' }, 'Готовлю ссылку…'));
  try {
    const t = await getText(file);
    JSON.parse(t);
    let bin = '';
    for (const b of new TextEncoder().encode(t)) bin += String.fromCharCode(b);
    linkBlock(box, 'happ://routing/onadd/' + btoa(bin), 'Happ', 'L', my);
  } catch (e) {
    if (my === gen) box.replaceChildren(note('Не удалось скачать профиль. Обновите страницу.'));
  }
}
// «Откуда эти шаги» (what the steps rest on, with a chip if not checked on a device) and «Документация».
function srcFoot(src) {
  const d = APPS[st.app].docs;
  if (!src && !d.length) return null;
  return el('div', { class: 'ae-src' },
    src ? [el('div', { class: 'ae-src__h' }, el('span', { class: 'ae-src__t' }, 'Откуда эти шаги'),
      src.chip ? el('span', { class: 'gx-chip gx-chip--none' }, src.chip) : null),
    el('p', { class: 'ae-note' }, src.t), src.links ? linksRow(src.links) : null] : null,
    d.length ? [el('span', { class: 'ae-src__t ae-src__docs' }, 'Документация'), linksRow(d)] : null);
}
function updater(dir, svc, where) {
  return [
    { t: 'Подключитесь к серверу по SSH, скачайте скрипт обновления и с его помощью — сами списки ' + where + ':',
      links: [['прочитать скрипт', 'https://github.com/anten-ka/aegis/blob/main/scripts/aegis-update.sh']],
      code: 'curl -fsSL -o /usr/local/bin/aegis-update ' + PUB + 'scripts/aegis-update.sh\nchmod 755 /usr/local/bin/aegis-update\naegis-update ' + dir + ' ' + svc,
      note2: 'Скрипт сверяет файлы с их SHA-256 и ставит на место, только если скачались целиком; ' +
        svc + ' перезапускает, только когда списки сменились (не перезапустился — повторит в следующий раз). ' +
        'Списки могут меняться почти каждый день — тогда ' + svc + ' перезапускается каждую ночь, и открытые подключения переподключаются.' },
    { t: 'Обновление раз в сутки — строкой в crontab -e (время выбрано случайно, чтобы не все серверы шли за файлами в одну минуту):',
      code: CRON.m + ' ' + CRON.h + ' * * * /usr/local/bin/aegis-update ' + dir + ' ' + svc,
      note2: 'Код 1 («SHA-256 не совпал») сразу после публикации — не поломка: GitHub несколько минут отдаёт файлы из кеша ' +
        'и может прислать новый .sha256 со старым файлом. Скрипт тогда ничего не меняет, следующий запуск возьмёт сошедшуюся пару.' },
  ];
}
const ipNote = () => (st.ip
  ? note('Правило по сетям срабатывает на подключения по адресу. Клиенты VPN обычно передают имя сайта; чтобы сверять с сетями и их, ' +
    'поставьте в routing "domainStrategy": "IPIfNonMatch" — тогда Xray сам спрашивает DNS для имён, которых нет в правиле по доменам.')
  : null);
const REALITY = { chip: 'не проверено на сервере', t: 'Reality: маскировочный сайт (dest) Xray открывает сам, мимо правил маршрутизации, — правило выше его не трогает ' +
  '(по устройству Xray; на живом сервере мы это не проверяли). А вот закрывать эти сети файрволом сервера нельзя, если сервер маскируется под сайт из списка: ' +
  'тогда Reality перестанет работать у всех.' };

function renderOut() {
  const my = ++gen;
  const o = $('out');
  const app = APPS[st.app];
  const direct = st.act === 'direct';
  const names = joinRu(sel().map((t) => NOM[t]));
  const namesGen = joinRu(sel().map((t) => GEN[t]));
  const Names = names.charAt(0).toUpperCase() + names.slice(1);
  $('res-h').textContent = 'Правила для ' + app.label + (app.side === 's' ? ' на сервере' : '');
  $('res-ic').className = iconCls(app.side === 's' ? 'server' : 'phone', true);
  $('res-sub').textContent = (sel().length ? Names : 'Списки не выбраны') + ' · ' + (direct ? 'напрямую, мимо VPN' : 'блокировать');
  $('jump-sub').textContent = app.label + ' · ' + (sel().length ? Names : '—') + ' · ' + (direct ? 'напрямую' : 'блокировать');
  resEmpty = true;
  if (!st.lists.length) { o.replaceChildren(al('plain', 'info', 'Выберите хотя бы один список.')); updateJump(); return; }
  if (DOMIP.includes(st.app) && !st.dom && !st.ip) {
    o.replaceChildren(al('plain', 'info', 'Выберите доменами, сетями или и то и другое.')); updateJump(); return;
  }
  resEmpty = st.app === 'goinst';  // goInstaller has no rules yet («Готовится»): no «Правила готовы» bar
  const outcome = direct ? 'Сайты ' + namesGen + ' пойдут мимо VPN и не увидят его адрес.'
    : 'Сайты ' + namesGen + ' не откроются на этом устройстве вовсе — ни через VPN, ни мимо.';
  const ok = (t) => al('success', 'check', t);
  const srs = (t) => [PUB + 'sing-box/geosite-aegis-' + t + '.srs', PUB + 'sing-box/geoip-aegis-' + t + '.srs'];
  // В профиле по строке на список — люди принимают это за «мало доменов».
  const etc = sel().length > 1 ? ' и т. п.' : '';
  const CATS = ' В профиле — по строке на список в доменах (geosite:' + sel()[0] + etc + ') и в адресах (geoip:' + sel()[0] + etc +
    '): это не отдельные домены, а категории из наших файлов, в каждой — все домены или сети списка.';
  const replaceWarn = (what) => al('warning', 'warn', 'Импорт заменит вашу текущую ' + what + '.', 'Если у вас уже есть свой профиль (например, от провайдера VPN), ' +
    'он перестанет быть активным — вернуть его можно в списке профилей приложения.');
  const warns = [], notes = [];
  let list = null, src = null;

  switch (st.app) {
    case 'xray': {
      const ob = direct ? 'direct' : 'block';
      if (st.xray === 'ext') {
        list = steps(
          { t: 'Скачайте файлы и положите их в каталог ресурсов Xray — там он ищет файлы из ext: (документация Xray):',
            btns: [st.ip ? dl('xray/aegis-ip.dat') : null, st.dom ? dl('xray/aegis-site.dat') : null],
            note: 'v2rayN — папка bin рядом с программой. v2rayNG — экран «Файлы ресурсов» → «Добавить URL»: в «Название» — ' +
              'точное имя файла (aegis-ip.dat, aegis-site.dat), в URL — ссылка на файл, затем «Загрузить файлы».' },
          { t: 'Добавьте правило маршрутизации ' + (direct ? 'с выходом напрямую (direct)' : 'с выходом-заглушкой (blackhole; в v2rayN и v2rayNG его тег — block)') +
            ' и поставьте его выше правила «всё в прокси»:', code: xrayRules(ob) },
          { t: 'Раз в неделю-две скачивайте файлы заново (в v2rayNG — снова «Загрузить файлы»): списки обновляются каждый день.' },
        );
      } else {
        const box = asyncBox();
        list = steps({ t: 'Вставьте правило в маршрутизацию приложения, выше правила «всё в прокси»' +
          (direct ? '' : ' (тег выхода-заглушки — как в вашем приложении; в v2rayN и v2rayNG — block)') + ':', node: box });
        inlineXray(box, ob, my);
      }
      notes.push(ok(outcome));
      if (st.ip) notes.push(note('Правило по сетям ловит подключения по имени, только если стратегия домена (domainStrategy) — IPOnDemand или IPIfNonMatch; ' +
        'при AsIs — только подключения по адресу. При IPIfNonMatch DNS спрашивается, только если ни одно правило не сработало; правило «всё в прокси» ' +
        'без условий срабатывает раньше — тогда нужен IPOnDemand (документация Xray).'));
      src = { chip: 'не проверено на устройстве', t: 'Правило и каталог ресурсов — по документации Xray, тег block в v2rayN — по его вики. Где каталог ресурсов ' +
        'в v2rayN и v2rayNG и тег block в v2rayNG — по их коду; на устройстве мы это не проверяли.',
        links: [['код v2rayN', SRC.v2rayNBin], ['код v2rayNG', SRC.v2rayNGAsset], ['тег в v2rayNG', SRC.v2rayNGTag]] };
      break;
    }
    case 'mihomo': {
      const act = direct ? 'DIRECT' : 'REJECT';
      list = steps(
        { t: 'Добавьте в конфигурацию (если rule-providers уже есть — допишите внутрь):', code: mihomoYaml(act) },
        { t: 'Правила RULE-SET поставьте выше общего правила, которое отправляет всё в VPN. Списки обновятся сами раз в сутки (interval).' },
      );
      notes.push(ok(outcome));
      if (st.ip) notes.push(note('С no-resolve правило по сетям ловит только подключения по адресу, имена ловит правило по доменам. ' +
        'Уберите no-resolve, если mihomo должен сверять с сетями и адреса имён (ценой DNS-запроса).'));
      break;
    }
    case 'happ': {
      const box = asyncBox();
      warns.push(replaceWarn('активную маршрутизацию Happ (профиль маршрутизации активен только один)'));
      list = steps({ t: 'Откройте ссылку на телефоне с Happ или отсканируйте QR:', node: box },
        { t: 'Happ скачает наши geo-файлы и включит профиль Aegis.' + CATS,
          note2: 'Когда Happ берёт свежие файлы, две страницы его документации говорят по-разному: ' +
            'английская — не чаще раза в неделю, даже если профиль обновляется каждый час; русская — когда в профиле новая дата LastUpdated ' +
            '(у нас она меняется вместе с файлами). Чтобы взять свежие раньше, откройте ссылку снова — это мы не проверяли.' });
      notes.push(ok(outcome));
      src = { chip: 'не проверено на устройстве', t: 'Профиль собран по документации Happ. Что Happ принимает свои теги в чужих geo-файлах (geosite:' + sel()[0] +
        '), подтверждено только опытом сообщества — на устройстве мы это не проверяли.' };
      happBlock(box, 'happ/' + combo() + '-' + st.act + '.json', my);
      break;
    }
    case 'incy': {
      const box = asyncBox();
      warns.push(replaceWarn('активную маршрутизацию INCY'));
      list = steps({ t: 'Откройте ссылку на телефоне с INCY или отсканируйте QR:', node: box },
        { t: 'INCY сам проверяет профиль по ссылке (по умолчанию раз в сутки) и берёт новые списки, когда они меняются.' + CATS });
      notes.push(ok(outcome));
      // «Напрямую» was checked on an iPhone; «Блокировать» was not.
      src = { chip: direct ? null : 'не проверено на устройстве', t: 'Ссылка и профиль — по документации INCY. Проверено на iPhone 12.11.2026, действие «Напрямую»: ' +
        'yandex.ru/internet с подключением VLESS показал домашний адрес, с AmneziaWG — адрес VPN-сервера. «Блокировать» на устройстве не проверяли.' };
      linkBlock(box, 'incy://autorouting/onadd/' + PUB + 'happ/' + combo() + '-' + st.act + '.json', 'INCY', 'M', my);
      break;
    }
    case 'hiddify':
      list = steps(
        { t: 'Нужен Hiddify 5.2.0 или новее. Откройте Настройки → Маршрутизация (Routing) и добавьте правило.' },
        { t: 'Выход (outbound): ' + (direct ? 'Direct' : 'Block') + '. В поле Rule-set добавьте ссылки:', code: sel().flatMap(srs).join('\n') },
        { t: 'Правило поставьте выше остальных. Списки Hiddify обновляет сам (по коду приложения — раз в 5 дней).' },
      );
      notes.push(ok(outcome));
      src = { chip: 'не проверено на устройстве', t: 'Отдельной страницы о правилах у Hiddify нет: шаги — по коду приложения и истории версий. На устройстве мы это не проверяли.' };
      break;
    case 'karing':
      list = steps(
        { t: 'Настройки → Diversion → Diversion rules → Edit → Custom diversion group → «+» справа вверху, имя — Aegis.' },
        { t: 'Откройте группу Aegis и в поле Rule Set вставьте ссылки:', code: sel().flatMap(srs).join('\n') },
        { t: 'Вернитесь на первый экран Diversion rules, у группы Aegis выберите действие ' + (direct ? 'Direct (напрямую)' : 'Block (блокировать)') +
          ' и переподключитесь.' },
      );
      notes.push(ok(outcome));
      src = { chip: 'не проверено на устройстве', t: 'Путь, поле Rule Set (ссылка кончается именем файла .srs) и действия Direct и Block — по документации Karing. ' +
        'По коду Karing, не проверено: несколько ссылок — по одной в строке, правила обновляются по умолчанию раз в 24 часа. ' +
        'Где группа стоит среди других правил, документация не говорит; на устройстве мы это не проверяли.',
        links: [['код: ссылки по строкам', SRC.karingLines], ['код: раз в 24 часа', SRC.karingDay]] };
      break;
    case 'shadowrocket': {
      const pol = direct ? 'DIRECT' : 'REJECT';
      warns.push(al('plain', 'info', 'По руководству сообщества, официальной документации нет;', 'не проверено на iPhone.'));
      list = steps(
        { t: 'Конфигурация → ⓘ у активного файла → Правило → «+» → тип RULE-SET, политика ' + pol + ', в URL — ссылка (для каждого списка):',
          code: sel().map((t) => PUB + 'shadowrocket/' + t + '.list').join('\n') },
        { t: 'Или допишите строки в раздел [Rule] файла конфигурации, выше FINAL:', code: sel().map((t) => 'RULE-SET,' + PUB + 'shadowrocket/' + t + '.list,' + pol).join('\n') },
        { t: 'Правила поставьте выше общих. Обновление списков — в настройках обновления конфигурации.' },
      );
      notes.push(ok(outcome));
      break;
    }
    case 'amnezia':
      list = steps(
        { t: 'Скачайте список:', btns: sel().map((t) => dl('amnezia/' + t + '.json')) },
        { t: 'В AmneziaVPN откройте раздельное туннелирование сайтов и выберите режим «Адреса из списка не должны открываться через VPN».' },
        { t: 'Импортируйте файл' + (sel().length > 1 ? 'ы по очереди (меню ⋮), добавляя к списку' : ' (меню ⋮)') + '.' },
        { t: 'Список сам не обновляется — раз в неделю-две импортируйте свежий. В файле только адреса IPv4.' },
      );
      notes.push(ok(outcome));
      break;
    case 'wg': {
      const f = 'wireguard/' + combo() + '-allowedips-' + st.wg + '.txt';
      const c = count(f);
      list = steps(
        { t: 'Откройте файл конфигурации (.conf) и найдите в разделе [Peer] строку AllowedIPs.' },
        { t: 'Замените её строкой из файла' + (c ? ' (записей: ' + n(c) + ')' : '') + ':',
          btns: [dl(f), copyBtn('Копировать строку', () => getText(f), 'ga-btn ga-btn--primary')] },
        { t: 'Сохраните и переподключитесь. Подходит и для AmneziaWG: строка та же.' },
        { t: 'Linux (wg-quick) и роутер: в строке есть и адрес вашего VPN-сервера, а wg-quick ведёт каждую её запись (кроме 0.0.0.0/0 и ::/0) ' +
          'в туннель — до сервера пакеты тоже уйдут в туннель, и соединение не поднимется. Добавьте до сервера маршрут мимо туннеля ' +
          'в раздел [Interface] (шлюз и сетевая карта — из ip route show default):',
          code: 'PostUp = ip route add <адрес сервера>/32 via <шлюз> dev <сетевая карта>\nPostDown = ip route del <адрес сервера>/32',
          note2: 'По документации и коду wg-quick (ссылки ниже). На роутере — то же его средствами. ' +
            'Прошивки роутеров, Windows и приложения на телефоне мы не проверяли.' },
      );
      notes.push(al('plain', 'info', 'У WireGuard нет правил «не пускать»:', 'строка — это «весь интернет, кроме ' + namesGen + ' и домашней сети». ' +
        (st.wg === 'full' ? 'Полный вариант — до десятков тысяч записей, на телефоне может тормозить.'
          : 'Короткий вариант не трогает адреса сервисов в облаках — только их собственные сети.')));
      break;
    }
    case '3xui': {
      const u = updater('/usr/local/x-ui/bin', 'x-ui', 'в папку Xray панели');
      const rows = [];
      if (st.dom) rows.push(['Домены', sel().map((t) => 'ext:aegis-site.dat:' + t).join(',')]);
      if (st.ip) rows.push(['IP', sel().map((t) => 'ext:aegis-ip.dat:' + t).join(',')]);
      rows.push(['Исходящее (Outbound Tag)', 'blocked']);
      list = steps(u[0],
        { t: 'В панели откройте настройки Xray, вкладку правил маршрутизации, и добавьте правило:', kv: rows,
          t2: 'Поставьте правило выше остальных, сохраните и перезапустите Xray.', note: 'То же в шаблоне конфигурации, в routing.rules:', code: xrayRules('blocked') },
        st.dom ? { t: 'Во входящих подключениях включите Sniffing (http, tls, quic) — без него правило по доменам не сработает.' } : null,
        u[1]);
      notes.push(ok('Клиенты VPN не откроют ' + names + ' через этот сервер.'), ipNote());
      src = REALITY;
      break;
    }
    case 'xray-s': {
      const u = updater('/usr/local/share/xray', 'xray', 'туда, где Xray берёт geoip.dat и geosite.dat (обычно /usr/local/share/xray; если у вас иначе — поменяйте путь)');
      list = steps(u[0],
        { t: 'Добавьте в outbounds выход-заглушку, если его нет:', code: '{ "protocol": "blackhole", "tag": "blocked" }' },
        { t: 'Добавьте правила в начало routing.rules:', code: xrayRules('blocked') },
        st.dom ? { t: 'Во входящих включите определение адреса: "sniffing": { "enabled": true, "destOverride": ["http", "tls", "quic"] }.' } : null,
        u[1]);
      notes.push(ok('Клиенты VPN не откроют ' + names + ' через этот сервер.'), ipNote());
      src = REALITY;
      break;
    }
    case 'goinst':
      notes.push(note('Готовится: в меню goInstaller → «Защита» появятся переключатели «Яндекс», «Российские сервисы» и «ВК», по умолчанию выключенные. ' +
        'Пока можно настроить Xray или 3X-UI на сервере — выберите их выше.'));
      break;
  }
  notes.push(protoNote(st.app));
  o.replaceChildren(...warns, ...[list, ...notes, srcFoot(src)].filter(Boolean));
  updateJump();
}

// ── «Что в списках» and the header chips ───────────────────────────────────────────────
const chip = (ic, ...kids) => el('span', { class: 'gx-chip gx-chip--tag' }, icon(ic, true), el('span', {}, kids));
function renderStats() {
  const meta = $('meta');
  const box = $('stats');
  if (!stats) {
    meta.replaceChildren(chip('info', 'Сведения о списках не загрузились — файлы при этом доступны.'));
    box.replaceChildren(el('p', { class: 'ae-muted' }, 'Нет данных.'));
    return;
  }
  const d = new Date(stats.generated * 1000);
  meta.replaceChildren(chip('clock', 'Обновлено ', el('b', {}, d.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' }))),
    chip('refresh', 'Обновляется ', el('b', {}, 'раз в сутки')));
  const rows = Object.values(stats.lists || {});
  if (isPhone()) {
    box.replaceChildren(el('div', { class: 'ae-rows' }, rows.map((v) => el('div', {}, el('b', {}, v.title),
      el('span', {}, 'IPv4 ' + n(v.v4) + ' · IPv6 ' + n(v.v6) + ' · доменов ' + n(v.domains)),
      el('span', {}, 'своих сетей целиком ' + n(v.whole) + ' · адресов точечно ' + n(v.point))))));
    return;
  }
  const heads = ['', 'Своих сетей целиком', 'Адресов точечно', 'Строк IPv4', 'Строк IPv6', 'Доменов'];
  box.replaceChildren(el('table', { class: 'ae-tbl' },
    el('thead', {}, el('tr', {}, heads.map((h) => el('th', { scope: 'col' }, h)))),
    el('tbody', {}, rows.map((v) => el('tr', {}, el('th', { scope: 'row' }, v.title),
      [v.whole, v.point, v.v4, v.v6, v.domains].map((c) => el('td', {}, n(c))))))));
}
// Сайты «ВК», которые не порталы VK, — из stats.json (lists.vk.outside): текст не отстанет от сборки.
function renderListsNote() {
  const out = stats && stats.lists && stats.lists.vk && stats.lists.vk.outside;
  // Старый stats.json (без поля) — остаётся текст из index.html; пустой список — строки нет.
  if (!Array.isArray(out)) return;
  const names = out.filter((x) => typeof x === 'string' && /^[a-z0-9@._*-]{1,80}$/.test(x));
  if (!names.length) { $('lists-note').hidden = !out.length; return; }
  $('lists-note').hidden = false;
  $('lists-note-t').textContent = 'В списке «ВК» есть и сайты, которые не порталы VK: ' + joinRu(names) +
    '. «ВК — блокировать» закроет и их.';
}
// Подписи с числами у списков — без пересоздания плиток, чтобы не трогать фокус.
function refreshCounts() {
  for (const b of $('lists').querySelectorAll('[data-k]')) {
    const sl = stats && stats.lists && stats.lists[b.dataset.k];
    if (!sl) continue;
    const h = b.querySelector('.ae-pick__h');
    h.replaceChildren(el('span', {}, n(sl.v4 + sl.v6) + ' сетей и адресов'),
      el('span', {}, n(sl.domains) + ' ' + plural(sl.domains, 'домен', 'домена', 'доменов')));
    h.hidden = false;
  }
}

// ── Layout by width: data-device for go DS, the stats card under the result at 1024–1199. ──
function layout() {
  document.documentElement.dataset.device = isPhone() ? 'phone' : 'desktop';
  const card = $('stats-card'), side = MQ.laptop.matches ? $('right') : $('left');
  if (card.parentNode !== side) side.append(card);
}
// Sticky columns (≥ 1024): one taller than the screen sticks by its bottom (aegis.css .is-tall), or its lower
// part would stay off-screen while the other column scrolls. Heights change with the result and the window.
function stickCols() {
  for (const c of [$('left'), $('right')]) c.classList.toggle('is-tall', c.offsetHeight > window.innerHeight - 48);
}
function initStick() {
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(stickCols);
    ro.observe($('left')); ro.observe($('right'));
  }
  window.addEventListener('resize', stickCols);
  stickCols();
}
// Phone bar «Правила готовы»: shown while the result is still below the screen.
function updateJump() {
  $('jump').hidden = !(isPhone() && resBelow && !resEmpty);
}
function initJump() {
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      for (const e of es) resBelow = !e.isIntersecting && e.boundingClientRect.top > 0;
      updateJump();
    }, { rootMargin: '0px 0px -60px 0px' }).observe($('res'));
  }
  $('jump-btn').addEventListener('click', () => {
    const r = $('res');
    window.scrollTo({ top: r.getBoundingClientRect().top + window.scrollY - 12, behavior: MQ.calm.matches ? 'auto' : 'smooth' });
    r.focus({ preventScroll: true });
  });
}

// ── Club dog ───────────────────────────────────────────────────────────────────────────
// Sticker: random once per session. Hidden: remembered per viewer. Storage may be blocked —
// then a random sticker per load and the hidden state lives until reload.
const dog = { hidden: false, tucked: false, peek: false, peekY: 0, raf: 0 };
function pickSticker() {
  let s = STICKERS[Math.floor(Math.random() * STICKERS.length)];
  try {
    const v = sessionStorage.getItem('aegis-club-sticker');
    if (STICKERS.includes(v)) s = v; else sessionStorage.setItem('aegis-club-sticker', s);
  } catch (e) { /* storage blocked */ }
  return s;
}
function dogHidden(v) {
  try {
    if (v === undefined) return localStorage.getItem('aegis-club-dog') === 'hidden';
    if (v) localStorage.setItem('aegis-club-dog', 'hidden'); else localStorage.removeItem('aegis-club-dog');
  } catch (e) { /* storage blocked */ }
  return false;
}
function dogMode() {
  const d = $('dog'), tab = $('dog-tab'), phone = isPhone();
  document.documentElement.classList.toggle('ae-dog-off', phone && dog.hidden);
  $('dog-mini').hidden = !phone || dog.hidden;
  // Phone: the hidden 48 px link leaves the edge tab bottom-left (aegis.css), so a hide is always reversible.
  if (phone) { d.hidden = true; tab.hidden = !dog.hidden; return; }
  d.hidden = false;
  const full = MQ.full.matches;
  d.classList.toggle('ae-dog--full', full);
  // Compact dog stands in the header; once the cards reach it, it tucks into the edge tab.
  dog.tucked = !full && $('s1').getBoundingClientRect().top < 16 + d.offsetHeight + 8;
  if (!dog.tucked) dog.peek = false;
  const away = dog.hidden || (dog.tucked && !dog.peek);
  d.classList.toggle('is-away', away);
  d.inert = away;
  tab.hidden = !away;
}
function dogTick() {
  if (dog.raf) return;
  dog.raf = requestAnimationFrame(() => {
    dog.raf = 0;
    if (dog.peek && Math.abs(window.scrollY - dog.peekY) > 200) dog.peek = false;
    dogMode();
  });
}
function initDog() {
  const s = pickSticker(), cat = s !== 'fi-top';
  const label = cat ? 'Хостинг-партнёр antenka' : 'Вступить в клуб';
  for (const a of [$('dog-pic'), $('dog-mini-pic')]) {
    a.href = cat ? HOST : CLUB;
    a.rel = cat ? 'noopener sponsored' : 'noopener';
    a.title = label;
    a.setAttribute('aria-label', label);
  }
  $('dog-img').src = 'club/' + s + '.webp';
  $('dog-mini-pic').dataset.sticker = s;
  $('dog-tab').querySelector('.ae-face').dataset.sticker = s;
  try { if (typeof qrcode === 'function') $('dog-qr').append(qrSvg(CLUB, 'M', '', '#fff', '#2A1B4A')); } catch (e) { /* the link still works without the picture */ }
  dog.hidden = dogHidden();
  $('dog-hide').addEventListener('click', () => {
    dog.hidden = true; dog.peek = false; dogHidden(true); dogMode();
    $('dog-tab').focus();
  });
  $('dog-tab').addEventListener('click', () => {
    dog.hidden = false; dogHidden(false);
    dog.peek = true; dog.peekY = window.scrollY;
    dogMode();
    (isPhone() ? $('dog-mini-pic') : $('dog-pic')).focus();
  });
  $('dog-mini-x').addEventListener('click', () => {
    dog.hidden = true; dogHidden(true); dogMode();
    $('dog-tab').focus();
  });
  window.addEventListener('scroll', dogTick, { passive: true });
  window.addEventListener('resize', dogTick);
  dogMode();
}

MQ.phone.addEventListener('change', () => { layout(); if (statsDone) renderStats(); dogMode(); updateJump(); });
MQ.laptop.addEventListener('change', layout);
buildTiles();
buildExtra();
layout();
render();
initJump();
initStick();
initDog();
fetch(RAW + 'stats.json', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => { stats = j && j.format === 1 ? j : null; statsDone = true; renderStats(); renderOut(); refreshCounts(); renderListsNote(); })
  .catch(() => { stats = null; statsDone = true; renderStats(); });
