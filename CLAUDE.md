# DUTYFATCH — правила проекта (общая часть для всех этапов)

## О проекте
Сайт DUTYFATCH — каталог моей винтажной одежды (Япония, Китай, Таиланд и др.).
Сайт показывает, что есть в наличии и что едет, чтобы покупатели не искали это
по Telegram-каналу. Оплаты, корзины и поиска нет — покупатель пишет мне в Telegram.
Выбора языка и страны нет.

## Стек
HTML, CSS, чистый JavaScript, без фреймворков и сборщиков. Хостинг — GitHub Pages.
Проверяю через Live Server в VS Code.

## Как работать со мной
- Я учусь программированию. В коде короткие комментарии на русском.
- Делай ТОЛЬКО текущий этап, который я прислал. Остальное не трогай.
- В конце этапа: перечисли созданные/изменённые файлы, объясни логику в 5–7
  пунктах и напиши, как проверить.
- Коммит делай только после того, как я напишу, что проверил.
- Папку ../_old не используй — это старая версия, она устарела.

## Структура файлов
index.html, catalog.html, product.html,
css/style.css,
js/data.js (загрузка таблицы), js/common.js (шапка, подвал, карточка, правила статусов),
js/home.js, js/catalog.js, js/product.js,
images/ (фото товаров), images/categories/<slug>.jpg (обложки категорий).

## Дизайн
Референсы: https://7sehnsucht.com/ (структура, плитки категорий, фото на странице товара),
https://nofaithstudios.com/ (цвета и шрифты), мой макет Figma (текст и кнопки на
странице товара, окно замеров).
- Белый фон, чёрный текст, тонкие чёрные линии-разделители, никаких цветных
  акцентов. Цвета и шрифты — переменные в :root.
- Меню, заголовки, категории — Oswald (Google Fonts), жирный, ЗАГЛАВНЫМИ.
- Названия товаров и цены — IBM Plex Mono, ЗАГЛАВНЫМИ.
- Верхней полоски-объявления нет.
- Mobile-first, адаптив: телефон в приоритете.
- Цены в BYN.

## Язык
- Английский: логотип, меню, категории, заголовки разделов, названия вещей.
- Русский: статусы, «Размер», «Замеры» и окно замеров, «Ожидается: …», блок заказа,
  «Как купить», «Telegram-канал DUTYFATCH», сообщения об ошибках.

## Ссылки (константы в js/common.js)
- Канал: https://t.me/dutyfatch
- Личка для заказов: https://t.me/razvall_chieff

## Категории (slug → название)
all → ALL PRODUCTS, tops → TOPS, outerwear → OUTERWEAR, pants → PANTS,
shoes → SHOES, accessories → ACCESSORIES, vintage → VINTAGE,
coming → COMING SOON, sold → SOLD. Ссылка: catalog.html?cat=<slug>.

## Данные — Google Таблица «DUTYFATCH_product» (опубликована как CSV)
- products: https://docs.google.com/spreadsheets/d/e/2PACX-1vRfdM_9SzDzNbzqsu9LNzF4m5x17RPtjNGe044BoFmLLByB6FAA2OmSIhWCnpUaDHA4abtFuA1Ewac2/pub?gid=0&single=true&output=csv
  колонки: id, brand, name, category, price, status, sold_date, eta, photos, description
  (status: available | reserved | transit | sold; photos — пути через запятую;
  sold_date — ГГГГ-ММ-ДД; eta — текст по-русски)
- measurements: https://docs.google.com/spreadsheets/d/e/2PACX-1vRfdM_9SzDzNbzqsu9LNzF4m5x17RPtjNGe044BoFmLLByB6FAA2OmSIhWCnpUaDHA4abtFuA1Ewac2/pub?gid=310853231&single=true&output=csv
  колонки: product_id, size, length, chest, sleeve, waist, inseam, photo1–photo4
  (одна строка = один размер; measurements.product_id = products.id)
