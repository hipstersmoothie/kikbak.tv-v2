Meteor.startup(function () {
  // code to run on server at startup
	Session.set('currentVideo', null);
	Session.set('userLikes', []);
	Session.setDefault('stateImage', 'playButton.png');
	Session.setDefault('selectedGenre', 'Top Videos');
	Session.setDefault('gridPushedRight', "gridMaxedOut");

	Accounts.ui.config({
    requestPermissions: {
      google: ['https://www.googleapis.com/auth/youtube']
    }
  })
  if(Meteor.user())
		Meteor.call('likedVideos', function(err, res) {
			if(!err) {
				Session.set('userLikes', res);
			}
		});
});

Accounts.onLogin(function() {
	Meteor.call('likedVideos', function(err, res) {
		if(!err) {
			Session.set('userLikes', res);
		}
	}); 
});

var video = null, playButton = "playButton.png", pauseButton = "pauseButton.png";

//==============SET METEOR CALL BACK TO TOPVIDEOS==============
Template.gridThumbs.rendered = function() {
	// setTimeout(function() {
	// 	renderVids();
	// }, 1500)
}

Template.header.helpers({
	genres: function() { 
		return [{type:"Top Videos", className: "topVideos"}, 
						{type:"Emerging", className: "emergingVideos"},
            {type:"Hip Hop", className: "hipHopVideos"},
           	{type:"Electronic", className: "electronicVideos"},
           	{type:"Interviews", className: "interviewVideos"},
           	{type:"Live", className: "liveVideos"}];
	},
	selectedGenre: function() {
		return Session.get('selectedGenre');
	},
	currentVideo: function() {
		return Session.get('currentVideo');
	},
	stateImage: function () {
		return Session.get("stateImage");
	}
});

CurrentVideos = null;
Template.header.events({
	'click .topVideos': function() {
		if(video)
			video.destroy(); 
		Router.go('/');
	},
	'click .hipHopVideos': function() {
		if(video)
			video.destroy(); 
		Router.go('/hipHop');
	},
	'click .interviewVideos': function() {
		if(video)
			video.destroy(); 
		Router.go('/interviews');
	},
	'click .liveVideos': function() {
		if(video)
			video.destroy(); 
		Router.go('/live');
	},
	'click .electronicVideos': function() {
		if(video)
			video.destroy(); 
		Router.go('/electronic');
	},
	'click .emergingVideos': function() {
		if(video)
			video.destroy(); 
		Router.go('/emerging');
	},
	"click .playButton": function () {
		if(Session.equals("stateImage",playButton)){
			video.playVideo();
			Session.set('stateImage', pauseButton);
		}else{
			video.pauseVideo();
			Session.set('stateImage', playButtonn);
		}
    },
    "click .nextButton": function () {
		Session.set('stateImage', pauseButton);
		video.nextVideo();	
    },
    "click .prevButton": function () {
		Session.set('stateImage', pauseButton);
		video.prevVideo();	
    },
  'click .likedVideos' : function() {
  	Router.go('/likes');
  }
});

Template.gridThumbs.helpers({
  isSelected: function () {
		return Session.get('currentVideo').videoId == this.videoId
	},
	isLiked: function() {
		var likes = _.map(Session.get('userLikes'), function(like) {
			return like.videoId;
		});
		return likes.indexOf(this.videoId) > -1;
	},
	rank: function(){
		return CurrentVideos.findOne({videoId:this.videoId}).rank;
	},
	hidePlayer: function() {
		return Session.get('playerTuckedLeft');
	},
	gridResized: function() {
		return Session.get('gridPushedRight');
	}
});

Template.gridThumbs.events({
    "click .single": function (event) {
    	if (event.target.classList[0] == 'like' || event.target.nodeName == 'P')
    		return
      var index = Session.get('playlist').indexOf(this.videoId);
      var thisVid = Session.get('videos')[index];
      Session.set('currentVideo', thisVid);
    	if(video == null){
      		console.log("First: " + (this.rank - 1));
			Session.set('gridPushedRight', "gridPushedRight");
			TweenLite.to(".playerContainer", 0.5, {display:'inline-block'}).delay(0.5);
			TweenLite.to(".playerContainer", 0.5, {ease: Expo.easeOut, x:0, y:0,z:0}).delay(0.5);
			TweenLite.to(".container", 0.5, {ease: Expo.easeOut, width:"27%"});
			TweenLite.to(".togglePlayer", 0, {display:'inline-block'});
			TweenLite.to(".togglePlayer", 0.5, { x:0, y:0,z:0, rotation:360});
    		TweenLite.to(".descriptionText", 0.5, { margin: "124px 20px 20px 0"});
      		renderVids(this.rank - 1);
		}else{
      		console.log("after: " + (this.rank - 1));
			Session.set('playerTuckedLeft', "");
			Session.set('gridPushedRight', "gridPushedRight");
    		TweenLite.to(".playerContainer", 0.5, {display:'inline-block'}).delay(0.5);
    		TweenLite.to(".playerContainer", 0.5, {ease: Expo.easeOut, x:0, y:0,z:0}).delay(0.5);
    		TweenLite.to(".togglePlayer", 0.5, { x:0, y:0,z:0, rotation:360});
    		TweenLite.to(".container", 0.5, {ease: Expo.easeOut, width:"27%"});
    		TweenLite.to(".descriptionText", 0.5, { margin: "124px 20px 20px 0"});
    		video.playVideoAt(this.rank - 1);
		}
    },
    "click .togglePlayer": function () {
    	if(Session.get('playerTuckedLeft') == "tuckedLeft"){
			Session.set('playerTuckedLeft', "");
			Session.set('gridPushedRight', "gridPushedRight");
    		TweenLite.to(".playerContainer", 0.5, {display:'inline-block'}).delay(0.5);
    		TweenLite.to(".playerContainer", 0.5, {ease: Expo.easeOut, x:0, y:0,z:0}).delay(0.5);
    		TweenLite.to(".togglePlayer", 0.5, { x:0, y:0,z:0, rotation:360});
    		TweenLite.to(".container", 0.5, {ease: Expo.easeOut, width:"27%"});
    		TweenLite.to(".descriptionText", 0.5, { margin: "124px 20px 20px 0"})

    	}else{
			Session.set('playerTuckedLeft', ".tuckedLeft");
			setTimeout(function() {
				Session.set('gridPushedRight', "gridMaxedOut");
			}, 500);
			TweenLite.to(".togglePlayer", 0.5, { x:-screen.width/1.56, y:0,z:0, rotation:180});
    		TweenLite.to(".playerContainer", 0.5, { x:-screen.width, y:0,z:0, display:'none'});
    		TweenLite.to(".container", 0.5, {ease: Expo.easeOut, width:"94%"}).delay(0.5);
    		TweenLite.to(".descriptionText", 0.5, { margin: "124px 20px 20px 0"})
    	}
    },
		'click .like': function() {
			var likesIds = _.map(Session.get('userLikes'), function(like) {
				return like.videoId;
			});
			var likes = Session.get('userLikes');
			var index = likesIds.indexOf(this.videoId);

			if(index > -1) {
				likes.splice(index, 1);
				Session.set('userLikes', likes);
				Meteor.call('likeVideo', this.videoId, 'dislike');
			} else {
				likes.push(this)
				Session.set('userLikes', likes);
				Meteor.call('likeVideo', this.videoId, 'like');
			}	
		}
  });

renderVids = function(rank) {
	Session.set("stateImage",pauseButton);	
	videoTmp = new YT.Player("player", {
        cuePlaylist:{
	        listType: 'playlist',
	        list: Session.get('playlist'),
	        index: rank,
	    },
		events: {
			onReady: function (event) {
          event.target.cuePlaylist(Session.get('playlist'),rank);
      },
			onStateChange: function (event) {
				var playlist = Session.get('playlist'),
						match = event.target.getVideoUrl().match(/[?&]v=([^&]+)/),
						index = playlist.indexOf(match[1]);

				if(event.data == YT.PlayerState.PLAYING) {
					Session.set('currentVideo', Session.get('videos')[index]);
					Session.set("stateImage",pauseButton);
				} else if (event.data == YT.PlayerState.PAUSED) {
					Session.set("stateImage",playButton);
				} else if (event.data == YT.PlayerState.CUED) {
					event.target.playVideo();
				}
			},
			onError: function(errorCode) { //video unavailable
				if(errorCode.data == 100 || errorCode.data == 150)
				  video.nextVideo();
			}
		} 
    });
    video = videoTmp;
    YT.load();   	
};