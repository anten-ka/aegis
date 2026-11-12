#!/bin/bash
# Публикация сборки в этот же репозиторий (задача publish в build.yml).
# Не прошедшее проверки и неполное не публикуем — остаются вчерашние файлы.
# Без изменений в списках коммит всё равно есть (meta, кеш RIPE, сводка):
# по дате meta видно, что сборка жива.
#
# Ключ — GITHUB_TOKEN из actions/checkout задачи publish (права только на этот
# репозиторий, contents: write); в скрипте его нет и в командную строку он не попадает.
#
# Вызов: publish.sh <рабочая копия> <сборка>
set -euo pipefail

repo="${1:?}"; new="${2:?}"
lists=(yandex ru-services vk)
# Каталоги, которые пишет только сборка.
dirs=(lists cache xray mihomo amnezia wireguard sing-box happ shadowrocket)

grep -qx 'format=1' "$new/meta" || { echo "::error::В meta нет format=1 — не публикую" >&2; exit 1; }
grep -qx 'ok=1' "$new/meta" || { echo "::error::Сборка не прошла проверки — не публикую" >&2; exit 1; }
need=(xray/aegis-ip.dat xray/aegis-site.dat xray/aegis-ip.dat.sha256 xray/aegis-site.dat.sha256
      "happ/$(IFS=_; echo "${lists[*]}")-direct.json" "happ/$(IFS=_; echo "${lists[*]}")-block.json"
      stats.json summary.md)
for l in "${lists[@]}"; do
    need+=("lists/$l-v4.txt" "mihomo/$l-ip.txt" "mihomo/$l-domain.txt" "amnezia/$l.json"
           "wireguard/$l-allowedips-compact.txt" "wireguard/$l-allowedips-full.txt" "shadowrocket/$l.list"
           "sing-box/geoip-aegis-$l.json" "sing-box/geosite-aegis-$l.json"
           "sing-box/geoip-aegis-$l.srs" "sing-box/geosite-aegis-$l.srs")
done
for f in "${need[@]}"; do
    [ -s "$new/$f" ] || { echo "::error::$f пустой или его нет — не публикую" >&2; exit 1; }
done

# Каталоги сборки заменяются целиком её файлами, остальное в репозитории не трогается.
stage() {
    for d in "${dirs[@]}"; do
        rm -rf "${repo:?}/$d"
        cp -R "$new/$d" "$repo/"
    done
    cp "$new/meta" "$new/summary.md" "$new/stats.json" "$repo/"
    git -C "$repo" add -A "${dirs[@]}" meta summary.md stats.json
    if git -C "$repo" diff --cached --quiet -- "${dirs[@]}"; then
        msg="Сборка $(date -u +%Y-%m-%d): списки без изменений"
    else
        msg="Списки $(date -u +%Y-%m-%d): $(git -C "$repo" diff --cached --shortstat -- lists | sed 's/^ //')"
    fi
    git -C "$repo" commit --quiet -m "$msg"
}

git -C "$repo" config user.name "github-actions[bot]"
git -C "$repo" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
stage
# Пока шла сборка, в main мог прийти другой коммит (ручной запуск в очереди, правка README).
# Тогда сборка кладётся заново поверх нового main: её каталоги — её файлами, чужие правки
# остальных файлов сохраняются. Не вышло и так — стоп с понятной причиной, а не молча.
# Ответ git на первый push — в файл: при обогнавшем main его подсказки «rejected… fetch first»
# в журнале выглядели бы ошибкой, хотя дальше идёт штатный повтор. Другую причину — показываем.
perr=$(mktemp)
trap 'rm -f "$perr"' EXIT
if ! git -C "$repo" push --quiet origin HEAD:main 2>"$perr"; then
    if grep -qE '\[rejected\]|non-fast-forward|fetch first' "$perr"; then
        echo "main ушёл вперёд — кладу сборку поверх нового main" >&2
    else
        cat "$perr" >&2
        echo "push не прошёл — пробую ещё раз поверх свежего main" >&2
    fi
    git -C "$repo" fetch --quiet --depth=1 origin main
    git -C "$repo" reset --quiet --hard FETCH_HEAD
    stage
    git -C "$repo" push --quiet origin HEAD:main \
        || { echo "::error::Не публикую: push в main не прошёл и поверх нового main — запустите сборку снова" >&2; exit 1; }
fi
echo "Опубликовано: $msg" >&2
