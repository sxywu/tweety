var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');

var ctx, hiddenCtx;
var size, imageSize, scaleFactor;
var image = [];
var duration = 1000;

// some defaults
var threshold = 122.5;
var padding = 20;
var tweetColors = {
  'reply': [248,148,6], // orange
  'retweet': [81,163,81], // green
  'tweet': [0,136,204] // blue
};
var fisheye = d3.fisheye.circular()
  .radius(60)
  .distortion(2);

function calculatePixels(props) {
  // turn it grayscale first
  _.each(props.image, function(pixel) {
    image.push(Math.max(pixel[0], pixel[1], pixel[2]));
  });
  // Atkinson dithering
  _.each(image, function(oldPixel, i) {
    var newPixel = oldPixel > threshold ? 255 : 0;
    var error = (oldPixel - newPixel) >> 3;
    
    image[i] = newPixel;
    image[i + 1] += error;
    image[i + 1] += error;
    image[i + imageSize - 1] += error;
    image[i + imageSize] += error;
    image[i + imageSize + 1] += error;
    image[i + imageSize + 2] += error;
  });
  image = image.slice(0, imageSize * imageSize);
}

function drawCanvas(tweets, elapsed) {
  //first clear canvas
  ctx.fillStyle = "#fff";
  ctx.rect(0, 0, size, size);
  ctx.fill();
  hiddenCtx.fillStyle = "#fff";
  hiddenCtx.rect(0, 0, size, size);
  hiddenCtx.fill();

  _.some(tweets, function(tweet, i) {
    if (!tweet.x && !tweet.y) {
      // if tweet doesn't have positions
      // it must mean there were more tweets than pixels
      // so stop drawing
      return true;
    }

    var t = elapsed / duration;
    t = (t > 1 ? 1 : t);
    var fe = fisheye(tweet);
    var x = elapsed ? tweet.interpolateX(t) : fe.x;
    var y = elapsed ? tweet.interpolateY(t) : fe.y;
    var radius = scaleFactor * tweet.opacity * Math.min(2, fe.z);

    // first fill the visible canvas
    if (tweet.clicked || !tweet.grayed) {
      ctx.fillStyle = 'rgba(' + tweetColors[tweet.type].join(',') + ',.65)';
    } else {
      ctx.fillStyle = 'rgba(200, 200, 200, .5)';
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
    ctx.fill();
    if (tweet.hovered) {
      // if it's hovered, give it a stroke
      ctx.strokeStyle = 'rgb(255,216,75)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // then the hidden canvas
    hiddenCtx.fillStyle = tweet.uniqColor;
    hiddenCtx.beginPath();
    hiddenCtx.arc(x, y, Math.max(radius, scaleFactor), 0, 2 * Math.PI, true);
    hiddenCtx.fill();
  });
}

var Canvas = React.createClass({
  getInitialState() {
    return {
      prevTweets: [],
      tweets: [],
      animate: false,
    }
  },

  componentDidMount() {
    ctx = this.refs.canvas.getDOMNode().getContext('2d');
    hiddenCtx = this.refs.hiddenCanvas.getDOMNode().getContext('2d');
  },

  componentWillReceiveProps(nextProps) {
    imageSize = Math.sqrt(nextProps.image.length);
    scaleFactor = Math.floor(500 / imageSize);
    size = imageSize * scaleFactor + 2 * padding;

    if (nextProps.updatePositions) {
      calculatePixels(nextProps);

      // calculate tweet positions and interpolaters
      var tweetIndex = 0;
      _.each(image, function(pixel, i) {
        if (!pixel) {
          // if pixel is filled, then assign a tweet to it
          var tweet = nextProps.tweets[tweetIndex];
          if (!tweet) return;
          tweetIndex += 1;

          tweet.px = tweet.x;
          tweet.py = tweet.y;
          tweet.x =  (i % imageSize) * scaleFactor + scaleFactor / 2 + padding;
          tweet.y =  Math.floor(i / imageSize) * scaleFactor + scaleFactor / 2 + padding;
          
          tweet.interpolateX = d3.interpolateNumber(tweet.px || tweet.x, tweet.x);
          tweet.interpolateY = d3.interpolateNumber(tweet.py || tweet.y, tweet.y);
        }
      });

      this.setState({tweets: nextProps.tweets});
    }
  },

  componentDidUpdate() {
    if (this.props.updatePositions) {
      // animate the pixels to their new position
      d3.timer((elapsed) => {
        drawCanvas(this.state.tweets, elapsed);
        return elapsed >= duration;
      });
    } else {
      drawCanvas(this.state.tweets);
    }
  },

  mouseMove(e) {
    var offsetX = e.nativeEvent.offsetX;
    var offsetY = e.nativeEvent.offsetY;
    // fisheye focus
    fisheye.focus([offsetX, offsetY]);

    var col = hiddenCtx.getImageData(offsetX, offsetY, 1, 1).data;
    var color = 'rgb(' + col[0] + "," + col[1] + ","+ col[2] + ")";

    this.props.onMouseMove(color);
  },

  mouseLeave() {
    fisheye.focus([size * 2, size * 2]);
    this.props.onMouseMove(null);
  },

  onClick(e) {
    this.props.onClick();
  },

  render() {
    return (
      <div className='canvas'>
        <canvas ref='canvas' width={size} height={size}
          onClick={this.onClick} onMouseMove={this.mouseMove} onMouseLeave={this.mouseLeave} />
        <canvas ref='hiddenCanvas' width={size} height={size}
          style={{display: 'none'}} />
      </div>
    );
  }
});

module.exports = Canvas;