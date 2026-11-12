#!/bin/bash
# Aegis: сборка списков «Яндекс», «Другие сервисы рунета» и «ВК».
#
# Скачивание — curl со своим конфигом и повторами (4 попытки, паузы 2, 4, 8 с;
# повторяем только сетевой сбой и 5xx/429/408 — как сетевой слой goInstaller).
# Разбор и проверки — python3 -I scripts/build.py. Сайт, RIPEstat и список сетей
# Telegram открыты. api.github.com/meta без ключа отвечает 60 раз в час на адрес, а адреса
# машин GitHub общие: в Action ключ запуска (GH_TOKEN, только чтение) уходит в отдельный
# конфиг curl 0600 только для api.github.com — не в argv. Не ответил и он — сети GitHub
# из прошлой сборки (cache/github-nets.txt) и строка на панели.
#
# Вызов: build.sh <прошлая сборка> <куда> [таблица владельцев]
#   прошлая сборка — каталог с lists/ и cache/ (в Action — сам репозиторий);
#   SHIELD_NO_TG=1 — не ходить за списком Telegram (из России он закрыт).
set -euo pipefail

prev="${1:?нужен каталог прошлой сборки (может быть пустым)}"
out="${2:?нужен каталог для результата}"
here=$(cd "$(dirname "$0")" && pwd)
classes="${3:-$here/../rules/asn-classes.tsv}"
site="${SHIELD_SITE:-https://russia.iplist.opencck.org}"
tpl='%7Bgroup%7D%20%7Bsite%7D%20%7Bdata%7D'
groups='group=yandex&group=russia&group=vk'

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$out"

cfg="$work/.curl"
( umask 077; {
    echo 'silent'; echo 'show-error'; echo 'location'
    echo 'connect-timeout = 30'; echo 'max-time = 120'
    echo 'max-filesize = 20000000'
    echo 'proto = "=https"'; echo 'proto-redir = "=https"'
    echo 'user-agent = "aegis-build (+https://github.com/anten-ka/aegis)"'
} > "$cfg" )

# Конфиг для api.github.com: тот же плюс ключ. printf — встроенная команда bash,
# ключ не попадает в список процессов.
ghcfg="$work/.curl-gh"
( umask 077; cp "$cfg" "$ghcfg"
  if [[ "${GH_TOKEN:-}" =~ ^[A-Za-z0-9_.-]+$ ]]; then
      printf 'header = "Authorization: Bearer %s"\n' "$GH_TOKEN" >> "$ghcfg"
  fi )

# fetch <что> <url> <файл> [конфиг] [warning] — до 4 попыток; окончательный ответ не повторяем.
# warning — когда у вызова есть запас (прошлая сборка, встроенный список): сборка идёт дальше,
# и ::error:: в журнале был бы неправдой.
fetch() {
    local what="$1" url="$2" dst="$3" conf="${4:-$cfg}" lvl="${5:-error}" i code rc
    for i in 1 2 3 4; do
        rc=0
        code=$(curl --config "$conf" -o "$dst" -w '%{http_code}' "$url") || rc=$?
        if [ "$rc" -eq 0 ] && [ "$code" = 200 ]; then return 0; fi
        case "$code" in 5??|429|408|000) ;; *) [ "$rc" -eq 0 ] && break ;; esac
        echo "  $what: попытка $i из 4 — curl $rc, ответ ${code:-нет}" >&2
        [ "$i" -lt 4 ] && sleep $(( 1 << i ))
    done
    echo "::$lvl::$what: не скачалось (curl $rc, ответ ${code:-нет})" >&2
    return 1
}

echo "Сайт: адреса и домены групп yandex, russia и vk" >&2
fetch "сайт, IPv4" "$site/?format=custom&data=ip4&$groups&template=$tpl" "$work/site-ip4.txt"
fetch "сайт, IPv6" "$site/?format=custom&data=ip6&$groups&template=$tpl" "$work/site-ip6.txt"
fetch "сайт, домены" "$site/?format=custom&data=domains&$groups&template=$tpl" "$work/site-domains.txt"

echo "Что не закрываем никогда: GitHub и Telegram" >&2
mkdir -p "$out/cache"
if fetch "GitHub meta" "https://api.github.com/meta" "$work/gh-meta.json" "$ghcfg" warning &&
   python3 -I - "$work/gh-meta.json" "$work/gh.txt" <<'PY'
import ipaddress, json, sys
meta = json.load(open(sys.argv[1]))
nets = sorted({str(ipaddress.ip_network(n, strict=False)) for k in ('hooks', 'web', 'api', 'git', 'packages', 'pages',
               'importer') for n in meta.get(k, [])})
if len(nets) < 10:
    sys.exit('в ответе GitHub meta почти нет сетей')
open(sys.argv[2], 'w').write(''.join(n + '\n' for n in nets))
PY
then
    cp "$work/gh.txt" "$out/cache/github-nets.txt"
elif [ -s "$prev/cache/github-nets.txt" ]; then
    cp "$prev/cache/github-nets.txt" "$work/gh.txt"
    cp "$work/gh.txt" "$out/cache/github-nets.txt"
    echo "GitHub: список сетей не скачался — взят из прошлой сборки" >> "$work/never-note"
else
    echo "::error::GitHub meta не скачался, и прошлого списка сетей GitHub нет" >&2
    exit 1
fi
# Список сетей Telegram из России не открывается; на машинах GitHub он есть.
# Не скачался — встроенный (сети Telegram меняются редко) и строка на панели.
if [ -n "${SHIELD_NO_TG:-}" ] || ! fetch "Telegram" "https://core.telegram.org/resources/cidr.txt" "$work/tg.txt" "$cfg" warning; then
    printf '%s\n' 91.108.4.0/22 91.108.8.0/22 91.108.12.0/22 91.108.16.0/22 91.108.20.0/22 \
        91.108.56.0/22 91.105.192.0/23 149.154.160.0/20 185.76.151.0/24 95.161.64.0/20 \
        2001:b28:f23d::/48 2001:b28:f23f::/48 2001:67c:4e8::/48 2001:b28:f23c::/48 2a0a:f280::/32 > "$work/tg.txt"
    echo "Telegram: список не скачался — взят встроенный" >> "$work/never-note"
fi
python3 -I - "$work" <<'PY'
import ipaddress, json, sys
d = sys.argv[1]
nets = set()
for f in ('/gh.txt', '/tg.txt'):
    nets.update(l.strip() for l in open(d + f) if l.strip())
ok = [ipaddress.ip_network(n, strict=False) for n in nets]
for v in (4, 6):
    with open('%s/never%d.txt' % (d, v), 'w') as fh:
        fh.write(''.join('%s\n' % n for n in ipaddress.collapse_addresses(x for x in ok if x.version == v)))
PY

echo "Разбор: владельцы по RIPE, правила, проверки" >&2
rc=0
python3 -I "$here/build.py" "$work" "$classes" "$prev" "$out" || rc=$?
exit "$rc"
