import { test, expect } from '@playwright/test';

test('Ghost Piece debug', async ({ page }) => {
  const jsErrors: string[] = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  // Check JS errors
  const criticalErrors = jsErrors.filter(e => !e.includes('favicon'));
  console.log('=== JS Errors ===');
  criticalErrors.forEach(e => console.log('  ' + e));

  // Check for GHOST log
  const ghostLogs = consoleMessages.filter(m => m.includes('[GHOST]'));
  console.log('\n=== Ghost Logs ===');
  ghostLogs.forEach(l => console.log('  ' + l));

  // Check R3F errors
  const r3fErrors = jsErrors.filter(e => e.includes('R3F'));
  console.log('\n=== R3F Errors ===');
  r3fErrors.forEach(e => console.log('  ' + e));

  // Screenshot
  await page.screenshot({ path: 'test-ghost-debug.png', fullPage: true });

  // Assertions
  expect(r3fErrors).toEqual([]);
  expect(ghostLogs.length).toBeGreaterThan(0);

  console.log(ghostLogs.length > 0 ? '\n✅ Ghost piece is computing!' : '\n❌ Ghost piece NOT computing');
});
