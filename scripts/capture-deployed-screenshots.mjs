import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const destDir = 'c:\\Users\\sanja\\Desktop\\reprise-source (1)\\reprise\\docs\\assets\\screenshots';
const publicDest = 'c:\\Users\\sanja\\Desktop\\reprise-source (1)\\reprise\\public\\assets\\screenshots';
const rootDest = 'c:\\Users\\sanja\\Desktop\\reprise-source (1)\\docs\\assets\\screenshots';

const baseUrl = 'https://reprise-recovery.rikit68533.chatgpt.site';

fs.mkdirSync(destDir, { recursive: true });
fs.mkdirSync(publicDest, { recursive: true });
fs.mkdirSync(rootDest, { recursive: true });

async function run() {
  console.log(`Connecting to deployed site: ${baseUrl} ...`);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Capture Deployed Landing Page
  console.log('1. Capturing Landing Page...');
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(destDir, 'deployed-landing-hero.png') });

  // 2. Navigate to /lab & Capture Test Lab Replay Room
  console.log('2. Navigating to /lab...');
  await page.goto(`${baseUrl}/lab`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  
  const replaySection = await page.$('.replay-section');
  if (replaySection) {
    console.log('Capturing Replay Room...');
    await replaySection.screenshot({ path: path.join(destDir, 'deployed-replay-room.png') });
  }

  // 3. Click "With safeguards" & Capture
  console.log('3. Toggling With safeguards...');
  const safeButton = await page.$('.segmented button:last-child');
  if (safeButton) {
    await safeButton.click();
    await new Promise(r => setTimeout(r, 800));
    if (replaySection) {
      await replaySection.screenshot({ path: path.join(destDir, 'deployed-guarded-room.png') });
    }
  }

  // 4. Run an Experiment Batch
  console.log('4. Running batch experiment on deployed site...');
  const refButton = await page.$('.segmented button:first-child');
  if (refButton) await refButton.click();

  const runButton = await page.$('.run-panel button.primary');
  if (runButton) {
    await runButton.click();
    console.log('Waiting for experiment results from Cloudflare Workers/D1...');
    await page.waitForSelector('.suite-body', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));
    const suiteSection = await page.$('.suite-section');
    if (suiteSection) {
      await suiteSection.screenshot({ path: path.join(destDir, 'deployed-experiment-suite.png') });
    }
  }

  // 5. Navigate to "Model & evidence" Tab
  console.log('5. Capturing Model & Evidence tab...');
  const navButtons = await page.$$('.topbar nav button');
  if (navButtons.length >= 3) {
    await navButtons[2].click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(destDir, 'deployed-model-evidence.png') });
  }

  // 6. Open "Bring your own sequence" Import Modal
  console.log('6. Capturing Import Modal...');
  if (navButtons.length >= 1) await navButtons[0].click();
  await new Promise(r => setTimeout(r, 600));
  const importButton = await page.$('.top-right button.icon-button');
  if (importButton) {
    await importButton.click();
    await page.waitForSelector('.modal', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(destDir, 'deployed-custom-trace-modal.png') });
  }

  await browser.close();
  console.log('All deployed screenshots captured successfully!');

  // Sync to public and root docs
  for (const file of fs.readdirSync(destDir)) {
    if (file.startsWith('deployed-') && file.endsWith('.png')) {
      fs.copyFileSync(path.join(destDir, file), path.join(publicDest, file));
      fs.copyFileSync(path.join(destDir, file), path.join(rootDest, file));
      console.log('Synced:', file);
    }
  }
}

run().catch(e => {
  console.error('Error during capture:', e);
  process.exit(1);
});
