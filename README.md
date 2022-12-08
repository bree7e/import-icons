# Import icons

Утилита для импорта иконок из figma

## Установка

Добавить в `.npmrc` строку:

```bash
@vepp:registry=http://172.31.240.39:4873
```

Установить пакет из репозитория:

```bash
npm i --save-dev @vepp/import-icons
```

**!** Так как скрипт скорее всего будет запускаться разработчиками вручную, все зависимости унесены в `peerDependencies` для возможности их установки глобально, а не для конкретного приложения.

Для установки глобально:

```bash
npm i -g fs-extra got ora svgo ts-node
```

Для установки локально

```bash
npm i -D fs-extra got ora svgo ts-node
```

## Быстрый старт

1. После установки выполнить `npx import-icons`. Скрипт закончится с ошибкой, но создаст конфигурационный файл `figma.json`
2. Заполнить `figma.json`, для удобства использования он имеет схему, которая находится в `node_modules/@vepp/import-icons/schema/figma-schema.json`. Пример конфигурации:

```json
{
  "$schema": "./node_modules/@vepp/import-icons/schema/figma-schema.json",
  "projects": {
    "vepp-mobile": {
      "icons": {
        "url": "https://www.figma.com/file/b7BggraZ1Ih3kG69jxdXSral/Vepp_213-Gorr)",
        "token": "38637-e3d9e312-215f-4d8c-a7be-94a5d1ae064b",
        "outputDir": "apps/vepp-mobile/src/assets/icons",
        "pageName": "mobile-icons"
      }
    }
  }
}
```

- figma-токен нужен для загрузки содержимого figma-файла по api. Как получить читать [тут](https://www.figma.com/developers/api#access-tokens).

3. Запустить скрипт `npx import-icons {projectName}`

## Оптимизация иконок

В данный момент принудительно включена, оптимизация происходит через утилиту [svgo](https://github.com/svg/svgo)

Для кастомного конфига svgo нужно в корне создать файл `svgo.json`, пример:

```json
{
  "plugins": [
    {
      "removeStyleElement": true
    },
    {
      "sortAttrs": true
    },
    {
      "moveElemsAttrsToGroup": false
    },
    {
      "removeViewBox": false
    }
  ]
}
```
