Meteor.startup(function () {
	// code to run on server at startup
	Session.set('currentVideo', null);
	Session.set('userLikes', []);
	Session.set('playerObj', null);
	Session.setDefault('stateImage', 'playButton.png');
	Session.setDefault('selectedGenre', 'Top Videos');
	Session.set('playerPushedTop', true);
	Session.set('playerMinimized', false);
	Accounts.ui.config({
		requestPermissions: {
			google: ['https://www.googleapis.com/auth/youtube']
		},
		requestOfflineToken: {google:true}
	})
	if(Meteor.user())
		Meteor.call('likedVideos', function(err, res) {
			if(!err) {
				Session.set('userLikes', res);
			}
		});

	setTimeout(function() {
		renderVids();
	}, 1500);
});

var _logout = Meteor.logout;
Meteor.logout = function customLogout() {
	Session.set('userLikes', []);
	_logout.apply(Meteor, arguments);
}

Accounts.onLogin(function() {
	AntiModals.dismissOverlay();
	getLikes();
});
Accounts.onLogin(getLikes);

var getLikes = function() {
	Meteor.call('likedVideos', function(err, res) {
		if(!err) 
			Session.set('userLikes', res);
	}); 
}

video = null;
var playButton = "playButton.png", 
		pauseButton = "pauseButton.png", tlMinimize = null, 
		tlDropdown = null, ytPlaylist = [];

//==============SET METEOR CALL BACK TO TOPVIDEOS==============
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
	},
	isLiked: function() {
		var likes = _.map(Session.get('userLikes'), function(like) {
			return like.videoId;
		});
		return likes.indexOf(Session.get('currentVideo').videoId) > -1;
	},
	isVideo: function() {
		return Session.get('currentVideo') != null;
	}
});

CurrentVideos = null;
Template.header.events({
	'click .topVideos': function() {
		Router.go('/');
	},
	'click .hipHopVideos': function() {
		Router.go('/hipHop');
	},
	'click .interviewVideos': function() {
		Router.go('/interviews');
	},
	'click .liveVideos': function() {
		Router.go('/live');
	},
	'click .electronicVideos': function() {
		Router.go('/electronic');
	},
	'click .emergingVideos': function() {
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
		if(Session.equals('playerPushedTop', true) && Session.equals('playerMinimized', false)){
			tlDropdown.restart();
			Session.set('playerPushedTop', false);
		}
	},
	"click .nextButton": function () {
		Session.set('stateImage', pauseButton);
		video.nextVideo();	
	},
	"click .prevButton": function () {
		Session.set('stateImage', pauseButton);
		video.previousVideo();	
  },
	'click .likedVideos' : function() {
		if(!Meteor.user())
			AntiModals.overlay('simpleModal');
		else
			Router.go('/likes');
	},
	'click .like': function() {
		hitLikeButton(Session.get("currentVideo"));
	}
});

var hitLikeButton = function(video) {
	if(!Meteor.user())
		AntiModals.overlay('simpleModal');
	else {
		var likes = Session.get('userLikes');
		var likesIds = _.map(likes, function(like) {
			return like.videoId;
		});
		var index = likesIds.indexOf(video.videoId);

		if(index > -1) {
			likes.splice(index, 1);
			Session.set('userLikes', likes);
			Meteor.call('likeVideo', video.videoId, 'dislike');
		} else {
			likes.unshift(video);
			Session.set('userLikes', likes);
			Meteor.call('likeVideo', video.videoId, 'like');
		}
	}
}

Template.player.helpers({
	overlayPopped: function() {
		if(Session.equals('playerPushedTop', false) && Session.equals('playerMinimized', false))
			return "overlayFront"
		else
			return "overlayBack"
	},
	currentVideo: function() {
		return Session.get('currentVideo') ? Session.get('currentVideo') : {description:""};
	},
	sharedata: function() {
		var video =  Session.get('currentVideo');
		if(video) {
			var url = 'https://www.youtube.com/watch?v=' + Session.get('currentVideo').videoId;
			return {
	      facebook: true,
	      twitter: true,
	      pinterest: false,
	      shareData: {
	        url: url,
	        defaultShareText: ' -- Found on WonderVid'
	      }
	    }
		} else
			return {};
	},
	minimized:function() {
		return Session.get('playerMinimized');
	},
	pushedTop: function() {
		return Session.get('playerPushedTop') && Session.get('currentVideo') != null;
	},
	formedDate: function() {
		var dateString = Session.get("currentVideo").youTubePostDate;
		var year = dateString.substring(0,4);
		var day = dateString.substring(5,7);
		var month = dateString.substring(8,10);
		console.log(dateString);
		return new Date(year, month, day, 0, 0, 0, 0).toDateString();
		return dateString;		
	}
});

Template.player.events({
	"click .togglePlayer": function () {
		if(Session.equals('playerPushedTop', false)){
			Session.set('playerPushedTop', true);
			tlDropdown.reverse();
		}
		Session.set('playerMinimized', false);
	},
	"click .minimizePlayer": function () {
		if(tlMinimize == null){
			tlMinimize = new TimelineLite();
			tlMinimize.to(".playerContainer", 0.5, {ease: Expo.easeOut, width: "25%", height: "25%", bottom: 0, right: 0});
		} else
			tlMinimize.restart();
		document.getElementById("playerContainer").style.display = "none";
		Session.set('playerMinimized', true);
	},
	"click .expandPlayer": function () {
		tlMinimize.reverse();
		Session.set('playerPushedTop', false);
		Session.set('playerMinimized', false);
		document.getElementById("playerContainer").style.display = "block";
	},
	"click .closePlayer": function () {
		tlDropdown.reverse();
		tlMinimize.reverse().delay(1.5);
		Session.set('playerPushedTop', true);
		Session.set('playerMinimized', false);
		video.pauseVideo();

	},
	"click .downArrow": function () {
		if(Session.equals('playerPushedTop', true) && Session.equals('playerMinimized', false)){
			tlDropdown.restart();
			Session.set('playerPushedTop', false);
			document.getElementById("playerContainer").style.display = "block";
		}
	}
});

Template.gridThumbs.helpers({
	isSelected: function () {
		return Session.get('currentVideo') ? Session.get('currentVideo').videoId == this.videoId : false;
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
	}
});

Template.gridThumbs.events({
	"click .single": function (event) {
		if (event.target.classList[0] == 'like' || event.target.nodeName == 'P')
			return
		var index = Session.get('playlist').indexOf(this.videoId);
		var thisVid = null, thisId = this.videoId;
		_.forEach(Session.get('videos'), function(video) {
			if(video.videoId == thisId) {
				thisVid = video;
				return false;
			}
		});
		
		if (index == -1) {
			Session.set('currentVideo', Session.get('videos')[thisVid.rank + 1]);
			video.playVideoAt(thisVid.rank);
			return;
		}

		Session.set('currentVideo', thisVid);
		if(tlDropdown == null || Session.equals('playerPushedTop', true)){
			console.log("First: " + index);
			Session.set('playerPushedTop', false);
			Session.set('playerMinimized', false);

			tlDropdown = new TimelineLite();
			document.getElementById("playerContainer").style.display = "block";
			tlDropdown.from(".playerContainer", 0.5, {x:0, y: -screen.height, z: 0});
			tlDropdown.to(".playerContainer", 0.5, {ease: Expo.easeIn, x:0, y: 0, z: 0});
			tlDropdown.to(".playerSideBar", 0.5, {ease: Expo.easeIn, left: "0%"});

			Meteor.defer(function () {
				video.playVideo();
				video.playVideoAt(index)
			});
		} else{
			console.log("after: " + index);
			tlDropdown.restart();
			video.playVideoAt(index);
			Session.set('playerPushedTop', false);
			Session.set('playerMinimized', false);
		}
	},
	'click .like': function() {
		if(!Meteor.user())
			AntiModals.overlay('simpleModal');
		else
			hitLikeButton(this);
	}
});

var findVid = function(videoId) {
	var thisVid = null;
	_.forEach(Session.get('videos'), function(video) {
		if(video.videoId == videoId) {
			thisVid = video;
			return false;
		}
	});
	return thisVid;
}

firstPlay = true, nextList = null;
renderVids = function() {
	Session.set("stateImage",pauseButton);	
	videoTmp = new YT.Player("player", {
	events: {
		onReady: function (event) {
				event.target.cuePlaylist(Session.get('playlist'));
		},
		onStateChange: function (event) {
			if (firstPlay && event.data == YT.PlayerState.PLAYING) {
				firstPlay = false;
				Session.set('playlist', video.getPlaylist());
			}
			if(event.data == YT.PlayerState.PLAYING) {
				var nextVid = findVid(event.target.getVideoUrl().match(/[?&]v=([^&]+)/)[1]);
				Session.set('currentVideo', nextVid);
				Session.set("stateImage",pauseButton);
			} else if (event.data == YT.PlayerState.PAUSED) {
				Session.set("stateImage",playButton);
			} else if (event.data == YT.PlayerState.CUED) {
				//event.target.playVideo();
			} else if (event.data == YT.PlayerState.ENDED) {
				if(nextList) {
					if (video.route != nextList.name) { // new page play first
						event.target.loadPlaylist(nextList.videoIds);
						Session.set('currentVideo', Session.get('videos')[0]);
					} else { // reload on same page, play next rank. SHOULD try to find id first then play rank if it can find it
						event.target.loadPlaylist(nextList.videoIds, Session.get('currentVideo').rank);
						Session.set('currentVideo', Session.get('videos')[Session.get('currentVideo').rank]);
					}
					video.route = nextList.name;
					nextList = null;
				} else {
					var nextVid = findVid(event.target.getVideoUrl().match(/[?&]v=([^&]+)/)[1]);
					Session.set('currentVideo', nextVid);
				}
			}
		},
		onError: function(errorCode) { //video unavailable
			if(errorCode.data == 100 || errorCode.data == 150)
				video.nextVideo();
		}
	} 
	});
	video = videoTmp;
	video.route = Router.current().route.getName();

	YT.load();   	
};