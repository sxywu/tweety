var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');

var CanvasComponent = require('./Canvas.jsx');
var TweetSummaryComponent = require('./TweetSummary.jsx');

// taken directly from nbremer's occupationcanvas code
//Generates the next color in the sequence, going from 0,0,0 to 255,255,255.
//From: https://bocoup.com/weblog/2d-picking-in-canvas
var nextCol = 1;
function genColor(){
  var ret = [];
  // via http://stackoverflow.com/a/15804183
  if(nextCol < 16777215){
    ret.push(nextCol & 0xff); // R
    ret.push((nextCol & 0xff00) >> 8); // G 
    ret.push((nextCol & 0xff0000) >> 16); // B

    nextCol += 100; // This is exagerated for this example and would ordinarily be 1.
  }
  var col = "rgb(" + ret.join(',') + ")";
  return col;
}

var App = React.createClass({

  getInitialState() {
    return {
      image: [],
      tweets: [],
      hoveredTweet: null,
      sort: 'date',
      click: null,
      updatePositions: true,
    };
  },

  componentWillMount() {
    // load the data
    d3.json('data/twitter_profile3.json', (image) => {
      d3.json('data/tweets.json', (tweets) => {
        // process the tweets
        var minOpacity = _.min(tweets, function(tweet) {
          return tweet.stats.favorites;
        });
        minOpacity = minOpacity.stats.favorites + 1;
        var maxOpacity = _.max(tweets, function(tweet) {
          return tweet.stats.favorites;
        });
        maxOpacity = maxOpacity.stats.favorites + 1;
        var opacityScale = d3.scale.log()
          .domain([minOpacity, maxOpacity])
          .range([.25, 1]);
        var colToTweet = {};

        tweets = _.chain(tweets)
          .sortBy(function(tweet) {
            tweet.date = new Date(tweet.created_at);
            tweet.opacity = opacityScale(tweet.stats.favorites + 1);
            if (tweet.retweet || tweet.quote) {
              tweet.type = 'retweet';
            } else if (tweet.in_reply_to) {
              tweet.type = 'reply';
            } else {
              tweet.type = 'tweet';
            }
            // and then remember the tweet by its unique color
            tweet.uniqColor = genColor();
            colToTweet[tweet.uniqColor] = tweet;
            return tweet.date;
          }).sortBy(function(tweet, i) {
            tweet.index = i;
            return -tweet.date;
          }).value();

        this.setState({image, tweets, colToTweet});
      });
    });
  },

  mousemoveCanvas(color) {
    var newState = {
      updatePositions: false
    };
    var tweet = this.state.colToTweet[color];
    var currentTweet = this.state.hoveredTweet;

    // we only want to re-render if hovered tweet is different from current tweet
    if (tweet && !tweet.grayed &&
      (!currentTweet || tweet.id !== currentTweet.id)) {
      // first clean up currentTweet (now previous tweet)
      if (currentTweet) {
        currentTweet.hovered = false;
      }
      tweet.hovered = true;
      newState.hoveredTweet = tweet;

    } else if (!tweet && currentTweet) {
      // if there's no new hovered tweet but there is a previous one, clean it up
      currentTweet.hovered = false;
      newState.hoveredTweet = null;
    }

    this.setState(newState);
  },

  clickSummary(type, value) {
    var newState = {
      updatePositions: false
    };

    if (type === 'sort') {
      newState[type] = value;
      newState.updatePositions = true;
      newState.tweets = _.sortBy(this.state.tweets, (tweet) => {
        if (value === 'favorites') {
          return -tweet.stats.favorites;
        } else if (value === 'type') {
          if (tweet.type === 'tweet') {
            return 1;
          } else if (tweet.type === 'retweet') {
            return 2;
          } else if (tweet.type === 'reply') {
            return 3;
          }
        } else {
          return -tweet[value];
        }
      });
    } else {
      // then it must been a click
      newState.click = {type, value};
      newState.tweets = this.calculateHighlight(type, value, newState.click);
    }

    this.setState(newState);
  },

  hoverSummary(type, value, clicked) {
    var newState = {
      updatePositions: false,
    };
    newState.tweets = this.calculateHighlight(type, value, this.state.click);

    this.setState(newState);
  },

  calculateHighlight(type, value, clicked) {
    return _.each(this.state.tweets, (tweet) => {
      if (type === 'type') {
        tweet.grayed = value && tweet.type !== value;
      } else if (type === 'hashtag') {
        tweet.grayed = value && !_.contains(tweet.hashtags, value);
      } else if (type === 'mention') {
        tweet.grayed = value && !_.chain(tweet.user_mentions)
          .pluck('name').contains(value).value();
      }
      if (clicked) {
        if (clicked.type === 'type') {
          tweet.clicked = tweet.type === clicked.value;
        } else if (clicked.type === 'hashtag') {
          tweet.clicked = _.contains(tweet.hashtags, clicked.value);
        } else if (clicked.type === 'mention') {
          tweet.clicked = _.chain(tweet.user_mentions)
            .pluck('name').contains(clicked.value).value();
        }
        // only if unhovered, should tweet.grayed be reliant on tweet.clicked
        if (!value) {
          tweet.grayed = !tweet.clicked;
        }
      }
      
    });
  },

  render() {
    return (
      <div>
        <CanvasComponent image={this.state.image} tweets={this.state.tweets}
          updatePositions={this.state.updatePositions} onMouseMove={this.mousemoveCanvas} />
        <TweetSummaryComponent sort={this.state.sort} hoveredTweet={this.state.hoveredTweet}
          tweets={this.state.tweets} onClick={this.clickSummary} onHover={this.hoverSummary} />
      </div>
    );
  }
});

module.exports = App;