const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const async = require('express-async-await');
const app = express();
const cors = require('cors');
const port = 4000;
app.get('/:trackID/:trackURL', cors(), async (req, res) => {
  axios({
    url: "https://www.1001tracklists.com/tracklist/" + req.params.trackID + "/" + req.params.trackURL,
    headers: {
      'Content-Type': 'text/html',
    }
  }).then(result => {
    console.log(result);
    const $ = cheerio.load(result.data);
    const tracks = [];
    const items = $('.mainContentDiv tr td meta[itemprop="name"]');

    Object.keys(items).forEach(key => {
      const track = $(items[key]).attr('content');
      if (track) {
        tracks.push(track);
      }
    });

    res.send(tracks);
  });
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});