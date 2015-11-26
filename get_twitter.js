var Twitter = require('twitter');
var fs = require('fs');
var request = require('request');
var _ = require('lodash');
var credentials = require('./credentials.js');

var client = new Twitter({
  consumer_key: credentials.consumer_key,
  consumer_secret: credentials.consumer_secret,
  access_token_key: credentials.access_token_key,
  access_token_secret: credentials.access_token_secret
});

var name = 'Elijah_Meeks';
var userParams = {q: name, count: 1};
var params = {screen_name: name, count: 200};
var maxId;
var userObj = {};
var tweets = userObj.tweets = {};
var prevTweetsNum = 0;
function getTweets() {
  client.get('statuses/user_timeline', params, function(error, rawTweets, response){
    if (!error) {
      _.each(rawTweets, function(tweet) {
        maxId = tweet.id_str;
        tweets[tweet.id_str] = {
          created_at: tweet.created_at,
          id: tweet.id_str,
          text: tweet.text,
          user_id: tweet.user.id,
          name: tweet.user.screen_name,
          stats: {
            favorites: tweet.favorite_count,
            retweets: tweet.retweet_count
          },
          hashtags: _.pluck(tweet.entities.hashtags, 'text'),
          user_mentions: _.map(tweet.entities.user_mentions, function(user) {
            return {user_id: user.id, name: user.screen_name};
          })
        };
        // reply
        if (tweet.in_reply_to_status_id) {
          tweets[tweet.id_str].in_reply_to = {
            id: tweet.in_reply_to_status_id_str,
            user_id: tweet.in_reply_to_user_id_str,
            name: tweet.in_reply_to_screen_name
          };
        }
        // retweet
        if (tweet.retweeted_status) {
          tweets[tweet.id_str].retweet = {
            id: tweet.retweeted_status.id_str,
            name: tweet.retweeted_status.user.screen_name
          };
        }
        // quote
        if (tweet.quoted_status) {
          tweets[tweet.id_str].quote = {
            id: tweet.quoted_status.id_str
          };
        }
      });

      console.log(_.size(tweets), prevTweetsNum);
      fs.writeFile('data/' + userObj.screen_name + '.json', JSON.stringify(userObj), 'utf8');
      if (_.size(tweets) !== prevTweetsNum) {
        // if tweets came back, there may be more, so go ask for more
        prevTweetsNum = _.size(tweets);
        params.max_id = maxId;
        getTweets();
      }
    } else {
      console.log(error);
    }
  });
}

client.get('users/search', userParams, function(error, rawUsers, response) {
  var user = rawUsers[0];
  userObj.id = user.id_str;
  userObj.screen_name = user.screen_name;
  userObj.name = user.name;
  userObj.numTweets = user.statuses_count;

  // download image, code from http://stackoverflow.com/questions/12740659/downloading-images-with-node-js
  var uri = user.profile_image_url.replace('_normal', '');
  var filename = 'images/' + userObj.screen_name + '.' + _.last(uri.split('.'));
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', function() {
      console.log('done downloading');

      getTweets();
    });
  });
});
