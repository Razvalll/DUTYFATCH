// product.js — страница товара: product.html?id=<id>

const MORE_LIMIT = 8; // сколько похожих вещей в MORE PICKUPS

// Подписи замеров в окне «Замеры»: колонка таблицы → текст. Порядок = порядок строк
const MEASURE_LABELS = {
  length: "Длина",
  chest: "Ширина груди (подмышка–подмышка)",
  sleeve: "Длина рукава",
  waist: "Талия",
  inseam: "Длина по внутреннему шву"
};

// Статус по-русски на странице товара
const STATUS_TEXT = {
  available: "В наличии",
  reserved: "Забронировано",
  transit: "В пути",
  sold: "Продано"
};

// Иконки: лупа и стрелки ‹ › у миниатюр
const ZOOM_ICON = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6" />
  </svg>`;
const ARROW_LEFT = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>`;
const ARROW_RIGHT = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>`;

const productBox = document.getElementById("product");
const moreSection = document.getElementById("more-pickups");

// id товара из адреса страницы
function currentId() {
  return new URLSearchParams(location.search).get("id");
}

// ===== Товар не найден =====
function renderNotFound() {
  document.title = "Товар не найден — DUTYFATCH";
  productBox.innerHTML = `
    <div class="product__empty">
      <p class="product__empty-title">Товар не найден</p>
      <a class="product__empty-link" href="${categoryUrl("all")}">Перейти в каталог →</a>
    </div>`;
}

// ===== Фото =====
function galleryHtml(product) {
  const photos = product.photos;
  const alt = escapeHtml((product.brand + " " + product.name).trim());

  // Фото нет — просто серая заглушка, без лупы и миниатюр
  if (photos.length === 0) {
    return `<div class="gallery"><div class="gallery__empty"></div></div>`;
  }

  // Большие фото в ленте. Первое грузим сразу, остальные — когда понадобятся
  const slides = photos.map((src, i) => `
    <div class="gallery__slide">
      <img src="${escapeHtml(src)}" alt="${alt}, фото ${i + 1}"${i > 0 ? ' loading="lazy"' : ""} onerror="this.remove()">
    </div>`).join("");

  // Миниатюры со стрелками — только если фото больше одного
  let nav = "";
  if (photos.length > 1) {
    const thumbs = photos.map((src, i) => `
      <button class="gallery__thumb" type="button" data-index="${i}" aria-label="Фото ${i + 1}">
        <img src="${escapeHtml(src)}" alt="" loading="lazy" onerror="this.remove()">
      </button>`).join("");

    nav = `
      <div class="gallery__nav">
        <button class="gallery__arrow" type="button" data-step="-1" aria-label="Предыдущее фото">${ARROW_LEFT}</button>
        <div class="gallery__thumbs">${thumbs}</div>
        <button class="gallery__arrow" type="button" data-step="1" aria-label="Следующее фото">${ARROW_RIGHT}</button>
      </div>`;
  }

  return `
    <div class="gallery${photos.length === 1 ? " gallery--single" : ""}">
      <div class="gallery__main">
        <div class="gallery__track">${slides}</div>
        <button class="gallery__zoom" type="button" aria-label="Открыть фото на весь экран">${ZOOM_ICON}</button>
      </div>
      ${nav}
    </div>`;
}

// Листание фото, миниатюры, стрелки и лупа
function initGallery() {
  const track = productBox.querySelector(".gallery__track");
  if (!track) return; // фото нет — нечего оживлять

  const slides = [...track.children];
  const thumbsBox = productBox.querySelector(".gallery__thumbs");
  const thumbs = [...productBox.querySelectorAll(".gallery__thumb")];
  const prevBtn = productBox.querySelector('[data-step="-1"]');
  const nextBtn = productBox.querySelector('[data-step="1"]');
  let active = -1; // номер фото, которое сейчас главное

  // Главное фото — то, чей левый край ближе всего к левому краю ленты
  function findActive() {
    let best = 0;
    slides.forEach((slide, i) => {
      const distance = Math.abs(slide.offsetLeft - track.scrollLeft);
      const bestDistance = Math.abs(slides[best].offsetLeft - track.scrollLeft);
      if (distance < bestDistance) best = i;
    });
    return best;
  }

  // Прокрутить ленту к фото с номером index
  function goTo(index) {
    index = Math.max(0, Math.min(index, slides.length - 1)); // не выходим за края
    track.scrollTo({ left: slides[index].offsetLeft, behavior: "smooth" });
  }

  // Обводим активную миниатюру, выключаем стрелки на краях
  function update() {
    const index = findActive();
    if (index === active) return; // ничего не поменялось
    active = index;

    thumbs.forEach((thumb, i) => thumb.classList.toggle("is-active", i === active));
    if (prevBtn) {
      prevBtn.disabled = active === 0;
      nextBtn.disabled = active === slides.length - 1;
    }

    // Если активная миниатюра ушла за край ряда — подвинуть ряд к ней
    const thumb = thumbs[active];
    if (thumb) {
      const left = thumb.offsetLeft;
      const right = left + thumb.offsetWidth;
      if (left < thumbsBox.scrollLeft) {
        thumbsBox.scrollLeft = left;
      } else if (right > thumbsBox.scrollLeft + thumbsBox.clientWidth) {
        thumbsBox.scrollLeft = right - thumbsBox.clientWidth;
      }
    }
  }

  track.addEventListener("scroll", update);
  update();

  // Клик по миниатюре
  if (thumbsBox) {
    thumbsBox.addEventListener("click", event => {
      const thumb = event.target.closest(".gallery__thumb");
      if (thumb) goTo(Number(thumb.dataset.index));
    });
    prevBtn.addEventListener("click", () => goTo(active - 1));
    nextBtn.addEventListener("click", () => goTo(active + 1));
  }

  // Лупа открывает текущее фото на весь экран
  const zoomBtn = productBox.querySelector(".gallery__zoom");
  zoomBtn.addEventListener("click", () => {
    const img = slides[active].querySelector("img");
    if (img) openLightbox(img.getAttribute("src"), img.alt, zoomBtn);
  });
}

// ===== Фото на весь экран =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
let lightboxOpener = null; // кнопка, на которую вернуть фокус после закрытия

function openLightbox(src, alt, opener) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightboxOpener = opener;
  lightbox.hidden = false;
  document.body.classList.add("no-scroll"); // страница под фото не прокручивается
  lightbox.querySelector(".lightbox__close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  // Если под фото открыто окно замеров — страница должна остаться неподвижной
  if (measure.hidden) document.body.classList.remove("no-scroll");
  if (lightboxOpener) lightboxOpener.focus();
}

// Клик куда угодно, кроме самого фото (фон или крестик), — закрыть
lightbox.addEventListener("click", event => {
  if (event.target !== lightboxImg) closeLightbox();
});

// Esc закрывает только верхнее окно: сначала фото, потом замеры
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!lightbox.hidden) closeLightbox();
  else if (!measure.hidden) closeMeasure();
});

// ===== Размер =====
let sizeRows = []; // строки замеров текущего товара — по одной на размер

function sizeHtml(product) {
  // Строки замеров этого товара; строку без размера пропускаем
  const rows = (MEASUREMENTS[product.id] || []).filter(row => row.size);
  sizeRows = rows;
  if (rows.length === 0) return ""; // замеров нет — ни размера, ни кнопки «Замеры»

  let choice;
  if (rows.length === 1) {
    choice = `<p class="size__single">Размер: ${escapeHtml(rows[0].size)}</p>`;
  } else {
    // Первый вариант в <select> выбран браузером сам
    const options = rows
      .map((row, i) => `<option value="${i}">${escapeHtml(row.size)}</option>`)
      .join("");
    choice = `
      <label class="size__label" for="size-select">Размер</label>
      <div class="select">
        <select id="size-select">${options}</select>
      </div>`;
  }

  return `
    <div class="size">
      <div class="size__choice">${choice}</div>
      <button class="btn-outline size__measure" type="button">Замеры</button>
    </div>`;
}

// ===== Окно замеров =====
const measure = document.getElementById("measure");
const measureTitle = document.getElementById("measure-title");
const measureBody = document.getElementById("measure-body");
let measureOpener = null; // кнопка «Замеры» — вернуть на неё фокус после закрытия

// Строка выбранного размера: из списка, а если размер один — она же
function selectedRow() {
  const select = document.getElementById("size-select");
  return sizeRows[select ? Number(select.value) : 0];
}

// Заполняет окно под выбранный размер
function renderMeasure() {
  const row = selectedRow();
  const alt = `Размер ${row.size}`;
  measureTitle.textContent = alt;

  // photo1–photo4, пустые пропускаем
  const photos = ["photo1", "photo2", "photo3", "photo4"]
    .map(key => row[key])
    .filter(src => src);

  const photosHtml = photos.length > 0
    ? `<div class="measure__photos">
        ${photos.map((src, i) => `
          <button class="measure__photo" type="button" aria-label="Увеличить фото ${i + 1}">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}, фото ${i + 1}" loading="lazy" onerror="this.remove()">
          </button>`).join("")}
      </div>`
    : "";

  // Только заполненные замеры, в порядке MEASURE_LABELS
  const lines = Object.keys(MEASURE_LABELS)
    .filter(key => row[key])
    .map(key => `
      <tr>
        <th scope="row">${MEASURE_LABELS[key]}</th>
        <td>${escapeHtml(row[key])} см</td>
      </tr>`)
    .join("");

  const tableHtml = lines
    ? `<table class="measure__table"><tbody>${lines}</tbody></table>`
    : "";

  measureBody.innerHTML = photosHtml || tableHtml
    ? photosHtml + tableHtml
    : `<p class="measure__empty">Замеры этого размера пока не добавлены — спросите в Telegram.</p>`;
}

function openMeasure(opener) {
  measureOpener = opener;
  renderMeasure();
  measure.hidden = false;
  measureBody.scrollTop = 0;
  document.body.classList.add("no-scroll"); // страница под окном не прокручивается
  measure.querySelector(".measure__close").focus();
}

function closeMeasure() {
  measure.hidden = true;
  document.body.classList.remove("no-scroll");
  if (measureOpener) measureOpener.focus();
}

// Клик по фото — на весь экран; по крестику или затемнению — закрыть
measure.addEventListener("click", event => {
  const photo = event.target.closest(".measure__photo");
  if (photo) {
    const img = photo.querySelector("img");
    if (img) openLightbox(img.getAttribute("src"), img.alt, photo);
    return;
  }
  if (event.target === measure || event.target.closest(".measure__close")) closeMeasure();
});

// Кнопка «Замеры» и смена размера
function initSize() {
  const button = productBox.querySelector(".size__measure");
  if (!button) return; // замеров нет — кнопки нет

  button.addEventListener("click", () => openMeasure(button));

  // Окно открыто и размер поменяли — обновить содержимое
  const select = document.getElementById("size-select");
  if (select) {
    select.addEventListener("change", () => {
      if (!measure.hidden) renderMeasure();
    });
  }
}

// ===== Блок заказа =====
function orderHtml(product) {
  // Проданная вещь: вместо заказа — ссылка вниз на похожие
  if (product.status === "sold") {
    return `
      <div class="order">
        <p class="order__sold">Эта вещь уже продана</p>
        <a class="order__similar" href="#more-pickups">Смотреть похожие ↓</a>
      </div>`;
  }

  return `
    <div class="order">
      <p class="order__text">Для заказа напишите мне в Telegram — отвечу на вопросы, пришлю дополнительные фото и замеры.</p>
      <a class="btn-black" href="${ORDER_URL}" target="_blank" rel="noopener">${TELEGRAM_ICON} Написать в Telegram</a>
    </div>`;
}

// ===== Вся страница товара =====
function renderProduct(product) {
  document.title = `${product.brand} ${product.name}`.trim() + " — DUTYFATCH";

  const brand = product.brand
    ? `<span class="product__brand">${escapeHtml(product.brand)}</span>`
    : "";

  // У едущих вещей — когда ожидается
  const eta = product.status === "transit" && product.eta
    ? `<p class="product__eta">Ожидается: ${escapeHtml(product.eta)}</p>`
    : "";

  // Плашка ORIGINAL — строкой под названием, если у вещи стоит флажок original
  const marksHtml = originalBadge(product);
  const marks = marksHtml ? `<div class="product__marks">${marksHtml}</div>` : "";

  const description = product.description
    ? `<p class="product__desc">${escapeHtml(product.description)}</p>`
    : "";

  productBox.innerHTML = `
    <div class="product__layout">
      ${galleryHtml(product)}

      <div class="product__info">
        <h1 class="product__title">
          ${brand}
          <span class="product__name">${escapeHtml(product.name)}</span>
        </h1>
        ${marks}
        <p class="product__price">${formatPrice(product.price)}</p>
        <p class="product__status">${STATUS_TEXT[product.status]}</p>
        ${eta}
        ${description}
        ${sizeHtml(product)}
        ${orderHtml(product)}
      </div>
    </div>`;

  initGallery();
  initSize();
}

// ===== MORE PICKUPS =====
// Та же категория, по тем же правилам видимости, что в каталоге, без текущей вещи
function renderMore(product) {
  const list = productsForCategory(PRODUCTS, product.category)
    .filter(p => p.id !== product.id)
    .slice(0, MORE_LIMIT);

  // «ALL →» ведёт в категорию вещи (если такой категории нет — в ALL PRODUCTS)
  const known = CATEGORIES.some(cat => cat.slug === product.category);
  document.getElementById("more-link").href = categoryUrl(known ? product.category : "all");

  const box = document.getElementById("more-carousel");
  box.innerHTML = list.length > 0
    ? list.map(productCard).join("")
    : `<p class="message">Похожих вещей пока нет — загляните в
         <a href="${CHANNEL_URL}" target="_blank" rel="noopener">Telegram-канал</a></p>`;

  moreSection.hidden = false;
}

loadData()
  .then(() => {
    const product = PRODUCTS.find(p => p.id === currentId());
    if (!product) {
      renderNotFound();
      return;
    }
    renderProduct(product);
    renderMore(product);
  })
  .catch(error => {
    console.error("Не удалось загрузить данные из таблицы:", error);
    productBox.innerHTML =
      `<p class="message">Не удалось загрузить товар. Проверьте интернет и обновите страницу.</p>`;
  });
