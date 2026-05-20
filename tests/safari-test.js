const { webkit } = require('playwright');

const BASE_URL       = (process.env.TEST_URL    || 'https://your-website.com').replace(/\/$/, '');
const PAGES_RAW      =  process.env.TEST_PAGES  || '/';
const VIEWPORTS_MODE =  process.env.TEST_VIEWPORTS || 'all';

// Third-party noise — safe to ignore
const NOISE_PATTERNS = [
  'access control checks',
  'accessing a frame with origin',
  'Protocols, domains, and ports must match',
  'cross-origin',
  'Cross-Origin',
  'givebutter.com',
  'stripe.com',
  'youtube.com',
  'google.com',
  'clarity.ms',
  'frame with origin',
  'Protocols must match',
];

const ALL_VIEWPORTS = [
  { width: 1280, height: 800,  name: 'desktop'   },
  { width: 390,  height: 844,  name: 'iphone-14' },
  { width: 768,  height: 1024, name: 'ipad'      },
];

const VIEWPORTS = VIEWPORTS_MODE === 'desktop only'
  ? ALL_VIEWPORTS.filter(v => v.name === 'desktop')
  : VIEWPORTS_MODE === 'mobile only'
  ? ALL_VIEWPORTS.filter(v => v.name !== 'desktop')
  : ALL_VIEWPORTS;

const PAGES = PAGES_RAW.split(',').map(p => {
  const path = p.trim().startsWith('/') ? p.trim() : '/' + p.trim();
  const name = path === '/' ? 'home' : path.replace(/\//g, '-').replace(/^-/, '').replace(/-$/, '');
  return { path, name };
});

(async () => {
  console.log(`Base URL  : ${BASE_URL}`);
  console.log(`Pages     : ${PAGES.map(p => p.path).join(', ')}`);
  console.log(`Viewports : ${VIEWPORTS.map(v => v.name).join(', ')}`);
  console.log('');

  const browser = await webkit.launch();
  let passed = 0;
  let failed = 0;
  const realErrors = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    });

    const page = await context.newPage();

    page.on('pageerror', err => {
      const msg = err.message || '';
      const isNoise = NOISE_PATTERNS.some(n => msg.includes(n));
      if (!isNoise) {
        realErrors.push({ viewport: viewport.name, page: 'unknown', error: msg });
      }
    });

    for (const route of PAGES) {
      try {
        const fullUrl = `${BASE_URL}${route.path}`;
        console.log(`[${viewport.name}] Loading ${fullUrl}...`);

        const response = await page.goto(fullUrl, {
          waitUntil: 'load',
          timeout: 30000,
        });

        await page.waitForTimeout(2000);

        const status = response.status();
        if (status >= 400) {
          console.error(`  FAIL: HTTP ${status}`);
          failed++;
          continue;
        }

        const filename = `screenshots/${route.name}-${viewport.name}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`  OK → ${filename}`);
        passed++;

      } catch (err) {
        console.error(`  FAIL: ${err.message}`);
        failed++;
      }
    }

    await context.close();
  }

  await browser.close();

  if (realErrors.length > 0) {
    console.log('\n⚠ Real JS errors on your site (not third-party noise):');
    realErrors.forEach(e => console.log(`  [${e.viewport}] ${e.error}`));
  } else {
    console.log('\n✓ No real JS errors found');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
