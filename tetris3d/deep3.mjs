import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
  const buttons = document.querySelectorAll('button');
  return Array.from(buttons).map(b => {
    const s = getComputedStyle(b);
    const rect = b.getBoundingClientRect();
    return {
      text: b.textContent?.substring(0, 30),
      color: s.color,
      bgColor: s.backgroundColor,
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      styleAttr: b.getAttribute('style')?.substring(0, 200) || '(none)',
      border: s.border
    };
  });
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
