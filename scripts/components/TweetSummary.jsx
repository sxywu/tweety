var React = require('react');
var _ = require('lodash');

var tweetColors = {
  'reply': [248,148,6], // orange
  'retweet': [92,145,59], // green
  'tweet': [0,136,204] // blue
};
var dateFormat = d3.time.format("%Y-%m-%d");
var TweetSummary = React.createClass({
  onClick(type, value, clicked) {
    if (type !== 'sort' && clicked) {
      // if it was already clicked, then unclick
      value = null;
    }
    this.props.onClick(type, value);
  },

  onMouseOver(type, value) {
    this.props.onHover(type, value);
  },

  onMouseLeave(type) {
    this.props.onHover(type, null);
  },

  renderHoverClick(type, value, count, color) {
    var clicked = this.props.click && value === this.props.click.value;
    var buttonStyle = {
      padding: '4px 7.5px',
      margin: '5px 5px 5px 0',
      borderRadius: 3,
      cursor: 'pointer',
      backgroundColor: clicked ? color : '#fff',
      color: clicked ? '#fff' : color,
      border: '1px solid ' + color,
      display: 'inline-block',
    };

    var preValue = type === 'type' ? '' : (type === 'hashtag' ? '#' : '@');
    return (
      <li>
        <span style={buttonStyle}
        onMouseOver={this.onMouseOver.bind(this, type, value)}
        onMouseLeave={this.onMouseLeave.bind(this, type)}
        onClick={this.onClick.bind(this, type, value, clicked)}>
          {preValue + value}
        </span>{count}
      </li>
    );
  },

  render() {
    var sectionStyle = {
      paddingBottom: '20px',
      color: '#666'
    };
    var subsectionStyle = {
      width: '40%',
      display: 'inline-block',
      verticalAlign: 'top',
      margin: 0
    };

    // sort
    var sorts = _.map(['date', 'type', 'favorites'], (value) => {
      var buttonStyle = {
        padding: '4px 10px',
        margin: '5px',
        borderRadius: 3,
        cursor: 'pointer',
        backgroundColor: (value === this.props.sort) ? '#666' : '#fff',
        color: (value === this.props.sort) ? '#fff' : '#666',
        border: '1px solid #666',
        display: 'inline-block'
      };
      return (
        <span style={buttonStyle} onClick={this.onClick.bind(this, 'sort', value)}>
          {value}
        </span>
      );
    });

    // hover and click
    var types = _.chain(this.props.tweets)
      .countBy((tweet) => tweet.type)
      .pairs()
      .sortBy((type) => -type[1])
      .map((type) => {
        var color = 'rgb(' + tweetColors[type[0]].join(',') + ')';
        return this.renderHoverClick('type', type[0], type[1], color);
      }).value();
    var hashtags = _.chain(this.props.tweets)
      //.pluck('hashtags').flatten()
      .pluck('h').flatten()
      .countBy().pairs()
      .sortBy((hashtag) => -hashtag[1])
      .slice(0, 5)
      .map((hashtag) => {
        return this.renderHoverClick('hashtag', hashtag[0], hashtag[1], '#666');
      }).value();
    var lowerCaseName = this.props.name && this.props.name.toLowerCase();

    var mentions = _.chain(this.props.tweets)
      //.pluck('user_mentions').flatten()
      .pluck('um').flatten()
      .pluck('name').flatten()
      .countBy().pairs()
      .filter((mention) => mention[0] !== lowerCaseName)
      .sortBy((mention) => -mention[1])
      .slice(1, 6) // we skip the first mention which is undefined (i.e. no mentions in a tweet)
      .map((mention) => {
        return this.renderHoverClick('mention', mention[0], mention[1], '#666');
      }).value();

    return (
      <div className='tweetSummary'>
        <div style={sectionStyle}>
          <div className='header'>2. SORT</div>
          {sorts}
        </div>
        <div style={sectionStyle}>
          <div className='header'>3. HOVER &amp; CLICK</div>
          <ol>
            <strong>Types</strong>
            {types}
          </ol>
          <ol style={subsectionStyle}>
            <strong>Hashtags</strong>
            {hashtags}
          </ol>
          <ol style={subsectionStyle}>
            <strong>Mentions</strong>
            {mentions}
          </ol>
        </div>
      </div>
    );
  }
});

module.exports = TweetSummary;