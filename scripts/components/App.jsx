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
      var selectedUser = users[0];
      this.setState({users, selectedUser});
    });
  },

  clickImage(user) {
    this.setState({selectedUser: user});
  },

  render() {
    var users = _.map(this.state.users, (user) => {
      var image = user.image;
      var style = {
        height: 100,
        opacity: this.state.selectedUser.name === user.name ? 1 : .25,
        cursor: 'pointer'
      };
      return (
        <img src={image} style={style} onClick={this.clickImage.bind(this, user)}/>
      );
    });
    var twitter = _.find(this.state.users, (user) => user.name === 'twitter');
    var twitterContent = (<ContentComponent user={twitter} showSummary={false} />);
    var content = (<ContentComponent user={this.state.selectedUser} showSummary={true} />);

    return (
      <div className='main'>
        <div className='landing'>
          {twitterContent}
          <div>
            <h1>tweety</h1>
            <h3>a portrait of tweets</h3>
            <h1>&darr;</h1>
          </div>
        </div>
        <div className='choose'>
          <div className='header'>1. CHOOSE</div>
          {users}
        </div>
        {content}
        <div className='about'>

        </div>
      </div>
    );
  }
});

module.exports = App;