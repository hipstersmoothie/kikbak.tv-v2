Router.plugin('loading', {loadingTemplate: 'loading'});

Router.configure({
  loadingTemplate: 'loading'
});

Router.route('/', function () {
	Session.set('selectedGenre', 'Top Videos');
    this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
    	setTimeout(function() {
    		getVideos();
    	}, 3000)
      
      return Session.get('videos') != null;
    }];
  }
});

Router.route('/hipHop', function () {
	Session.set('selectedGenre', 'Hip Hop');
    this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
    	Meteor.call("hipHopVideos", setList);	
      	return Session.get('videos') != null;
    }];
  }
});

Router.route('/interviews', function () {
	Session.set('selectedGenre', 'Interviews');
    this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
    	Meteor.call("interviews", setList);
        return Session.get('videos') != null;
    }];
  }
})

Router.route('/live', function () {
	Session.set('selectedGenre', 'Live');
  	this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
    	Meteor.call("live", setList);
      	return Session.get('videos') != null;
    }];
  }
});

Router.route('/electronic', function () {
	Session.set('selectedGenre', 'Electronic');
  	this.render('app');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return [function () {
    	Meteor.call("electronic", setList);
     	return Session.get('videos') != null;
    }];
  }
});

