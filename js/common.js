// common.js — то, что одинаково на всех страницах:
// ссылки, категории, шапка с меню, подвал и карточка товара.

// ===== Ссылки =====
const CHANNEL_URL = "https://t.me/dutyfatch";      // Telegram-канал
const ORDER_URL = "https://t.me/razvall_chieff";   // личка для заказов

// ===== Категории: slug (для ссылки) → название =====
const CATEGORIES = [
  { slug: "all", name: "ALL PRODUCTS" },
  { slug: "tops", name: "TOPS" },
  { slug: "outerwear", name: "OUTERWEAR" },
  { slug: "pants", name: "PANTS" },
  { slug: "shoes", name: "SHOES" },
  { slug: "accessories", name: "ACCESSORIES" },
  { slug: "vintage", name: "VINTAGE" },
  { slug: "coming", name: "COMING SOON" },
  { slug: "sold", name: "SOLD" }
];

// ===== Подписи статусов (логику доделаем в этапе 3) =====
const STATUS_LABELS = {
  available: "В наличии",
  reserved: "Бронь",
  transit: "В пути",
  sold: "Продано"
};

// Иконка Telegram (используется в шапке)
const TELEGRAM_ICON = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.5 13.2 1.8 11.7c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.3z" />
  </svg>`;

// Защита от «ломающих» символов (<, &, ") в тексте из таблицы
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Ссылка на страницу каталога нужной категории
function categoryUrl(slug) {
  return "catalog.html?cat=" + slug;
}

// Список ссылок на категории — общий для шапки и меню
function categoryLinks() {
  return CATEGORIES
    .map(cat => `<a href="${categoryUrl(cat.slug)}">${cat.name}</a>`)
    .join("");
}

// ===== Шапка =====
function renderHeader() {
  const placeholder = document.getElementById("site-header");
  if (!placeholder) return;

  // outerHTML заменяет сам <div> на шапку + меню
  placeholder.outerHTML = `
    <header class="header">
      <div class="header__bar">
        <button class="icon-btn header__burger" type="button" aria-label="Открыть меню"
                aria-controls="drawer" aria-expanded="false">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        </button>

        <a class="logo" href="index.html">DUTYFATCH</a>

        <a class="icon-btn" href="${CHANNEL_URL}" target="_blank" rel="noopener" aria-label="Telegram-канал DUTYFATCH">
          ${TELEGRAM_ICON}
        </a>
      </div>

      <!-- Строка категорий: видна только на компьютере -->
      <nav class="header__nav">${categoryLinks()}</nav>
    </header>

    <!-- Выезжающее меню для телефона -->
    <div class="drawer" id="drawer">
      <div class="drawer__overlay"></div>
      <nav class="drawer__panel" aria-label="Категории">
        <button class="icon-btn drawer__close" type="button" aria-label="Закрыть меню">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
        <div class="drawer__links">${categoryLinks()}</div>
      </nav>
    </div>`;

  initMenu();
}

// Открытие/закрытие выезжающего меню
function initMenu() {
  const drawer = document.getElementById("drawer");
  const burger = document.querySelector(".header__burger");
  const closeBtn = drawer.querySelector(".drawer__close");
  const overlay = drawer.querySelector(".drawer__overlay");

  function openMenu() {
    drawer.classList.add("is-open");
    document.body.classList.add("no-scroll"); // страница под меню не прокручивается
    burger.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function closeMenu() {
    drawer.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    burger.setAttribute("aria-expanded", "false");
    burger.focus();
  }

  burger.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  // Esc закрывает меню, только если оно открыто
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) {
      closeMenu();
    }
  });
}

// ===== Подвал =====
function renderFooter() {
  const placeholder = document.getElementById("site-footer");
  if (!placeholder) return;

  placeholder.outerHTML = `
    <footer class="footer">
      <a class="logo" href="index.html">DUTYFATCH</a>

      <div class="footer__how">
        <h2 class="footer__title">Как купить</h2>
        <p>Выберите вещь → нажмите «Написать в Telegram» → договоримся о деталях</p>
        <a class="footer__link" href="${ORDER_URL}" target="_blank" rel="noopener">Написать в Telegram</a>
      </div>

      <a class="footer__link" href="${CHANNEL_URL}" target="_blank" rel="noopener">Telegram-канал DUTYFATCH</a>

      <p class="footer__copy">© DUTYFATCH · Брест</p>
    </footer>`;
}

// Цена: число → "180 BYN", null (пусто или не число) → «Цена по запросу»
function formatPrice(price) {
  return price === null ? "Цена по запросу" : price + " BYN";
}

// ===== Карточка товара =====
// Принимает один товар, возвращает HTML-строку карточки.
function productCard(product) {
  // photos — уже массив путей, на карточке берём первое фото
  const photo = product.photos[0];
  const label = STATUS_LABELS[product.status] || "";

  // Если фото не загрузилось, onerror убирает картинку — остаётся серый фон
  const img = photo
    ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.remove()">`
    : "";

  return `
    <a class="card" href="product.html?id=${encodeURIComponent(product.id)}">
      <div class="card__photo">
        ${img}
        ${label ? `<span class="badge badge--${product.status}">${label}</span>` : ""}
      </div>
      <p class="card__brand">${escapeHtml(product.brand)}</p>
      <h3 class="card__name">${escapeHtml(product.name)}</h3>
      <p class="card__price">${formatPrice(product.price)}</p>
    </a>`;
}

// Шапку и подвал рисуем сразу: скрипт подключён в конце <body>
renderHeader();
renderFooter();
