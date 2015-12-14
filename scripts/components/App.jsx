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
        );
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
          <img src='images/shirleyxywu.jpeg' style={{width: 150, borderRadius: 150}} />
          <h2>about tweety</h2>
          <p>
          "I tawt I taw a puddy tat!"
          </p>
          <p>
One fateful November evening, <a href='http://twitter.com/shirleyxywu' target='_new'>@shirleyxywu</a> made the trek up to SF for her first ever <a href='https://wafflejs.com/' target='_new'>wafflejs</a>.
  There, she was ridiculously inspired by <a href='https://twitter.com/kosamari' target='_new'>@kosamari</a>'s talk on canvas and image processing.
  On the drive home, she couldn't stop thinking about it: <a href='https://twitter.com/shirleyxywu/status/662181207560450048' target='_new'>what if we mapped pixels in an image to social media activity</a>?
  A few days later, <a href='https://twitter.com/search?q=%23tweetyviz' target='_new'>#tweetyviz</a> was born.
          </p>
          <br />
          <h3>criteria</h3>
          <p>
Currently, #tweetyviz is a curated collection of celebrities and developers whose twitter profiles have met the following criteria:
<ol>
  <li>profile has at least 1500 tweets to render meaningfully, 3000+ tweets to render optimally</li>
  <li>profile image has sufficient contrast, and (optimally) a gradient of colors</li>
</ol>
As such, the data are currently being manually pulled.
<h4>Let me know (tweet @shirleyxywu or #tweetyviz) if you want to see your or your favorite celebrity's #tweetyviz, or alternatively, if you want to see #tweetyviz automated so you can do it yourself 😎</h4>
          </p>
          <br />
          <h3>thank you</h3>
          <p>
Finally, this obsession would not have been as smooth without the unfailing and at times begrudging (distracting) support from my other half,
 and the amazing friends I have made in the <a href='https://twitter.com/search?q=%23d3js' target='new'>#d3js</a> community.  They include, but definitely aren't
 limited to: <a href='http://twitter.com/enjalot' target='_new'>@enjalot</a>, <a href='http://twitter.com/jsundram' target='_new'>@jsundram</a>
 , <a href='http://twitter.com/Elijah_Meeks' target='_new'>@Elijah_Meeks</a>, <a href='http://twitter.com/zanstrong' target='_new'>@zanstrong</a>
 , <a href='http://twitter.com/vlandham' target='_new'>@vlandham</a>, <a href='http://twitter.com/syntagmatic' target='_new'>@syntagmatic</a>.
  Thank you so much for being an amazing influence in my life. 
          </p>
        </div>
      </div>
    );
  }
});

module.exports = App;