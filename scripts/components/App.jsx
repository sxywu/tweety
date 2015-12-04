var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');

var ContentComponent = require('./Content.jsx');

var App = React.createClass({
  getInitialState() {
    return {
      users: [],
      selectedUser: null,
    };
  },

  componentWillMount() {
    d3.json('data/users.json', (users) => {
      this.setState({users});
    });
  },

  render() {
    var users = _.map(this.state.users, (user) => {
      var image = 'images/' + user.image;
      return (
        <span>
          <img src={image} width="100" />
          <div>{user.name}</div>
        </span>
      );
    });
    var content = this.state.selectedUser &&
      (<ContentComponent user={this.state.selectedUser} />);

    console.log(users, this.state.users)
    return (
      <div>
        {users}
        {content}
      </div>
    );
  }
});

module.exports = App;