var Twitter = require('twitter');
var fs = require('fs');
var _ = require('lodash');
var credentials = require('./credentials.js');

var client = new Twitter({
  consumer_key: credentials.consumer_key,
  consumer_secret: credentials.consumer_secret,
  access_token_key: credentials.access_token_key,
  access_token_secret: credentials.access_token_secret
});
 
var params = {screen_name: 'shirleyxywu', count: 200};
var maxId;
var tweets = {};
function getTweets() {
  client.get('statuses/user_timeline', params, function(error, rawTweets, response){
    if (!error) {
      _.each(rawTweets, function(tweet) {
        maxId = tweet.id;
        tweets[tweet.id] = {
          created_at: tweet.created_at,
          id: tweet.id,
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
          tweets[tweet.id].in_reply_to = {
            id: tweet.in_reply_to_status_id,
            user_id: tweet.in_reply_to_user_id,
            name: tweet.in_reply_to_screen_name
          };
        }
        // retweet
        if (tweet.retweeted_status) {
          tweets[tweet.id].retweet = {
            id: tweet.retweeted_status.id
          };
        }
        // quote
        if (tweet.quoted_status) {
          tweets[tweet.id].quote = {
            id: tweet.quoted_status.id
          };
        }
      });
      console.log(_.size(tweets));
      fs.writeFile('tweets.json', JSON.stringify(tweets), 'utf8');
      if (!_.isEmpty(rawTweets)) {
        // if tweets came back, there may be more, so go ask for more
        params.max_id = maxId;
        getTweets();
      }
    } else {
      console.log(error);
    }
  });
}

getTweets();
