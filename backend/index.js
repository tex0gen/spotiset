const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();
const port = 4000;

app.get('/:trackID/:trackURL', cors(), async (req, res) => {
  const url = `https://www.1001tracklists.com/tracklist/${req.params.trackID}/${req.params.trackURL}`;

  console.log("Requesting tracklist:", url);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Mobile UA is a good idea – they serve simpler markup
  await page.setUserAgent(
    "Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0 Firefox/41.0"
  );

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Wait for tracklist entries (tlpItem) to exist
  await page.waitForSelector('.tlpItem', { timeout: 10000 });

  // Extract the meta[itemprop="name"] contents
  const tracks = await page.$$eval(
    '.tlpItem meta[itemprop="name"]',
    els => els.map(e => e.content)
  );

  await browser.close();

  res.send(tracks);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
