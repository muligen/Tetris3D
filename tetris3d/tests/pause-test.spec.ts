import { test, expect } from '@playwright/test';

test('调试暂停功能', async ({ page }) => {
  await page.goto('http://localhost:5175');
  await page.waitForTimeout(2000);

  // 截图初始状态
  await page.screenshot({ path: 'screenshots/debug-01-initial.png' });

  // 按 P 键
  await page.keyboard.press('p');
  await page.waitForTimeout(1000);

  // 截图暂停状态
  await page.screenshot({ path: 'screenshots/debug-02-after-p.png', fullPage: true });

  // 检查游戏状态（通过执行 JavaScript）
  const state = await page.evaluate(() => {
    // 获取 window 对象上的信息
    return {
      hasCanvas: !!document.querySelector('canvas'),
      bodyText: document.body.textContent?.slice(0, 200),
      allDivs: Array.from(document.querySelectorAll('div')).map(d => d.textContent).slice(0, 10)
    };
  });

  console.log('页面状态:', JSON.stringify(state, null, 2));

  // 检查是否有 PAUSED 文字
  const hasPausedText = await page.locator('text=PAUSED').count();
  console.log('PAUSED 文字数量:', hasPausedText);

  // 尝试获取所有文本
  const allText = await page.evaluate(() => {
    const walk = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    const texts: string[] = [];
    let node;
    while (node = walk.nextNode()) {
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        texts.push(text);
      }
    }
    return texts;
  });
  console.log('所有文本:', allText);
});
