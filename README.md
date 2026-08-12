# Pulsepet

Питомец, которого кормит твоя жизнь.

## Открыть в браузере

**Постоянная ссылка (после включения GitHub Pages):**  
https://ramza107.github.io/Tamagochi/

Как включить один раз:  
Repository → Settings → Pages → Deploy from a branch → branch `cursor/pulsepet-mvp-249e` (или `main`), folder `/docs` → Save  
или Source: **GitHub Actions** (workflow `Deploy Pulsepet Web`).

**Временный превью-хостинг** (может истечь без API-ключа Tiiny):  
https://chocolate-brittani-39.tiiny.site/

## Локально

```bash
npm install
npm run web
```

Или статическая сборка:

```bash
npm run build:web
npx serve dist
```

## Идея

**Nuri** — мягкий моховый камешек с янтарным «ядром-пульсом». Сон, шаги и экранное время меняют цвет, позу и письма.

## Сейчас / позже

- MVP: анимации, 4 настроения, симулятор метрик, веб
- На Mac: HealthKit, виджеты, Live Activity, App Store
