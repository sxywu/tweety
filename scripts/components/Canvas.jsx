var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');
var d3 = require('d3/d3');

var ctx, hiddenCtx;
var size, imageSize, scaleFactor;
var image = [];
var tweetMap = {};

// some defaults
var threshold = 158;
var padding = 20;
var tweetColors = {
  'reply': [248,148,6], // orange
  'retweet': [81,163,81], // green
  'tweet': [0,136,204] // blue
};

function calculatePixels(nextProps) {
  // if image is already filled, we must have calculated it already
  if (image.length) return;

  // turn it grayscale first
  _.each(nextProps.image, function(pixel) {
    image.push(Math.max(pixel[0], pixel[1], pixel[2]));
  });
  // Atkinson dithering
  var tweetIndex = 0;
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
    
    if (!newPixel) {
      // if the pixel is black, then keep track of
      // its corresponding tweet
      tweetMap[i] = nextProps.tweets[tweetIndex];
      tweetIndex += 1;
    }
  });
  image = image.slice(0, imageSize * imageSize);
}

function drawCanvas() {
  //first clear canvas
  ctx.fillStyle = "#fff";
  ctx.rect(0, 0, size, size);
  ctx.fill();

  _.each(image, function(pixel, i) {
    var tweet = tweetMap[i];
    if (tweet) {
      var x = (i % imageSize) * scaleFactor + scaleFactor / 2;
      var y = Math.floor(i / imageSize) * scaleFactor + scaleFactor / 2;

      // first fill the visible canvas
      ctx.fillStyle = 'rgba(' + tweetColors[tweet.type].join(',') +
        ',' + tweet.opacity + ')';
      ctx.beginPath();
      ctx.arc(x, y, scaleFactor * tweet.opacity, 0, 2 * Math.PI, true);
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
      hiddenCtx.fillRect(x - scaleFactor / 2, y - scaleFactor / 2,
        scaleFactor, scaleFactor);
    }
  });
}

var Canvas = React.createClass({
  componentDidMount() {
    ctx = this.refs.canvas.getDOMNode().getContext('2d');
    hiddenCtx = this.refs.hiddenCanvas.getDOMNode().getContext('2d');
  },

  componentWillReceiveProps(nextProps) {
    imageSize = Math.sqrt(nextProps.image.length);
    scaleFactor = Math.floor(500 / imageSize);
    size = imageSize * scaleFactor;
  },

  componentDidUpdate() {
    calculatePixels(this.props);
    drawCanvas();
  },

  render() {
    return (
      <div>
        <canvas ref='canvas' width={size} height={size} />
        <canvas ref='hiddenCanvas' width={size} height={size} />
      </div>
    );
  }
});

module.exports = Canvas;