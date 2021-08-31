const express = require('express')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const async = require('express-async-await')
const app = express()
const cors = require('cors')
const port = 4000

app.get('/:trackID/:trackURL', cors(), async (req, res) => {
  await fetch("https://www.1001tracklists.com/tracklist/" + req.params.trackID + "/" + req.params.trackURL, {
    'Content-Type': 'text/html',
    headers: {
      "User-Agent": "Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0 Firefox/41.0"
    }
  })
  .then(res => res.text())
  .then(
    (result) => {
      let tracks = [];
      const $ = cheerio.load(result);
      const items = $('.tlpItem meta[itemprop="name"]');

      Object.keys(items).forEach(key => {
        const track = $(items[key]).attr('content');
        if (track) {
          tracks.push(track);
        }
      });

      res.send(tracks);
    }
  );
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
})
