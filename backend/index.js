const express = require('express')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const async = require('express-async-await')
const app = express()
const cors = require('cors')
const port = 4000

app.get('/:trackID/:trackURL', cors(), async (req, res) => {
  await fetch("https://www.1001tracklists.com/tracklist/"+req.params.trackID+"/"+req.params.trackURL, {
    'Content-Type': 'text/html'
  })
  .then(res => res.text())
  .then(
    (result) => {
      const $ = cheerio.load(result);
      const tracks = [];
      const items = $('.mainContentDiv tr td meta[itemprop="name"]');
      
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