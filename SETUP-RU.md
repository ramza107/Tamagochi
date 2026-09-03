# Настройка облака для админа (один раз)

Чтобы диспетчер **каждое утро** обновлял карту **без GitHub** — нужна облачная база.  
Мы используем **Firebase** (бесплатного тарифа хватит).

После настройки админ делает так:

1. Открывает сайт → **Admin**
2. Вводит **email + пароль**
3. Кликает по карте → ставит траки → дату ready → **Save truck**
4. Все посетители сразу видят изменения

---

## Шаг 1. Создать Firebase-проект (10–15 мин, делаете вы один раз)

1. Зайдите на https://console.firebase.google.com/
2. **Add project** → название, например `transcargo-fleet`
3. Отключите Google Analytics (не обязательно) → Create

## Шаг 2. Firestore (база данных)

1. В меню слева: **Build → Firestore Database**
2. **Create database** → режим **Production** → регион `us-west1` или ближайший к США
3. **Rules** → вставьте содержимое файла `firestore.rules` из этого проекта → **Publish**

## Шаг 3. Authentication (логин админа)

1. **Build → Authentication** → Get started
2. **Sign-in method** → **Email/Password** → Enable → Save
3. Вкладка **Users** → **Add user**
   - Email: `dispatch@transcargo.com` (или свой)
   - Password: придумайте и **запишите** — это пароль для диспетчера

## Шаг 4. Ключи для сайта

1. ⚙️ **Project settings** → **Your apps** → иконка **Web** `</>`
2. App nickname: `transcargo-site` → Register app
3. Скопируйте объект `firebaseConfig`

## Шаг 5. Вставить ключи в сайт

Откройте `js/config.js` и заполните блок `firebase`:

```js
firebase: {
  enabled: true,
  apiKey: "AIza...",
  authDomain: "transcargo-fleet.firebaseapp.com",
  projectId: "transcargo-fleet",
  storageBucket: "transcargo-fleet.appspot.com",
  messagingSenderId: "...",
  appId: "1:...:web:...",
},
adminEmail: "dispatch@transcargo.com",
```

Сохраните и задеплойте сайт на GitHub Pages (как уже делали).

## Шаг 6. Загрузить начальные траки (один раз)

1. Откройте сайт → Admin → войдите
2. **Import JSON** (если видна кнопка) или добавьте траки вручную
3. Либо в Firebase Console → Firestore → коллекция `trucks` → импорт из `data/fleet.json`

После включения Firebase кнопки Import/Export скрыты — всё через карту.

---

## Утренний сценарий для диспетчера

| Шаг | Действие |
|-----|----------|
| 1 | Открыть сайт на телефоне или компьютере |
| 2 | Admin → email + пароль |
| 3 | **Clear all trucks** (очистить вчерашние) |
| 4 | Кликнуть по карте где стоят траки |
| 5 | Выбрать тип (Box / Conestoga), дату ready, Save |
| 6 | Logout (необязательно) |

Пароль можно сохранить в браузере — останется залогинен.

---

## Стоимость

Firebase Spark (free): ~50k чтений/день — для карты траков более чем enough.

---

## Если Firebase не настроен

Сайт работает в **demo mode** — изменения только в этом браузере.  
Для продакшена обязательно `firebase.enabled: true`.
