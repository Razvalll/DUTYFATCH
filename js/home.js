// home.js — главная страница: карусели и плитки категорий.

const NEW_IN_LIMIT = 8; // сколько вещей показывать в «NEW IN», если ничего не отмечено new_in

// Плитки всех категорий. Фото: images/categories/<slug>.jpg,
// если файла нет — onerror убирает картинку и видна серая заглушка.
// alt пустой специально: название категории уже написано под фото, читать его дважды не нужно.
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
    // Те же правила, что в каталоге: NEW IN берём из ALL PRODUCTS (без transit
    // и старых sold), COMING SOON — то же, что в категории coming. Свежие вещи первыми.
    const all = productsForCategory(PRODUCTS, "all");
    const picked = all.filter(p => p.new_in); // отмеченные new_in = yes
    // Ничего не отмечено — берём последние вещи, чтобы карусель не была пустой
    const newIn = picked.length > 0 ? picked : all.slice(0, NEW_IN_LIMIT);
    const coming = productsForCategory(PRODUCTS, "coming");

    renderCarousel("new-in", newIn);
    renderCarousel("coming-soon", coming);
  })
  .catch(error => {
    console.error("Не удалось загрузить данные из таблицы:", error);
    const text = `<p class="message">Не удалось загрузить товары. Проверьте интернет и обновите страницу.</p>`;
    document.getElementById("new-in").innerHTML = text;
    document.getElementById("coming-soon").innerHTML = text;
  });
