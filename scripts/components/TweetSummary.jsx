var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');
var d3 = require('d3/d3');

var tweetColors = {
  'reply': [248,148,6], // orange
  'retweet': [81,163,81], // green
  'tweet': [0,136,204] // blue
};
var dateFormat = d3.time.format("%Y-%m-%d");
var TweetSummary = React.createClass({
  onClick(e) {
    this.props.onClick('sort', e.target.getAttribute('value'));
  },

  render() {
    var tweetStyle = {
      marginTop: '20px',
      border: '1px solid #ccc',
      padding: '10px',
      width: '100%',
      borderRadius: 3
    }
    var sorts = _.map(['date', 'type', 'favorites'], (value) => {
      var buttonStyle = {
        padding: '2.5px 10px',
        marginLeft: '5px',
        boxShadow: '0 0 5px #ccc',
        borderRadius: 3,
        cursor: 'pointer',
        border: (value === this.props.sort) ? '2px solid #666' : 'none',
      };
      return (<span style={buttonStyle} onClick={this.onClick} value={value}>{value}</span>);
    });
    var types = _.chain(this.props.tweets)
      .countBy((tweet) => tweet.type)
      .map((count, type) => {
        var buttonStyle = {
          padding: '2.5px 10px',
          height: '14px',
          borderRadius: 14,
          cursor: 'pointer',
          backgroundColor: 'rgb(' + tweetColors[type].join(',') + ')',
          color: '#fff',
          fontWeight: 600,
        };
        return (<div><span style={buttonStyle}>{count}</span> {type}</div>)
      }).value();
    var hashtags = _.chain(this.props.tweets)
      .pluck('hashtags').flatten()
      .countBy().pairs()
      .sortBy((hashtag) => -hashtag[1])
      .slice(0, 5)
      .map((hashtag) => {
        var buttonStyle = {
          padding: '2.5px 10px',
          height: '14px',
          borderRadius: 14,
          cursor: 'pointer',
          backgroundColor: '#ccc',
          color: '#fff',
          fontWeight: 600,
        };
        return (<div><span style={buttonStyle}>{hashtag[1]}</span> #{hashtag[0]}</div>)
      }).value();
    var mentions = _.chain(this.props.tweets)
      .pluck('user_mentions').flatten()
      .pluck('name').flatten()
      .countBy().pairs()
      .sortBy((mention) => -mention[1])
      .slice(0, 5)
      .map((mention) => {
        var buttonStyle = {
          padding: '2.5px 10px',
          height: '14px',
          borderRadius: 14,
          cursor: 'pointer',
          backgroundColor: '#ccc',
          color: '#fff',
          fontWeight: 600,
        };
        return (<div><span style={buttonStyle}>{mention[1]}</span> @{mention[0]}</div>)
      }).value();

    var hoveredTweet = this.props.hoveredTweet;
    hoveredTweet = hoveredTweet && (
      <div style={tweetStyle}>
        <strong>tweet #{hoveredTweet.index}: {dateFormat(hoveredTweet.date)}</strong>
        <div>{hoveredTweet.text}</div>
        <div>{hoveredTweet.stats.favorites} favorites, {hoveredTweet.stats.retweets} retweets</div>
      </div>
    );
    return (
      <div className='tweetSummary'>
        <div>
          Sort {sorts}
        </div>
        <div>
          Hover {types} {hashtags} {mentions}
        </div>
        {hoveredTweet}
      </div>
    );
  }
});

module.exports = TweetSummary;