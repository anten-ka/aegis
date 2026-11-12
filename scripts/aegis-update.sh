#!/bin/sh
# aegis-update — обновить aegis-ip.dat и aegis-site.dat на сервере с Xray (3X-UI, Xray).
#
#   aegis-update <каталог файлов Xray> [служба]
#   aegis-update /usr/local/x-ui/bin x-ui        # 3X-UI
#   aegis-update /usr/local/share/xray xray      # Xray
#
# Порядок: сначала .sha256 рядом с файлом (64 знака); совпал с файлом на диске — ничего не
# делаем. Иначе оба файла качаются во временные рядом с настоящими, проверяются (не пустые,
# SHA-256 сошёлся с .sha256), и только когда годны оба — встают на место атомарным mv.
# Службу перезапускаем, только если файл действительно сменился: перезапуск рвёт сессии.
# Перед заменой файлов ставим отметку .aegis-restart-pending, после удачного перезапуска
# снимаем: не перезапустилась служба (или скрипт прервали) — следующий запуск повторит
# перезапуск, даже если файлы больше не менялись.
# Обрыв, пустой ответ, чужой хеш — старые файлы не тронуты, службу не трогаем, код выхода 1
# (cron пришлёт письмо, если почта настроена). Сигнал (HUP, INT, TERM) останавливает скрипт.
#
# AEGIS_BASE — откуда брать (по умолчанию публикация aegis); нужно только для проверки.
set -u

base="${AEGIS_BASE:-https://raw.githubusercontent.com/anten-ka/aegis/main/xray}"
dir="${1:-}"
svc="${2:-}"
files="aegis-ip.dat aegis-site.dat"

die() { echo "aegis-update: $*" >&2; exit 1; }

[ -n "$dir" ] && [ -d "$dir" ] || die "нет каталога «$dir»; вызов: aegis-update <каталог> [служба]"
case "$svc" in -*|*[!A-Za-z0-9@._-]*) die "странное имя службы: $svc" ;; esac
case "$base" in https://*|http://127.0.0.1:*) ;; *) die "AEGIS_BASE — только https://" ;; esac

if command -v sha256sum >/dev/null 2>&1; then
    sha() { sha256sum "$1" | cut -d' ' -f1; }
else
    sha() { shasum -a 256 "$1" | cut -d' ' -f1; }
fi
get() {  # get <url> <файл>
    curl -fsS --connect-timeout 20 --max-time 300 --retry 2 --retry-delay 10 -o "$2" "$1"
}

mark="$dir/.aegis-restart-pending"
tmp=$(mktemp -d "$dir/.aegis-update.XXXXXX") || die "не создать временный каталог в $dir"
# Уборка — в EXIT; сигнал только завершает скрипт (exit запускает ту же уборку).
# Ловушка на сигнал без exit убрала бы временные файлы и продолжила работу.
trap 'rm -rf "$tmp"' EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

todo=""
for f in $files; do
    get "$base/$f.sha256" "$tmp/$f.sha256" || die "$f.sha256 не скачался — файлы не тронуты"
    want=$(cat "$tmp/$f.sha256")
    case "$want" in
        *[!0-9a-f]*|"") die "$f.sha256: не хеш — файлы не тронуты" ;;
    esac
    [ ${#want} -eq 64 ] || die "$f.sha256: не 64 знака — файлы не тронуты"
    if [ -f "$dir/$f" ] && [ "$(sha "$dir/$f")" = "$want" ]; then
        continue
    fi
    get "$base/$f" "$tmp/$f" || die "$f не скачался — файлы не тронуты"
    [ -s "$tmp/$f" ] || die "$f пришёл пустым — файлы не тронуты"
    # Сразу после выпуска кеш GitHub может отдать новый .sha256 и прежний файл: тогда
    # хеш не сойдётся, ничего не меняем, следующий запуск возьмёт сошедшуюся пару.
    [ "$(sha "$tmp/$f")" = "$want" ] || die "$f: SHA-256 не совпал с $f.sha256 — файлы не тронуты"
    chmod 644 "$tmp/$f"
    todo="$todo $f"
done

if [ -z "$todo" ]; then
    if [ -n "$svc" ] && [ -f "$mark" ]; then
        echo "aegis-update: файлы не менялись, но прошлый перезапуск $svc не прошёл — повторяю" >&2
    else
        echo "aegis-update: без изменений" >&2
        exit 0
    fi
else
    if [ -n "$svc" ]; then
        : > "$mark" || die "не создать отметку $mark — файлы не тронуты"
    fi
    for f in $todo; do
        mv -f "$tmp/$f" "$dir/$f" || die "не удалось поставить $f на место"
    done
    echo "aegis-update: обновлены$todo" >&2
fi
if [ -n "$svc" ]; then
    systemctl restart "$svc" || die "$svc не перезапустился — следующий запуск повторит перезапуск"
    rm -f "$mark"
else
    echo "aegis-update: службу не указали — перезапустите Xray сами" >&2
fi
