const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
  const page = await browser.newPage();
  const fileUrl = `file://${path.resolve('index.html').replace(/ /g, '%20')}`;
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });

  let failures = [];

  for (let i = 0; i < 120; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(20);
    const stateRaw = await page.evaluate(() => window.render_game_to_text && window.render_game_to_text());
    const state = JSON.parse(stateRaw);

    const badTrees = state.trees.filter((t) => !Array.isArray(t.safeDirections) || t.safeDirections.length === 0);
    if (badTrees.length > 0) {
      failures.push({ run: i + 1, level: state.level, badTrees: badTrees.map((t) => t.id) });
      break;
    }

    // Restart to generate a fresh random level 1 each iteration.
    await page.keyboard.press('r');
    await page.waitForTimeout(20);
  }

  if (failures.length > 0) {
    console.log(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, runs: 120 }, null, 2));
  await browser.close();
})();
