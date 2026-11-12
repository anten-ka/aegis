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
const APPS = {
  xray: { side: 'c', label: 'Xray', hint: 'v2rayN, v2rayNG и др.', acts: ['direct', 'block'],
    docs: [['Документация Xray: маршрутизация', 'https://xtls.github.io/ru/config/routing.html'],
      ['каталог ресурсов', 'https://xtls.github.io/ru/config/env.html'],
      ['вики v2rayN: свои правила', 'https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules']] },
  mihomo: { side: 'c', label: 'mihomo', hint: 'Clash Verge, FlClash и др.', acts: ['direct', 'block'],
    docs: [['Документация mihomo: rule-providers', 'https://wiki.metacubex.one/config/rule-providers/']] },
  happ: { side: 'c', label: 'Happ', hint: 'профиль маршрутизации', acts: ['direct', 'block'],
    docs: [['Документация Happ: маршрутизация', 'https://www.happ.su/main/ru/dev-docs/routing'],
      ['на английском', 'https://www.happ.su/main/dev-docs/routing']] },
  incy: { side: 'c', label: 'INCY', hint: 'обновляется сам', acts: ['direct', 'block'],
    docs: [['Документация INCY: автомаршрутизация', 'https://incy.gitbook.io/docs/docs-en/autorouting.en'],
      ['маршрутизация', 'https://incy.gitbook.io/docs/docs-en/routing']] },
  hiddify: { side: 'c', label: 'Hiddify', hint: 'правила sing-box', acts: ['direct', 'block'],
    docs: [['Hiddify на GitHub', 'https://github.com/hiddify/hiddify-app'],
      ['история версий', 'https://github.com/hiddify/hiddify-app/blob/main/HISTORY.md']] },
  karing: { side: 'c', label: 'Karing', hint: 'правила sing-box', acts: ['direct', 'block'],
    docs: [['Документация Karing: свои правила', 'https://karing.app/en/tutorial/custom-diversion'],
      ['поле Rule Set', 'https://karing.app/en/app-manual/diversion-rule-edit'],
      ['действия группы', 'https://karing.app/en/app-manual/diversion-rule']] },
  shadowrocket: { side: 'c', label: 'Shadowrocket', hint: 'iPhone, iPad, Mac', acts: ['direct', 'block'],
    docs: [['Shadowrocket в App Store', 'https://apps.apple.com/us/app/shadowrocket/id932747118'],
      ['руководство сообщества (неофициальное)', 'https://github.com/LOWERTOP/Shadowrocket']] },
  amnezia: { side: 'c', label: 'AmneziaVPN', hint: 'приложение', acts: ['direct'],
    why: { block: 'В AmneziaVPN список только пускает сайты мимо VPN или только через VPN — блокировки нет.' },
    docs: [['Документация AmneziaVPN: раздельное туннелирование', 'https://docs.amnezia.org/ru/documentation/instructions/vpn-split-tunneling']] },
  wg: { side: 'c', label: 'WireGuard / AmneziaWG', hint: 'файл .conf', acts: ['direct'],
    why: { block: 'WireGuard решает только, что пускать в туннель, — блокировать он не умеет.' },
    docs: [['WireGuard', 'https://www.wireguard.com/quickstart/'], ['AmneziaWG', 'https://docs.amnezia.org/documentation/amnezia-wg'],
      ['man wg-quick', 'https://git.zx2c4.com/wireguard-tools/about/src/man/wg-quick.8'],
      ['код wg-quick', 'https://github.com/WireGuard/wireguard-tools/blob/ba8556ce45c230906041a1a04450b7b638057917/src/wg-quick/linux.bash#L168-L180']] },
  '3xui': { side: 's', label: '3X-UI', hint: 'панель', acts: ['block'], why: { direct: SRV_WHY },
    docs: [['3X-UI на GitHub', 'https://github.com/MHSanaei/3x-ui'], ['маршрутизация Xray', 'https://xtls.github.io/ru/config/routing.html']] },
  'xray-s': { side: 's', label: 'Xray', hint: 'config.json', acts: ['block'], why: { direct: SRV_WHY },
    docs: [['Документация Xray: маршрутизация', 'https://xtls.github.io/ru/config/routing.html']] },
  goinst: { side: 's', label: 'goInstaller', hint: 'готовится', acts: ['block'], why: { direct: SRV_WHY }, docs: [] },
};
const st = { lists: ['yandex'], app: 'xray', act: 'direct', dom: true, ip: true, wg: 'compact', xray: 'ext' };
// Время обновления на сервере — случайное, один раз на открытие страницы: чтобы не все
// серверы шли за файлами в одну минуту.
const CRON = { m: Math.floor(Math.random() * 60), h: 4 + Math.floor(Math.random() * 3) };
let stats = null;
let gen = 0;  // номер отрисовки: ответ от прежней не должен лечь в новую

const $ = (id) => document.getElementById(id);
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
function opt(type, name, value, checked, label, hint, onChange, disabled) {
  const i = el('input', { type, name, value });
  i.checked = checked;
  i.disabled = !!disabled;
  i.addEventListener('change', onChange);
  return el('label', { class: 'opt' }, i, el('span', {}, label, hint ? el('small', {}, hint) : null));
}
function copyBtn(label, getValue, cls) {
  const b = el('button', { class: cls || 'copy', type: 'button' }, label);
  b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(await getValue()); b.textContent = 'Скопировано'; }
    catch (e) { b.textContent = 'Не вышло — выделите и скопируйте'; }
    setTimeout(() => { b.textContent = label; }, 2000);
  });
  return b;
}
function code(text, wrapLines) {
  return el('div', { class: 'codebox' }, el('pre', wrapLines ? { class: 'wrap-lines' } : {}, text), copyBtn('Копировать', () => text));
}
// Скачивание: raw.githubusercontent.com — другой адрес, там атрибут download не работает, и
// вместо файла открывался текст. Поэтому файл берём fetch и отдаём как Blob; не вышло — ссылка.
function dl(file, label) {
  const name = file.split('/').pop();
  const a = el('a', { class: 'dl', href: PUB + file, download: name }, label || ('Скачать ' + name));
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
const count = (f) => (stats && stats.files && stats.files[f]) ? stats.files[f].count : null;
const n = (x) => (x == null ? '—' : Number(x).toLocaleString('ru-RU'));
const sel = () => Object.keys(LISTS).filter((k) => st.lists.includes(k));
const combo = () => sel().join('_');
const joinRu = (a) => (a.length < 3 ? a.join(' и ') : a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1]);
const pad2 = (x) => String(x).padStart(2, '0');

// Отрисовка выбора заново пересоздаёт поля — фокус возвращаем на поле с тем же name и value,
// иначе стрелки в группе переключателей уводили его на body.
function render() {
  const a = document.activeElement;
  const keep = a && a.tagName === 'INPUT' && $('cfg').contains(a) ? [a.name, a.value] : null;

  const l = $('lists'); l.replaceChildren();
  for (const [k, v] of Object.entries(LISTS)) {
    const sl = stats && stats.lists && stats.lists[k];
    l.append(opt('checkbox', 'lists', k, st.lists.includes(k), v,
      sl ? n(sl.v4 + sl.v6) + ' сетей и адресов, ' + n(sl.domains) + ' доменов' : null, (e) => {
        st.lists = e.target.checked ? [...new Set([...st.lists, k])] : st.lists.filter((x) => x !== k);
        render();
      }));
  }
  for (const side of ['c', 's']) {
    const box = $('apps-' + side); box.replaceChildren();
    for (const [k, v] of Object.entries(APPS)) {
      if (v.side !== side) continue;
      box.append(opt('radio', 'app', k, st.app === k, v.label, v.hint, () => {
        st.app = k;
        if (!APPS[k].acts.includes(st.act)) st.act = APPS[k].acts[0];
        render();
      }));
    }
  }
  const app = APPS[st.app];
  const ac = $('action'); ac.replaceChildren();
  for (const [k, v] of Object.entries(ACTS)) {
    const ok = app.acts.includes(k);
    ac.append(opt('radio', 'act', k, st.act === k, v.label, ok ? v.hint : app.why[k], () => { st.act = k; render(); }, !ok));
  }
  const x = $('extra'); x.replaceChildren();
  if (['xray', 'mihomo', '3xui', 'xray-s'].includes(st.app)) {
    x.append(opt('checkbox', 'dom', 'dom', st.dom, 'По доменам', 'точнее, нужен sniffing', (e) => { st.dom = e.target.checked; render(); }));
    x.append(opt('checkbox', 'ip', 'ip', st.ip, 'По сетям', 'подключения по адресу', (e) => { st.ip = e.target.checked; render(); }));
  }
  if (st.app === 'xray') {
    x.append(opt('radio', 'xray', 'ext', st.xray === 'ext', 'Файлы geo', 'ext:aegis-*.dat', () => { st.xray = 'ext'; render(); }));
    x.append(opt('radio', 'xray', 'inline', st.xray === 'inline', 'Правило целиком', 'если приложение не берёт свои .dat', () => { st.xray = 'inline'; render(); }));
  }
  if (st.app === 'wg') {
    x.append(opt('radio', 'wg', 'compact', st.wg === 'compact', 'Короткий', 'для телефона', () => { st.wg = 'compact'; render(); }));
    x.append(opt('radio', 'wg', 'full', st.wg === 'full', 'Полный', 'для компьютера и роутера', () => { st.wg = 'full'; render(); }));
  }

  if (keep) {
    const same = [...$('cfg').querySelectorAll('input')].filter((i) => i.name === keep[0]);
    const f = same.find((i) => i.value === keep[1] && !i.disabled) || same.find((i) => i.checked) || same.find((i) => !i.disabled);
    if (f) f.focus();
  }
  renderOut();
}

function steps(...items) { return el('ol', { class: 'steps' }, items.filter(Boolean).map((i) => el('li', {}, i))); }
const note = (...t) => el('div', { class: 'note' }, t);

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
async function inlineXray(box, outbound, my) {
  box.replaceChildren(el('p', { class: 'muted' }, 'Собираю правило из свежих списков…'));
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
      el('p', { class: 'muted' }, 'В правиле ' + n(dom.length) + ' доменов и ' + n(ip.length) + ' сетей. Оно не обновляется само — пересоберите раз в неделю-две.'));
  } catch (e) {
    if (my === gen) box.replaceChildren(note('Не удалось скачать списки. Обновите страницу или возьмите файлы geo.'));
  }
}

// QR — библиотекой qrcode-generator (vendor/, MIT) и своим SVG: только модули, без строк HTML.
function qrSvg(text) {
  const q = qrcode(0, 'L');
  q.addData(text, 'Byte');
  q.make();
  const m = q.getModuleCount(), pad = 4, size = m + pad * 2;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
  svg.setAttribute('class', 'qr');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'QR-код ссылки');
  svg.setAttribute('shape-rendering', 'crispEdges');
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', size); bg.setAttribute('height', size); bg.setAttribute('fill', '#ffffff');
  const d = [];
  for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) if (q.isDark(r, c)) d.push('M' + (c + pad) + ' ' + (r + pad) + 'h1v1h-1z');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d.join(''));
  p.setAttribute('fill', '#000000');
  svg.append(bg, p);
  return svg;
}
function linkBlock(box, url, appName, my) {
  if (my !== gen) return;
  const parts = [el('div', { class: 'btns' },
    el('a', { class: 'dl primary', href: url }, 'Открыть в ' + appName),
    copyBtn('Копировать ссылку', () => url, 'btn'))];
  let qr = null;
  try { qr = typeof qrcode === 'function' ? qrSvg(url) : null; } catch (e) { qr = null; }
  parts.push(qr
    ? el('div', { class: 'qrbox' }, qr, el('p', { class: 'muted' }, 'На другом устройстве: отсканируйте камерой или сканером в ' + appName + '.'))
    : el('p', { class: 'muted' }, 'QR не построился — откройте ссылку или скопируйте её.'));
  parts.push(el('details', {}, el('summary', { class: 'muted' }, 'Ссылка целиком'), el('pre', { class: 'wrap-lines' }, url)));
  box.replaceChildren(...parts);
}
async function happBlock(box, file, my) {
  box.replaceChildren(el('p', { class: 'muted' }, 'Готовлю ссылку…'));
  try {
    const t = await getText(file);
    JSON.parse(t);
    let bin = '';
    for (const b of new TextEncoder().encode(t)) bin += String.fromCharCode(b);
    linkBlock(box, 'happ://routing/onadd/' + btoa(bin), 'Happ', my);
  } catch (e) {
    if (my === gen) box.replaceChildren(note('Не удалось скачать профиль. Обновите страницу.'));
  }
}
function docsLine() {
  const d = APPS[st.app].docs;
  if (!d.length) return null;
  const kids = ['Документация: '];
  d.forEach(([t, h], i) => { if (i) kids.push(' · '); kids.push(link(t, h)); });
  return el('p', { class: 'docs' }, kids);
}
function updater(dir, svc, where) {
  return [
    ['Подключитесь к серверу по SSH, скачайте скрипт обновления (', link('прочитать его', 'https://github.com/anten-ka/aegis/blob/main/scripts/aegis-update.sh'),
      ') и с его помощью — сами списки ' + where + ':',
      code('curl -fsSL -o /usr/local/bin/aegis-update ' + PUB + 'scripts/aegis-update.sh\nchmod 755 /usr/local/bin/aegis-update\naegis-update ' + dir + ' ' + svc),
      el('p', { class: 'muted' }, 'Скрипт сверяет файлы с их SHA-256 и ставит на место, только если скачались целиком; ' +
        svc + ' перезапускает, только когда списки сменились (не перезапустился — повторит в следующий раз). ' +
        'Списки могут меняться почти каждый день — тогда ' + svc + ' перезапускается каждую ночь, и открытые подключения переподключаются.')],
    ['Обновление раз в сутки — строкой в crontab -e (время выбрано случайно, чтобы не все серверы шли за файлами в одну минуту):',
      code(CRON.m + ' ' + CRON.h + ' * * * /usr/local/bin/aegis-update ' + dir + ' ' + svc),
      el('p', { class: 'muted' }, 'Код 1 («SHA-256 не совпал») сразу после публикации — не поломка: GitHub несколько минут отдаёт файлы из кеша ' +
        'и может прислать новый .sha256 со старым файлом. Скрипт тогда ничего не меняет, следующий запуск возьмёт сошедшуюся пару.')],
  ];
}
const ipNote = () => (st.ip
  ? note('Правило по сетям срабатывает на подключения по адресу. Клиенты VPN обычно передают имя сайта; чтобы сверять с сетями и их, ' +
    'поставьте в routing "domainStrategy": "IPIfNonMatch" — тогда Xray сам спрашивает DNS для имён, которых нет в правиле по доменам.')
  : null);

function renderOut() {
  const my = ++gen;
  const o = $('out'); o.replaceChildren();
  if (!st.lists.length) { o.append(note('Выберите хотя бы один список.')); return; }
  if (['xray', 'mihomo', '3xui', 'xray-s'].includes(st.app) && !st.dom && !st.ip) {
    o.append(note('Выберите доменами, сетями или и то и другое.')); return;
  }
  const names = joinRu(sel().map((t) => NOM[t]));
  const namesGen = joinRu(sel().map((t) => GEN[t]));
  const Names = names.charAt(0).toUpperCase() + names.slice(1);
  const direct = st.act === 'direct';
  const outcome = direct ? Names + ' пойдут мимо VPN и не увидят его адрес.'
    : Names + ' не откроются на этом устройстве вовсе — ни через VPN, ни мимо.';
  const srs = (t) => [PUB + 'sing-box/geosite-aegis-' + t + '.srs', PUB + 'sing-box/geoip-aegis-' + t + '.srs'];
  const replaceWarn = (what) => note('Импорт заменит вашу текущую ' + what + '. Если у вас уже есть свой профиль (например, от провайдера VPN), ' +
    'он перестанет быть активным — вернуть его можно в списке профилей приложения.');

  switch (st.app) {
    case 'xray': {
      const ob = direct ? 'direct' : 'block';
      if (st.xray === 'ext') {
        o.append(steps(
          ['Скачайте файлы и положите их в каталог ресурсов Xray — там он ищет файлы из ext: (документация Xray):',
            el('div', { class: 'btns' }, st.ip ? dl('xray/aegis-ip.dat') : null, st.dom ? dl('xray/aegis-site.dat') : null),
            el('p', { class: 'muted' }, 'v2rayN — папка bin рядом с программой. v2rayNG — экран «Файлы ресурсов» → «Добавить URL»: в «Название» — ' +
              'точное имя файла (aegis-ip.dat, aegis-site.dat), в URL — ссылка на файл, затем «Загрузить файлы».')],
          ['Добавьте правило маршрутизации ' + (direct ? 'с выходом напрямую (direct)' : 'с выходом-заглушкой (blackhole; в v2rayN и v2rayNG его тег — block)') +
            ' и поставьте его выше правила «всё в прокси»:', code(xrayRules(ob))],
          ['Раз в неделю-две скачивайте файлы заново (в v2rayNG — снова «Загрузить файлы»): списки обновляются каждый день.'],
        ));
      } else {
        const box = el('div', {});
        o.append(steps(['Вставьте правило в маршрутизацию приложения, выше правила «всё в прокси»' +
          (direct ? '' : ' (тег выхода-заглушки — как в вашем приложении; в v2rayN и v2rayNG — block)') + ':', box]));
        inlineXray(box, ob, my);
      }
      o.append(note(outcome));
      if (st.ip) o.append(note('Правило по сетям ловит подключения по имени, только если стратегия домена (domainStrategy) — IPOnDemand или IPIfNonMatch; ' +
        'при AsIs — только подключения по адресу. При IPIfNonMatch DNS спрашивается, только если ни одно правило не сработало; правило «всё в прокси» ' +
        'без условий срабатывает раньше — тогда нужен IPOnDemand (документация Xray).'));
      o.append(el('p', { class: 'muted' }, 'Правило и каталог ресурсов — по документации Xray, тег block в v2rayN — по его вики. Где каталог ресурсов ' +
        'в v2rayN и v2rayNG и тег block в v2rayNG — по их коду (', link('v2rayN', SRC.v2rayNBin), ', ', link('v2rayNG', SRC.v2rayNGAsset), ', ',
        link('тег', SRC.v2rayNGTag), '); на устройстве мы это не проверяли.'));
      break;
    }
    case 'mihomo': {
      const act = direct ? 'DIRECT' : 'REJECT';
      o.append(steps(
        ['Добавьте в конфигурацию (если rule-providers уже есть — допишите внутрь):', code(mihomoYaml(act))],
        ['Правила RULE-SET поставьте выше общего правила, которое отправляет всё в VPN. Списки обновятся сами раз в сутки (interval).'],
      ), note(outcome));
      if (st.ip) o.append(note('С no-resolve правило по сетям ловит только подключения по адресу, имена ловит правило по доменам. ' +
        'Уберите no-resolve, если mihomo должен сверять с сетями и адреса имён (ценой DNS-запроса).'));
      break;
    }
    case 'happ': {
      const box = el('div', {});
      o.append(replaceWarn('активную маршрутизацию Happ (профиль маршрутизации активен только один)'),
        steps(['Откройте ссылку на телефоне с Happ или отсканируйте QR:', box],
          ['Happ скачает наши geo-файлы и включит профиль Aegis. Когда Happ берёт свежие файлы, две страницы его документации говорят по-разному: ' +
            'английская — не чаще раза в неделю, даже если профиль обновляется каждый час; русская — когда в профиле новая дата LastUpdated ' +
            '(у нас она меняется вместе с файлами). Чтобы взять свежие раньше, откройте ссылку снова — это мы не проверяли.']),
        note(outcome),
        el('p', { class: 'muted' }, 'Профиль собран по документации Happ. Что Happ принимает свои теги в чужих geo-файлах (geosite:' + sel()[0] +
          '), подтверждено только опытом сообщества — на устройстве мы это не проверяли.'));
      happBlock(box, 'happ/' + combo() + '-' + st.act + '.json', my);
      break;
    }
    case 'incy': {
      const box = el('div', {});
      o.append(replaceWarn('активную маршрутизацию INCY'),
        steps(['Откройте ссылку на телефоне с INCY или отсканируйте QR:', box],
          ['INCY сам проверяет профиль по ссылке (по умолчанию раз в сутки) и берёт новые списки, когда они меняются.']),
        note(outcome),
        el('p', { class: 'muted' }, 'Ссылка и профиль — по документации INCY. На устройстве мы это не проверяли.'));
      linkBlock(box, 'incy://autorouting/onadd/' + PUB + 'happ/' + combo() + '-' + st.act + '.json', 'INCY', my);
      break;
    }
    case 'hiddify': {
      const urls = sel().flatMap(srs);
      o.append(steps(
        ['Нужен Hiddify 5.2.0 или новее. Откройте Настройки → Маршрутизация (Routing) и добавьте правило.'],
        ['Выход (outbound): ' + (direct ? 'Direct' : 'Block') + '. В поле Rule-set добавьте ссылки:', code(urls.join('\n'))],
        ['Правило поставьте выше остальных. Списки Hiddify обновляет сам (по коду приложения — раз в 5 дней).'],
      ), note(outcome),
      el('p', { class: 'muted' }, 'Отдельной страницы о правилах у Hiddify нет: шаги — по коду приложения и истории версий. На устройстве мы это не проверяли.'));
      break;
    }
    case 'karing': {
      const urls = sel().flatMap(srs);
      o.append(steps(
        ['Настройки → Diversion → Diversion rules → Edit → Custom diversion group → «+» справа вверху, имя — Aegis.'],
        ['Откройте группу Aegis и в поле Rule Set вставьте ссылки:', code(urls.join('\n'))],
        ['Вернитесь на первый экран Diversion rules, у группы Aegis выберите действие ' + (direct ? 'Direct (напрямую)' : 'Block (блокировать)') +
          ' и переподключитесь.'],
      ), note(outcome),
      el('p', { class: 'muted' }, 'Путь, поле Rule Set (ссылка кончается именем файла .srs) и действия Direct и Block — по документации Karing. ' +
        'По коду Karing, не проверено: несколько ссылок — по одной в строке (', link('код', SRC.karingLines), '), правила обновляются по умолчанию ' +
        'раз в 24 часа (', link('код', SRC.karingDay), '). Где группа стоит среди других правил, документация не говорит; на устройстве мы это не проверяли.'));
      break;
    }
    case 'shadowrocket': {
      const pol = direct ? 'DIRECT' : 'REJECT';
      const lines = sel().map((t) => 'RULE-SET,' + PUB + 'shadowrocket/' + t + '.list,' + pol);
      o.append(note('По руководству сообщества, официальной документации нет; не проверено на iPhone.'),
        steps(
          ['Конфигурация → ⓘ у активного файла → Правило → «+» → тип RULE-SET, политика ' + pol + ', в URL — ссылка (для каждого списка):',
            code(sel().map((t) => PUB + 'shadowrocket/' + t + '.list').join('\n'))],
          ['Или допишите строки в раздел [Rule] файла конфигурации, выше FINAL:', code(lines.join('\n'))],
          ['Правила поставьте выше общих. Обновление списков — в настройках обновления конфигурации.'],
        ), note(outcome));
      break;
    }
    case 'amnezia':
      o.append(steps(
        ['Скачайте список:', el('div', { class: 'btns' }, sel().map((t) => dl('amnezia/' + t + '.json')))],
        ['В AmneziaVPN откройте раздельное туннелирование сайтов и выберите режим «Адреса из списка не должны открываться через VPN».'],
        ['Импортируйте файл' + (sel().length > 1 ? 'ы по очереди (меню ⋮), добавляя к списку' : ' (меню ⋮)') + '.'],
        ['Список сам не обновляется — раз в неделю-две импортируйте свежий. В файле только адреса IPv4.'],
      ), note(outcome));
      break;
    case 'wg': {
      const f = 'wireguard/' + combo() + '-allowedips-' + st.wg + '.txt';
      const c = count(f);
      o.append(steps(
        ['Откройте файл конфигурации (.conf) и найдите в разделе [Peer] строку AllowedIPs.'],
        ['Замените её строкой из файла' + (c ? ' (записей: ' + n(c) + ')' : '') + ':',
          el('div', { class: 'btns' }, dl(f), copyBtn('Копировать строку', () => getText(f), 'primary'))],
        ['Сохраните и переподключитесь. Подходит и для AmneziaWG: строка та же.'],
        ['Linux (wg-quick) и роутер: в строке есть и адрес вашего VPN-сервера, а wg-quick ведёт каждую её запись (кроме 0.0.0.0/0 и ::/0) ' +
          'в туннель — до сервера пакеты тоже уйдут в туннель, и соединение не поднимется. Добавьте до сервера маршрут мимо туннеля ' +
          'в раздел [Interface] (шлюз и сетевая карта — из ip route show default):',
          code('PostUp = ip route add <адрес сервера>/32 via <шлюз> dev <сетевая карта>\nPostDown = ip route del <адрес сервера>/32', true),
          el('p', { class: 'muted' }, 'По документации и коду wg-quick (ссылки ниже). На роутере — то же его средствами. ' +
            'Прошивки роутеров, Windows и приложения на телефоне мы не проверяли.')],
      ), note('У WireGuard нет правил «не пускать»: строка — это «весь интернет, кроме ' + namesGen + ' и домашней сети». ' +
        (st.wg === 'full' ? 'Полный вариант — до десятков тысяч записей, на телефоне может тормозить.'
          : 'Короткий вариант не трогает адреса сервисов в облаках — только их собственные сети.')));
      break;
    }
    case '3xui':
      o.append(steps(
        ...updater('/usr/local/x-ui/bin', 'x-ui', 'в папку Xray панели').slice(0, 1),
        ['В панели откройте настройки Xray, вкладку правил маршрутизации, и добавьте правило. ',
          st.dom ? ['Домены: ', el('code', {}, sel().map((t) => 'ext:aegis-site.dat:' + t).join(',')), '. '] : '',
          st.ip ? ['IP: ', el('code', {}, sel().map((t) => 'ext:aegis-ip.dat:' + t).join(',')), '. '] : '',
          'Исходящее (Outbound Tag): ', el('code', {}, 'blocked'), '. Поставьте правило выше остальных, сохраните и перезапустите Xray.',
          el('p', { class: 'muted' }, 'То же в шаблоне конфигурации, в routing.rules:'), code(xrayRules('blocked'))],
        st.dom ? ['Во входящих подключениях включите Sniffing (http, tls, quic) — без него правило по доменам не сработает.'] : null,
        ...updater('/usr/local/x-ui/bin', 'x-ui', '').slice(1),
      ), ipNote(), note('Клиенты VPN не откроют ' + names + ' через этот сервер.'), realityNote());
      break;
    case 'xray-s':
      o.append(steps(
        ...updater('/usr/local/share/xray', 'xray', 'туда, где Xray берёт geoip.dat и geosite.dat (обычно /usr/local/share/xray; если у вас иначе — поменяйте путь)').slice(0, 1),
        ['Добавьте в outbounds выход-заглушку, если его нет:', code('{ "protocol": "blackhole", "tag": "blocked" }')],
        ['Добавьте правила в начало routing.rules:', code(xrayRules('blocked'))],
        st.dom ? ['Во входящих включите определение адреса: "sniffing": { "enabled": true, "destOverride": ["http", "tls", "quic"] }.'] : null,
        ...updater('/usr/local/share/xray', 'xray', '').slice(1),
      ), ipNote(), note('Клиенты VPN не откроют ' + names + ' через этот сервер.'), realityNote());
      break;
    case 'goinst':
      o.append(note('Готовится: в меню goInstaller → «Защита» появятся переключатели «Яндекс», «Российские сервисы» и «ВК», по умолчанию выключенные. ' +
        'Пока можно настроить Xray или 3X-UI на сервере — выберите их выше.'));
      break;
  }
  const d = docsLine();
  if (d) o.append(d);
}
function realityNote() {
  return el('p', { class: 'muted' }, 'Reality: маскировочный сайт (dest) Xray открывает сам, мимо правил маршрутизации, — правило выше его не трогает ' +
    '(по устройству Xray; на живом сервере мы это не проверяли). А вот закрывать эти сети файрволом сервера нельзя, если сервер маскируется под сайт из списка: ' +
    'тогда Reality перестанет работать у всех.');
}

function renderStats() {
  const meta = $('meta'); meta.replaceChildren();
  const t = $('stats');
  if (!stats) {
    meta.append(el('span', { class: 'pill' }, 'Сведения о списках не загрузились — файлы при этом доступны.'));
    t.replaceChildren(el('tbody', {}, el('tr', {}, el('td', { class: 'muted' }, 'Нет данных.'))));
    return;
  }
  const d = new Date(stats.generated * 1000);
  meta.append(el('span', { class: 'pill' }, 'Обновлено ', el('b', {}, d.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' }))));
  meta.append(el('span', { class: 'pill' }, 'Обновляется ', el('b', {}, 'раз в сутки')));
  const rows = [['', 'Своих сетей целиком', 'Адресов точечно', 'Строк IPv4', 'Строк IPv6', 'Доменов']];
  for (const [k, v] of Object.entries(stats.lists)) rows.push([v.title, v.whole, v.point, v.v4, v.v6, v.domains]);
  t.replaceChildren(
    el('thead', {}, el('tr', {}, rows[0].map((h) => el('th', {}, h)))),
    el('tbody', {}, rows.slice(1).map((r) => el('tr', {}, r.map((c, i) => el('td', i ? { class: 'n' } : {}, i ? n(c) : c))))));
}

render();
fetch(RAW + 'stats.json', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => { stats = j && j.format === 1 ? j : null; renderStats(); renderOut(); refreshCounts(); renderListsNote(); })
  .catch(() => { stats = null; renderStats(); });
// Сайты «ВК», которые не порталы VK, — из stats.json (lists.vk.outside): текст не отстанет от сборки.
function renderListsNote() {
  const out = stats && stats.lists && stats.lists.vk && stats.lists.vk.outside;
  // Старый stats.json (без поля) — остаётся текст из index.html; пустой список — строки нет.
  if (!Array.isArray(out)) return;
  const names = out.filter((x) => typeof x === 'string' && /^[a-z0-9@._*-]{1,80}$/.test(x));
  if (!names.length) { $('lists-note').hidden = !out.length; return; }
  $('lists-note').hidden = false;
  $('lists-note').textContent = 'В списке «ВК» есть и сайты, которые не порталы VK: ' + joinRu(names) +
    '. «ВК — блокировать» закроет и их.';
}
// Подписи с числами у списков — без пересоздания полей, чтобы не трогать фокус.
function refreshCounts() {
  for (const i of $('lists').querySelectorAll('input')) {
    const sl = stats && stats.lists && stats.lists[i.value];
    if (!sl) continue;
    const span = i.nextElementSibling;
    let s = span.querySelector('small');
    if (!s) { s = el('small', {}); span.append(s); }
    s.textContent = n(sl.v4 + sl.v6) + ' сетей и адресов, ' + n(sl.domains) + ' доменов';
  }
}
