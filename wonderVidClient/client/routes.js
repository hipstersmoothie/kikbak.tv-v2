Router.plugin('loading', {loadingTemplate: 'loading'});

Router.configure({
  loadingTemplate: 'loading'
});

TopVideos = new Mongo.Collection('videos');
HipHopVideos = new Mongo.Collection('hipHop');
ElectronicVideos = new Mongo.Collection('electronic');
LiveVideos = new Mongo.Collection('live');
EmergingVideos = new Mongo.Collection('emerging');
AllStarVideos = new Mongo.Collection('allStar');

Router.route('/', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'topVideos');
  },
  data: function() {
    return updateGrid('Top Videos', TopVideos, this, '/');
  }
}); 

Router.route('/allStar', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'allStar');
  },
  data: function() {
    return updateGrid('All Star', AllStarVideos, this, '/allStar');
  }
});

Router.route('/hipHop', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'hipHop');
  },
  data: function() {
    return updateGrid('Hip Hop', HipHopVideos, this, '/hipHop');
  }
}); 

Router.route('/live', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'live');
  },
  data: function() {
   return updateGrid('Live', LiveVideos, this);
  }
});

Router.route('/electronic', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'electronic');
  },
  data: function() {
    return updateGrid('Electronic', ElectronicVideos, this);
  }
});  

Router.route('/emerging', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return Meteor.subscribe('videos', 'emerging');
  },
  data: function() {
    return updateGrid('Emerging', EmergingVideos, this);
  }
});  

LikedVideos = new Mongo.Collection();
Router.route('/likes', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    if(!Meteor.user())
      AntiModals.overlay('simpleModal');

    return [function() {
      return Session.get('userLikes').length > 0;
    }]
  },
  data: function() {
    Session.set('videos', null);
    Session.set('selectedGenre', 'Likes');

    var videos = Session.get('userLikes');
    _.forEach(videos, function(video) {
      delete video._id;
      LikedVideos.update({rank: video.rank}, video, {upsert:true})
    });
    CurrentVideos = LikedVideos;
    var templateData = { videos: videos  };

    Session.set('playlist', _.map(videos, function(video) {
      return video.videoId;
    }));
    Session.set('videos', videos);
    return templateData;
  }
}); 

var updateGrid = function(genre, collection, route) {
  if (route.ready()) {
    Session.set('videos', null);
    Session.set('selectedGenre', genre);
    var videos = collection.find({}, {sort:{rank:1}}).fetch();
    var vidIds = _.pluck(videos, 'videoId');
    var templateData = { videos: videos  };
    Session.set('playlist', vidIds);
    Session.set('videos', videos);
    if (video) {
      nextList = {
        videoIds : vidIds,
        name : Router.current().route.getName()
      };
    }
    CurrentVideos = collection;
    return templateData;
  }
}