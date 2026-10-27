// data.js — загрузка товаров и замеров.
// Сейчас данные берутся из Google Таблицы (CSV). Потом можно перейти на базу SQL Server:
// поменять DATA_SOURCE на "api" и указать API_URL — остальной сайт менять не придётся.

// ===== Откуда брать данные =====
// "sheets" — Google Таблица (сейчас)
// "api"    — свой сервер, который читает базу SQL Server и отдаёт JSON (см. sql/schema.sql)
const DATA_SOURCE = "sheets";

// Адрес сервера для "api", без «/» в конце. Сервер должен отдавать:
//   API_URL + "/products"     → [{ "id": "101", "brand": "...", ... }, ...]
//   API_URL + "/measurements" → [{ "product_id": "101", "size": "L", ... }, ...]
// Названия полей — те же, что колонки в Google Таблице.
const API_URL = "";

const PRODUCTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfdM_9SzDzNbzqsu9LNzF4m5x17RPtjNGe044BoFmLLByB6FAA2OmSIhWCnpUaDHA4abtFuA1Ewac2/pub?gid=0&single=true&output=csv";
const MEASUREMENTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRfdM_9SzDzNbzqsu9LNzF4m5x17RPtjNGe044BoFmLLByB6FAA2OmSIhWCnpUaDHA4abtFuA1Ewac2/pub?gid=310853231&single=true&output=csv";

// Статусы, которые сайт умеет показывать. Товар с другим статусом скрываем.
const KNOWN_STATUSES = ["available", "reserved", "transit", "sold"];

// Сюда loadData() положит данные. Другие скрипты читают их после загрузки.
let PRODUCTS = [];     // массив товаров
let MEASUREMENTS = {}; // замеры по id товара: { "101": [ { size: "M", ... }, ... ] }

// ===== Разбор CSV =====
// Идём по тексту посимвольно и помним, внутри кавычек мы или нет.
// Внутри кавычек запятая и перенос строки — часть ячейки, а "" — это одна кавычка.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  text = text.replace(/^﻿/, ""); // убираем невидимый символ BOM в начале файла

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'; // "" → одна кавычка
        i++;
      } else if (ch === '"') {
        inQuotes = false; // кавычки закрылись
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === "") {
      inQuotes = true; // кавычка в начале ячейки — ячейка «в кавычках»
    } else if (ch === ",") {
      row.push(cell); // конец ячейки
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++; // \r\n — один перенос
      row.push(cell); // конец строки
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  // Последняя строка, если файл не закончился переносом
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // Пустые строки (все ячейки пустые) выкидываем
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

// Строки CSV → объекты по заголовкам: { id: "101", brand: "No Faith", ... }
function rowsToObjects(headers, rows) {
  return rows.map(cells => {
    const obj = {};
    headers.forEach((key, i) => {
      if (key) obj[key] = (cells[i] || "").trim(); // пробелы по краям обрезаем
    });
    return obj;
  });
}

// Скачивает один CSV и превращает в массив объектов
async function fetchCSV(url, requiredColumn) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Таблица не ответила, код " + response.status);
  }

  const rows = parseCSV(await response.text());
  const headers = (rows[0] || []).map(h => h.trim().toLowerCase());

  // Если вместо таблицы пришла страница ошибки — нужной колонки в ней не будет
  if (!headers.includes(requiredColumn)) {
    throw new Error("В таблице нет колонки " + requiredColumn);
  }
  return rowsToObjects(headers, rows.slice(1));
}

// Скачивает JSON-массив с сервера (для DATA_SOURCE = "api").
// Все значения приводим к тексту, как в CSV: 480 → "480", null → "".
// Тогда проверка строк ниже работает одинаково для таблицы и для базы.
async function fetchJSON(url, requiredColumn) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Сервер не ответил, код " + response.status);
  }

  const items = await response.json();
  if (!Array.isArray(items)) {
    throw new Error("Сервер вернул не список");
  }

  const rows = items.map(item => {
    const obj = {};
    Object.keys(item).forEach(key => {
      const value = item[key];
      obj[key.toLowerCase()] = value === null || value === undefined ? "" : String(value).trim();
    });
    return obj;
  });

  if (rows.length > 0 && !(requiredColumn in rows[0])) {
    throw new Error("В ответе сервера нет поля " + requiredColumn);
  }
  return rows;
}

// Сырые строки товаров и замеров. Только эта функция знает, откуда берутся данные
function fetchRows() {
  if (DATA_SOURCE === "api") {
    return Promise.all([
      fetchJSON(API_URL + "/products", "id"),
      fetchJSON(API_URL + "/measurements", "product_id")
    ]);
  }
  return Promise.all([
    fetchCSV(PRODUCTS_CSV_URL, "id"),
    fetchCSV(MEASUREMENTS_CSV_URL, "product_id")
  ]);
}

// ===== Проверка и подготовка строк =====

// "1 200" или "120,5" → число. Пусто или не число → null («Цена по запросу»)
function parsePrice(value) {
  const clean = value.replace(/\s/g, "").replace(",", ".");
  if (clean === "") return null;
  const number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

// Колонка-флажок. Флажок Google Таблиц приходит в CSV как TRUE / FALSE,
// в старых строках вместо него написано yes. Регистр и пробелы не важны:
// TRUE / yes → true; FALSE, пусто или колонки нет → false
function isFlagOn(value) {
  const text = (value || "").trim().toLowerCase();
  return text === "true" || text === "yes";
}

// Проверяем каждую строку: плохую пропускаем, остальные приводим к нужному виду
function prepareProducts(rows) {
  const products = [];

  rows.forEach(row => {
    if (!row.id || !row.name) {
      console.warn("Строка пропущена: нет id или name", row);
      return;
    }

    const status = (row.status || "").toLowerCase();
    if (!KNOWN_STATUSES.includes(status)) {
      console.warn(`Товар ${row.id} скрыт: неизвестный status «${row.status || ""}»`);
      return;
    }

    const price = parsePrice(row.price || "");
    if (price === null && row.price) {
      console.warn(`Товар ${row.id}: цена «${row.price}» не число — покажем «Цена по запросу»`);
    }

    products.push({
      id: row.id,
      brand: row.brand || "",
      name: row.name,
      category: (row.category || "").toLowerCase(),
      price: price,                 // число или null
      status: status,
      sold_date: row.sold_date || "",
      eta: row.eta || "",
      // "a.jpg, b.jpg" → ["a.jpg", "b.jpg"], пустые куски убираем
      photos: (row.photos || "").split(",").map(p => p.trim()).filter(p => p !== ""),
      description: row.description || "",
      new_in: isFlagOn(row.new_in),     // показывать ли в NEW IN на главной
      original: isFlagOn(row.original), // плашка ORIGINAL: оригинальный бренд подтверждён
      vintage: isFlagOn(row.vintage)    // винтаж: попадает в VINTAGE из любой категории, плашки нет
    });
  });

  return products;
}

// Замеры → { "101": [строка, строка], "102": [...] }.
// Замеры к товару, которого нет среди PRODUCTS, игнорируем.
function groupMeasurements(rows, products) {
  const ids = new Set(products.map(p => p.id));
  const groups = {};

  rows.forEach(row => {
    const id = row.product_id;
    if (!ids.has(id)) return;

    if (!groups[id]) groups[id] = [];
    groups[id].push(row);
  });

  return groups;
}

// ===== Главная функция: грузит товары и замеры одновременно =====
async function loadData() {
  const [productRows, measurementRows] = await fetchRows();

  PRODUCTS = prepareProducts(productRows);
  MEASUREMENTS = groupMeasurements(measurementRows, PRODUCTS);

  return { products: PRODUCTS, measurements: MEASUREMENTS };
}
