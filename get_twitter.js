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

var name;
var userParams;
var params;
var maxId;
var userObj;
var prevTweetsNum;
var doneFetchingData = true;
function getTweets() {
  client.get('statuses/user_timeline', params, function(error, rawTweets, response){
    if (!error) {
      _.each(rawTweets, function(tweet) {
        maxId = tweet.id_str;
        userObj.tweets[tweet.id_str] = {
          created_at: tweet.created_at,
          id: tweet.id_str,
          text: tweet.text,
          user_id: tweet.user && tweet.user.id,
          name: tweet.user && tweet.user.screen_name,
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
          userObj.tweets[tweet.id_str].in_reply_to = {
            id: tweet.in_reply_to_status_id_str,
            user_id: tweet.in_reply_to_user_id_str,
            name: tweet.in_reply_to_screen_name
          };
        }
        // retweet
        if (tweet.retweeted_status) {
          userObj.tweets[tweet.id_str].retweet = {
            id: tweet.retweeted_status.id_str,
            name: tweet.retweeted_status.user.screen_name
          };
        }
        // quote
        if (tweet.quoted_status) {
          userObj.tweets[tweet.id_str].quote = {
            id: tweet.quoted_status.id_str
          };
        }
      });

      console.log(name, _.size(userObj.tweets), prevTweetsNum);
      fs.writeFile('data/' + userObj.screen_name + '.json', JSON.stringify(userObj), 'utf8');
      if (_.size(userObj.tweets) !== prevTweetsNum) {
        // if tweets came back, there may be more, so go ask for more
        prevTweetsNum = _.size(userObj.tweets);
        params.max_id = maxId;
        getTweets();
      } else {
        doneFetchingData = true;
      }
    } else {
      console.log(error);
      // error most likely bc of API timeout
      // so wait 15min before trying again
      setTimeout(getTweets, 900000);
    }
  });
}

function getUser(userFile) {
  name = userFile.name;
  userParams = {q: name, count: 1};
  params = {screen_name: name, count: 200};
  maxId = null;
  userObj = {};
  userObj.tweets = {};
  prevTweetsNum = 0;
  doneFetchingData = false;

  client.get('users/search', userParams, function(error, rawUsers, response) {
    console.log(rawUsers[0].name)
    var user = rawUsers[0];
    userObj.id = user.id_str;
    userObj.screen_name = user.screen_name;
    userObj.name = user.name;
    userObj.numTweets = user.statuses_count;
    userFile.numFollowers = userObj.numFollowers = user.followers_count;

    // download image, code from http://stackoverflow.com/questions/12740659/downloading-images-with-node-js
    var uri = user.profile_image_url.replace('_normal', '');
    userFile.image = 'images/' + userObj.screen_name + '.' + _.last(uri.split('.'));
    request.head(uri, function(err, res, body){

      request(uri).pipe(fs.createWriteStream(userFile.image)).on('close', function() {
        console.log(userFile.image, 'done downloading');

        getTweets();
      });
    });
  });
}

var i = 0;
var users = [];
function fetchAllUsers() {
  setTimeout(function() {
    if (!doneFetchingData) {
      fetchAllUsers();
    } else if (users[i]) {
      console.log('usuer', users[i].name)
      getUser(users[i]);
      i += 1;
      fetchAllUsers();
    } else {
      // if we're done fetching data
      // and there are no more users, then save the users file
      // with all the new images data
      _.each(users, function(user) {
        console.log(user.image);
      });
      fs.writeFile('data/users.json', JSON.stringify(users), 'utf8');
    }
  }, 2000);
}

fs.readFile('data/users.json', 'utf8', function(err, rawUsers) {
  users = JSON.parse(rawUsers);
  fetchAllUsers();
});

