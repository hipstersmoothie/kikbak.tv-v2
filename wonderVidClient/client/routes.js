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
    Session.set('selectedGenre', 'Top Videos');
    templateData = { videos: TopVideos.find() };
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    return templateData;
  }
}); 

Router.route('/hipHop', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'hipHop');
  },
  data: function() {
    templateData = { videos: HipHopVideos.find() };
    Session.set('selectedGenre', 'Hip Hop');
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    return templateData;
  }
}); 

Router.route('/interviews', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'interviews');
  },
  data: function() {
    templateData = { videos: InterviewVideos.find() };
    Session.set('selectedGenre', 'Interviews');
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    return templateData;
  }
}); 

Router.route('/live', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'live');
  },
  data: function() {
    templateData = { videos: LiveVideos.find() };
    Session.set('selectedGenre', 'Live');
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    return templateData;
  }
}); 

Router.route('/electronic', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  Meteor.subscribe('videos', 'electronic');
  },
  data: function() {
    templateData = { videos: ElectronicVideos.find() };
    Session.set('selectedGenre', 'Electronic');
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    return templateData;
  }
}); 
