import { test, expect } from '@playwright/test';

// 使用 iPhone 14 Pro 模拟移动设备
test.use({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
});

test('移动端触摸按钮测试', async ({ page }) => {
  await page.goto('/Tetris3D/');

  // 等待游戏加载
  await page.waitForTimeout(2000);

  // 截图初始状态
  await page.screenshot({ path: 'screenshots/mobile-01-initial.png' });

  // 检查触摸控制按钮是否存在
  const buttons = page.locator('button:has-text("←"), button:has-text("→"), button:has-text("↻"), button:has-text("↓")');
  const buttonCount = await buttons.count();
  console.log('找到按钮数量:', buttonCount);
  expect(buttonCount).toBe(4);

  // 点击左移按钮 (使用 tap 模拟真实触摸)
  const leftButton = page.locator('button:has-text("←")').first();
  await leftButton.tap();
  await page.waitForTimeout(300);

  // 截图
  await page.screenshot({ path: 'screenshots/mobile-02-after-left.png' });

  // 点击右移按钮
  const rightButton = page.locator('button:has-text("→")').first();
  await rightButton.tap();
  await page.waitForTimeout(300);

  // 截图
  await page.screenshot({ path: 'screenshots/mobile-03-after-right.png' });

  // 点击旋转按钮
  const rotateButton = page.locator('button:has-text("↻")').first();
  await rotateButton.tap();
  await page.waitForTimeout(300);

  // 截图
  await page.screenshot({ path: 'screenshots/mobile-04-after-rotate.png' });

  console.log('移动端触摸测试完成');
});

test('移动端按钮 pointerEvents 检查', async ({ page }) => {
  await page.goto('/Tetris3D/');
  await page.waitForTimeout(2000);

  // 检查 TouchControls 容器的 pointerEvents 样式
  const touchControlsStyle = await page.evaluate(() => {
    const touchControls = document.querySelector('.md\\:hidden');
    if (!touchControls) return null;
    const computedStyle = window.getComputedStyle(touchControls);
    return {
      pointerEvents: computedStyle.pointerEvents,
      className: touchControls.className,
    };
  });
  console.log('TouchControls 样式:', JSON.stringify(touchControlsStyle, null, 2));

  // pointerEvents 应该是 'auto' 而不是 'none'
  expect(touchControlsStyle?.pointerEvents).toBe('auto');
});
