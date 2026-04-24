import { test, expect } from '@playwright/test';

test.use({ headless: true });

test('50 bot users test', async ({ browser }) => {
  test.setTimeout(120000); // 2 minutes

  const contexts = [];
  for (let i = 0; i < 50; i++) {
    contexts.push(await browser.newContext());
  }

  const results = await Promise.all(contexts.map(async (context, i) => {
    try {
      const page = await context.newPage();
      await page.goto('http://localhost:3000/');

      await page.fill('input[placeholder="e.g. John Doe"]', `Bot User ${i}`);
      await page.fill('input[placeholder="e.g. San Francisco, CA"]', `City ${i}`);
      await page.fill('input[placeholder="For deeper analysis"]', `bot${i}@example.com`);

      await page.click('button:has-text("Initiate Scan")');

      // Wait for results
      await page.waitForSelector('text=ESTIMATED EXPOSURE', { timeout: 10000 });
      return { id: i, success: true };
    } catch (e) {
      return { id: i, success: false, error: e.message };
    }
  }));

  const failed = results.filter(r => !r.success);
  console.log(`Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log(failed[0].error);
  }
});
