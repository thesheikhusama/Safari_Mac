# Safari Testing with GitHub Actions

Tests your website on real macOS Safari using GitHub Actions.

## Setup

1. Open this folder in VSCode
2. Run `npm install` in the terminal
3. Push to GitHub
4. Go to Actions tab → Safari Testing → Run workflow
5. Enter your URL and click Run
6. Download screenshots from the Artifacts section

## Edit pages to test

Open `tests/safari-test.js` and update `PAGES_TO_TEST`:

```js
const PAGES_TO_TEST = [
  { path: '/',        name: 'home'    },
  { path: '/about',   name: 'about'   },
  { path: '/contact', name: 'contact' },
];
```

## Viewports tested

- Desktop (1280×800)
- iPhone 14 (390×844)
- iPad (768×1024)
