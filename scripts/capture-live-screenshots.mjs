import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const destDir = 'c:\\Users\\sanja\\Desktop\\reprise-source (1)\\reprise\\docs\\assets\\screenshots';
const publicDest = 'c:\\Users\\sanja\\Desktop\\reprise-source (1)\\reprise\\public\\assets\\screenshots';
const rootDest = 'c:\\Users\\sanja\\Desktop\\reprise-source (1)\\docs\\assets\\screenshots';

fs.mkdirSync(destDir, { recursive: true });
fs.mkdirSync(publicDest, { recursive: true });
fs.mkdirSync(rootDest, { recursive: true });

async function run() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://127.0.0.1:3000/ ...');
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });

  // 1. Capture Hero Overview
  console.log('1. Capturing Hero Overview...');
  await page.screenshot({ path: path.join(destDir, 'real-hero-overview.png') });

  // 2. Scroll to Replay Room & Capture Canvas
  console.log('2. Capturing Replay Room & FlowCanvas...');
  const replaySection = await page.$('.replay-section');
  if (replaySection) {
    await replaySection.screenshot({ path: path.join(destDir, 'real-replay-room.png') });
  }

  // 3. Click "With safeguards" and capture
  console.log('3. Clicking With safeguards...');
  const safeButton = await page.$('.segmented button:last-child');
  if (safeButton) {
    await safeButton.click();
    await new Promise(r => setTimeout(r, 600));
    if (replaySection) {
      await replaySection.screenshot({ path: path.join(destDir, 'real-guarded-room.png') });
    }
  }

  // 4. Run an Experiment Batch (click "Run experiment")
  console.log('4. Running batch experiment...');
  // First switch back to Reference policy
  const refButton = await page.$('.segmented button:first-child');
  if (refButton) await refButton.click();

  const runButton = await page.$('.run-panel button.primary');
  if (runButton) {
    await runButton.click();
    console.log('Waiting for experiment to run and render...');
    await page.waitForSelector('.suite-body', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    const suiteSection = await page.$('.suite-section');
    if (suiteSection) {
      await suiteSection.screenshot({ path: path.join(destDir, 'real-experiment-suite.png') });
    }
  }

  // 5. Navigate to "Model & evidence" Tab
  console.log('5. Capturing Model & Evidence Tab...');
  const navButtons = await page.$$('.topbar nav button');
  // Tab index 2 is 'Model & evidence'
  if (navButtons.length >= 3) {
    await navButtons[2].click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(destDir, 'real-model-evidence.png') });
  }

  // 6. Open "Bring your own sequence" Import Modal
  console.log('6. Capturing Import Modal...');
  // Click Test lab first
  if (navButtons.length >= 1) await navButtons[0].click();
  await new Promise(r => setTimeout(r, 500));
  const importButton = await page.$('.top-right button.icon-button');
  if (importButton) {
    await importButton.click();
    await page.waitForSelector('.modal', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(destDir, 'real-custom-trace-modal.png') });
  }

  await browser.close();
  console.log('All real screenshots captured successfully!');

  // Copy to public and root
  for (const file of fs.readdirSync(destDir)) {
    if (file.endsWith('.png')) {
      fs.copyFileSync(path.join(destDir, file), path.join(publicDest, file));
      fs.copyFileSync(path.join(destDir, file), path.join(rootDest, file));
      console.log('Synced:', file);
    }
  }
}

run().catch(e => {
  console.error('Failed to capture:', e);
  process.exit(1);
});
