// catalog.js — страница каталога: catalog.html?cat=<slug>

let dataLoaded = false; // станет true, когда таблица загрузится

// Категория из адреса страницы. Пустая или неизвестная → ALL PRODUCTS
function currentSlug() {
  const slug = new URLSearchParams(location.search).get("cat");
  return CATEGORIES.some(cat => cat.slug === slug) ? slug : "all";
}

function categoryName(slug) {
  return CATEGORIES.find(cat => cat.slug === slug).name;
}

// Кнопки категорий, активная залита чёрным
function renderTabs(activeSlug) {
  const box = document.getElementById("cat-tabs");

  box.innerHTML = CATEGORIES.map(cat => {
    const active = cat.slug === activeSlug;
    return `<a class="cat-tab${active ? " is-active" : ""}" href="${categoryUrl(cat.slug)}"
               data-slug="${cat.slug}"${active ? ' aria-current="page"' : ""}>${cat.name}</a>`;
  }).join("");

  // На телефоне активная кнопка может быть за краем — прокручиваем строку к ней
  const activeTab = box.querySelector(".is-active");
  box.scrollLeft = activeTab.offsetLeft - (box.clientWidth - activeTab.offsetWidth) / 2;
}

// Количество и карточки
function renderProducts(slug) {
  const list = productsForCategory(PRODUCTS, slug);
  const grid = document.getElementById("catalog-grid");

  document.getElementById("catalog-count").textContent =
    list.length + (list.length === 1 ? " ITEM" : " ITEMS");

  if (list.length === 0) {
    grid.innerHTML = `
      <p class="message">Пока пусто — загляните в
        <a href="${CHANNEL_URL}" target="_blank" rel="noopener">Telegram-канал</a></p>`;
    return;
  }
  grid.innerHTML = list.map(productCard).join("");
}

// Показать категорию целиком: заголовок, кнопки, товары (если уже загружены)
function showCategory(slug) {
  const name = categoryName(slug);
  document.getElementById("catalog-title").textContent = name;
  document.title = name + " — DUTYFATCH";
  renderTabs(slug);
  if (dataLoaded) renderProducts(slug);
}

// Клик по кнопке категории — меняем категорию без перезагрузки страницы,
// чтобы не скачивать таблицу заново. Адрес в строке браузера тоже меняется.
document.getElementById("cat-tabs").addEventListener("click", event => {
  const tab = event.target.closest(".cat-tab");
  if (!tab) return;
  // Ctrl/Cmd/Shift + клик — пусть браузер откроет новую вкладку, как обычно
  if (event.ctrlKey || event.metaKey || event.shiftKey) return;

  event.preventDefault();
  if (tab.dataset.slug === currentSlug()) return; // уже открыта

  history.pushState(null, "", tab.href);
  showCategory(tab.dataset.slug);
});

// Кнопки «Назад» / «Вперёд» в браузере
window.addEventListener("popstate", () => showCategory(currentSlug()));

showCategory(currentSlug());

loadData()
  .then(() => {
    dataLoaded = true;
    renderProducts(currentSlug());
  })
  .catch(error => {
    console.error("Не удалось загрузить данные из таблицы:", error);
    document.getElementById("catalog-grid").innerHTML =
      `<p class="message">Не удалось загрузить товары. Проверьте интернет и обновите страницу.</p>`;
  });
