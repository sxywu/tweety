var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');

var ContentComponent = require('./Content.jsx');

var App = React.createClass({
  getInitialState() {
    return {
      users: [],
      selectedUser: {},
    };
  },

  componentWillMount() {
    d3.json('data/users.json', (err, users) => {
      var selectedUser = users[_.random(1, users.length - 1)];
      this.setState({users, selectedUser});
    });
  },

  clickImage(user) {
    var newTop = this.refs.content.getDOMNode().offsetTop - 40;
    window.scrollTo(0, newTop);
    this.setState({selectedUser: user});
  },

  scrollToChoose() {
    var newTop = this.refs.choose.getDOMNode().offsetTop - 20;
    this.scrollWindow(newTop);
  },

  scrollWindow(newTop) {
    var currentTop = window.scrollY;
    var duration = 250;
    d3.timer((elapsed) => {
      var t = elapsed / duration;
      t = (t > 1 ? 1 : t);
      var top = (newTop - currentTop) * t + currentTop;
      window.scrollTo(0, top);
      return elapsed >= duration;
    });
  },

  render() {
    var users = _.chain(this.state.users)
      .sortBy((user) => -user.numFollowers)
      .map((user) => {
        var image = user.image;
        var style = {
          height: 100,
          opacity: this.state.selectedUser.name === user.name ? 1 : .25,
          cursor: 'pointer'
        };
        return (
          <img src={image} style={style} onClick={this.clickImage.bind(this, user)}/>
        )
      }).value();
    var twitter = _.find(this.state.users, (user) => user.name === 'twitter');
    var twitterContent = (<ContentComponent user={twitter} showSummary={false} />);
    var content = (<ContentComponent user={this.state.selectedUser}
      showSummary={true} scrollToChoose={this.scrollToChoose} />);
    var arrowStyle = {cursor: 'pointer'};

    return (
      <div className='main'>
        <div className='landing'>
          {twitterContent}
          <div>
            <h1>tweety</h1>
            <h3>a portrait of tweets</h3>
            <h1 style={arrowStyle} onClick={this.scrollToChoose}>&darr;</h1>
          </div>
        </div>
        <div className='choose' ref='choose'>
          <div className='header'>1. CHOOSE</div>
          {users}
        </div>
        <div ref='content'>
          {content}
        </div>
        <div className='about'>

        </div>
      </div>
    );
  }
});

module.exports = App;