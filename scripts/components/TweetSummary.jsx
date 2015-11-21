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
      color: '#666',
    };
    return (
      <div>
        Sort by: 
        <span style={buttonStyles} onClick={this.onClick} value='date'>date</span>
        <span style={buttonStyles} onClick={this.onClick} value='type'>type</span>
        <span style={buttonStyles} onClick={this.onClick} value='favorites'>favorites</span>
      </div>
    );
  }
});

module.exports = TweetSummary;