var React = require('react/addons');
var cx = React.addons.classSet;
var _ = require('lodash');

var ContentComponent = require('./Content.jsx');

var App = React.createClass({
  getInitialState() {
    return {
      users: [],
      selectedUser: {},
      global_metadata: {},
    };
  },

  componentWillMount() {
    // This file could be smaller if we did the mention occurence calculation the backend;
    // then we could just send everyone's top N, and not send the mentions column in
    // the username-min.csv file at all.
    d3.csv('data/global_metadata.csv')
      .row((r) => { return {
        // have {id: "12", name: "", followers: "-1", tweets: "-1", screenname: "jack"}
        // want   "name": "arnicas","image": "images/arnicas.jpg", "imageWidth": 70, "numFollowers": 6329
        id: r.id,
        fullname: r.name,
        name: r.screenname,
        numFollowers: +r.followers,
        numTweets: +r.tweets,
        imageWidth: 80, // TODO: this is not the actual image width; just used to scale
        image: "images/" + r.screenname + ".jpg"
      };})
      .get((err, all_users) => {
        var users = all_users.filter((u) => { return u.numFollowers > 0;});
        var selectedUser = users[_.random(1, users.length - 1)];

        var global_metadata = {};
        all_users.forEach((u) => { global_metadata[u.id] = u;});
        this.setState({users, selectedUser, global_metadata});
    });
  },

  clickImage(user) {
    this.setState({selectedUser: user});
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
    var twitterContent = (<ContentComponent user={twitter} global_metadata={this.state.global_metadata} showSummary={false} />);
    var content = (<ContentComponent user={this.state.selectedUser} global_metadata={this.state.global_metadata} showSummary={true} />);

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
