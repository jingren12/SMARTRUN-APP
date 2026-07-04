import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--no-sandbox'],
});

const page = await browser.newPage({ viewport: { width: 393, height: 852 } });

const BASE = 'http://127.0.0.1:5173';

console.log('--- Home ---');
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'screenshots/home.png', fullPage: false });
console.log('  ✓ home.png');

console.log('--- Run ---');
const buttons1 = await page.locator('button').all();
for (const b of buttons1) {
  const t = await b.textContent();
  if (t?.includes('训练')) { await b.click(); break; }
}
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/run.png', fullPage: false });
console.log('  ✓ run.png');

console.log('--- AI Coach ---');
const buttons2 = await page.locator('button').all();
for (const b of buttons2) {
  const t = await b.textContent();
  if (t?.includes('AI')) { await b.click(); break; }
}
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/aicoach.png', fullPage: false });
console.log('  ✓ aicoach.png');

console.log('--- Robot ---');
const buttons3 = await page.locator('button').all();
for (const b of buttons3) {
  const t = await b.textContent();
  if (t?.includes('机器')) { await b.click(); break; }
}
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/robot.png', fullPage: false });
console.log('  ✓ robot.png');

console.log('--- Profile ---');
const buttons4 = await page.locator('button').all();
for (const b of buttons4) {
  const t = await b.textContent();
  if (t?.includes('我的')) { await b.click(); break; }
}
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/profile.png', fullPage: false });
console.log('  ✓ profile.png');

console.log('\n=== All screenshots captured ===');
await browser.close();