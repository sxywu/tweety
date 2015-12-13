var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');

var CanvasComponent = require('./Canvas.jsx');
var TweetSummaryComponent = require('./TweetSummary.jsx');
var TweetComponent = require('./Tweet.jsx');
var DownScaleCanvas = require('./DownScaleCanvas.jsx');

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

var Content = React.createClass({

  getInitialState() {
    return {
      imageWidth: 50,
      image: [],
      user: {},
      tweets: [],
      hoveredTweet: null,
      sort: 'date',
      click: null,
      updatePositions: true,
    };
  },

  componentDidMount() {
    this.loadingIndicator = this.refs.loading && this.refs.loading.getDOMNode();
    if (this.loadingIndicator) {
      // React gods please don't be mad at me.
      // I realize this isn't the best way to do things.
      this.loadingIndicator.style.display = 'none';  
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.user.name === this.state.user.screenName) {
      // if we've already calculated the image, don't calculate again
      return;
    }

    // i'm sorry.  this feels wrong.  but it's too much work to do it the right way now.
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'block';  
    }

    // load the data
    var name = nextProps.user.name;
    var canvas = document.getElementById('getImageData');
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.src = nextProps.user.image;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      var imageWidth = nextProps.user.imageWidth;
      var scale = imageWidth / img.width;
      var rawImage = DownScaleCanvas.getJSON(canvas, scale);
      var image = []; // the dithered image

      // after we get image json
      // turn it grayscale first
      _.each(rawImage, function(pixel) {
        image.push(Math.max(pixel[0], pixel[1], pixel[2]));
      });
      // set the threshold to the average of all pixel values
      var threshold = _.reduce(image, (memo, pixel) => memo + pixel, 0) / image.length;
      // then Atkinson dithering
      _.each(image, function(oldPixel, i) {
        var newPixel = oldPixel > threshold ? 255 : 0;
        var error = (oldPixel - newPixel) >> 3;
        
        image[i] = newPixel;
        image[i + 1] += error;
        image[i + 1] += error;
        image[i + imageWidth - 1] += error;
        image[i + imageWidth] += error;
        image[i + imageWidth + 1] += error;
        image[i + imageWidth + 2] += error;
      });
      image = image.slice(0, rawImage.length);

      d3.json('data/' + name + '.json', (rawUser) => {
        var user = {
          name: rawUser.name,
          screenName: rawUser.screen_name,
          numTweets: rawUser.numTweets,
        };
        var tweets = rawUser.tweets;
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

        var numTweetsNotShown = user.numTweets - _.size(tweets);
        tweets = _.chain(tweets)
          .sortBy(function(tweet) {
            tweet.date = new Date(tweet.created_at);
            tweet.opacity = opacityScale(tweet.stats.favorites + 1);
            // make hashtags and user_mentions lower case so that they unique correctly
            tweet.hashtags = _.map(tweet.hashtags, (hashtag) => hashtag.toLowerCase());
            _.each(tweet.user_mentions, (mention) => {
              mention.name = mention.name.toLowerCase();
            });
            // then calculate tweet type
            if (tweet.retweet) {
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
            tweet.index = numTweetsNotShown + i + 1;
            return -tweet.date;
          }) // only work with the as many tweets as pixels
          .slice(0, _.filter(image, (pixel) => !pixel).length)
          .value();

        // again.  i'm sorry React gods.  i hope this doesn't make bugs.
        if (this.loadingIndicator) {
          this.loadingIndicator.style.display = 'none';  
        }

        this.setState({
          imageWidth, image, user, tweets, colToTweet, updatePositions: true,
          hoveredTweet: null,
          sort: 'date',
          click: null,
        });
      });      
    }
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

  clickCanvas() {
    if (!this.state.hoveredTweet) return;

    var tweet = this.state.hoveredTweet;
    var url;
    if (tweet.type === 'retweet') {
      url = 'http://twitter.com/' + tweet.retweet.name + '/status/' + tweet.retweet.id;
    } else {
      url = 'http://twitter.com/' + tweet.name + '/status/' + tweet.id;
    }
    window.open(url, '_new');
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
      newState.click = value && {type, value};
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
    var numFormat = d3.format(',');
    var userHeader = this.props.showSummary &&
      (<div className='userHeader'>
        <a href={'http://www.twitter.com/' + this.state.user.screenName} target='_new'>
          {this.state.user.name && this.state.user.name.toUpperCase()} ({this.state.user.screenName})
        </a>
        <div className='subtitle'>
          displaying {numFormat(this.state.tweets.length)} of {numFormat(this.state.user.numTweets)} tweets
        </div>
      </div>);
    var tweetSummary = this.props.showSummary &&
      (<TweetSummaryComponent sort={this.state.sort} click={this.state.click}
        tweets={this.state.tweets} hoveredTweet={this.state.hoveredTweet}
        onClick={this.clickSummary} onHover={this.hoverSummary} />);
    var loadingStyle = {
      position: 'absolute',
      top: 0,
      width: '540px',
      height: '540px',
      textAlign: 'center',
      verticalAlign: 'middle',
      backgroundColor: 'rgba(255,255,255,.75)'
    };
    var loadingIndicator = this.props.showSummary && (
      <div ref='loading' style={loadingStyle}>
        <img src='images/tuzki4.gif' style={{marginTop: '200px'}}/>
        <p>crunching that delicious data 💕</p>
      </div>
    );

    return (
      <div className='content'>
        {userHeader}
        <div style={{position: 'relative'}}>
          <CanvasComponent imageWidth={this.state.imageWidth}
            image={this.state.image} tweets={this.state.tweets}
            updatePositions={this.state.updatePositions}
            onMouseMove={this.mousemoveCanvas} onClick={this.clickCanvas} />
          {loadingIndicator}
          {tweetSummary}
        </div>
        <TweetComponent hoveredTweet={this.state.hoveredTweet} />
      </div>
    );
  }
});

module.exports = Content;