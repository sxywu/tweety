/*
This file strips unused data from the collected tweets. It could be simpler to not collect the data in the first place
by modifying get_twitter.js but then we'd have to hit twitter's API again. You can also keep the original data
and use for other projects, while this one we can just use the minified ones
*/
fs = require('fs');

filenames = fs.readdirSync("./data/")
console.log("filenames", filenames)

filenames.forEach(function(file) {
  // we skip our minified files
  if(file.indexOf("-min") >= 0 || file.indexOf("csv") >= 0 || file === '.DS_Store') return;

  console.log(file)
  var data = JSON.parse(fs.readFileSync("./data/" + file).toString())
  var tweets = data.tweets;
  if(tweets) {
  var ids = Object.keys(tweets)
  ids.forEach(function(id) {
    var t = tweets[id]
    var d = JSON.parse(JSON.stringify(t))
    delete d.user_id
    delete d.id

    if(d.hashtags.length) {
      d.h = t.hashtags
    }
    delete d.hashtags;

    if(d.user_mentions.length) {
      d.um = t.user_mentions;
    }
    delete d.user_mentions;

    d.c = t.created_at;
    delete d.created_at;
    tweets[id] = d;
  })
  }
  console.log("file", "./data/" + data.screen_name + "-min.json")
  fs.writeFileSync("./data/" + data.screen_name + "-min.json", JSON.stringify(data))
})