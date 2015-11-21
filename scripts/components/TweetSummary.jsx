var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');
var d3 = require('d3/d3');

var dateFormat = d3.time.format("%Y-%m-%d");
var TweetSummary = React.createClass({
  onClick(e) {
    this.props.onClick('sort', e.target.getAttribute('value'));
  },

  render() {
    var buttonStyles = {
      padding: '5px 7.5px',
      marginLeft: '5px',
      boxShadow: '0 0 5px #ccc',
      borderRadius: 3,
      cursor: 'pointer',
    };
    var tweetStyle = {
      marginTop: '20px',
      border: '1px solid #ccc',
      padding: '10px',
      width: '100%',
      borderRadius: 3
    }
    var sorts = _.map(['date', 'type', 'favorites'], (value) => {
      buttonStyles.border = (value === this.props.sort) ? '2px solid #666' : 'none';
      return (<span style={buttonStyles} onClick={this.onClick} value={value}>{value}</span>);
    });
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
        {hoveredTweet}
      </div>
    );
  }
});

module.exports = TweetSummary;