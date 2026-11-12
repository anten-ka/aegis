"""Aegis: сборка списков «Яндекс», «Другие сервисы рунета» и «ВК».

python3 -I, только стандартная библиотека — тот же стек, что у защиты goInstaller.
Адреса и домены — russia.iplist.opencck.org (скачивает build.sh), владелец каждого
адреса — RIPEstat. Правила (rules/asn-classes.tsv):
  own   — сеть принадлежит самому сервису: все объявленные сети этой AS целиком;
  isp, cloud, чужая own — только сам адрес (/32, /128);
  cdn   — общий узел: не закрываем;
  нет в таблице, не объявлена — не закрываем, в отчёт.

usage: python3 -I build.py <in_dir> <classes.tsv> <prev_dir> <out_dir>
  in_dir: site-ip4.txt site-ip6.txt site-domains.txt (строки «группа сайт адрес»),
          never4.txt never6.txt (сети, которые не закрываем никогда), never-note (если есть)
  AEGIS_NEW_MAX — сколько новых блоков разрешить за эту сборку (ручной запуск, README).
Код выхода: 0 — списки собраны и прошли проверки, 1 — не публиковать.
"""
import collections
import datetime
import hashlib
import ipaddress as ia
import json
import os
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

LISTS = {'yandex': 'Яндекс', 'russia': 'Другие сервисы рунета', 'vk': 'ВК'}
# Код списка в .dat (Xray сверяет без учёта регистра), имя файлов и имя в профиле Happ.
TAGS = {'yandex': 'YANDEX', 'russia': 'RU-SERVICES', 'vk': 'VK'}
FILE = {'yandex': 'yandex', 'russia': 'ru-services', 'vk': 'vk'}
NAME_EN = {'yandex': 'Yandex', 'russia': 'RU services', 'vk': 'VK'}
PUB = 'https://raw.githubusercontent.com/anten-ka/aegis/main/'
RIPE = 'https://stat.ripe.net/data/%s/data.json?resource=%s&sourceapp=goinstaller-shield'
CACHE_DAYS = 7
EMPTY_DAYS = 1          # пустой ответ network-info переспрашиваем через сутки, а не через неделю
ANN_DAYS = 2            # announced-prefixes: окно двое суток, берём только объявленное сейчас
OWN_STALE_DAYS = 14     # сети своей AS из прошлой сборки годятся две недели, дальше — стоп
SEEN_DAYS = 30          # блок, которого нет на сайте дольше месяца, уходит из кеша
REFRESH_MAX = 600
NEW_MAX = 500           # новых блоков /24 (/48) за сборку: больше — RIPE не спрашиваем, стоп
NEW_FIRST = 8000        # то же для первой сборки, когда кеша нет
PAR = 6
TRIES = 4
# Потолки — те же, что у защиты на сервере (SHIELD_MAX4/6): что опубликовали, то сервер примет.
MAX4_24 = 16384
MAX6_48 = 16777216
FLOOR4_24 = 1024
LINES_FLOOR = {4: 500, 6: 200}   # рост строк считаем от max(прошлое, это)
LINES_SHRINK_MIN = 20            # падение вдвое считаем, когда строк было хотя бы столько
POINT_MAX = 20000                # адресов точечно в одном списке
WG_MAX = 60000                   # записей в одной строке AllowedIPs
DOM_MIN, DOM_FLOOR, DOM_MAX = 20, 100, 20000
NEW_BASES_MAX = 50               # новых доменов второго уровня в списке за сборку
NAME = re.compile(r'^[a-z0-9@._*-]{1,80}$')
STAT = {'calls': 0, 'errors': 0}


def now():
    return int(time.time())


def ripe(call, res):
    """data из ответа RIPEstat или None. Ответ без status=ok — тоже ошибка."""
    url = RIPE % (call, res)
    if call == 'announced-prefixes':
        url += '&starttime=%d' % (now() - ANN_DAYS * 86400)
    for i in range(TRIES):
        STAT['calls'] += 1
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                j = json.load(r)
            if j.get('status') == 'ok' and isinstance(j.get('data'), dict):
                return j['data']
        except Exception:  # noqa: BLE001 — сеть или кривой ответ, повтор
            pass
        if i < TRIES - 1:
            time.sleep(2 * 2 ** i)
    STAT['errors'] += 1
    return None


def key_of(a):
    return str(ia.ip_network('%s/%d' % (a, 24 if a.version == 4 else 48), strict=False))


def load_site(path):
    rows = []
    for ln in open(path, encoding='utf-8'):
        f = ln.split()
        if len(f) != 3 or f[0] not in LISTS or not NAME.match(f[1]):
            continue
        try:
            a = ia.ip_address(f[2])
        except ValueError:
            continue
        rows.append((f[0], f[1], a))
    return rows


def load_classes(path):
    cls = {}
    for ln in open(path, encoding='utf-8'):
        if ln.startswith('#') or not ln.strip():
            continue
        f = ln.rstrip('\n').split('\t') + ['', '', '']
        cls[f[0]] = {'class': f[1], 'owner': f[2], 'svc': f[3].split()}
    return cls


def svc_ok(site, pats):
    return any(site == p or (p.endswith('@*') and site.startswith(p[:-1])) for p in pats)


def clean_holder(s):
    """Имя владельца AS пишет сам владелец: в Markdown панели — только простой текст."""
    return re.sub(r'\s+', ' ', re.sub(r"[^\w .,()&'/-]", ' ', s or '?')).strip()[:80] or '?'


def md(s):
    return re.sub(r'([\\`*_\[\]<>|])', r'\\\1', s)


def load_cache(prev):
    c, h = {}, {}
    try:
        for ln in open(os.path.join(prev, 'cache', 'ripe-nets.tsv'), encoding='utf-8'):
            k, p, asn, t = ln.rstrip('\n').split('\t')
            c[k] = (p, asn, int(t))
        for ln in open(os.path.join(prev, 'cache', 'ripe-as.tsv'), encoding='utf-8'):
            asn, t, hold = ln.rstrip('\n').split('\t', 2)
            h[asn] = (clean_holder(hold), int(t))
    except (OSError, ValueError):
        pass
    return c, h


def load_seen(prev, cache):
    """cache/ripe-seen.tsv: «блок, когда он последний раз был на сайте». Отдельный файл,
    а не пятая колонка ripe-nets.tsv: прежний build.py читает кеш как раньше.
    Записи нет (кеш прежней версии) — берём время ответа RIPE."""
    seen = {}
    try:
        for ln in open(os.path.join(prev, 'cache', 'ripe-seen.tsv'), encoding='utf-8'):
            f = ln.rstrip('\n').split('\t')
            if len(f) == 2 and re.fullmatch(r'[0-9]{1,11}', f[1]):
                seen[f[0]] = int(f[1])
    except OSError:
        pass
    return {k: seen.get(k, v[2]) for k, v in cache.items()}


def load_own_cache(prev):
    """cache/ripe-own.tsv: «AS, время, сети через пробел» — запас на случай, если RIPE не ответит."""
    own = {}
    try:
        for ln in open(os.path.join(prev, 'cache', 'ripe-own.tsv'), encoding='utf-8'):
            asn, t, nets = ln.rstrip('\n').split('\t')
            own[asn] = (int(t), [ia.ip_network(x) for x in nets.split()])
    except (OSError, ValueError):
        pass
    return own


def live_prefixes(d):
    """Сети, которые AS объявляет сейчас: последняя отметка совпадает с концом окна запроса.
    Объявленное час назад и снятое (утечка маршрута, ошибка) — не берём."""
    if not isinstance(d, dict) or not d.get('query_endtime'):
        return []
    out = set()
    for x in d.get('prefixes') or []:
        try:
            last = max(t['endtime'] for t in x['timelines'])
            n = ia.ip_network(x['prefix'])
        except (KeyError, TypeError, ValueError):
            continue
        if last == d['query_endtime']:
            out.add(n)
    return sorted(out, key=lambda n: (n.version, n))


def load_prev_list(prev, name):
    out = []
    try:
        for ln in open(os.path.join(prev, 'lists', name), encoding='utf-8'):
            ln = ln.strip()
            if ln and not ln.startswith('#'):
                out.append(ia.ip_network(ln))
    except (OSError, ValueError):
        return None
    return out


def load_prev_domains(prev, f):
    try:
        lines = open(os.path.join(prev, 'mihomo', '%s-domain.txt' % f), encoding='utf-8').read().split()
    except OSError:
        return None
    return {x[2:] for x in lines if x.startswith('+.')}


def units(nets, v):
    s = 24 if v == 4 else 48
    return sum(n.num_addresses for n in nets if n.version == v) >> ((32 if v == 4 else 128) - s)


def bar(n, total, width=24):
    if total <= 0:
        return ''
    k = round(width * n / total)
    return '█' * k + '░' * (width - k)


def day(t):
    return datetime.datetime.fromtimestamp(t, datetime.timezone.utc).strftime('%d.%m')


# ---------------------------------------------------------------- выгрузки для ядер
# Xray: geoip.dat / geosite.dat — protobuf из app/router/config.proto
# (GeoIPList{1: GeoIP{1: код, 2: CIDR{1: байты адреса, 2: префикс}}},
#  GeoSiteList{1: GeoSite{1: код, 2: Domain{1: тип (2 — домен с поддоменами), 2: имя}}}).
# Сверено с geoip/geosite самого сайта (protoc --decode_raw).
HOST = re.compile(r'^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$')
# Общие чужие домены в списках сервисов (трекеры, облака): по имени их не закрываем.
SHARED = re.compile(r'(^|\.)(google\w*|gstatic|doubleclick|youtube|ytimg|cloudflare\w*|cloudfront|akamai\w*|'
                    r'amazonaws|apple|icloud|microsoft|azure\w*|windows|live|facebook|fbcdn|instagram|whatsapp|'
                    r'adjust|criteo|appsflyer|branch|firebase\w*|sentry|github\w*|jsdelivr|fastly\w*|bunny\w*|'
                    r'gcore\w*|edgekey|edgesuite|telegram|t)\.(com|net|org|io|me|co|app)$|'
                    # облака с чужими сайтами внутри: хранилище Yandex Cloud, службы телефонов Huawei
                    r'(^|\.)(yandexcloud\.(net|kz)|dbankcloud\.(com|cn|ru)|hicloud\.com|huawei\w*\.com)$')
# Зоны, под которыми живут чужие сайты. Само такое имя в список не берём: «+.com.ru» закрыл бы
# все сайты в com.ru. Имена ниже зоны (company.msk.ru) — обычные сайты, их берём.
# .ru и .su — все записи publicsuffix.org (12.11.2026); прочие страны — общее правило SLD ниже.
RU_ZONES = frozenset('''
ac.ru edu.ru gov.ru int.ru mil.ru test.ru com.ru net.ru org.ru pp.ru ras.ru eurodir.ru
adygeya.ru bashkiria.ru bir.ru cbg.ru dagestan.ru grozny.ru kalmykia.ru kustanai.ru marine.ru
mordovia.ru msk.ru mytis.ru nalchik.ru nov.ru pyatigorsk.ru spb.ru vladikavkaz.ru vladimir.ru
na4u.ru mircloud.ru myjino.ru mcdir.ru vps.mcdir.ru mcpre.ru hb.cldmail.ru
abkhazia.su adygeya.su aktyubinsk.su arkhangelsk.su armenia.su ashgabad.su azerbaijan.su
balashov.su bashkiria.su bryansk.su bukhara.su chimkent.su dagestan.su east-kazakhstan.su exnet.su
georgia.su grozny.su ivanovo.su jambyl.su kalmykia.su kaluga.su karacol.su karaganda.su karelia.su
khakassia.su krasnodar.su kurgan.su kustanai.su lenug.su mangyshlak.su mordovia.su msk.su
murmansk.su nalchik.su navoi.su north-kazakhstan.su nov.su obninsk.su penza.su pokrovsk.su
sochi.su spb.su tashkent.su termez.su togliatti.su troitsk.su tselinograd.su tula.su tuva.su
vladikavkaz.su vladimir.su vologda.su
'''.split())
# *.hosting.myjino.ru и т. п. в publicsuffix — каждое имя на уровень ниже тоже зона.
WILD_ZONES = frozenset('hosting.myjino.ru landing.myjino.ru spectrum.myjino.ru vps.myjino.ru'.split())
# Второй уровень других стран: com.tr, co.uk, gov.by, or.jp — двухуровневое имя с такой меткой не берём.
SLD = frozenset('ac co com edu gov gob gouv int mil net nom org or ne go pp ltd plc sch gen'.split())
# Площадки, где под одним именем тысячи чужих сайтов.
HOSTING = frozenset('''
narod.ru ucoz.ru ucoz.net ucoz.com ucoz.org mybb.ru tilda.ws wixsite.com blogspot.com wordpress.com
netlify.app vercel.app pages.dev workers.dev web.app appspot.com herokuapp.com
'''.split())


def zone_refused(d):
    lab = d.split('.')
    return (d in RU_ZONES or d in HOSTING or '.'.join(lab[1:]) in WILD_ZONES or
            (len(lab) == 2 and lab[0] in SLD))


def base_of(d):
    """Домен второго уровня (или третьего под зоной из списков выше): yandex.com.tr, firm.msk.ru."""
    lab = d.split('.')
    k = 3 if len(lab) >= 3 and ('.'.join(lab[-2:]) in RU_ZONES or lab[-2] in SLD) else 2
    return '.'.join(lab[-k:])


def pb_varint(n):
    b = bytearray()
    while True:
        x = n & 0x7f
        n >>= 7
        b.append(x | (0x80 if n else 0))
        if not n:
            return bytes(b)


def pb_len(field, data):
    return pb_varint(field << 3 | 2) + pb_varint(len(data)) + data


def pb_int(field, n):
    return pb_varint(field << 3) + pb_varint(n)


def xray_geoip(lists):
    out = []
    for g, nets in lists.items():
        body = [pb_len(1, TAGS[g].encode())]
        for n in nets:
            body.append(pb_len(2, pb_len(1, n.network_address.packed) + pb_int(2, n.prefixlen)))
        out.append(pb_len(1, b''.join(body)))
    return b''.join(out)


def xray_geosite(doms):
    out = []
    for g, names in doms.items():
        body = [pb_len(1, TAGS[g].encode())]
        for d in names:
            body.append(pb_len(2, pb_int(1, 2) + pb_len(2, d.encode())))
        out.append(pb_len(1, b''.join(body)))
    return b''.join(out)


def complement(excl, full):
    """full без всех сетей excl. Один проход по отсортированным сетям: время линейное
    (прежний перебор address_exclude на 5 тыс. разрозненных адресов шёл две минуты)."""
    addr = ia.IPv4Address if full.version == 4 else ia.IPv6Address
    cur, end = int(full.network_address), int(full.broadcast_address)
    out = []
    for e in sorted(ia.collapse_addresses(x for x in excl if x.version == full.version)):
        a, b = int(e.network_address), int(e.broadcast_address)
        if b < cur or a > end:
            continue
        if a > cur:
            out.extend(ia.summarize_address_range(addr(cur), addr(a - 1)))
        cur = b + 1
        if cur > end:
            return out
    out.extend(ia.summarize_address_range(addr(cur), addr(end)))
    return out


LAN4 = [ia.ip_network(x) for x in ('0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16',
                                     '172.16.0.0/12', '192.168.0.0/16', '224.0.0.0/3')]
LAN6 = [ia.ip_network(x) for x in ('::1/128', 'fc00::/7', 'fe80::/10', 'ff00::/8')]
# Частные сети в профиле Happ — как в профиле по умолчанию из документации Happ.
HAPP_LAN = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16', '224.0.0.0/4', '255.255.255.255']


def allowed_ips(nets):
    v4 = complement([n for n in nets if n.version == 4] + LAN4, ia.ip_network('0.0.0.0/0'))
    v6 = complement([n for n in nets if n.version == 6] + LAN6, ia.ip_network('::/0'))
    return v4 + v6


def combos():
    """Все наборы списков в порядке LISTS: yandex, ru-services, vk, yandex_ru-services, …"""
    gs = list(LISTS)
    out = []
    for size in range(1, len(gs) + 1):
        for mask in range(1, 1 << len(gs)):
            c = [g for i, g in enumerate(gs) if mask >> i & 1]
            if len(c) == size:
                out.append(c)
    return out


def combo_name(c):
    return '_'.join(FILE[g] for g in c)


def load_domains(path, never_names):
    doms = {g: set() for g in LISTS}
    shared = set()
    refused = {g: set() for g in LISTS}
    sites = {g: set() for g in LISTS}     # сайты, чьи домены вошли в список
    try:
        lines = open(path, encoding='utf-8').read().split('\n')
    except OSError:
        lines = []
    for ln in lines:
        f = ln.split()
        if len(f) != 3 or f[0] not in LISTS:
            continue
        d = f[2].lower().rstrip('.')
        if not HOST.match(d):
            continue
        if zone_refused(d):
            refused[f[0]].add(d)
            continue
        if SHARED.search(d) or any(d == x or d.endswith('.' + x) for x in never_names):
            shared.add(d)
            continue
        doms[f[0]].add(d)
        if NAME.match(f[1]):
            sites[f[0]].add(f[1])
    out = {}
    for g, s in doms.items():  # домен идёт с поддоменами: дочернее имя при родителе лишнее
        keep = []
        for d in s:
            parts = d.split('.')
            if not any('.'.join(parts[i:]) in s for i in range(1, len(parts) - 1)):
                keep.append(d)
        out[g] = sorted(keep)
    return out, shared, refused, sites


def happ_profile(c, action, stamp):
    """Профиль маршрутизации Happ и INCY (поля — по документации Happ, dev-docs/routing).
    Теги — из наших .dat (Geoipurl/Geositeurl); частные сети — адресами, как в профиле по умолчанию."""
    sites = ['geosite:%s' % FILE[g] for g in c]
    ips = ['geoip:%s' % FILE[g] for g in c]
    d = action == 'direct'
    return {
        'Name': 'Aegis: %s (%s)' % (' + '.join(NAME_EN[g] for g in c), action),
        'GlobalProxy': 'true',
        'Geoipurl': PUB + 'xray/aegis-ip.dat',
        'Geositeurl': PUB + 'xray/aegis-site.dat',
        'LastUpdated': stamp,
        'DnsHosts': {},
        'DirectSites': sites if d else [],
        'DirectIp': (ips if d else []) + HAPP_LAN,
        'ProxySites': [],
        'ProxyIp': [],
        'BlockSites': [] if d else sites,
        'BlockIp': [] if d else ips,
        'DomainStrategy': 'IPIfNonMatch',
        'FakeDNS': 'false',
    }


def geo_stamp(prev, shas, gen):
    """LastUpdated профилей Happ — когда .dat менялись в последний раз: Happ и INCY по нему
    перекачивают файлы, и без изменений качать незачем."""
    try:
        for f, h in shas.items():
            if open(os.path.join(prev, 'xray', f + '.sha256'), encoding='ascii').read().strip() != h:
                return str(gen)
        t = json.load(open(os.path.join(prev, 'happ', 'yandex-direct.json'), encoding='utf-8'))['LastUpdated']
        if isinstance(t, str) and re.fullmatch(r'[0-9]{9,11}', t):
            return t
    except (OSError, ValueError, KeyError, TypeError):
        pass
    return str(gen)


def export_cores(out, entries, doms, prev, gen):
    files = []

    def put(rel, data, count, core, listed=True):
        p = os.path.join(out, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        mode = 'wb' if isinstance(data, bytes) else 'w'
        with open(p, mode, **({} if mode == 'wb' else {'encoding': 'utf-8'})) as fh:
            fh.write(data)
        if listed:
            files.append((core, rel, count, os.path.getsize(p)))

    nets = {g: sorted(ia.collapse_addresses(n for n in entries[g] if n.version == 4)) +
            sorted(ia.collapse_addresses(n for n in entries[g] if n.version == 6)) for g in LISTS}
    shas = {}
    for f, data, cnt in (('aegis-ip.dat', xray_geoip(nets), sum(map(len, nets.values()))),
                         ('aegis-site.dat', xray_geosite(doms), sum(map(len, doms.values())))):
        put('xray/' + f, data, cnt, 'Xray')
        shas[f] = hashlib.sha256(data).hexdigest()
        # 64 знака без перевода строки: так ждёт INCY (и скрипт обновления на сервере).
        put('xray/%s.sha256' % f, shas[f], 1, 'Xray', listed=False)
    for g in LISTS:
        f = FILE[g]
        put('mihomo/%s-ip.txt' % f, ''.join('%s\n' % n for n in nets[g]), len(nets[g]), 'mihomo')
        put('mihomo/%s-domain.txt' % f, ''.join('+.%s\n' % d for d in doms[g]), len(doms[g]), 'mihomo')
        v4 = [n for n in nets[g] if n.version == 4]
        put('amnezia/%s.json' % f, json.dumps([{'hostname': str(n), 'ip': ''} for n in v4], indent=1) + '\n',
            len(v4), 'AmneziaVPN')
        put('sing-box/geosite-aegis-%s.json' % f,
            json.dumps({'version': 2, 'rules': [{'domain_suffix': doms[g]}]}, indent=1) + '\n',
            len(doms[g]), 'sing-box')
        put('sing-box/geoip-aegis-%s.json' % f,
            json.dumps({'version': 2, 'rules': [{'ip_cidr': [str(n) for n in nets[g]]}]}, indent=1) + '\n',
            len(nets[g]), 'sing-box')
        put('shadowrocket/%s.list' % f,
            '# Aegis: %s — https://github.com/anten-ka/aegis\n' % LISTS[g] +
            ''.join('DOMAIN-SUFFIX,%s\n' % d for d in doms[g]) +
            ''.join('IP-CIDR,%s,no-resolve\n' % n for n in nets[g]),
            len(doms[g]) + len(nets[g]), 'Shadowrocket')
    # WireGuard: одна строка AllowedIPs на туннель — каждый набор списков отдельным файлом.
    # Happ и INCY: один активный профиль — тоже на каждый набор, «напрямую» и «блокировать».
    stamp = geo_stamp(prev, shas, gen)
    for c in combos():
        name = combo_name(c)
        own = [n for g in c for n in entries[g] if entries[g][n].endswith('целиком')]
        for kind, src in (('compact', own), ('full', [n for g in c for n in nets[g]])):
            a = allowed_ips(src)
            put('wireguard/%s-allowedips-%s.txt' % (name, kind), 'AllowedIPs = %s\n' % ', '.join(map(str, a)),
                len(a), 'WireGuard / AmneziaWG')
        for action in ('direct', 'block'):
            put('happ/%s-%s.json' % (name, action),
                json.dumps(happ_profile(c, action, stamp), ensure_ascii=False, separators=(',', ':')) + '\n',
                len(c), 'Happ / INCY')
    return files


def write_meta(out, gen, ok):
    with open(os.path.join(out, 'meta'), 'w', encoding='utf-8') as fh:
        fh.write('format=1\ngenerated=%d\nok=%d\n' % (gen, 1 if ok else 0))


def stop_new(out, new_keys, limit, rows, notes, t0):
    """Новых блоков больше предела: RIPE не спрашиваем вовсе, публиковать нечего."""
    os.makedirs(out, exist_ok=True)
    nk = set(new_keys)
    per = collections.Counter()
    for g, s, a in rows:
        if key_of(a) in nk:
            per[(g, s)] += 1
    ts = datetime.datetime.now(datetime.timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
    L = ['# Aegis: маршрутизация к сервисам рунета', '',
         '**%s** · %.0f с · ❌ не публикуем — остаются прошлые списки' % (ts, time.time() - t0), '',
         '## Проверки', '',
         '- ❌ новых блоков для RIPE: %d — больше предела %d. RIPE не спрашивали.' % (len(new_keys), limit)]
    L += ['- ' + n for n in notes]
    L += ['', 'Если рост настоящий (новый список, большая выгрузка сайта) — запустите сборку вручную '
          '(Actions → build → Run workflow) с new_max не меньше %d.' % len(new_keys), '',
          '| Список | Сайт | Новых блоков |', '|---|---|---:|']
    for (g, s), n in per.most_common(15):
        L.append('| %s | %s | %d |' % (LISTS[g], md(s), n))
    with open(os.path.join(out, 'summary.md'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(L) + '\n')
    write_meta(out, now(), False)
    print('ok=0 new_keys=%d limit=%d calls=0' % (len(new_keys), limit))
    return 1


def new_limit(cached, notes):
    v = os.environ.get('AEGIS_NEW_MAX', '').strip()
    if v:
        if re.fullmatch(r'[0-9]{1,7}', v):
            notes.append('⚠️ предел новых блоков на эту сборку поднят вручную: %d' % int(v))
            return int(v)
        notes.append('⚠️ AEGIS_NEW_MAX — не число, взят обычный предел')
    return NEW_FIRST if not cached else max(NEW_MAX, cached // 2)


def main():
    in_dir, cls_f, prev, out = sys.argv[1:5]
    t0 = time.time()
    gen = now()
    rows = load_site(os.path.join(in_dir, 'site-ip4.txt')) + load_site(os.path.join(in_dir, 'site-ip6.txt'))
    cls = load_classes(cls_f)
    never = [ia.ip_network(x.strip()) for f in ('never4.txt', 'never6.txt')
             for x in open(os.path.join(in_dir, f), encoding='utf-8') if x.strip()]
    never = list(ia.collapse_addresses(n for n in never if n.version == 4)) + \
        list(ia.collapse_addresses(n for n in never if n.version == 6))
    cache, hcache = load_cache(prev)
    seen = load_seen(prev, cache)
    own_cache = load_own_cache(prev)
    fresh = now() - CACHE_DAYS * 86400
    fails, notes = [], []
    try:
        for ln in open(os.path.join(in_dir, 'never-note'), encoding='utf-8'):
            if ln.strip():
                notes.append('⚠️ ' + ln.strip())
    except OSError:
        pass

    # 1. Владелец каждого блока /24 (/48) — RIPE, с кешем прошлой сборки.
    keys = {}
    for g, s, a in rows:
        keys.setdefault(key_of(a), a)
    new_keys = [k for k in keys if k not in cache]
    limit = new_limit(len(cache), notes)
    if len(new_keys) > limit:
        return stop_new(out, new_keys, limit, rows, notes, t0)
    # Устаревшие — не больше REFRESH_MAX за сборку, старые первыми:
    # полный обход растягивается на неделю, RIPE не получает 2 тыс. запросов разом.
    stale = sorted((k for k in keys if k in cache and cache[k][2] < fresh), key=lambda k: cache[k][2])
    need = new_keys + stale[:REFRESH_MAX]
    hits = len(keys) - len(need)

    def look(k):
        d = ripe('network-info', str(keys[k]))
        if d is None:
            return k, None
        p = d.get('prefix') or '-'
        asn = str((d.get('asns') or ['-'])[0])
        try:
            p = str(ia.ip_network(p))
        except (TypeError, ValueError):
            p = '-'
        if not re.fullmatch(r'[0-9]{1,10}', asn):
            asn = '-'
        t = now()
        if p == '-' or asn == '-':  # не объявлена: переспросим через сутки, а не через неделю
            t -= (CACHE_DAYS - EMPTY_DAYS) * 86400
        return k, (p, asn, t)
    with ThreadPoolExecutor(PAR) as ex:
        for k, v in ex.map(look, need):
            if v is not None:
                cache[k] = v
    asns = sorted({cache[k][1] for k in keys if k in cache and cache[k][1] != '-'}, key=int)
    hneed = [a for a in asns if a not in hcache or hcache[a][1] < fresh]
    with ThreadPoolExecutor(PAR) as ex:
        for a, d in zip(hneed, ex.map(lambda a: ripe('as-overview', 'AS' + a), hneed)):
            if d is not None:
                hcache[a] = (clean_holder(d.get('holder')), now())

    # 2. Разбор каждого адреса по правилам.
    kinds = collections.defaultdict(collections.Counter)      # список -> правило -> адресов
    per_site = collections.defaultdict(lambda: collections.defaultdict(set))
    unknown = collections.defaultdict(lambda: [0, set()])
    entries = collections.defaultdict(dict)                    # список -> сеть -> подпись
    own_used = collections.defaultdict(set)
    for g, s, a in rows:
        k = key_of(a)
        if k not in cache:
            kind = 'нет ответа RIPE'
            asn = '-'
        else:
            p, asn, _ = cache[k]
            c = cls.get(asn)
            if p == '-' or asn == '-':
                kind = 'под вопросом'
            elif c is None:
                kind = 'под вопросом'
                unknown[asn][0] += 1
                unknown[asn][1].add(s)
            elif c['class'] == 'own' and svc_ok(s, c['svc']):
                kind = 'своя сеть'
                own_used[g].add(asn)
            elif c['class'] == 'cdn':
                kind = 'CDN — не трогаем'
            else:
                kind = 'адресом'
        kinds[g][kind] += 1
        per_site[(g, s)][kind].add(a)
        if kind == 'адресом':
            n = ia.ip_network(a)
            entries[g].setdefault(n, '%s | AS%s %s | адрес' % (s, asn, (cls.get(asn) or {}).get('owner') or hcache.get(asn, ('?',))[0]))

    # 3. Свои сети — все сети, которые AS объявляет сейчас, целиком.
    # Нет ответа RIPE — сети прошлой сборки (не старше OWN_STALE_DAYS) или стоп:
    # молча выпавший сервис хуже вчерашнего списка.
    own_all = sorted({a for v in own_used.values() for a in v}, key=int)
    with ThreadPoolExecutor(PAR) as ex:
        ann = dict(zip(own_all, ex.map(lambda a: ripe('announced-prefixes', 'AS' + a), own_all)))
    own_nets, own_keep = {}, {}
    for a in own_all:
        live = live_prefixes(ann.get(a))
        old = own_cache.get(a)
        who = 'AS%s (%s)' % (a, cls[a]['owner'])
        why = 'не ответил' if ann.get(a) is None else 'не назвал ни одной объявленной сети'
        if live:
            if old and len(old[1]) >= 4 and 2 * len(live) < len(old[1]):
                notes.append('⚠️ %s: объявленных сетей меньше вдвое (%d → %d)' % (who, len(old[1]), len(live)))
            own_nets[a] = live
            own_keep[a] = (now(), live)
        elif old and old[0] >= now() - OWN_STALE_DAYS * 86400:
            notes.append('⚠️ %s: RIPE %s — взяты сети прошлой сборки (%d, от %s)' % (who, why, len(old[1]), day(old[0])))
            own_nets[a] = old[1]
            own_keep[a] = old
        else:
            fails.append('❌ %s: RIPE %s, свежих сетей прошлой сборки нет — сервис выпал бы из списка' % (who, why))
    for g, used in own_used.items():
        for a in used:
            for n in own_nets.get(a, []):
                entries[g][n] = '%s | AS%s | своя сеть целиком' % (cls[a]['owner'], a)

    # 4. Что не закрываем никогда: частное, служебное, GitHub, Telegram.
    dropped = collections.defaultdict(list)
    for g in LISTS:
        for n in list(entries[g]):
            why = None
            if n.is_private or n.is_reserved or n.is_multicast or n.is_loopback or n.is_link_local:
                why = 'частная или служебная'
            elif any(n.overlaps(x) for x in never if x.version == n.version):
                why = 'GitHub или Telegram'
            if why:
                dropped[g].append((n, why, entries[g].pop(n)))

    # 5. Списки, проверки, сравнение с прошлой сборкой.
    os.makedirs(os.path.join(out, 'lists'), exist_ok=True)
    os.makedirs(os.path.join(out, 'cache'), exist_ok=True)
    summary = {}
    for g in LISTS:
        for v in (4, 6):
            nets = list(ia.collapse_addresses(n for n in entries[g] if n.version == v))
            name = '%s-v%d.txt' % (FILE[g], v)
            u = units(nets, v)
            old = load_prev_list(prev, name)
            ou = units(old, v) if old else None
            summary[(g, v)] = (nets, u, old, ou)
            lim = MAX4_24 if v == 4 else MAX6_48
            if u > lim:
                fails.append('❌ %s: %d блоков — больше потолка %d' % (name, u, lim))
            if ou is not None and v == 4 and u > 3 * max(ou, FLOOR4_24):
                fails.append('❌ %s: охват вырос больше чем втрое (%d → %d блоков /24)' % (name, ou, u))
            if ou and v == 4 and u * 2 < ou:
                fails.append('❌ %s: охват меньше половины прошлого (%d → %d блоков /24)' % (name, ou, u))
            # Строки: точечные адреса почти не двигают охват, их рост виден только здесь.
            if old is not None:
                if len(nets) > 3 * max(len(old), LINES_FLOOR[v]):
                    fails.append('❌ %s: строк больше чем втрое (%d → %d)' % (name, len(old), len(nets)))
                if len(old) >= LINES_SHRINK_MIN and len(nets) * 2 < len(old):
                    fails.append('❌ %s: строк меньше половины прошлого (%d → %d)' % (name, len(old), len(nets)))
            if v == 4 and len(nets) < 50:
                fails.append('❌ %s: всего %d записей' % (name, len(nets)))
            with open(os.path.join(out, 'lists', name), 'w', encoding='utf-8') as fh:
                fh.write(''.join('%s\n' % n for n in nets))
        point = sum(1 for n in entries[g] if n.prefixlen == n.max_prefixlen)
        if point > POINT_MAX:
            fails.append('❌ «%s»: %d адресов точечно — больше потолка %d' % (LISTS[g], point, POINT_MAX))
        with open(os.path.join(out, 'lists', '%s_with_comments.txt' % FILE[g]), 'w', encoding='utf-8') as fh:
            for n in sorted(entries[g], key=lambda n: (n.version, n)):
                fh.write('%s # %s\n' % (n, entries[g][n]))
    asked = len(need) + len(hneed) + len(own_all)
    err_share = STAT['errors'] / max(1, asked)
    if err_share > 0.05:
        fails.append('❌ RIPE не ответил на %.0f%% запросов (%d из %d)' % (100 * err_share, STAT['errors'], asked))

    doms, shared_doms, refused, dom_sites = load_domains(os.path.join(in_dir, 'site-domains.txt'),
                                              ('github.com', 'githubusercontent.com', 'telegram.org', 't.me'))
    dom_new = {}
    for g in LISTS:
        n, title = len(doms[g]), LISTS[g]
        old = load_prev_domains(prev, FILE[g])
        if n < DOM_MIN:
            fails.append('❌ домены «%s»: всего %d' % (title, n))
        if n > DOM_MAX:
            fails.append('❌ домены «%s»: %d — больше потолка %d' % (title, n, DOM_MAX))
        if old is None:
            continue
        if n > 3 * max(len(old), DOM_FLOOR):
            fails.append('❌ домены «%s»: больше чем втрое (%d → %d)' % (title, len(old), n))
        if old and n * 2 < len(old):
            fails.append('❌ домены «%s»: меньше половины прошлого (%d → %d)' % (title, len(old), n))
        added = sorted(set(doms[g]) - old)
        new_b = sorted({base_of(d) for d in added} - {base_of(d) for d in old})
        dom_new[g] = (added, new_b)
        if len(new_b) > NEW_BASES_MAX:
            fails.append('❌ домены «%s»: %d новых доменов второго уровня за сборку — больше %d'
                         % (title, len(new_b), NEW_BASES_MAX))
    core_files = export_cores(out, entries, doms, prev, gen)
    wg = max((cnt, rel) for core, rel, cnt, _ in core_files if core.startswith('WireGuard'))
    if wg[0] > WG_MAX:
        fails.append('❌ %s: %d записей AllowedIPs — больше потолка %d' % (wg[1], wg[0], WG_MAX))

    # Кеш: блок, которого нет на сайте дольше SEEN_DAYS, уходит. Ушедший на время остаётся:
    # иначе после временного провала данных сайта вернувшиеся блоки шли бы как новые
    # и упирались в предел новых — публикация вставала до ручного запуска.
    for k in keys:
        seen[k] = gen
    keep = sorted(k for k in cache if seen.get(k, 0) >= gen - SEEN_DAYS * 86400)
    used_as = {cache[k][1] for k in keep} | set(own_all)
    with open(os.path.join(out, 'cache', 'ripe-nets.tsv'), 'w', encoding='utf-8') as fh:
        for k in keep:
            p, asn, t = cache[k]
            fh.write('%s\t%s\t%s\t%d\n' % (k, p, asn, t))
    with open(os.path.join(out, 'cache', 'ripe-seen.tsv'), 'w', encoding='utf-8') as fh:
        for k in keep:
            fh.write('%s\t%d\n' % (k, seen[k]))
    with open(os.path.join(out, 'cache', 'ripe-as.tsv'), 'w', encoding='utf-8') as fh:
        for a, (hold, t) in sorted(((a, v) for a, v in hcache.items() if a in used_as), key=lambda x: int(x[0])):
            fh.write('%s\t%d\t%s\n' % (a, t, hold))
    with open(os.path.join(out, 'cache', 'ripe-own.tsv'), 'w', encoding='utf-8') as fh:
        for a in own_all:
            if a in own_keep:
                fh.write('%s\t%d\t%s\n' % (a, own_keep[a][0], ' '.join(map(str, own_keep[a][1]))))
        # Своя AS, которой в этой сборке нет, держится, пока её сети годятся как запас.
        for a, (t, nets) in sorted(own_cache.items()):
            if a not in own_all and t >= now() - OWN_STALE_DAYS * 86400:
                fh.write('%s\t%d\t%s\n' % (a, t, ' '.join(map(str, nets))))

    ok = not fails
    # «Все проверки пройдены» — только без замечаний: рядом с ⚠️ это читалось бы как «всё чисто».
    good = '✅ блокирующих ошибок нет, замечания ниже' if notes else '✅ все проверки пройдены'
    checks = (fails if fails else [good]) + notes

    # 6. Панель — $GITHUB_STEP_SUMMARY.
    ts = datetime.datetime.now(datetime.timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
    L = []
    L.append('# Aegis: маршрутизация к сервисам рунета')
    L.append('')
    L.append('**%s** · сборка %.0f с · %s' % (
        ts, time.time() - t0, '✅ можно публиковать' if ok else '❌ не публикуем — остаются прошлые списки'))
    L.append('')
    L.append('## Что в списках')
    L.append('')
    L.append('| Список | Свои сети целиком | Адресов точечно | Охват, блоков /24 | Строк IPv4 | Строк IPv6 | Доменов | С прошлой сборки |')
    L.append('|---|---:|---:|---:|---:|---:|---:|---|')
    for g, title in LISTS.items():
        nets4, u4, old4, ou4 = summary[(g, 4)]
        nets6, _, old6, _ = summary[(g, 6)]
        whole = sum(1 for n in entries[g] if entries[g][n].endswith('целиком'))
        point = sum(1 for n in entries[g] if n.prefixlen == n.max_prefixlen)
        if old4 is None:
            delta = 'первая сборка'
        else:
            add = len(set(nets4 + nets6) - set(old4 + (old6 or [])))
            rem = len(set(old4 + (old6 or [])) - set(nets4 + nets6))
            delta = 'без изменений' if not add and not rem else '+%d / −%d строк' % (add, rem)
        L.append('| **%s** | %d | %d | %d | %d | %d | %d | %s |' % (title, whole, point, u4, len(nets4), len(nets6),
                                                                  len(doms[g]), delta))
    L.append('')
    L.append('goInstaller на сервере примет не больше %d блоков /24 на список. Своя сеть — вся сеть принадлежит сервису '
             'по RIPE; точечно — адрес в облаке, у оператора или хостера.' % MAX4_24)
    L.append('')
    L.append('## Как разобраны адреса сайта')
    L.append('')
    order = ['своя сеть', 'адресом', 'CDN — не трогаем', 'под вопросом', 'нет ответа RIPE']
    for g, title in LISTS.items():
        tot = sum(kinds[g].values())
        L.append('**%s** — %d адресов с сайта' % (title, tot))
        L.append('')
        L.append('| Правило | Адресов | |')
        L.append('|---|---:|---|')
        for k in order:
            if kinds[g][k]:
                L.append('| %s | %d | `%s` |' % (k, kinds[g][k], bar(kinds[g][k], tot)))
        L.append('')
    L.append('## Сервисы: что попадает в списки')
    L.append('')
    for g, title in LISTS.items():
        L.append('<details><summary>%s — по каждому сайту</summary>' % title)
        L.append('')
        L.append('| Сайт | Свои сети (AS) | Своя сеть | Адресом | CDN | Под вопросом |')
        L.append('|---|---|---:|---:|---:|---:|')
        sites = [(s, d) for (gg, s), d in per_site.items() if gg == g]
        sites.sort(key=lambda x: (-(len(x[1]['своя сеть']) + len(x[1]['адресом'])), x[0]))
        for s, d in sites:
            owners = sorted({cache[key_of(a)][1] for a in d['своя сеть'] if key_of(a) in cache}, key=int)
            L.append('| %s | %s | %d | %d | %d | %d |' % (md(s), ', '.join('AS' + a for a in owners) or '—',
                                                         len(d['своя сеть']), len(d['адресом']),
                                                         len(d['CDN — не трогаем']), len(d['под вопросом'])))
        L.append('')
        L.append('</details>')
        L.append('')
    L.append('## Домены')
    L.append('')
    L.append('Имя покрывает и поддомены. ' + ', '.join('%s — %d' % (LISTS[g], len(doms[g])) for g in LISTS) + '.')
    L.append('')
    by_sfx = collections.Counter('.'.join(d.split('.')[-2:]) for d in shared_doms)
    L.append('Общие домены, где живут чужие сайты и службы, в списки не берём: %s.' % (
        ', '.join('%s — %d' % kv for kv in by_sfx.most_common(6)) or 'нет'))
    ref = sorted({d for s in refused.values() for d in s})
    L.append('')
    L.append('Зоны с чужими сайтами (com.ru, msk.ru, площадки вроде tilda.ws) целиком в списки не берём: %s.' % (
        ', '.join('`%s`' % d for d in ref[:10]) + (' и ещё %d' % (len(ref) - 10) if len(ref) > 10 else '')
        if ref else 'не встретились'))
    for g in LISTS:
        if g in dom_new and dom_new[g][0]:
            added, new_b = dom_new[g]
            L.append('')
            L.append('Новое в «%s»: %d имён, новых доменов второго уровня — %d%s' % (
                LISTS[g], len(added), len(new_b),
                (': ' + ', '.join('`%s`' % d for d in new_b[:20]) + (' …' if len(new_b) > 20 else ''))
                if new_b else ''))
    L.append('')
    L.append('## Файлы для ядер и приложений')
    L.append('')
    L.append('Как подключить — README репозитория и [генератор маршрутизации](https://aegis-routing.github.io/).')
    L.append('')
    L.append('<details><summary>%d файлов</summary>' % len(core_files))
    L.append('')
    L.append('| Для чего | Файл | Записей | Размер |')
    L.append('|---|---|---:|---:|')
    for core, rel, cnt, size in core_files:
        L.append('| %s | `%s` | %d | %s |' % (core, rel, cnt, ('%.0f КБ' % (size / 1024)) if size >= 1024 else '%d Б' % size))
    L.append('')
    L.append('</details>')
    L.append('')
    L.append('## Владельцы, которых нет в таблице')
    L.append('')
    if unknown:
        L.append('Их адреса **в списки не берём**, пока владельца не внесут в `asn-classes.tsv`.')
        L.append('')
        L.append('| AS | Владелец по RIPE | Адресов | Где встретился |')
        L.append('|---|---|---:|---|')
        for a, (n, ss) in sorted(unknown.items(), key=lambda x: (-x[1][0], int(x[0])))[:15]:
            L.append('| AS%s | %s | %d | %s |' % (a, md(hcache.get(a, ('?',))[0]), n, ', '.join(md(x) for x in sorted(ss)[:4])))
        if len(unknown) > 15:
            L.append('')
            L.append('…и ещё %d AS.' % (len(unknown) - 15))
    else:
        L.append('Все владельцы разобраны.')
    L.append('')
    L.append('## Проверки')
    L.append('')
    for c in checks:
        L.append('- ' + c)
    for g in LISTS:
        if dropped[g]:
            L.append('- выкинуто из «%s»: %d (%s)' % (LISTS[g], len(dropped[g]),
                                                  ', '.join(sorted({w for _, w, _ in dropped[g]}))))
    L.append('- RIPE: %d запросов, из кеша %d блоков из %d, без ответа %d' % (STAT['calls'], hits, len(keys), STAT['errors']))
    L.append('')
    L.append('Источники: [russia.iplist.opencck.org](https://russia.iplist.opencck.org) (MIT, rekryt/iplist) · '
             '[RIPEstat](https://stat.ripe.net) · правила — `rules/asn-classes.tsv` · '
             '[генератор маршрутизации](https://aegis-routing.github.io/).')
    with open(os.path.join(out, 'summary.md'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(L) + '\n')
    write_meta(out, gen, ok)
    # stats.json — для страницы-конфигуратора: сколько чего и когда собрано.
    st = {'format': 1, 'generated': gen, 'lists': {}, 'files': {}}
    for g in LISTS:
        # sites — сайты, от которых в список что-то попало (адрес, сеть, домен);
        # outside — те из них, что не входят в сервисы своих сетей группы
        # (в «ВК» — сайты, которые не порталы VK: страница и README называют их).
        got = {s for (gg, s), d in per_site.items() if gg == g and (d.get('адресом') or d.get('своя сеть'))} | dom_sites[g]
        pats = {p for c in cls.values() if c['class'] == 'own' and any(svc_ok(s, c['svc']) for s in got)
                for p in c['svc']}
        st['lists'][FILE[g]] = {
            'title': LISTS[g],
            'whole': sum(1 for n in entries[g] if entries[g][n].endswith('целиком')),
            'point': sum(1 for n in entries[g] if n.prefixlen == n.max_prefixlen),
            'v4': len(summary[(g, 4)][0]), 'v6': len(summary[(g, 6)][0]),
            'domains': len(doms[g]), 'site_addrs': sum(kinds[g].values()),
            'rules': {k: kinds[g][k] for k in order if kinds[g][k]},
            'sites': sorted(got), 'outside': sorted(s for s in got if not svc_ok(s, pats)),
        }
    for core, rel, cnt, size in core_files:
        st['files'][rel] = {'core': core, 'count': cnt, 'size': size}
    for g in LISTS:
        for v in (4, 6):
            p = 'lists/%s-v%d.txt' % (FILE[g], v)
            st['files'][p] = {'core': 'list', 'count': len(summary[(g, v)][0]),
                              'size': os.path.getsize(os.path.join(out, p))}
    with open(os.path.join(out, 'stats.json'), 'w', encoding='utf-8') as fh:
        json.dump(st, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    print('ok=%d calls=%d errors=%d cache_hits=%d/%d' % (ok, STAT['calls'], STAT['errors'], hits, len(keys)))
    return 0 if ok else 1


sys.exit(main())
