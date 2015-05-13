Router.plugin('loading', {loadingTemplate: 'Loading'});

// Router.route('/', function () {
//   Meteor.call("videos", function(error, videos) {
//   	if(!error) {
//   		Session.set('videos', result);
// 		Session.set('videoId', result[0].videoId);
// 		Session.set('playlist', _.pluck(result, "videoId"));
// 		renderVid(result[0].videoId);
// 		this.render('app');
//   	}

//   });
  
// });

Router.route('/', function () {
  this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
      return Session.get('videos') != null;
    }];
  }
});

Router.route('/hipHop', function () {
  this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
      return Session.get('videos') != null;
    }];
  }
});

Router.route('/interviews', function () {
  this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
      return Session.get('videos') != null;
    }];
  }
}).onBeforeAction(function() {
	console.log('now')
});

Router.route('/live', function () {
  this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
      return Session.get('videos') != null;
    }];
  }
});

Router.route('/electronic', function () {
  this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
      return Session.get('videos') != null;
    }];
  }
});

