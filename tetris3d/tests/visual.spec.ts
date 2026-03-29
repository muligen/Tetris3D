import { test, expect } from '@playwright/test';

test.describe('3D Tetris 视觉测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置视口大小为 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5175');
    // 等待页面加载
    await page.waitForTimeout(2000);
  });

  test('游戏页面加载', async ({ page }) => {
    // 等待UI渲染完成
    await page.waitForSelector('button:has-text("Classic")', { timeout: 10000 });
    await page.waitForTimeout(2000); // 额外等待确保样式应用

    // 截图初始状态
    await page.screenshot({ path: 'screenshots/01-initial.png' });

    // 检查是否有错误
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 等待一会儿收集错误
    await page.waitForTimeout(3000);

    if (errors.length > 0) {
      console.log('浏览器控制台错误:', errors);
    }

    // 检查 canvas 元素是否存在
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('游戏控制测试', async ({ page }) => {
    // 截图初始状态
    await page.screenshot({ path: 'screenshots/02-before-controls.png' });

    // 模拟键盘控制
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/03-after-left.png' });

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/04-after-right.png' });

    await page.keyboard.press('ArrowUp'); // 旋转
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/05-after-rotate.png' });

    // 快速下落
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/06-after-drop.png' });
  });

  test('暂停功能', async ({ page }) => {
    // 按 P 键暂停
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/07-paused.png', fullPage: true });

    // 检查暂停文字是否显示
    const pageText = await page.textContent('body');
    expect(pageText).toContain('PAUSED');

    // 按 P 键继续
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/08-resumed.png' });
  });

  test('连续游戏', async ({ page }) => {
    // 连续按空格键快速下落数个方块
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: 'screenshots/09-after-10-drops.png', fullPage: true });

    // 检查分数板
    const scoreText = await page.textContent('body');
    console.log('页面内容片段:', scoreText?.slice(0, 200));
  });
});
