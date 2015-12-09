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
      var image = 'images/' + user.image;
      var style = {
        height: 100,
        borderRadius: 50,
        margin: 5,
        boxShadow: this.state.selectedUser.name === user.name ? '0 0 10px yellow' : 'none',
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
      <div>
        {twitterContent}
        {users}
        {content}
      </div>
    );
  }
});

module.exports = App;