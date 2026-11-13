#!/bin/bash
# Релиз GitHub после публикации (задача publish в build.yml, шаг «Выпустить релиз»).
# Шаг идёт, только когда изменились файлы списков, или при ручном запуске с release=true —
# по списку релизов видно, когда вышла новая версия списков.
#
# Тег и название — дата UTC из сообщения коммита (ГГГГ-ММ-ДД); такой тег уже есть — -2, -3…
# Цель — опубликованный коммит, файлы релиза берутся из него же (git archive), а не из
# рабочей копии: .dat и .sha256 для Xray, .srs для sing-box и zip всех каталогов списков.
# Разница в тексте — с последним выпущенным релизом (не черновиком): так и выпуск вручную после
# сбоя показывает, что изменилось с прошлого релиза. Релизов нет — «Первый выпуск».
# В тексте релиза — только числа из stats.json, названия списков (по белому списку символов)
# и ссылки. Строк из чужих данных (домены, владельцы сетей) нет: GitHub отрисовал бы их
# разметку и @упоминания.
#
# Ключ — GH_TOKEN в окружении только этого шага (github.token задачи publish, contents: write);
# в командную строку он не попадает. Упал релиз — опубликованный коммит остаётся, шаг падает
# с ::error:: и подсказкой, как выпустить заново.
#
# Вызов: release.sh <рабочая копия>
#   AEGIS_SHA, AEGIS_DATE, AEGIS_CHANGED (true/false) — выходы publish.sh;
#   GITHUB_REPOSITORY, GITHUB_SERVER_URL, GITHUB_RUN_ID — из Actions.
set -euo pipefail

repo="${1:?нужна рабочая копия}"
# Те же каталоги, что outdirs в publish.sh: менять вместе.
outdirs=(lists xray mihomo amnezia wireguard sing-box happ shadowrocket)

why='смотрите журнал шага'
sha="${AEGIS_SHA:-}"
work=$(mktemp -d)
cleanup() {
    local rc=$?
    rm -rf "$work"
    if [ "$rc" -ne 0 ]; then
        echo "::error::Релиз не выпущен: $why. Списки уже опубликованы (коммит ${sha:-?}), их это не отменяет. Выпустить заново: Actions → build → Run workflow с галочкой «Выпустить релиз»; кнопка Re-run здесь не поможет." >&2
    fi
}
trap cleanup EXIT
die() { why="$1"; exit 1; }

# Всё, что пойдёт в текст релиза, ссылки и имена, — по строгому образцу.
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { sha=''; die "AEGIS_SHA не похож на коммит"; }
day="${AEGIS_DATE:-}"
[[ "$day" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || die "AEGIS_DATE не похож на ГГГГ-ММ-ДД"
changed="${AEGIS_CHANGED:-}"
[[ "$changed" =~ ^(true|false)$ ]] || die "AEGIS_CHANGED не true и не false"
slug="${GITHUB_REPOSITORY:-}"
[[ "$slug" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || die "GITHUB_REPOSITORY не похож на владелец/репозиторий"
server="${GITHUB_SERVER_URL:-https://github.com}"
[[ "$server" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || die "GITHUB_SERVER_URL не похож на адрес GitHub"
run="${GITHUB_RUN_ID:-}"
[[ "$run" =~ ^[0-9]+$ ]] || die "GITHUB_RUN_ID не число"
[ -n "${GH_TOKEN:-}" ] || die "нет GH_TOKEN"
git -C "$repo" cat-file -e "$sha^{commit}" 2>/dev/null || die "коммита $sha нет в рабочей копии"
export GH_PROMPT_DISABLED=1

# Прошлый выпуск — последний релиз, не черновик. Не ответил GitHub — стоп, а не «Первый выпуск».
prevtag=$(gh release list --repo "$slug" --exclude-drafts --limit 1 --json tagName -q '.[0].tagName // ""') \
    || die "не получен список релизов (gh release list)"
prev="$work/prev-stats.json"
if [ -n "$prevtag" ]; then
    [[ "$prevtag" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}(-[0-9]+)?$ ]] || die "тег последнего релиза не вида ГГГГ-ММ-ДД[-N]"
    git -C "$repo" fetch --quiet --depth=1 origin "refs/tags/$prevtag:refs/tags/$prevtag" \
        || die "тег прошлого выпуска $prevtag не получен из origin"
    # Нет stats.json в выпуске — значения без сравнения, с пометкой в тексте.
    git -C "$repo" show "refs/tags/$prevtag:stats.json" > "$prev" 2>/dev/null || rm -f "$prev"
fi

# Свободный тег: дата, иначе дата-2, дата-3… Теги — из origin, а не из неполной копии.
tags=$(git -C "$repo" ls-remote --tags --refs origin) || die "не получен список тегов из origin"
tags=$(cut -f2 <<<"$tags")
tag="$day"; n=1
while grep -qxF "refs/tags/$tag" <<<"$tags"; do
    n=$((n + 1)); tag="$day-$n"
    [ "$n" -le 99 ] || die "за $day уже 99 тегов"
done

# Файлы релиза — плоско, имена уникальны и без «#» (у gh это начало подписи файла).
mkdir -p "$work/tree" "$work/assets"
git -C "$repo" archive --format=tar "$sha" -- "${outdirs[@]}" | tar -xf - -C "$work/tree" \
    || die "каталоги списков не извлечены из коммита"
git -C "$repo" archive --format=zip --prefix="aegis-lists-$tag/" -o "$work/assets/aegis-lists-$tag.zip" \
    "$sha" -- "${outdirs[@]}" || die "zip каталогов списков не собран"
shopt -s nullglob
srs=("$work/tree/sing-box/"*.srs)
shopt -u nullglob
[ "${#srs[@]}" -gt 0 ] || die "в sing-box/ нет .srs"
for f in "$work/tree/xray/aegis-ip.dat" "$work/tree/xray/aegis-site.dat" \
         "$work/tree/xray/aegis-ip.dat.sha256" "$work/tree/xray/aegis-site.dat.sha256" "${srs[@]}"; do
    b=$(basename "$f")
    # Имя — из коммита сборки: в сообщение только после проверки.
    [[ "$b" =~ ^[A-Za-z0-9._-]+$ ]] || die "имя одного из файлов релиза не годится (не A-Za-z0-9._-)"
    [ -s "$f" ] || die "${f#"$work/tree/"} пустой или его нет"
    [ ! -e "$work/assets/$b" ] || die "два файла релиза с именем $b"
    cp "$f" "$work/assets/$b"
done
assets=("$work/assets/"*)

# Текст релиза: этот stats.json против stats.json прошлого выпуска.
git -C "$repo" show "$sha:stats.json" > "$work/stats.json" || die "в коммите нет stats.json"
python3 -I - "$work/stats.json" "$prev" "$prevtag" "$changed" "$tag" "$server/$slug" "$sha" "$run" "$work/notes.md" \
    <<'PY' || die "текст релиза не собран (stats.json не того вида)"
import datetime, json, re, sys

cur_path, prev_path, prevtag, changed, tag, base, sha, run, out_path = sys.argv[1:]
KEY = re.compile(r'[a-z0-9-]{1,40}')
# Название — из build.py, но в Markdown ничего лишнего: буквы, цифры, пробел и простая пунктуация.
TITLE = re.compile(r'[0-9A-Za-zЀ-ӿ ,()«»—–-]{1,80}')
FIELDS = (('whole', 'Свои сети целиком'), ('point', 'Адресов точечно'), ('v4', 'Строк IPv4'),
          ('v6', 'Строк IPv6'), ('domains', 'Доменов'))


def num(v):
    if isinstance(v, bool) or not isinstance(v, int) or not 0 <= v < 10 ** 9:
        raise ValueError('не число: %r' % (v,))
    return v


def lists_of(stats):
    if not isinstance(stats, dict) or stats.get('format') != 1 or not isinstance(stats.get('lists'), dict):
        raise ValueError('не тот формат')
    out = {}
    for key, v in stats['lists'].items():
        if not KEY.fullmatch(key) or not isinstance(v, dict):
            raise ValueError('список %r' % (key,))
        title = v.get('title')
        out[key] = {'title': title if isinstance(title, str) and TITLE.fullmatch(title) else key,
                    **{f: num(v.get(f)) for f, _ in FIELDS}}
    return out


cur = json.load(open(cur_path, encoding='utf-8'))
now = lists_of(cur)
if not now:
    sys.exit('в stats.json нет списков')
old = None
if prevtag:
    try:
        old = lists_of(json.load(open(prev_path, encoding='utf-8')))
    except (OSError, ValueError):
        old = None

gen = cur.get('generated')
when = (datetime.datetime.fromtimestamp(gen, datetime.timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
        if isinstance(gen, int) and not isinstance(gen, bool) and 0 < gen < 10 ** 10 else tag)

L = ['Сборка списков **%s**.' % when, '']
why = ('Файлы списков изменились с прошлой сборки.' if changed == 'true'
       else 'Выпуск запущен вручную: с прошлой сборки файлы списков не изменились.')
if old is not None:
    L.append('%s В скобках — разница с выпуском %s.' % (why, prevtag))
elif prevtag:
    L.append('%s stats.json выпуска %s не прочитан — значения без сравнения.' % (why, prevtag))
else:
    L.append('%s Первый выпуск — значения без сравнения.' % why)
L += ['', '| Список | ' + ' | '.join(t for _, t in FIELDS) + ' |', '|---|' + '---:|' * len(FIELDS)]
for key, v in now.items():
    was = old.get(key) if old is not None else None
    cells = []
    for f, _ in FIELDS:
        if was is None:
            cells.append('%d' % v[f])
        else:
            d = v[f] - was[f]
            cells.append('%d (%s)' % (v[f], '±0' if d == 0 else '+%d' % d if d > 0 else '−%d' % -d))
    mark = ' (новый)' if old is not None and was is None else ''
    L.append('| **%s**%s | %s |' % (v['title'], mark, ' | '.join(cells)))
for key, was in (old or {}).items():
    if key not in now:
        L += ['', 'Список **%s** убран (был в выпуске %s).' % (was['title'], prevtag)]
L += ['',
      '- Генератор: https://aegis-routing.github.io/',
      '- Что в списках: [summary.md](%s/blob/%s/summary.md)' % (base, sha),
      ('- Что изменилось в файлах с выпуска %s: [сравнение](%s/compare/%s...%s)' % (prevtag, base, prevtag, sha)
       if prevtag else '- Коммит: [%s](%s/commit/%s)' % (sha[:7], base, sha)),
      '- Сборка: [запуск Actions](%s/actions/runs/%s)' % (base, run),
      '',
      'Файлы ниже — из этого коммита: `aegis-ip.dat` и `aegis-site.dat` с `.sha256` — для Xray, `.srs` — '
      'rule-set sing-box, `aegis-lists-%s.zip` — все каталоги списков.' % tag]
with open(out_path, 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(L) + '\n')
PY

url=$(gh release create "$tag" --repo "$slug" --target "$sha" --title "$tag" --notes-file "$work/notes.md" \
      --latest "${assets[@]}") || die "gh release create не прошёл"
echo "Релиз $tag: $url (${#assets[@]} файлов)" >&2
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    printf '## Релиз [%s](%s/%s/releases/tag/%s)\n' "$tag" "$server" "$slug" "$tag" >> "$GITHUB_STEP_SUMMARY"
fi
