"""Aegis: проверка готовой сборки без ядер — каждый файл разбирается и сверяется с остальными.

python3 -I validate.py <out_dir>
Списки, коды и адрес публикации берутся из build.py (разбором, без запуска), чтобы не разойтись.
Проверяет: строки mihomo, JSON AmneziaVPN, AllowedIPs WireGuard (покрывают всё, кроме списков и
частных сетей, и не пересекаются с ними), rule-set sing-box, списки Shadowrocket, профили Happ/INCY,
.sha256 рядом с .dat, сами .dat (protobuf разбирается и сверяется со списками mihomo).
Код выхода: 0 — всё сошлось, 1 — нет (что именно — в stderr).
"""
import ast
import base64
import hashlib
import ipaddress as ia
import json
import os
import re
import sys

HOST = re.compile(r'^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$')
ERR = []


def bad(msg):
    ERR.append(msg)


def consts():
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build.py'), encoding='utf-8').read()
    want = {'LISTS', 'TAGS', 'FILE', 'PUB', 'HAPP_LAN', 'LAN4', 'LAN6'}
    got = {}
    for node in ast.parse(src).body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            name = node.targets[0].id
            if name in want - {'LAN4', 'LAN6'}:
                got[name] = ast.literal_eval(node.value)
            elif name in ('LAN4', 'LAN6'):  # [ia.ip_network(x) for x in (...)]
                got[name] = [ia.ip_network(x) for x in ast.literal_eval(node.value.generators[0].iter)]
    missing = want - set(got)
    if missing:
        sys.exit('validate: в build.py не нашлось %s' % ', '.join(sorted(missing)))
    return got


def read(out, rel, binary=False):
    p = os.path.join(out, rel)
    try:
        with open(p, 'rb' if binary else 'r', **({} if binary else {'encoding': 'utf-8'})) as fh:
            return fh.read()
    except OSError:
        bad('%s: нет файла' % rel)
        return None


def net(s, rel):
    try:
        return ia.ip_network(s)
    except ValueError:
        bad('%s: не сеть: %r' % (rel, s[:60]))
        return None


def pb_fields(buf):
    """(номер поля, тип, значение) верхнего уровня; длина или varint."""
    i, n = 0, len(buf)
    while i < n:
        key, i = varint(buf, i)
        f, t = key >> 3, key & 7
        if t == 0:
            v, i = varint(buf, i)
        elif t == 2:
            ln, i = varint(buf, i)
            if i + ln > n:
                raise ValueError('обрезано')
            v, i = buf[i:i + ln], i + ln
        else:
            raise ValueError('тип %d' % t)
        yield f, t, v


def varint(buf, i):
    r = s = 0
    while True:
        if i >= len(buf) or s > 63:
            raise ValueError('varint')
        b = buf[i]
        i += 1
        r |= (b & 0x7f) << s
        s += 7
        if not b & 0x80:
            return r, i


def dat_geoip(data):
    out = {}
    for f, t, gi in pb_fields(data):
        if f != 1 or t != 2:
            raise ValueError('GeoIPList: поле %d' % f)
        code, cidrs = None, []
        for f2, t2, v in pb_fields(gi):
            if f2 == 1:
                code = v.decode()
            elif f2 == 2:
                ip = pre = None
                for f3, t3, x in pb_fields(v):
                    if f3 == 1:
                        ip = ia.ip_address(bytes(x))
                    elif f3 == 2:
                        pre = x
                cidrs.append(ia.ip_network('%s/%d' % (ip, pre)))
        out[code] = cidrs
    return out


def dat_geosite(data):
    out = {}
    for f, t, gs in pb_fields(data):
        if f != 1 or t != 2:
            raise ValueError('GeoSiteList: поле %d' % f)
        code, names = None, []
        for f2, t2, v in pb_fields(gs):
            if f2 == 1:
                code = v.decode()
            elif f2 == 2:
                typ = val = None
                for f3, t3, x in pb_fields(v):
                    if f3 == 1:
                        typ = x
                    elif f3 == 2:
                        val = x.decode()
                if typ != 2:
                    raise ValueError('%s: тип домена %r, а нужен 2 (домен с поддоменами)' % (code, typ))
                names.append(val)
        out[code] = names
    return out


def covered(nets, v):
    return sum(n.num_addresses for n in ia.collapse_addresses(x for x in nets if x.version == v))


def main():
    out = sys.argv[1]
    C = consts()
    files = [C['FILE'][g] for g in C['LISTS']]
    tag = {C['FILE'][g]: C['TAGS'][g] for g in C['LISTS']}
    ips, doms = {}, {}

    # mihomo — от них сверяется всё остальное
    for f in files:
        rel = 'mihomo/%s-ip.txt' % f
        t = read(out, rel)
        if t is not None:
            ips[f] = [x for x in (net(s, rel) for s in t.split('\n') if s) if x]
            if not ips[f]:
                bad('%s: пусто' % rel)
            if [str(x) for x in ips[f]] != [s for s in t.split('\n') if s]:
                bad('%s: сети не в каноническом виде' % rel)
        rel = 'mihomo/%s-domain.txt' % f
        t = read(out, rel)
        if t is not None:
            lines = [s for s in t.split('\n') if s]
            for s in lines:
                if not (s.startswith('+.') and HOST.match(s[2:])):
                    bad('%s: строка %r' % (rel, s[:60]))
            doms[f] = [s[2:] for s in lines]
            if not doms[f]:
                bad('%s: пусто' % rel)
    if ERR:
        return finish()

    # Xray: .dat и .sha256
    for name, parse, want in (('aegis-ip.dat', dat_geoip, {tag[f]: ips[f] for f in files}),
                              ('aegis-site.dat', dat_geosite, {tag[f]: doms[f] for f in files})):
        data = read(out, 'xray/' + name, binary=True)
        sha = read(out, 'xray/%s.sha256' % name)
        if data is None or sha is None:
            continue
        if not re.fullmatch(r'[0-9a-f]{64}', sha):
            bad('xray/%s.sha256: не 64 шестнадцатеричных знака без перевода строки' % name)
        elif sha != hashlib.sha256(data).hexdigest():
            bad('xray/%s.sha256: не совпадает с файлом' % name)
        try:
            got = parse(data)
        except (ValueError, UnicodeDecodeError, TypeError) as e:
            bad('xray/%s: не разбирается: %s' % (name, e))
            continue
        if got != want:
            bad('xray/%s: содержимое не совпадает со списками mihomo (коды %s)' % (name, sorted(got)))

    for f in files:
        # AmneziaVPN: только IPv4
        rel = 'amnezia/%s.json' % f
        t = read(out, rel)
        if t is not None:
            try:
                j = json.loads(t)
                if not isinstance(j, list) or any(set(x) != {'hostname', 'ip'} or x['ip'] != '' for x in j):
                    bad('%s: не тот формат' % rel)
                elif [ia.ip_network(x['hostname']) for x in j] != [x for x in ips[f] if x.version == 4]:
                    bad('%s: не совпадает с IPv4 списка' % rel)
            except (ValueError, TypeError, KeyError) as e:
                bad('%s: %s' % (rel, e))
        # sing-box: version 2, одно правило
        for kind, field, want in (('geosite', 'domain_suffix', doms[f]), ('geoip', 'ip_cidr', [str(x) for x in ips[f]])):
            rel = 'sing-box/%s-aegis-%s.json' % (kind, f)
            t = read(out, rel)
            if t is None:
                continue
            try:
                j = json.loads(t)
                if j.get('version') != 2 or j.get('rules') != [{field: want}]:
                    bad('%s: не version 2 или не совпадает со списком' % rel)
            except ValueError as e:
                bad('%s: %s' % (rel, e))
        # Shadowrocket
        rel = 'shadowrocket/%s.list' % f
        t = read(out, rel)
        if t is not None:
            want = ['DOMAIN-SUFFIX,' + d for d in doms[f]] + ['IP-CIDR,%s,no-resolve' % x for x in ips[f]]
            got = [s for s in t.split('\n') if s and not s.startswith('#')]
            if got != want:
                bad('%s: не совпадает со списком' % rel)

    # Наборы списков: WireGuard и Happ/INCY
    combos = []
    for mask in range(1, 1 << len(files)):
        combos.append([f for i, f in enumerate(files) if mask >> i & 1])
    for c in combos:
        name = '_'.join(c)
        rel = 'wireguard/%s-allowedips-full.txt' % name
        t = read(out, rel)
        if t is not None:
            if not t.startswith('AllowedIPs = ') or not t.endswith('\n') or t.count('\n') != 1:
                bad('%s: не одна строка «AllowedIPs = …»' % rel)
            else:
                a = [x for x in (net(s.strip(), rel) for s in t[13:].split(',')) if x]
                ex = [x for f in c for x in ips[f]]
                for v, lan, full in ((4, C['LAN4'], 1 << 32), (6, C['LAN6'], 1 << 128)):
                    sa, se = covered(a, v), covered(ex + lan, v)
                    su = covered(a + ex + lan, v)
                    if su != full or su != sa + se:
                        bad('%s: IPv%d — AllowedIPs и списки %s' % (rel, v, 'пересекаются' if su != sa + se else 'покрывают не всё'))
        rel = 'wireguard/%s-allowedips-compact.txt' % name
        t = read(out, rel)
        if t is not None and (not t.startswith('AllowedIPs = ') or
                              not all(net(s.strip(), rel) for s in t[13:].split(','))):
            bad('%s: не строка AllowedIPs' % rel)
        for action in ('direct', 'block'):
            rel = 'happ/%s-%s.json' % (name, action)
            t = read(out, rel)
            if t is None:
                continue
            try:
                j = json.loads(t)
            except ValueError as e:
                bad('%s: %s' % (rel, e))
                continue
            keys = {'Name', 'GlobalProxy', 'Geoipurl', 'Geositeurl', 'LastUpdated', 'DnsHosts', 'DirectSites',
                    'DirectIp', 'ProxySites', 'ProxyIp', 'BlockSites', 'BlockIp', 'DomainStrategy', 'FakeDNS'}
            sites = ['geosite:' + f for f in c]
            gips = ['geoip:' + f for f in c]
            d = action == 'direct'
            if set(j) != keys:
                bad('%s: поля %s' % (rel, sorted(set(j) ^ keys)))
            elif not (j['Geoipurl'] == C['PUB'] + 'xray/aegis-ip.dat' and j['Geositeurl'] == C['PUB'] + 'xray/aegis-site.dat'
                      and j['GlobalProxy'] == 'true' and j['FakeDNS'] == 'false' and j['DnsHosts'] == {}
                      and j['DomainStrategy'] in ('AsIs', 'IPIfNonMatch', 'IPOnDemand')
                      and re.fullmatch(r'[0-9]{9,11}', j['LastUpdated'])
                      and j['DirectSites'] == (sites if d else []) and j['BlockSites'] == ([] if d else sites)
                      and j['DirectIp'] == (gips if d else []) + C['HAPP_LAN'] and j['BlockIp'] == ([] if d else gips)
                      and j['ProxySites'] == [] and j['ProxyIp'] == []
                      and re.fullmatch(r'[ -~]{1,80}', j['Name'])):
                bad('%s: значения полей' % rel)
            elif len(t) > 1500:
                bad('%s: %d байт — ссылка happ:// не влезет в QR' % (rel, len(t)))
            elif re.search(r'[+/]', base64.b64encode(t.encode()).decode()):
                # Как Happ читает «+» и «/» внутри happ://routing/onadd/{base64}, не проверено;
                # в ASCII-тексте без «>», «?», «~» их не бывает — держим так.
                bad('%s: в base64 есть «+» или «/» — ссылка happ:// может не открыться' % rel)
    return finish()


def finish():
    for e in ERR:
        print('::error::validate: ' + e, file=sys.stderr)
    print('validate: %s' % ('ошибок нет' if not ERR else '%d ошибок' % len(ERR)), file=sys.stderr)
    return 1 if ERR else 0


sys.exit(main())
