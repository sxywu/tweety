var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');
var d3 = require('d3/d3');

//     var dateFormat = d3.time.format("%Y-%m-%d");
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
    var sorts = _.map(['date', 'type', 'favorites'], (value) => {
      buttonStyles.border = (value === this.props.sort) ? '2px solid #666' : 'none';
      return (<span style={buttonStyles} onClick={this.onClick} value={value}>{value}</span>);
    });
    return (
      <div className='tweetSummary'>
        <div>
          Sort by: {sorts}
        </div>
      </div>
    );
  }
});

module.exports = TweetSummary;