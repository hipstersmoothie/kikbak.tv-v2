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
    CurrentVideos = TopVideos;
    templateData = { videos: TopVideos.find({}, {sort:{rank:1}}) };
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    Session.set('videos', _.values(templateData.videos.collection._docs._map));
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
    CurrentVideos = HipHopVideos;
    templateData = { videos: HipHopVideos.find({}, {sort:{rank:1}}) };
    Session.set('selectedGenre', 'Hip Hop');
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    Session.set('videos', _.values(templateData.videos.collection._docs._map));
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
    CurrentVideos = InterviewVideos;
    templateData = { videos: InterviewVideos.find({}, {sort:{rank:1}}) };
    Session.set('selectedGenre', 'Interviews');
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    Session.set('videos', _.values(templateData.videos.collection._docs._map));
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
    CurrentVideos = LiveVideos;
    templateData = { videos: LiveVideos.find({}, {sort:{rank:1}}) };
    Session.set('selectedGenre', 'Live');
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    Session.set('videos', _.values(templateData.videos.collection._docs._map));
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
    CurrentVideos = ElectronicVideos;
    templateData = { videos: ElectronicVideos.find({}, {sort:{rank:1}}) };
    Session.set('selectedGenre', 'Electronic');
    Session.set('playlist', _.pluck(_.values(templateData.videos.collection._docs._map), 'videoId'));
    Session.set('videos', _.values(templateData.videos.collection._docs._map));
    return templateData;
  }
}); 
