# Aegis: маршрутизация к сервисам рунета

**12.11.2026 16:40 UTC** · сборка 285 с · ✅ можно публиковать

## Что в списках

| Список | Свои сети целиком | Адресов точечно | Охват, блоков /24 | Строк IPv4 | Строк IPv6 | Доменов | С прошлой сборки |
|---|---:|---:|---:|---:|---:|---:|---|
| **Яндекс** | 47 | 730 | 755 | 650 | 82 | 100 | первая сборка |
| **Другие сервисы рунета** | 210 | 2870 | 257 | 2497 | 69 | 307 | первая сборка |
| **ВК** | 33 | 519 | 246 | 444 | 28 | 63 | первая сборка |

goInstaller на сервере примет не больше 16384 блоков /24 на список. Своя сеть — вся сеть принадлежит сервису по RIPE; точечно — адрес в облаке, у оператора или хостера.

## Как разобраны адреса сайта

**Яндекс** — 4469 адресов с сайта

| Правило | Адресов | |
|---|---:|---|
| своя сеть | 3515 | `███████████████████░░░░░` |
| адресом | 771 | `████░░░░░░░░░░░░░░░░░░░░` |
| CDN — не трогаем | 79 | `░░░░░░░░░░░░░░░░░░░░░░░░` |
| под вопросом | 104 | `█░░░░░░░░░░░░░░░░░░░░░░░` |

**Другие сервисы рунета** — 5900 адресов с сайта

| Правило | Адресов | |
|---|---:|---|
| своя сеть | 1439 | `██████░░░░░░░░░░░░░░░░░░` |
| адресом | 2971 | `████████████░░░░░░░░░░░░` |
| CDN — не трогаем | 1140 | `█████░░░░░░░░░░░░░░░░░░░` |
| под вопросом | 350 | `█░░░░░░░░░░░░░░░░░░░░░░░` |

**ВК** — 2223 адресов с сайта

| Правило | Адресов | |
|---|---:|---|
| своя сеть | 148 | `██░░░░░░░░░░░░░░░░░░░░░░` |
| адресом | 665 | `███████░░░░░░░░░░░░░░░░░` |
| CDN — не трогаем | 1201 | `█████████████░░░░░░░░░░░` |
| под вопросом | 209 | `██░░░░░░░░░░░░░░░░░░░░░░` |

## Сервисы: что попадает в списки

<details><summary>Яндекс — по каждому сайту</summary>

| Сайт | Свои сети (AS) | Своя сеть | Адресом | CDN | Под вопросом |
|---|---|---:|---:|---:|---:|
| yandex.ru | AS13238 | 2547 | 145 | 75 | 77 |
| yandex@cloud | AS13238 | 18 | 606 | 0 | 0 |
| yandex@cdn | AS13238 | 325 | 12 | 2 | 24 |
| yandex@maps | AS13238 | 102 | 0 | 0 | 0 |
| yandex@kinopoisk.ru | AS13238 | 96 | 0 | 0 | 0 |
| yandex@market | AS13238 | 83 | 3 | 2 | 0 |
| yandex@mail | AS13238 | 68 | 0 | 0 | 0 |
| yandex@media | AS13238 | 64 | 0 | 0 | 2 |
| yandex@business | AS13238 | 43 | 0 | 0 | 1 |
| yandex@disk | AS13238 | 36 | 0 | 0 | 0 |
| yandex@web | AS13238 | 36 | 0 | 0 | 0 |
| yandex@alice | AS13238 | 31 | 0 | 0 | 0 |
| yandex@tools | AS13238 | 29 | 0 | 0 | 0 |
| yandex@auto.ru | AS13238 | 20 | 2 | 0 | 0 |
| yandex@other | AS13238 | 13 | 0 | 0 | 0 |
| yandex@smartcaptcha | AS13238 | 4 | 2 | 0 | 0 |

</details>

<details><summary>Другие сервисы рунета — по каждому сайту</summary>

| Сайт | Свои сети (AS) | Своя сеть | Адресом | CDN | Под вопросом |
|---|---|---:|---:|---:|---:|
| mts.ru | — | 0 | 759 | 352 | 50 |
| mos.ru | — | 0 | 435 | 58 | 50 |
| vtb.ru | AS24823, AS41551 | 264 | 85 | 33 | 30 |
| sberbank.ru | AS35237 | 250 | 81 | 93 | 15 |
| beeline.ru | — | 0 | 249 | 3 | 15 |
| megafon.ru | — | 0 | 243 | 12 | 49 |
| alfabank.ru | AS15632 | 176 | 35 | 19 | 20 |
| ozon.ru | AS44386, AS207986 | 167 | 15 | 12 | 20 |
| magnit.ru | AS57319 | 58 | 119 | 48 | 18 |
| gosuslugi.ru | AS196747 | 30 | 124 | 2 | 0 |
| wb.ru | AS57073 | 145 | 7 | 0 | 0 |
| nalog.ru | — | 0 | 148 | 0 | 2 |
| t2.ru | — | 0 | 122 | 4 | 14 |
| gazprombank.ru | AS35022, AS48033 | 81 | 21 | 7 | 0 |
| rzd.ru | AS20702 | 27 | 60 | 4 | 8 |
| 2gis.ru | AS197482 | 35 | 44 | 80 | 19 |
| detmir.ru | AS42661 | 14 | 35 | 17 | 9 |
| genotek.ru | — | 0 | 48 | 3 | 0 |
| mosreg.ru | AS203891 | 32 | 16 | 24 | 6 |
| vkusvill.ru | AS213506 | 7 | 35 | 83 | 3 |
| pochta.ru | AS49002 | 31 | 10 | 0 | 0 |
| bitrix24.ru | — | 0 | 40 | 141 | 1 |
| rosreestr.gov.ru | — | 0 | 36 | 0 | 0 |
| tbank.ru | AS43399 | 15 | 17 | 1 | 1 |
| lamoda.ru | AS57906 | 4 | 22 | 16 | 7 |
| x5.ru | AS44704 | 16 | 9 | 3 | 0 |
| avito.ru | AS201012 | 15 | 7 | 46 | 3 |
| cdek.ru | — | 0 | 22 | 18 | 0 |
| rutube.ru | AS207353 | 9 | 13 | 8 | 1 |
| saby.ru | AS208981, AS214063 | 19 | 2 | 4 | 0 |
| vkusnoitochka.ru | — | 0 | 18 | 1 | 6 |
| habr.com | AS204671 | 10 | 6 | 11 | 2 |
| medsi.ru | AS206295 | 2 | 10 | 10 | 0 |
| mosenergosbyt.ru | AS62358 | 5 | 7 | 0 | 0 |
| hh.ru | AS47724 | 3 | 8 | 9 | 0 |
| reso.ru | AS39266 | 3 | 8 | 0 | 0 |
| invitro.ru | AS197379 | 3 | 7 | 1 | 0 |
| myspar.ru | — | 0 | 10 | 2 | 0 |
| rendez-vous.ru | AS61326 | 3 | 7 | 0 | 0 |
| avtodor-tr.ru | AS20698 | 5 | 1 | 8 | 0 |
| twinby.ru | — | 0 | 6 | 0 | 0 |
| fssp.gov.ru | — | 0 | 5 | 1 | 0 |
| leroymerlin.ru | AS208008 | 4 | 1 | 0 | 1 |
| mvd.ru | AS44560 | 2 | 3 | 2 | 0 |
| tenderplan.ru | — | 0 | 5 | 2 | 0 |
| mosobleirc.ru | AS62358 | 2 | 2 | 0 | 0 |
| onepricecoffee.com | — | 0 | 4 | 2 | 0 |
| bestbenefits.ru | — | 0 | 3 | 0 | 0 |
| roszdravnadzor.gov.ru | AS197571 | 2 | 1 | 0 | 0 |

</details>

<details><summary>ВК — по каждому сайту</summary>

| Сайт | Свои сети (AS) | Своя сеть | Адресом | CDN | Под вопросом |
|---|---|---:|---:|---:|---:|
| mail.ru | AS49988, AS60863 | 3 | 205 | 12 | 33 |
| vk.com | AS47541, AS62243 | 72 | 88 | 1 | 9 |
| sferum.ru | AS47541 | 36 | 31 | 1 | 0 |
| rustore.ru | AS47541 | 28 | 37 | 0 | 23 |
| max.ru | AS47541 | 1 | 57 | 0 | 1 |
| tetrika-school.ru | — | 0 | 36 | 19 | 0 |
| mailru@other | — | 0 | 33 | 0 | 0 |
| uchi.ru | — | 0 | 27 | 30 | 3 |
| ok.ru | — | 0 | 26 | 0 | 0 |
| skillfactory.ru | — | 0 | 26 | 28 | 7 |
| dzen.ru | — | 0 | 20 | 0 | 0 |
| gb.ru | — | 0 | 18 | 2 | 0 |
| cian.ru | — | 0 | 17 | 2 | 0 |
| skillbox.ru | — | 0 | 17 | 405 | 17 |
| vk@vkplay.ru | — | 0 | 16 | 2 | 6 |
| vk@vkvideo.ru | AS47541 | 8 | 1 | 0 | 0 |
| tamtam.chat | — | 0 | 5 | 0 | 0 |
| youla.ru | — | 0 | 2 | 1 | 0 |
| mailru@cloud.mail.ru | — | 0 | 1 | 0 | 0 |
| mailru@news.mail.ru | — | 0 | 1 | 0 | 0 |
| mailru@otvet.mail.ru | — | 0 | 1 | 0 | 0 |
| aliexpress.ru | — | 0 | 0 | 698 | 110 |

</details>

## Домены

Имя покрывает и поддомены. Яндекс — 100, Другие сервисы рунета — 307, ВК — 63.

Общие домены, где живут чужие сайты и службы, в списки не берём: yandexcloud.net — 638, dbankcloud.ru — 2, yandexcloud.kz — 1, adjust.com — 1, dbankcloud.com — 1.

Зоны с чужими сайтами (com.ru, msk.ru, площадки вроде tilda.ws) целиком в списки не берём: не встретились.

## Файлы для ядер и приложений

Как подключить — README репозитория и [генератор маршрутизации](https://anten-ka.github.io/aegis/).

<details><summary>48 файлов</summary>

| Для чего | Файл | Записей | Размер |
|---|---|---:|---:|
| Xray | `xray/aegis-ip.dat` | 3770 | 39 КБ |
| Xray | `xray/aegis-site.dat` | 470 | 10 КБ |
| mihomo | `mihomo/yandex-ip.txt` | 732 | 13 КБ |
| mihomo | `mihomo/yandex-domain.txt` | 100 | 1 КБ |
| AmneziaVPN | `amnezia/yandex.json` | 650 | 33 КБ |
| sing-box | `sing-box/geosite-aegis-yandex.json` | 100 | 2 КБ |
| sing-box | `sing-box/geoip-aegis-yandex.json` | 732 | 18 КБ |
| Shadowrocket | `shadowrocket/yandex.list` | 832 | 29 КБ |
| mihomo | `mihomo/ru-services-ip.txt` | 2566 | 43 КБ |
| mihomo | `mihomo/ru-services-domain.txt` | 307 | 6 КБ |
| AmneziaVPN | `amnezia/ru-services.json` | 2497 | 127 КБ |
| sing-box | `sing-box/geosite-aegis-ru-services.json` | 307 | 8 КБ |
| sing-box | `sing-box/geoip-aegis-ru-services.json` | 2566 | 61 КБ |
| Shadowrocket | `shadowrocket/ru-services.list` | 2873 | 101 КБ |
| mihomo | `mihomo/vk-ip.txt` | 472 | 8 КБ |
| mihomo | `mihomo/vk-domain.txt` | 63 | 873 Б |
| AmneziaVPN | `amnezia/vk.json` | 444 | 23 КБ |
| sing-box | `sing-box/geosite-aegis-vk.json` | 63 | 1 КБ |
| sing-box | `sing-box/geoip-aegis-vk.json` | 472 | 11 КБ |
| Shadowrocket | `shadowrocket/vk.list` | 535 | 18 КБ |
| WireGuard / AmneziaWG | `wireguard/yandex-allowedips-compact.txt` | 381 | 5 КБ |
| WireGuard / AmneziaWG | `wireguard/yandex-allowedips-full.txt` | 6745 | 129 КБ |
| Happ / INCY | `happ/yandex-direct.json` | 1 | 534 Б |
| Happ / INCY | `happ/yandex-block.json` | 1 | 532 Б |
| WireGuard / AmneziaWG | `wireguard/ru-services-allowedips-compact.txt` | 1253 | 19 КБ |
| WireGuard / AmneziaWG | `wireguard/ru-services-allowedips-full.txt` | 20503 | 383 КБ |
| Happ / INCY | `happ/ru-services-direct.json` | 1 | 549 Б |
| Happ / INCY | `happ/ru-services-block.json` | 1 | 547 Б |
| WireGuard / AmneziaWG | `wireguard/vk-allowedips-compact.txt` | 405 | 6 КБ |
| WireGuard / AmneziaWG | `wireguard/vk-allowedips-full.txt` | 4678 | 86 КБ |
| Happ / INCY | `happ/vk-direct.json` | 1 | 522 Б |
| Happ / INCY | `happ/vk-block.json` | 1 | 520 Б |
| WireGuard / AmneziaWG | `wireguard/yandex_ru-services-allowedips-compact.txt` | 1367 | 21 КБ |
| WireGuard / AmneziaWG | `wireguard/yandex_ru-services-allowedips-full.txt` | 25708 | 487 КБ |
| Happ / INCY | `happ/yandex_ru-services-direct.json` | 2 | 590 Б |
| Happ / INCY | `happ/yandex_ru-services-block.json` | 2 | 588 Б |
| WireGuard / AmneziaWG | `wireguard/yandex_vk-allowedips-compact.txt` | 552 | 8 КБ |
| WireGuard / AmneziaWG | `wireguard/yandex_vk-allowedips-full.txt` | 10341 | 196 КБ |
| Happ / INCY | `happ/yandex_vk-direct.json` | 2 | 563 Б |
| Happ / INCY | `happ/yandex_vk-block.json` | 2 | 561 Б |
| WireGuard / AmneziaWG | `wireguard/ru-services_vk-allowedips-compact.txt` | 1403 | 21 КБ |
| WireGuard / AmneziaWG | `wireguard/ru-services_vk-allowedips-full.txt` | 23493 | 441 КБ |
| Happ / INCY | `happ/ru-services_vk-direct.json` | 2 | 578 Б |
| Happ / INCY | `happ/ru-services_vk-block.json` | 2 | 576 Б |
| WireGuard / AmneziaWG | `wireguard/yandex_ru-services_vk-allowedips-compact.txt` | 1501 | 23 КБ |
| WireGuard / AmneziaWG | `wireguard/yandex_ru-services_vk-allowedips-full.txt` | 28316 | 537 КБ |
| Happ / INCY | `happ/yandex_ru-services_vk-direct.json` | 3 | 619 Б |
| Happ / INCY | `happ/yandex_ru-services_vk-block.json` | 3 | 617 Б |

</details>

## Владельцы, которых нет в таблице

Их адреса **в списки не берём**, пока владельца не внесут в `asn-classes.tsv`.

| AS | Владелец по RIPE | Адресов | Где встретился |
|---|---|---:|---|
| AS45102 | ALIBABA-CN-NET - Alibaba (US) Technology Co., Ltd. | 59 | aliexpress.ru, rustore.ru |
| AS199524 | GCORE G-Core Labs S.A. | 32 | alfabank.ru, megafon.ru, vtb.ru, yandex@cdn |
| AS211914 | AERCA-NET AER-CA LLC | 27 | aliexpress.ru |
| AS6762 | SEABONE-NET TELECOM ITALIA SPARKLE S.p.A. | 26 | aliexpress.ru |
| AS1299 | TWELVE99 Arelion Sweden AB | 18 | aliexpress.ru |
| AS21051 | NIVAL-AS ASTRUM LLC | 16 | mail.ru, vk@vkplay.ru |
| AS49063 | DTLN Data Storage Center JSC | 16 | 2gis.ru, beeline.ru, detmir.ru, mos.ru |
| AS54994 | ML-1432-54994 - Meteverse Limited. | 15 | mts.ru |
| AS25513 | ASN-MGTS-USPD PJSC Moscow city telephone network | 13 | mos.ru |
| AS19750 | AS-CRITEO - Criteo Corp. | 12 | lamoda.ru, skillbox.ru, skillfactory.ru |
| AS62268 | E-Moskva-AS Joint Stock Company Electronic Moscow | 11 | mos.ru |
| AS9002 | RETN-AS RETN Limited | 10 | yandex@cdn, yandex@media |
| AS43647 | AS-SERVERCORE-UZ SERVERCORE CIS FE LLC | 10 | yandex.ru |
| AS199669 | ATLEX-AS Okay-Telecom Ltd. | 10 | mts.ru, skillbox.ru |
| AS200107 | KL-EXT Kaspersky Lab Switzerland GmbH | 10 | magnit.ru |

…и ещё 145 AS.

## Проверки

- ✅ все проверки пройдены
- RIPE: 2810 запросов, из кеша 0 блоков из 2481, без ответа 0

Источники: [russia.iplist.opencck.org](https://russia.iplist.opencck.org) (MIT, rekryt/iplist) · [RIPEstat](https://stat.ripe.net) · правила — `rules/asn-classes.tsv` · [генератор маршрутизации](https://anten-ka.github.io/aegis/).
