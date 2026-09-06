import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const destDir = 'c:\\Users\\sanja\\Desktop\\reprise-source (1)\\reprise\\docs\\assets\\screenshots';
const publicDest = 'c:\\Users\\sanja\\Desktop\\reprise-source (1)\\reprise\\public\\assets\\screenshots';
const rootDest = 'c:\\Users\\sanja\\Desktop\\reprise-source (1)\\docs\\assets\\screenshots';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://reprise-recovery.rikit68533.chatgpt.site/lab', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Click With safeguards
  const safeButton = await page.$('.segmented button:last-child');
  if (safeButton) await safeButton.click();
  await new Promise(r => setTimeout(r, 800));

  // Invoke the exact canvas draw function for guarded
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const fiberKey = Object.keys(canvas).find(k => k.startsWith('__reactFiber'));
    let cur = canvas[fiberKey];
    while (cur && (!cur.memoizedProps || !cur.memoizedProps.steps)) {
      cur = cur.return;
    }
    const steps = cur.memoizedProps.steps;
    const cursor = cur.memoizedProps.cursor;
    const guarded = true;

    const box = canvas.getBoundingClientRect();
    const width = box.width;
    const height = box.height;
    const d = Math.min(window.devicePixelRatio, 2);
    canvas.width = width * d;
    canvas.height = height * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);

    const w = width, h = height;
    const startX = w * 0.13, endX = w * 0.87;
    const rows = [h * 0.25, h * 0.5, h * 0.75];

    ctx.lineWidth = 1;
    for (let y = 0; y < 12; y++) {
      ctx.strokeStyle = 'rgba(171,181,195,.055)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + (0 - w * 0.5) * (1 + y * 0.23), h * 0.12 + y * h * 0.084);
      ctx.lineTo(w * 0.5 + (w - w * 0.5) * (1 + y * 0.23), h * 0.12 + y * h * 0.084);
      ctx.stroke();
    }
    for (let x = 0; x < 14; x++) {
      ctx.strokeStyle = 'rgba(171,181,195,.045)';
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + (x - 7) * w * 0.044, 0);
      ctx.lineTo(w * 0.5 + (x - 7) * w * 0.15, h);
      ctx.stroke();
    }

    const points = steps.filter(s => s.type !== 'telemetry.heartbeat').map((s, i, arr) => {
      const originalIndex = steps.indexOf(s);
      return {
        x: startX + (endX - startX) * (i / Math.max(1, arr.length - 1)),
        y: rows[s.action === 'recover' || s.action === 'hold' || s.action === 'refund' ? 1 : s.type.startsWith('gateway') ? 2 : 0],
        s,
        index: originalIndex
      };
    });

    ctx.setLineDash([3, 7]);
    rows.forEach((y, i) => {
      ctx.strokeStyle = 'rgba(194,205,219,.16)';
      ctx.beginPath();
      ctx.moveTo(startX - 25, y);
      ctx.lineTo(endX + 25, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const color = '#b8e99f';
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const on = b.index <= cursor;
      ctx.strokeStyle = on ? color : 'rgba(153,164,183,.14)';
      ctx.lineWidth = on ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.bezierCurveTo((a.x + b.x) / 2, a.y, (a.x + b.x) / 2, b.y, b.x, b.y);
      ctx.stroke();
    }

    points.forEach(p => {
      const on = p.index <= cursor;
      const current = p.index === cursor;
      ctx.fillStyle = on ? '#222b38' : '#171e2a';
      ctx.strokeStyle = on ? color : '#404653';
      ctx.lineWidth = current ? 2 : 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, current ? 13 : 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (on) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (current) {
        ctx.strokeStyle = 'rgba(184,233,159,.15)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 21, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = '13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = on ? '#e1e4e9' : '#707b8e';
      ctx.fillText(p.s.at + 's', p.x, p.y + 32);
      ctx.font = '13px Arial, sans-serif';
      ctx.fillText(
        p.s.action === 'hold' ? 'Action held' :
        p.s.action === 'recover' ? 'Recovery charged' :
        p.s.action === 'refund' ? 'Refund posted' :
        p.s.type.replace('gateway.', 'Bank: ').replace('webhook.', 'Notify: ').replace('checkout.', 'Checkout: ').replace('consent.', 'Consent: '),
        p.x, p.y - 23
      );
    });

    ctx.textAlign = 'left';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillStyle = '#7f8a9e';
    ['EVENTS', 'AGENT', 'LEDGER'].forEach((t, i) => ctx.fillText(t, 20, rows[i] + 4));
  });

  const replaySection = await page.$('.replay-section');
  if (replaySection) {
    const file = 'deployed-guarded-room.png';
    await replaySection.screenshot({ path: path.join(destDir, file) });
    fs.copyFileSync(path.join(destDir, file), path.join(publicDest, file));
    fs.copyFileSync(path.join(destDir, file), path.join(rootDest, file));
    console.log('Successfully captured and saved', file);
  }

  await browser.close();
}

run().catch(console.error);
