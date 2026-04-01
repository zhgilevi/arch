# Arch

Backend уже реализован на FastAPI. Для frontend добавлено отдельное приложение на React + TypeScript в каталоге `frontend`.

## Что есть на фронте

- главная страница с формой загрузки файла в `POST /burial/upload`
- кнопка `Кластеризовать`, которая открывает страницу результатов и вызывает `GET /cluster/clusters`
- страница результатов с кластерами, выпадающим списком объектов и топ-10 предметов для каждого кластера
- страница `/burial/:shortName` с информацией по всем объектам для выбранного `burial_short_name`

## Запуск backend

```bash
uv run fastapi dev app/main.py
```

## Запуск frontend

Нужен установленный Node.js.

```bash
cd frontend
npm install
npm run dev
```

По умолчанию frontend обращается к backend по адресу `http://localhost:8000`.
При необходимости можно переопределить адрес через переменную `VITE_API_BASE_URL`.
