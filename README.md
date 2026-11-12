# Aegis — генератор маршрутизации к сервисам рунета

Настройки маршрутизации к сервисам рунета: Яндексу, ВК, банкам, Госуслугам, маркетплейсам, операторам,
магазинам. Списки их адресов и доменов собираются раз в сутки; по каждой сети сверяется, кому она принадлежит, —
целиком в список попадают только сети самого сервиса.

Что можно сделать:

- **на клиенте** — пустить эти сервисы мимо VPN (`direct`): они работают так же, как без VPN;
- **на сервере** — не пускать к ним клиентов VPN (`block`).

Удобнее первое; второе, на сервере, действует и для тех, кто на своём устройстве ничего не настроил.

> In English: a routing generator for Runet services: daily lists of IP networks and domains of Yandex, VK and other
> major Runet services, verified against RIPE. Ready-to-use files for Xray (geoip/geosite), mihomo (rule-providers),
> sing-box rule-sets (Hiddify, Karing), Happ/INCY routing profiles, Shadowrocket rule lists, AmneziaVPN split
> tunnelling and WireGuard/AmneziaWG `AllowedIPs`. Use them to block these services for VPN clients on a server, or
> to route them directly (outside the VPN) on a client.

**Генератор: [anten-ka.github.io/aegis](https://anten-ka.github.io/aegis/)** — выберите списки, приложение и что
сделать (напрямую или блокировать) — страница покажет готовые правила и что куда вставить, для Happ и INCY — ещё и
ссылку с QR. Что в списках сегодня — [summary.md](summary.md).

## Списки

| Список | Тег и имя файла | Что в нём |
|---|---|---|
| Яндекс | `yandex` | сервисы Яндекса |
| Другие сервисы рунета | `ru-services` | банки, Госуслуги, маркетплейсы, операторы, магазины и др. |
| ВК | `vk` | ВКонтакте, Почта Mail.ru, Одноклассники, Дзен, MAX, RuStore, Сферум и другие сервисы группы, а также сайты не VK (ниже) |

ВК: целиком в список попадают только собственные сети порталов VK. AS47764 — облако VK Cloud, где живут сайты чужих
компаний, поэтому из неё берутся только адреса самих сервисов, а не вся сеть.

**В списке «ВК» есть и сайты, которые не порталы VK:** сайт-источник кладёт их в ту же группу vk. На 12.11.2026 это
aliexpress.ru, cian.ru, gb.ru, skillbox.ru, skillfactory.ru, tetrika-school.ru и uchi.ru — их адреса и домены.
«ВК — блокировать» закроет и их. Перечень на сегодня сборка пишет в `stats.json` (`lists.vk.outside`), его
показывает генератор.

## Что внутри

`<список>` — `yandex`, `ru-services` или `vk`; `<набор>` — несколько списков через `_` в этом порядке, например
`yandex_vk` или `yandex_ru-services_vk`.

| Файл | Для чего |
|---|---|
| `xray/aegis-ip.dat`, `xray/aegis-site.dat` | Xray, 3X-UI, Happ, INCY: сети и домены, теги `yandex`, `ru-services`, `vk` |
| `xray/aegis-ip.dat.sha256`, `xray/aegis-site.dat.sha256` | SHA-256 файлов (64 знака): по нему INCY и скрипт обновления понимают, что файл сменился и скачался целиком |
| `mihomo/<список>-ip.txt`, `mihomo/<список>-domain.txt` | mihomo: rule-provider `ipcidr` (IPv4 и IPv6) и `domain` |
| `sing-box/geosite-aegis-<список>.srs` и `.json` | sing-box (Hiddify, Karing): домены. `.srs` — двоичный, версия 2, читает sing-box 1.10 и новее |
| `sing-box/geoip-aegis-<список>.srs` и `.json` | sing-box: сети IPv4 и IPv6 |
| `happ/<набор>-direct.json`, `happ/<набор>-block.json` | профиль маршрутизации Happ и INCY: напрямую или блокировать |
| `shadowrocket/<список>.list` | Shadowrocket: `DOMAIN-SUFFIX` и `IP-CIDR …,no-resolve` для RULE-SET |
| `amnezia/<список>.json` | приложение AmneziaVPN: раздельное туннелирование (только IPv4) |
| `wireguard/<набор>-allowedips-compact.txt` | WireGuard, AmneziaWG: `AllowedIPs` без собственных сетей сервисов |
| `wireguard/<набор>-allowedips-full.txt` | то же, без всех адресов из списка |
| `lists/<список>-v4.txt`, `lists/<список>-v6.txt` | сети одной строкой на сеть — для своих скриптов, nftables, роутеров |
| `lists/<список>_with_comments.txt` | то же с пояснением: сервис, владелец сети, правило |
| `scripts/aegis-update.sh` | обновление `.dat` на сервере: с проверкой SHA-256 и без лишних перезапусков |
| `summary.md`, `stats.json` | что в списках сегодня и что изменилось |

Ссылки на файлы — `https://raw.githubusercontent.com/anten-ka/aegis/main/<файл>`.

## Подключения WireGuard и AmneziaWG: где действуют правила

Действуют ли правила, когда приложение подключено через WireGuard или AmneziaWG, — по каждому приложению. На
устройстве проверен только INCY (iPhone, 12.11.2026); остальное — по документации и коду приложений.

- **INCY:** с действием «Напрямую» профиль сработал с подключением VLESS и не сработал с AmneziaWG — для AmneziaWG
  берите AmneziaVPN или строку AllowedIPs. WireGuard, «Блокировать» и другие устройства мы не проверяли
  ([протоколы INCY](https://github.com/INCY-DEV/incy-platforms/blob/cc03fd036deb272191bb3c23aacf67a6dbc1a092/README.md?plain=1#L72)).
- **Happ:** в документации нет ни WireGuard, ни AmneziaWG
  ([протоколы Happ](https://www.happ.su/main/faq/adding-configuration-subscription)), на устройстве Happ мы не
  проверяли; в INCY такой же профиль с AmneziaWG не действует.
- **Hiddify:** WireGuard и AmneziaWG запускает в том же ядре sing-box, что и VLESS, поэтому правила должны действовать
  и для них — так по коду ([parser.go](https://github.com/hiddify/hiddify-core/blob/b32da5d975a3ffab6ed706173839b5d0ffc55c6c/v2/config/parser.go#L158-L206),
  [builder.go](https://github.com/hiddify/hiddify-core/blob/b32da5d975a3ffab6ed706173839b5d0ffc55c6c/v2/config/builder.go#L234-L284)),
  на устройстве не проверяли.
- **Karing:** по заметкам к выпускам ([2906](https://github.com/KaringX/karing/releases/tag/v1.2.26.2906),
  [2916](https://github.com/KaringX/karing/releases/tag/v1.2.26.2916)) WireGuard и AmneziaWG работают в его ядре
  sing-box, поэтому правила должны действовать и для них — на устройстве не проверяли.
- **Shadowrocket:** по [истории версий](https://apps.apple.com/us/app/shadowrocket/id932747118) умеет WireGuard и
  AmneziaWG (какие версии AmneziaWG — неизвестно); действуют ли с ними правила, мы не проверяли.
- **Xray (v2rayN, v2rayNG):** по [документации](https://github.com/XTLS/Xray-docs-next/blob/44ed2e81cce3e0d134b901907aba75503abd82df/docs/en/config/outbounds/wireguard.md?plain=1#L3)
  правила действуют на все подключения Xray, включая WireGuard. AmneziaWG в Xray нет: файл AmneziaWG
  [v2rayN](https://github.com/2dust/v2rayN/blob/e3457fa4b4776d380d3bac271e63eeb42847ebaa/v2rayN/ServiceLib/Handler/Fmt/WireguardFmt.cs#L103-L162)
  и [v2rayNG](https://github.com/2dust/v2rayNG/blob/1fa257fab9f6eacd1b05b50b49834d5bbe5a6980/V2rayNG/app/src/main/java/com/v2ray/ang/fmt/WireguardFmt.kt#L48-L89)
  откроют как обычный WireGuard без маскировки — подключится ли он, мы не проверяли.
- **mihomo (Clash Verge Rev, FlClash):** WireGuard и AmneziaWG — такие же прокси, как VLESS, правила действуют и на них
  ([документация](https://wiki.metacubex.one/en/config/proxies/wg/), [код](https://github.com/MetaCubeX/mihomo/blob/0455d0d28c4526937380505153e65a843d8612e8/adapter/outbound/wireguard.go#L105-L143));
  AmneziaWG задаётся только в профиле YAML (`amnezia-wg-option`); на устройстве не проверяли.
- **AmneziaVPN:** с WireGuard и AmneziaWG список действует, только если в конфигурации `AllowedIPs = 0.0.0.0/0, ::/0`;
  иначе приложение показывает «Раздельное туннелирование на сервере» и список не применяет
  ([документация](https://docs.amnezia.org/documentation/instructions/vpn-split-tunneling),
  [код](https://github.com/amnezia-vpn/amnezia-client/blob/864c1faab81166579a43a06fde9dbc9076b0be92/client/vpnConnection.cpp#L412-L458));
  на устройстве не проверяли.
- **Строка AllowedIPs:** работает и с WireGuard, и с AmneziaWG. Конфигурацию AmneziaWG открывайте в приложении
  [AmneziaWG](https://docs.amnezia.org/documentation/amnezia-wg): приложение WireGuard её не примет (iOS, macOS и
  Android — по коду: [wireguard-apple](https://github.com/WireGuard/wireguard-apple/blob/2fec12a6e1f6e3460b6ee483aa00ad29cddadab1/Sources/Shared/Model/TunnelConfiguration%2BWgQuickConfig.swift#L74-L83),
  [wireguard-android](https://github.com/WireGuard/wireguard-android/blob/e7b3a3c118836e112620b1302a8ba1873ad4daac/tunnel/src/main/java/com/wireguard/config/Interface.java#L98-L100)).

## Xray и 3X-UI на сервере (блокировать)

Документация: [маршрутизация Xray](https://xtls.github.io/ru/config/routing.html), [3X-UI](https://github.com/MHSanaei/3x-ui).

1. Поставьте скрипт обновления ([прочитать его](scripts/aegis-update.sh)) и скачайте им файлы туда, где у Xray
   лежат `geoip.dat` и `geosite.dat`:

   ```bash
   curl -fsSL -o /usr/local/bin/aegis-update https://raw.githubusercontent.com/anten-ka/aegis/main/scripts/aegis-update.sh
   chmod 755 /usr/local/bin/aegis-update
   aegis-update /usr/local/x-ui/bin x-ui           # 3X-UI
   # aegis-update /usr/local/share/xray xray       # Xray
   ```

   Скрипт сначала берёт `.sha256`; совпал с файлом на диске — ничего не делает. Иначе качает оба файла во
   временные рядом, проверяет (не пустые, SHA-256 сошёлся) и только тогда ставит на место одним `mv`. Службу
   перезапускает, только если файл сменился. Оборвалась загрузка — старые файлы остаются, код выхода 1. Служба не
   перезапустилась — следующий запуск повторит перезапуск.

   Списки могут меняться почти каждый день, и тогда служба перезапускается каждую ночь: открытые подключения
   клиентов обрываются и переподключаются.

2. Добавьте правило маршрутизации. В 3X-UI — в настройках Xray, на вкладке правил маршрутизации: новое
   правило, в поле доменов `ext:aegis-site.dat:yandex`, в поле IP `ext:aegis-ip.dat:yandex`, исходящее —
   `blocked`. Сохраните и перезапустите Xray. То же в `config.json`:

   ```json
   { "type": "field", "domain": ["ext:aegis-site.dat:yandex"], "outboundTag": "blocked" },
   { "type": "field", "ip": ["ext:aegis-ip.dat:yandex"], "outboundTag": "blocked" }
   ```

   Для других списков — теги `ru-services` и `vk`. Правило по доменам работает, только если во входящем
   подключении включено определение адреса (sniffing: `http`, `tls`, `quic`).

3. Правило по сетям срабатывает на подключения по адресу. Клиенты VPN обычно передают имя сайта, и при
   `"domainStrategy": "AsIs"` (так по умолчанию в 3X-UI) такие подключения проверяются только по доменам. Чтобы
   сверять с сетями и их, поставьте в `routing` `"domainStrategy": "IPIfNonMatch"` — тогда Xray сам спрашивает DNS
   для имён, которых нет в правиле по доменам.

4. Обновление раз в сутки — строкой в `crontab -e`. Минуту и час возьмите любые свои (генератор предлагает
   случайные), чтобы не все серверы шли за файлами в одну минуту:

   ```
   23 5 * * * /usr/local/bin/aegis-update /usr/local/x-ui/bin x-ui
   ```

   Код 1 («SHA-256 не совпал») сразу после публикации — не поломка: raw.githubusercontent.com несколько минут
   отдаёт файлы из кеша (`cache-control: max-age=300`) и может прислать новый `.sha256` со старым файлом. Скрипт
   тогда ничего не меняет, следующий запуск возьмёт сошедшуюся пару.

«Напрямую» на сервере не бывает: выход с сервера и есть выход через VPN.

Reality и маскировка под сайт из списка: маскировочный сайт (`dest`) Xray открывает сам, мимо правил
маршрутизации, — правило выше его не трогает (так устроен Xray; на живом сервере это не проверяли). Закрывать эти
сети файрволом сервера (nftables, iptables) нельзя, если сервер маскируется под сайт из списка: тогда Reality
перестанет работать у всех.

## Xray на устройстве (v2rayN, v2rayNG и др.)

Файл из `ext:файл:тег` Xray ищет в каталоге ресурсов ([маршрутизация](https://xtls.github.io/ru/config/routing.html),
[каталог ресурсов](https://xtls.github.io/ru/config/env.html)). Положите туда `xray/aegis-ip.dat` и
`xray/aegis-site.dat` и добавьте то же правило: с исходящим `direct` — сервисы пойдут мимо VPN, с выходом-заглушкой
(`blackhole`) — не откроются вовсе.

Где каталог ресурсов и как называется заглушка в конкретном приложении, официальная документация v2rayN и
v2rayNG не говорит (кроме тега). **Не проверено на устройстве**, прочитано в коде:

- **v2rayN:** каталог ресурсов — папка `bin` рядом с программой ([код](https://github.com/2dust/v2rayN/blob/e3457fa4b4776d380d3bac271e63eeb42847ebaa/v2rayN/ServiceLib/Manager/CoreInfoManager.cs#L168),
  [код](https://github.com/2dust/v2rayN/blob/e3457fa4b4776d380d3bac271e63eeb42847ebaa/v2rayN/ServiceLib/Common/Utils.cs#L1233-L1235)); тег заглушки в примерах [вики v2rayN](https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules) — `block`.
- **v2rayNG:** экран «Файлы ресурсов» → «Добавить URL»: в «Название» — точное имя (`aegis-ip.dat`,
  `aegis-site.dat`), в URL — ссылка на файл; затем «Загрузить файлы». Файл ложится под этим именем в каталог,
  который v2rayNG отдаёт Xray ([код](https://github.com/2dust/v2rayNG/blob/1fa257fab9f6eacd1b05b50b49834d5bbe5a6980/V2rayNG/app/src/main/java/com/v2ray/ang/ui/userasset/UserAssetViewModel.kt#L114-L115),
  [код](https://github.com/2dust/v2rayNG/blob/1fa257fab9f6eacd1b05b50b49834d5bbe5a6980/V2rayNG/app/src/main/java/com/v2ray/ang/core/CoreNativeManager.kt#L32-L34)); тег заглушки — `block` ([код](https://github.com/2dust/v2rayNG/blob/1fa257fab9f6eacd1b05b50b49834d5bbe5a6980/V2rayNG/app/src/main/java/com/v2ray/ang/AppConfig.kt#L113-L114)).

Правило по сетям ловит подключения по имени, только если `domainStrategy` — `IPOnDemand` или `IPIfNonMatch`. При
`IPIfNonMatch` второй проход с DNS бывает, только если в первом не сработало ни одно правило; правило «всё в
прокси» без условий срабатывает в первом же проходе — тогда нужен `IPOnDemand`
([документация Xray](https://xtls.github.io/ru/config/routing.html)).

## Happ и INCY

Один профиль маршрутизации на оба приложения: `happ/<набор>-direct.json` (мимо VPN) или `-block.json`
(блокировать). В профиле — наши `aegis-ip.dat` и `aegis-site.dat` (`Geoipurl`, `Geositeurl`), теги
`geosite:yandex` и `geoip:yandex` и т. п., частные сети — адресами, `DomainStrategy` — `IPIfNonMatch`.

- **Happ** ([документация](https://www.happ.su/main/ru/dev-docs/routing), [на английском](https://www.happ.su/main/dev-docs/routing)):
  ссылка `happ://routing/onadd/{base64 профиля}` — добавляет профиль и включает его. Генератор собирает её из
  опубликованного файла и показывает QR. Когда Happ берёт свежие geo-файлы, две страницы документации говорят
  по-разному: английская — не чаще раза в неделю, даже если профиль обновляется каждый час; русская — когда в
  профиле новая дата `LastUpdated` (у нас она меняется вместе с файлами). Поэтому, чтобы взять свежие раньше,
  откройте ссылку снова — **не проверено**.
- **INCY** ([автомаршрутизация](https://incy.gitbook.io/docs/docs-en/autorouting.en),
  [маршрутизация](https://incy.gitbook.io/docs/docs-en/routing)): ссылка
  `incy://autorouting/onadd/https://raw.githubusercontent.com/anten-ka/aegis/main/happ/yandex-direct.json` —
  INCY сам проверяет профиль по ссылке (по умолчанию раз в сутки), а geo-файлы сверяет по `.sha256`.

Импорт **заменяет активную маршрутизацию** приложения: профиль активен только один. В профиле — по строке на
список в доменах (`geosite:yandex` и т. п.) и в адресах (`geoip:yandex` и т. п.): это не отдельные домены, а
категории из наших файлов, в каждой — все домены или сети списка.

**С AmneziaWG в INCY не действует.** Профиль — это правила ядра Xray. Проверено на iPhone 12.11.2026 в INCY,
действие «Напрямую»: с подключением VLESS yandex.ru/internet показал домашний адрес, с подключением AmneziaWG —
адрес VPN-сервера, то есть к AmneziaWG INCY профиль не применяет. Для AmneziaWG берите раздел «AmneziaVPN» или
«WireGuard и AmneziaWG» (там только «Напрямую»). Другие протоколы INCY, действие «Блокировать» и Happ на устройстве
мы не проверяли; что Happ принимает свои теги в чужих geo-файлах, подтверждено опытом сообщества.

## Hiddify и Karing (sing-box)

Ссылки на rule-set для списка `yandex` (для других — `ru-services`, `vk`):

```
https://raw.githubusercontent.com/anten-ka/aegis/main/sing-box/geosite-aegis-yandex.srs
https://raw.githubusercontent.com/anten-ka/aegis/main/sing-box/geoip-aegis-yandex.srs
```

- **Hiddify** 5.2.0 и новее: Настройки → Маршрутизация (Routing) → добавить правило → выход Direct или Block →
  поле Rule-set — ссылки выше. Отдельной страницы о правилах у Hiddify нет; шаги — по
  [коду приложения](https://github.com/hiddify/hiddify-app) и [истории версий](https://github.com/hiddify/hiddify-app/blob/main/HISTORY.md),
  на устройстве не проверены. Списки Hiddify обновляет сам (по коду — раз в 5 дней). Файлы `geoip-…` Hiddify не
  берёт в правила DNS — поэтому домены и сети в разных файлах.
- **Karing**: Settings → Diversion → Diversion rules → Edit → Custom diversion group → «+», группа Aegis → поле
  Rule Set — ссылки выше; затем на первом экране Diversion rules у группы выбрать действие Direct (мимо VPN) или
  Block (блокировать) и переподключиться. По документации: [путь и переподключение](https://karing.app/en/tutorial/custom-diversion),
  [поле Rule Set](https://karing.app/en/app-manual/diversion-rule-edit) (ссылка должна кончаться именем файла с
  `.srs` или `.json`), [действия группы](https://karing.app/en/app-manual/diversion-rule). По коду, **не проверено**:
  несколько ссылок — по одной в строке ([код](https://github.com/KaringX/karing/blob/02df19a29007e727fd53d2e041282bbef6134f04/lib/screens/diversion_group_custom_edit_screen.dart#L1397-L1401)),
  обновление правил по умолчанию — раз в 24 часа ([код](https://github.com/KaringX/karing/blob/02df19a29007e727fd53d2e041282bbef6134f04/lib/app/modules/setting_manager.dart#L1410)). Где группа
  стоит среди других правил, документация не говорит.

Сам формат: [rule-set sing-box](https://sing-box.sagernet.org/configuration/rule-set/). `.srs` собирает и проверяет
настоящий sing-box при каждой сборке.

## Shadowrocket

**По руководству сообщества, официальной документации нет; не проверено на iPhone.** Источник —
[неофициальное руководство](https://github.com/LOWERTOP/Shadowrocket); приложение —
[App Store](https://apps.apple.com/us/app/shadowrocket/id932747118).

Конфигурация → ⓘ у активного файла → Правило → «+» → тип RULE-SET, политика `DIRECT` (мимо VPN) или `REJECT`
(блокировать), URL — `https://raw.githubusercontent.com/anten-ka/aegis/main/shadowrocket/yandex.list`. Или строкой в
раздел `[Rule]` выше `FINAL`:

```
RULE-SET,https://raw.githubusercontent.com/anten-ka/aegis/main/shadowrocket/yandex.list,DIRECT
```

Сети IPv6 записаны как `IP-CIDR,…,no-resolve`: по руководству `IP-CIDR` подходит и для IPv4, и для IPv6.

## mihomo

Документация: [rule-providers](https://wiki.metacubex.one/config/rule-providers/).

```yaml
rule-providers:
  aegis-yandex-domain:
    type: http
    behavior: domain
    format: text
    url: https://raw.githubusercontent.com/anten-ka/aegis/main/mihomo/yandex-domain.txt
    path: ./rule-set/aegis-yandex-domain.txt
    interval: 86400
  aegis-yandex-ip:
    type: http
    behavior: ipcidr
    format: text
    url: https://raw.githubusercontent.com/anten-ka/aegis/main/mihomo/yandex-ip.txt
    path: ./rule-set/aegis-yandex-ip.txt
    interval: 86400

rules:
  - RULE-SET,aegis-yandex-domain,DIRECT
  - RULE-SET,aegis-yandex-ip,DIRECT,no-resolve
  # ...дальше ваши правила; блокировать — REJECT вместо DIRECT
```

Для других списков — `ru-services-…` и `vk-…`. Правила ставьте выше общего правила, которое отправляет всё в VPN.
С `no-resolve` правило по сетям ловит только подключения по адресу; без него mihomo сверяет с сетями и адреса
имён (ценой DNS-запроса).

## AmneziaVPN (приложение)

Документация: [раздельное туннелирование](https://docs.amnezia.org/ru/documentation/instructions/vpn-split-tunneling).

В настройках раздельного туннелирования сайтов выберите режим «Адреса из списка не должны открываться через
VPN» и импортируйте `amnezia/yandex.json` (или `ru-services.json`, `vk.json`). Только «мимо VPN»: блокировать
AmneziaVPN не умеет. Список не обновляется сам — раз в неделю-две скачивайте свежий и импортируйте заново.

## WireGuard и AmneziaWG (файл конфигурации)

Документация: [WireGuard](https://www.wireguard.com/quickstart/), [AmneziaWG](https://docs.amnezia.org/documentation/amnezia-wg).

У WireGuard нет правил «не пускать»: в туннель идёт то, что перечислено в `AllowedIPs`. Поэтому файлы
`wireguard/<набор>-allowedips-*.txt` — это готовая строка «весь интернет, кроме этих сервисов и домашней сети».
Замените ею строку `AllowedIPs` в разделе `[Peer]` и переподключитесь. Блокировать так нельзя — только «мимо VPN».

- `compact` — без собственных сетей сервисов: от 400 до 1 500 записей (на 12.11.2026), подходит для телефонов.
- `full` — без всех адресов из списка: от 4,7 до 28 тысяч записей, для компьютеров и роутеров; на телефоне
  может тормозить.

Точные числа на сегодня — в `stats.json` и в генераторе.

**Linux (wg-quick) и роутеры: маршрут до своего сервера.** Строка — «всё, кроме списков», поэтому в ней и адрес
вашего VPN-сервера. wg-quick для каждой записи `AllowedIPs`, кроме `0.0.0.0/0` и `::/0`, добавляет обычный маршрут
в туннель ([man wg-quick](https://git.zx2c4.com/wireguard-tools/about/src/man/wg-quick.8),
[код](https://github.com/WireGuard/wireguard-tools/blob/ba8556ce45c230906041a1a04450b7b638057917/src/wg-quick/linux.bash#L168-L180)), и пакеты до самого сервера тоже уйдут в туннель — соединение не поднимется. Добавьте до сервера
маршрут мимо туннеля в раздел `[Interface]` (шлюз и сетевая карта — из `ip route show default`):

```
PostUp = ip route add <адрес сервера>/32 via <шлюз> dev <сетевая карта>
PostDown = ip route del <адрес сервера>/32
```

На роутере — то же его средствами: маршрут до сервера через провайдера.
Прошивки роутеров, Windows и приложения на телефоне мы не проверяли.

## Как собираются списки

- Адреса и домены — [russia.iplist.opencck.org](https://russia.iplist.opencck.org) (rekryt/iplist, MIT): сайт раз
  в час разрешает домены сервисов через несколько DNS, IPv4 и IPv6. Группы сайта: yandex, russia, vk.
- Владелец каждой сети — [RIPEstat](https://stat.ripe.net). Сети владельца — только объявленные сейчас (за
  последние двое суток), а не за две недели.
- Правила:

  | Где адрес | Что попадает в список |
  |---|---|
  | В собственной сети сервиса | Все сети этого владельца целиком |
  | У оператора, в облаке, у хостера | Только сам адрес |
  | На общем CDN или защите от атак (Akamai, Cloudflare, DDoS-Guard и т. п.) | Ничего: там чужие сайты |
  | Владелец ещё не разобран | Ничего, пока его не разберут |

- Домены, где живут чужие сайты и службы (хранилище Yandex Cloud, сервисы Huawei, чужие трекеры), по имени в
  списки не попадают. Общие зоны (`com.ru`, `msk.ru` и другие из Public Suffix List) и бесплатные хостинги не
  принимаются вовсе. Сети GitHub и Telegram не попадают никогда.
- Сборка не публикуется, если что-то пошло не так — тогда остаются вчерашние файлы:
  - сайт не ответил или RIPE не ответил на заметную долю запросов;
  - RIPE не ответил про сети владельца: берутся его сети из прошлой сборки, если им не больше 14 дней (на панели
    — ⚠️), иначе сборка останавливается, а не выкидывает сервис молча;
  - сети, адреса или домены списка выросли больше чем втрое или уменьшились больше чем вдвое; за одну сборку
    появилось больше 50 новых доменов второго уровня; превышены потолки размера;
  - новых сетей для проверки в RIPE больше обычного (сломанный или подменённый ответ сайта) — тогда RIPE не
    спрашиваем вовсе;
  - файлы не прошли проверку (ниже).
- Собирает GitHub Actions этого репозитория раз в сутки (`.github/workflows/build.yml`, код — `scripts/`,
  правила — `rules/asn-classes.tsv`). Сборка идёт с правом только на чтение; публикует отдельная задача.
- Проверка перед публикацией: `scripts/validate.py` разбирает каждый файл и сверяет файлы между собой (сети и
  домены, `.dat` против текстовых списков, `.sha256`, JSON AmneziaVPN, rule-set sing-box, списки Shadowrocket,
  профили Happ, строки AllowedIPs покрывают всё, кроме списков); затем настоящий Xray загружает `.dat` (и
  отвергает несуществующий тег), sing-box собирает `.srs` и находит в них адрес и домен из списка (и не находит
  чужие), а mihomo проверяет конфиг с нашими списками (`mihomo -t`). Читает ли `mihomo -t` сами файлы списков, не
  подтверждено: если нет, в журнале сборки будет предупреждение, а содержимое списков для mihomo проверяет только
  `validate.py`. Версии и SHA-256 ядер закреплены в `build.yml`.
- На серверах с goInstaller (anten-ka) списки будут включаться в меню «Защита» — готовится.

Нашли сервис не в том списке или ошибку владельца — откройте issue.
