Meteor.startup(function () {
	// code to run on server at startup
	Session.set('currentVideo', null);
	Session.set('userLikes', []);
	Session.set('playerObj', null);
	Session.setDefault('stateImage', 'playButton.png');
	Session.setDefault('selectedGenre', 'Top Videos');
	Session.setDefault('gridPushedRight', "gridMaxedOut");
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
	}, 1500)
});

var _logout = Meteor.logout;
Meteor.logout = function customLogout() {
// Do your thing here
	Session.set('userLikes', []);
	_logout.apply(Meteor, arguments);
}

Accounts.onLogin(function() {
	AntiModals.dismissOverlay();
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
	}
});

CurrentVideos = null;
Template.header.events({
	'click .topVideos': function() {
		// if(video)
		// 	video.destroy(); 
		Router.go('/');
	},
	'click .hipHopVideos': function() {
		// if(video)
		// 	video.destroy(); 
		Router.go('/hipHop');
	},
	'click .interviewVideos': function() {
		// if(video)
		// 	video.destroy(); 
		Router.go('/interviews');
	},
	'click .liveVideos': function() {
		// if(video)
		// 	video.destroy(); 
		Router.go('/live');
	},
	'click .electronicVideos': function() {
		// if(video)
		// 	video.destroy(); 
		Router.go('/electronic');
	},
	'click .emergingVideos': function() {
		// if(video)
		// 	video.destroy(); 
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
			document.getElementById("minimizePlayer").style.display = "inline-block";
			document.getElementById("togglePlayer").style.display = "inline-block";
			document.getElementById("closePlayer").style.display = "none";
			document.getElementById("expandPlayer").style.display = "none";
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
	}
});

Template.player.helpers({
	overlayPopped: function() {
		if(Session.equals('playerPushedTop', false) && Session.equals('playerMinimized', false))
			return "overlayFront"
		else
			return "overlayBack"
	},
	currentVideo: function() {
		return Session.get('currentVideo');
	},
	sharedata: function() {
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
	}
});

Template.player.onRendered = function() {
	Socialite.load();
}

Template.player.events({
	"click .togglePlayer": function () {
		if(Session.equals('playerPushedTop', false)){
			Session.set('playerPushedTop', true);
			tlDropdown.reverse();
			// TweenLite.to(".togglePlayer", 0.5, { x:0, y:0,z:0, rotation:270});
		}
		Session.set('playerMinimized', false);
	},
	"click .minimizePlayer": function () {
		if(tlMinimize == null){
		tlMinimize = new TimelineLite();
		tlMinimize.to(".playerContainer", 0.5, {ease: Expo.easeOut, width: "25%", height: "25%", bottom: 0, right: 0});
	} else
		tlMinimize.restart();
		Session.set('playerMinimized', true);
		document.getElementById("minimizePlayer").style.display = "none";
		document.getElementById("togglePlayer").style.display = "none";
		document.getElementById("closePlayer").style.display = "inline-block";
		document.getElementById("expandPlayer").style.display = "inline-block";
	},
	"click .expandPlayer": function () {
		tlMinimize.reverse();
		Session.set('playerPushedTop', false);
		Session.set('playerMinimized', false);
		document.getElementById("minimizePlayer").style.display = "inline-block";
		document.getElementById("togglePlayer").style.display = "inline-block";
		document.getElementById("closePlayer").style.display = "none";
		document.getElementById("expandPlayer").style.display = "none";
	},
	"click .closePlayer": function () {
		tlDropdown.reverse();
		tlMinimize.reverse().delay(1.5);
		Session.set('playerPushedTop', true);
		Session.set('playerMinimized', false);
		video.pauseVideo();
		document.getElementById("minimizePlayer").style.display = "none";
		document.getElementById("togglePlayer").style.display = "none";
		document.getElementById("closePlayer").style.display = "inline-block";
		document.getElementById("expandPlayer").style.display = "inline-block";
	},
	"click .downArrow": function () {
		if(Session.equals('playerPushedTop', true) && Session.equals('playerMinimized', false)){
			tlDropdown.restart();
			Session.set('playerPushedTop', false);
			
			document.getElementById("minimizePlayer").style.display = "inline-block";
			document.getElementById("togglePlayer").style.display = "inline-block";
			document.getElementById("closePlayer").style.display = "none";
			document.getElementById("expandPlayer").style.display = "none";
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
		var thisVid = null, thisId = this.videoId;
		_.forEach(Session.get('videos'), function(video) {
			if(video.videoId == thisId) {
				thisVid = video;
				return false;
			}
		})
		
		if (index == -1) {
			Session.set('currentVideo', Session.get('videos')[thisVid.rank + 1]);
			video.playVideoAt(thisVid.rank);
			return;
		} else {
			Session.set('currentVideo', thisVid);
		}
		
		console.log("First: " + index);
		if(tlDropdown == null || Session.equals('playerPushedTop', true)){
			Session.set('playerPushedTop', false);
			Session.set('playerMinimized', false);

			tlDropdown = new TimelineLite();
			document.getElementById("playerContainer").style.display = "block";
			tlDropdown.from(".playerContainer", 0.5, {x:0, y: -screen.height, z: 0});
			tlDropdown.to(".playerContainer", 0.5, {ease: Expo.easeIn, x:0, y: 0, z: 0});
			tlDropdown.to(".playerSideBar", 0.5, {ease: Expo.easeIn, left: "0%"});

			// TweenLite.to(".togglePlayer", 0.5, { rotation:90});
			document.getElementById("minimizePlayer").style.display = "inline-block";
			document.getElementById("togglePlayer").style.display = "inline-block";
			document.getElementById("closePlayer").style.display = "none";
			document.getElementById("expandPlayer").style.display = "none";
			document.getElementById("downArrow").style.display = "inline-block"
			document.getElementById("playerSideBar").style.display = "inline-block";

			document.getElementById("playButton").style.display = "inline-block";
			document.getElementById("prevButton").style.display = "inline-block";
			document.getElementById("nextButton").style.display = "inline-block";
			video.playVideo();

			//renderVids(index);
			video.playVideoAt(index)
		} else{
			console.log("after: " + index);
			tlDropdown.restart();
			video.playVideoAt(index);
			Session.set('playerPushedTop', false);
			Session.set('playerMinimized', false);
			document.getElementById("minimizePlayer").style.display = "inline-block";
			document.getElementById("togglePlayer").style.display = "inline-block";
			document.getElementById("closePlayer").style.display = "none";
			document.getElementById("expandPlayer").style.display = "none";

		}
	},
	'click .like': function() {
		if(!Meteor.user())
			AntiModals.overlay('simpleModal');
		else {
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
				likes.unshift(this);
				Session.set('userLikes', likes);
				Meteor.call('likeVideo', this.videoId, 'like');
			}
		}	
	}
});

var findVid = function(videoId) {
	var thisVid = null;
	_.forEach(Session.get('videos'), function(video) {
		// console.log(video.videoId, videoId)
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
				//Session.set('currentVideo', Session.get('videos')[index]);
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