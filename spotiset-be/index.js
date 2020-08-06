const express = require('express')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const async = require('express-async-await')
const app = express()
const cors = require('cors')
const port = 4000

getTracklist = async (id, url) => {
  return await fetch("https://www.1001tracklists.com/tracklist/"+id+"/"+url, {
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

      return JSON.stringify(tracks);
    }
  );
}

app.get('/:trackID/:trackURL', cors(), async (req, res) => {
  const tracks = await getTracklist(req.params.trackID, req.params.trackURL);
  res.send(tracks);
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
})