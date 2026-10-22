# DUTYFATCH

Каталог винтажной одежды: что в наличии и что едет. Чистый HTML, CSS и JavaScript,
данные — из Google Таблицы. Хостинг — GitHub Pages.

## Публикация на GitHub Pages (один раз)

1. На github.com нажмите **New repository**. Название, например, `dutyfatch`.
   Тип — **Public** (на бесплатном аккаунте Pages работает только для публичных).
   Галочки README / .gitignore / license не ставьте — репозиторий должен быть пустым.
2. В терминале VS Code, в папке проекта, свяжите проект с GitHub
   (адрес возьмите со страницы нового репозитория):
   ```bash
   git remote add origin https://github.com/<ваш-логин>/dutyfatch.git
   ```
3. Слейте рабочую ветку в `main` и отправьте всё на GitHub:
   ```bash
   git checkout main
   git merge stage-2-google-sheet
   git push -u origin main
   ```
4. На GitHub: **Settings → Pages → Build and deployment**.
   Source: **Deploy from a branch**, Branch: **main**, папка **/ (root)** → **Save**.
5. Через 1–2 минуты вверху этой страницы появится адрес сайта:
   `https://<ваш-логин>.github.io/dutyfatch/`. Ход публикации видно во вкладке **Actions**.

## Как обновлять сайт

- **Товары, цены, статусы, замеры** — просто меняете Google Таблицу.
  Сайт читает её при каждом открытии, публиковать ничего не нужно
  (Google обновляет опубликованный CSV с задержкой до ~5 минут).
- **Фото** — кладёте файлы в `images/`, пишете путь в колонку `photos`, затем отправляете на GitHub.
- **Код (HTML, CSS, JS)** и фото:
  ```bash
  git add .
  git commit -m "Что поменял"
  git push
  ```
  Через 1–2 минуты изменения на сайте. Если видна старая версия — обновите страницу с Ctrl+F5.

## Переход на SQL Server (на будущее)

SQL Server Management Studio (SSMS) — программа для работы с базой Microsoft SQL Server.

1. В SSMS откройте `sql/schema.sql` и выполните (F5) — создастся база `dutyfatch`
   с таблицами `products` и `measurements` (те же колонки, что в Google Таблице).
2. Перенесите данные: скачайте листы таблицы как CSV
   (**Файл → Скачать → CSV**) и загрузите в SSMS:
   правый клик по базе → **Tasks → Import Data** → источник Flat File → таблица назначения.
3. Нужен небольшой сервер (API), который выполняет запросы из конца `sql/schema.sql`
   и отдаёт результат в JSON. **Сайт на GitHub Pages не может подключиться к базе напрямую**,
   а логин и пароль от базы нельзя писать в JS — его видит любой посетитель.
4. В `js/data.js` поменяйте `DATA_SOURCE = "api"` и впишите адрес сервера в `API_URL`.
   Остальные файлы сайта менять не нужно.
