import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Collect console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check for errors
  if (errors.length > 0) {
    console.log('=== PAGE ERRORS ===');
    errors.forEach(e => console.log(e));
  }

  // Inject code to check ghost piece rendering from inside the R3F scene
  const result = await page.evaluate(() => {
    const results = {};

    // Check store state
    const store = window.__TETRIS_STORE__;

    // Check if GameBoard is rendering ghost by looking at Three.js scene
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Get the Three.js renderer
      const r3fRoot = canvas._r3fRoot || canvas.__r3f;
      results.hasCanvas = true;

      // Try to find THREE.js scene via __THREE__
      results.threeExists = typeof THREE !== 'undefined';
    }

    return results;
  });

  console.log('=== Basic checks ===');
  console.log(JSON.stringify(result, null, 2));

  // Take a screenshot to see the current state
  await page.screenshot({ path: 'test-ghost-screenshot.png' });
  console.log('Screenshot saved to test-ghost-screenshot.png');

  // Now inject a test: wait for game to initialize, then check scene children
  const sceneCheck = await page.evaluate(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Access the R3F internal state through the canvas
        const canvas = document.querySelector('canvas');
        if (!canvas) {
          resolve({ error: 'No canvas found' });
          return;
        }

        // Try to find scene via window.__R3F__
        // R3F stores state internally, we need to traverse
        // Instead, let's inject a global from the component

        // Alternative: use the store to check game state
        const storeModule = document.querySelector('[data-testid]');
        resolve({ note: 'Checking via store injection needed' });
      }, 1000);
    });
  });

  // Better approach: inject test code before page load
  await page.evaluate(() => {
    // Monkey-patch the store to expose it globally
    // We'll check the scene after next frame
    window.__ghostTestResults = [];

    // Patch THREE.Mesh constructor to track ghost piece creation
    const origGroup = THREE.Group.prototype.add;
    let ghostFound = false;

    THREE.Group.prototype.add = function(object) {
      if (object.userData && object.userData.isGhostPiece) {
        ghostFound = true;
        window.__ghostTestResults.push({
          type: 'ghost_group_added',
          childCount: object.children.length,
          time: Date.now()
        });
      }

      // Check if this is a ghost mesh (transparent, opacity ~0.2)
      if (object.material && object.material.transparent && object.material.opacity <= 0.3) {
        window.__ghostTestResults.push({
          type: 'transparent_mesh',
          opacity: object.material.opacity,
          position: object.position.toArray(),
          time: Date.now()
        });
      }

      return origGroup.call(this, object);
    };
  });

  // Wait a bit for the game to process
  await page.waitForTimeout(2000);

  // Check results
  const ghostResults = await page.evaluate(() => window.__ghostTestResults);
  console.log('=== Ghost detection results ===');
  console.log(JSON.stringify(ghostResults, null, 2));

  // Now do a more direct check: evaluate the scene graph
  const sceneInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'no canvas' };

    // Try to find the scene by traversing
    // In R3F, the scene is stored in the store
    // Let's try a different approach: read store state
    const state = window.__R3F_STATE__;

    // Check all objects with userData
    const results = [];
    const findGhostObjects = (obj, path = '') => {
      if (obj.userData) {
        if (obj.userData.isGhostPiece || obj.userData.isCurrentPiece || obj.userData.isPlacedPiece) {
          results.push({
            path,
            type: obj.type,
            userData: { ...obj.userData },
            childCount: obj.children ? obj.children.length : 0,
            visible: obj.visible
          });
        }
      }
      if (obj.children) {
        obj.children.forEach((child, i) => {
          findGhostObjects(child, `${path}/${child.type || 'unknown'}[${i}]`);
        });
      }
    };

    // Try to access the scene from canvas internal state
    // R3F v8 uses store.getState().scene
    try {
      const fiber = canvas[Object.getOwnPropertySymbols(canvas).find(s => s.description === 'r3f.fiber')];
      if (fiber) {
        return { note: 'Found R3F fiber', hasFiber: true };
      }
    } catch (e) {}

    return { results, note: 'Could not access scene directly' };
  });

  console.log('=== Scene info ===');
  console.log(JSON.stringify(sceneInfo, null, 2));

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
