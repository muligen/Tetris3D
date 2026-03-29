import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
});
page.on('pageerror', err => errors.push('PAGE: ' + err.message));

await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);

const dom = await page.evaluate(() => {
  const root = document.getElementById('root');
  const first = root?.firstElementChild;
  if (!first) return { rootChildren: root?.childElementCount, html: root?.innerHTML?.substring(0,300) };
  const s = getComputedStyle(first);
  const children = [];
  for (const c of first.children) {
    const cs = getComputedStyle(c);
    children.push({
      tag: c.tagName,
      zIndex: cs.zIndex,
      position: cs.position,
      w: Math.round(c.getBoundingClientRect().width),
      h: Math.round(c.getBoundingClientRect().height),
      children: c.childElementCount,
      style: c.getAttribute('style')?.substring(0,100),
      text: c.textContent?.substring(0,80)
    });
  }
  return { 
    rootChildren: root?.childElementCount,
    firstTag: first.tagName,
    firstStyle: first.getAttribute('style')?.substring(0,200),
    firstW: Math.round(first.getBoundingClientRect().width),
    firstH: Math.round(first.getBoundingClientRect().height),
    children 
  };
});
console.log('=== DOM ===');
console.log(JSON.stringify(dom, null, 2));
console.log('\n=== ERRORS ===');
console.log(errors.length ? errors.join('\n') : 'None');
await browser.close();
