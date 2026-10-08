// home.js — главная страница: карусели и плитки категорий.

const NEW_IN_LIMIT = 10; // сколько вещей показывать в «NEW IN»

// Плитки всех категорий. Фото: images/categories/<slug>.jpg,
// если файла нет — onerror убирает картинку и видна серая заглушка.
function renderCategoryTiles() {
  const box = document.getElementById("category-tiles");

  box.innerHTML = CATEGORIES.map(cat => `
    <a class="tile" href="${categoryUrl(cat.slug)}">
      <div class="tile__photo">
        <img src="images/categories/${cat.slug}.jpg" alt="" loading="lazy" onerror="this.remove()">
      </div>
      <span class="tile__name">${cat.name} →</span>
    </a>`).join("");
}

// Заполняет карусель карточками или пишет, что пусто
function renderCarousel(id, products) {
  const box = document.getElementById(id);

  if (products.length === 0) {
    box.innerHTML = `<p class="message">Пока здесь пусто</p>`;
    return;
  }
  box.innerHTML = products.map(productCard).join("");
}

renderCategoryTiles();

// Пока таблица грузится, в каруселях стоит «Загрузка…» (прописано в index.html).
// Когда данные пришли — рисуем карточки вместо неё.
loadData()
  .then(() => {
    // Новые строки в таблице добавляются снизу, поэтому переворачиваем:
    // самые свежие вещи окажутся первыми
    const newIn = PRODUCTS
      .filter(p => p.status === "available")
      .reverse()
      .slice(0, NEW_IN_LIMIT);

    const coming = PRODUCTS.filter(p => p.status === "transit");

    renderCarousel("new-in", newIn);
    renderCarousel("coming-soon", coming);
  })
  .catch(error => {
    console.error("Не удалось загрузить данные из таблицы:", error);
    const text = `<p class="message">Не удалось загрузить товары. Проверьте интернет и обновите страницу.</p>`;
    document.getElementById("new-in").innerHTML = text;
    document.getElementById("coming-soon").innerHTML = text;
  });
