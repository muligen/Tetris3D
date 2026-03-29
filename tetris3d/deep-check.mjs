import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
  const root = document.getElementById('root');
  const app = root?.firstElementChild?.firstElementChild; // root > div > div(Game container)
  if (!app) return { error: 'no app', rootHTML: root?.innerHTML?.substring(0, 300) };
  
  const canvas = app.querySelector('canvas');
  const overlay = app.children[1]; // second child = UI overlay
  
  if (!overlay) return { error: 'no overlay', childCount: app.childElementCount };
  
  const overlayStyle = getComputedStyle(overlay);
  const overlayRect = overlay.getBoundingClientRect();
  const canvasRect = canvas?.getBoundingClientRect();
  const canvasStyle = canvas ? getComputedStyle(canvas) : null;
  
  // Get all visible children of the overlay
  const children = [];
  for (const child of overlay.children) {
    const cs = getComputedStyle(child);
    const rect = child.getBoundingClientRect();
    children.push({
      tag: child.tagName,
      text: child.textContent?.substring(0, 60),
      position: cs.position,
      zIndex: cs.zIndex,
      color: cs.color,
      bgColor: cs.backgroundColor,
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      overflow: cs.overflow,
      display: cs.display,
      visible: rect.width > 0 && rect.height > 0
    });
  }
  
  return {
    overlay: {
      position: overlayStyle.position,
      zIndex: overlayStyle.zIndex,
      width: Math.round(overlayRect.width),
      height: Math.round(overlayRect.height),
      pointerEvents: overlayStyle.pointerEvents,
      color: overlayStyle.color,
      childCount: overlay.childElementCount
    },
    canvas: canvas ? {
      position: canvasStyle.position,
      zIndex: canvasStyle.zIndex,
      width: Math.round(canvasRect.width),
      height: Math.round(canvasRect.height)
    } : 'no canvas',
    children
  };
});
console.log(JSON.stringify(result, null, 2));

// Take a screenshot and save
await page.screenshot({ path: 'debug-screenshot.png' });
console.log('\nScreenshot saved to debug-screenshot.png');

await browser.close();
