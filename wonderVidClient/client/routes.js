Router.plugin('loading', {loadingTemplate: 'loading'});

Router.configure({
  loadingTemplate: 'loading'
});

TopVideos = new Mongo.Collection('videos');
HipHopVideos = new Mongo.Collection('hipHop');
ElectronicVideos = new Mongo.Collection('electronic');
LiveVideos = new Mongo.Collection('live');
InterviewVideos = new Mongo.Collection('interviews');
EmergingVideos = new Mongo.Collection('emerging');

Router.route('/', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'topVideos');
  },
  data: function() {
    return updateGrid('Top Videos', TopVideos);
  }
}); 

Router.route('/hipHop', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'hipHop');
  },
  data: function() {
    return updateGrid('Hip Hop', HipHopVideos);
  }
}); 

Router.route('/interviews', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'interviews');
  },
  data: function() {
    return updateGrid('Interviews', InterviewVideos);
  }
});

Router.route('/live', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'live');
  },
  data: function() {
   return updateGrid('Live', LiveVideos);
  }
});

Router.route('/electronic', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'electronic');
  },
  data: function() {
    return updateGrid('Electronic', ElectronicVideos);
  }
});  

Router.route('/emerging', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return Meteor.subscribe('videos', 'emerging');
  },
  data: function() {
    return updateGrid('Emerging', EmergingVideos);
  }
});  

LikedVideos = new Mongo.Collection();
Router.route('/likes', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return [function() {
      return Session.get('userLikes').length > 0;
    }]//Meteor.subscribe('userData');
  },
  data: function() {
    Session.set('videos', null);
    Session.set('selectedGenre', 'Likes');

    var videos = Session.get('userLikes');
    _.forEach(videos, function(video) {
      LikedVideos.update({rank: video.rank}, video, {upsert:true})
    });
    CurrentVideos = LikedVideos;
    var templateData = { videos: videos  };

    Session.set('playlist', _.map(videos, function(video) {
      return video.contentDetails.videoId;
    }));
    Session.set('videos', videos);
    return templateData;
  }
}); 

var updateGrid = function(genre, collection) {
  Session.set('videos', null);
  Session.set('selectedGenre', genre);
  CurrentVideos = collection;
  var videos = collection.find({}, {sort:{rank:1}}).collection._docs._map;
  videos = _.values(videos).sort(function(a, b) {
    return a.rank - b.rank;
  });
  var templateData = { videos: videos  };
  console.log(videos)
  Session.set('playlist', _.pluck(videos, 'videoId'));// 
  Session.set('videos', videos);
  return templateData;
}