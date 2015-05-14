Router.plugin('loading', {loadingTemplate: 'loading'});

Router.configure({
  loadingTemplate: 'loading'
});

TopVideos = new Mongo.Collection('videos');
HipHopVideos = new Mongo.Collection('hipHop');
ElectronicVideos = new Mongo.Collection('electronic');
LiveVideos = new Mongo.Collection('live');
InterviewVideos = new Mongo.Collection('interviews');

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

var updateGrid = function(genre, collection) {
  Session.set('selectedGenre', genre);
  CurrentVideos = collection;
  var templateData = { videos: collection.find({}, {sort:{rank:1}}) };
  var vids = _.values(templateData.videos.collection._docs._map);
  vids.sort(function(a, b) {
    return a.rank - b.rank;
  });
  Session.set('playlist', _.pluck(vids, 'videoId'));// 
  Session.set('videos', _.values(templateData.videos.collection._docs._map));
  return templateData;
}