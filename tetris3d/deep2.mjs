import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
  // Check every single element with text content
  const allElements = document.querySelectorAll('*');
  const visible = [];
  for (const el of allElements) {
    const s = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const text = el.textContent?.trim();
    if (text && text.length > 1 && text.length < 200 && rect.width > 0 && rect.height > 0) {
      visible.push({
        tag: el.tagName,
        text: text.substring(0, 60),
        color: s.color,
        bgColor: s.backgroundColor,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        opacity: s.opacity,
        visibility: s.visibility,
        display: s.display,
        styleAttr: el.getAttribute('style')?.substring(0, 120) || '(none)'
      });
    }
  }
  return visible;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
