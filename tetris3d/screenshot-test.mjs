import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);

// Method 1: page.screenshot
await page.screenshot({ path: 'test-page.png' });

// Method 2: locator screenshot of the overlay div
const overlay = page.locator('div[style*="z-index: 10"]');
await overlay.screenshot({ path: 'test-overlay.png' }).catch(e => console.log('overlay error:', e.message));

// Method 3: locator screenshot of a specific button
const classicBtn = page.locator('button:has-text("Classic")');
await classicBtn.screenshot({ path: 'test-button.png' }).catch(e => console.log('button error:', e.message));

// Method 4: evaluate with toDataURL
const dataUrl = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  return canvas?.toDataURL()?.substring(0, 50) || 'no canvas';
});
console.log('Canvas dataURL:', dataUrl);

console.log('Done');
await browser.close();
