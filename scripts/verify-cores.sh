#!/bin/bash
# Проверка готовых файлов (шаг build.yml): сначала без ядер — scripts/validate.py разбирает
# каждый файл и сверяет файлы между собой, — потом настоящими ядрами:
#   Xray    — правила с ext:aegis-ip.dat / ext:aegis-site.dat по всем тегам;
#   mihomo  — конфиг с rule-providers из наших текстовых файлов;
#   sing-box — собирает .srs из наших .json и сверяет, что адрес и домен из списка
#              в собранном файле находятся, а чужой домен — нет.
# Не прошло — публикации нет: файл, который ядро не читает, сломал бы чужие настройки.
# Проверки Xray и sing-box идут и на заведомо плохом входе: если ядро его примет, проверка
# ничего не проверяет — сборка падает. mihomo -t проверяет конфиг; читает ли он при этом сами
# файлы списков — не подтверждено: если нет, в журнале будет предупреждение, а содержимое
# списков для mihomo проверяет только validate.py.
#
# Ядра — официальные выпуски с GitHub; версия и SHA-256 закреплены в build.yml.
#
# Вызов: verify-cores.sh <каталог сборки>
set -euo pipefail

out="${1:?нужен каталог сборки}"
: "${XRAY_VERSION:?}" "${XRAY_SHA256:?}" "${MIHOMO_VERSION:?}" "${MIHOMO_SHA256:?}"
: "${SING_BOX_VERSION:?}" "${SING_BOX_SHA256:?}"
here=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
lists=(yandex ru-services vk)

get() {  # get <url> <файл> <sha256>
    curl -fsSL --retry 3 --retry-delay 5 -o "$2" "$1"
    echo "$3  $2" | sha256sum -c --quiet - || { echo "::error::хеш не сошёлся: $1" >&2; exit 1; }
}

echo "Файлы без ядер" >&2
python3 -I "$here/validate.py" "$out" || { echo "::error::validate.py нашёл ошибки в сборке" >&2; exit 1; }

echo "Xray ${XRAY_VERSION}" >&2
get "https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-64.zip" "$work/xray.zip" "$XRAY_SHA256"
mkdir "$work/xray"
unzip -q "$work/xray.zip" xray geoip.dat geosite.dat -d "$work/xray"
cp "$out/xray/aegis-ip.dat" "$out/xray/aegis-site.dat" "$work/xray/"
{
    echo '{ "log": { "loglevel": "warning" },'
    echo '  "inbounds": [{ "port": 10808, "listen": "127.0.0.1", "protocol": "socks" }],'
    echo '  "outbounds": [{ "protocol": "freedom", "tag": "direct" }, { "protocol": "blackhole", "tag": "blocked" }],'
    echo '  "routing": { "rules": ['
    sep=''
    for l in "${lists[@]}"; do
        printf '%s    { "type": "field", "domain": ["ext:aegis-site.dat:%s"], "outboundTag": "blocked" },\n' "$sep" "$l"
        printf '    { "type": "field", "ip": ["ext:aegis-ip.dat:%s"], "outboundTag": "blocked" }' "$l"
        sep=$',\n'
    done
    printf '\n  ] } }\n'
} > "$work/xray.json"
XRAY_LOCATION_ASSET="$work/xray" "$work/xray/xray" run -test -c "$work/xray.json" \
    || { echo "::error::Xray не принял aegis-ip.dat / aegis-site.dat" >&2; exit 1; }
# Пустой тег Xray принял бы молча — сверяем неправильным тегом, что теги вообще читаются.
for f in aegis-ip.dat aegis-site.dat; do
    sed "s/ext:$f:yandex/ext:$f:no-such-tag/" "$work/xray.json" > "$work/xray-bad.json"
    cmp -s "$work/xray.json" "$work/xray-bad.json" && { echo "::error::подмена тега $f не сработала" >&2; exit 1; }
    if XRAY_LOCATION_ASSET="$work/xray" "$work/xray/xray" run -test -c "$work/xray-bad.json" >/dev/null 2>&1; then
        echo "::error::Xray принял несуществующий тег в $f — проверка ничего не проверяет" >&2; exit 1
    fi
done

echo "mihomo ${MIHOMO_VERSION}" >&2
get "https://github.com/MetaCubeX/mihomo/releases/download/${MIHOMO_VERSION}/mihomo-linux-amd64-${MIHOMO_VERSION}.gz" \
    "$work/mihomo.gz" "$MIHOMO_SHA256"
gunzip -c "$work/mihomo.gz" > "$work/mihomo" && chmod 700 "$work/mihomo"
mkdir -p "$work/m/rule-set"
cp "$out"/mihomo/*.txt "$work/m/rule-set/"
{
    echo 'mixed-port: 17890'
    echo 'rule-providers:'
    for f in "$out"/mihomo/*.txt; do
        n=$(basename "$f" .txt)
        case "$n" in *-ip) b=ipcidr ;; *) b=domain ;; esac
        printf '  %s:\n    type: file\n    behavior: %s\n    format: text\n    path: ./rule-set/%s.txt\n' "$n" "$b" "$n"
    done
    echo 'rules:'
    for f in "$out"/mihomo/*.txt; do
        n=$(basename "$f" .txt)
        case "$n" in *-ip) echo "  - RULE-SET,$n,REJECT,no-resolve" ;; *) echo "  - RULE-SET,$n,REJECT" ;; esac
    done
    echo '  - MATCH,DIRECT'
} > "$work/m/config.yaml"
"$work/mihomo" -t -d "$work/m" -f "$work/m/config.yaml" \
    || { echo "::error::mihomo не принял списки" >&2; exit 1; }
# Читает ли mihomo -t сами файлы. Если нет — содержимое уже проверил validate.py выше.
cp -R "$work/m" "$work/m-bad"
echo 'это-не-сеть' >> "$work/m-bad/rule-set/yandex-ip.txt"
if "$work/mihomo" -t -d "$work/m-bad" -f "$work/m-bad/config.yaml" >/dev/null 2>&1; then
    echo "::warning::mihomo -t не читает файлы списков — их содержимое проверено только validate.py" >&2
fi

echo "sing-box ${SING_BOX_VERSION}" >&2
sbv="${SING_BOX_VERSION#v}"
get "https://github.com/SagerNet/sing-box/releases/download/v${sbv}/sing-box-${sbv}-linux-amd64.tar.gz" \
    "$work/sing-box.tar.gz" "$SING_BOX_SHA256"
mkdir "$work/sb"
tar -xzf "$work/sing-box.tar.gz" -C "$work/sb" --strip-components=1 "sing-box-${sbv}-linux-amd64/sing-box"
sb="$work/sb/sing-box"
# match печатает «match rules.[N]: …» в stderr и выходит с 0 и при совпадении, и без него.
# Вывод — в переменную, а не в grep -q через канал: под pipefail ранний выход grep
# роняет конвейер.
sbmatch() { local r; r=$("$sb" rule-set match -f binary "$1" "$2" 2>&1) || return 1; [[ "$r" == *"match rules"* ]]; }
for l in "${lists[@]}"; do
    for kind in geosite geoip; do
        src="$out/sing-box/$kind-aegis-$l.json"
        srs="$out/sing-box/$kind-aegis-$l.srs"
        "$sb" rule-set compile --output "$srs" "$src" \
            || { echo "::error::sing-box не собрал $kind-aegis-$l.srs" >&2; exit 1; }
        # Версия .srs — 2: читается sing-box 1.10 и новее (Hiddify, Karing).
        [ "$(head -c 4 "$srs" | od -An -tx1 | tr -d ' \n')" = 53525302 ] \
            || { echo "::error::$kind-aegis-$l.srs: не SRS версии 2" >&2; exit 1; }
        if [ "$kind" = geosite ]; then
            # Домен из списка, у которого «x» + домен списком не покрыт: «xvk.com» не должен
            # находиться по «vk.com» — суффикс сверяется по границе метки, а не по буквам.
            probe=$(python3 -I -c '
import json, sys
s = json.load(open(sys.argv[1]))["rules"][0]["domain_suffix"]
have = set(s)
for d in s:
    p = ("x" + d).split(".")
    if not any(".".join(p[i:]) in have for i in range(len(p))):
        print(d)
        break
else:
    sys.exit(1)' "$src") || { echo "::error::$kind-aegis-$l.json: не нашёл домена для проверки" >&2; exit 1; }
            for q in "$probe" "aegis-probe.$probe"; do
                sbmatch "$srs" "$q" \
                    || { echo "::error::$kind-aegis-$l.srs: не нашёл $q из своего списка" >&2; exit 1; }
            done
            for q in "x$probe" example.invalid; do
                if sbmatch "$srs" "$q"; then
                    echo "::error::$kind-aegis-$l.srs: нашёл $q, которого в списке нет — проверка ничего не проверяет" >&2; exit 1
                fi
            done
        else
            probe=$(python3 -I -c 'import ipaddress,json,sys; print(ipaddress.ip_network(json.load(open(sys.argv[1]))["rules"][0]["ip_cidr"][0]).network_address)' "$src")
            sbmatch "$srs" "$probe" \
                || { echo "::error::$kind-aegis-$l.srs: не нашёл $probe из своего списка" >&2; exit 1; }
            if sbmatch "$srs" 192.0.2.1; then
                echo "::error::$kind-aegis-$l.srs: нашёл 192.0.2.1 — проверка ничего не проверяет" >&2; exit 1
            fi
        fi
    done
done
# Испорченный файл sing-box должен отвергнуть, а не «не найти».
head -c 40 "$out/sing-box/geoip-aegis-yandex.srs" > "$work/bad.srs"
if "$sb" rule-set match -f binary "$work/bad.srs" 192.0.2.1 >/dev/null 2>&1; then
    echo "::error::sing-box принял обрезанный .srs — проверка ничего не проверяет" >&2; exit 1
fi

echo "Ядра приняли все файлы" >&2
