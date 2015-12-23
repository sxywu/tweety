var React = require('react');
var _ = require('lodash');
var AppComponent = require('./App.jsx');
var RouterMixin = require('react-mini-router').RouterMixin;

var Routes = React.createClass({
  mixins: [RouterMixin],

  routes: {
      '/': 'renderApp',
      '/user/:username': 'renderApp'
  },

  render() {
    return this.renderCurrentRoute();
  },

  renderApp(username) {
    username = _.isString(username) ? username.toLowerCase() : '';
    return (<AppComponent selectedUser={username} />);
  }
});

module.exports = Routes;
