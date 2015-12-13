var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');

var tweetColors = {
  'reply': [248,148,6], // orange
  'retweet': [81,163,81], // green
  'tweet': [0,136,204], // blue
  'favorite': [189,54,47] // red
};
var dateFormat = d3.time.format("%Y-%m-%d");
var Tweet = React.createClass({
  render() {
    var hoveredTweet = this.props.hoveredTweet;
    if (hoveredTweet) {
      var top = hoveredTweet.y + 20;
      var left = hoveredTweet.x + 20;
      var tweetStyle = {
        padding: '10px',
        width: '400px',
        borderRadius: 3,
        position: 'absolute',
        top, left,
        pointerEvents: 'none',
        backgroundColor: 'rgba(255, 255, 255, .85)',
        border: '1px solid #666',
        color: '#666',
        fontSize: '1em',
      }
      var dateStyle = {
        fontFamily: 'Helvetica',
      };
      var statsStyle = {
        display: 'inline-block',
        marginRight: '5px',
        fontWeight: 600,
      }

      hoveredTweet = hoveredTweet && (
        <div style={tweetStyle}>
          <div style={dateStyle}>
            <strong>{dateFormat(hoveredTweet.date)}</strong> (tweet #{hoveredTweet.index})
          </div>
          <p dangerouslySetInnerHTML={{__html: hoveredTweet.text}} />
          <span style={dateStyle}>
            <strong>{hoveredTweet.stats.favorites}</strong> favorites,
            <strong> {hoveredTweet.stats.retweets}</strong> retweets
          </span>
        </div>
      );
    }
    
    return (
      <div>
        {hoveredTweet}
      </div>
    );
  }
});

module.exports = Tweet;