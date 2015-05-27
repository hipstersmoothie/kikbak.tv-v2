var greenHex = '#31C663';
var greenRgb = 'rgba(49,198,99,0.5)';
var greenTag = "url('/images/rankBackground.png')";
var yellowHex = '#F7DD72';
var yellowRgb = 'rgba(247,221,114,0.5)';
var yellowTag = "url('/images/rankBackgroundYellow.png')";
var redHex = '#D6373A';
var redRgb = 'rgba(214,55,58,0.5)';
var redTag = "url('/images/rankBackgroundRed.png')";

Meteor.startup(function () {
	Session.set('currentVideo', null);
	Session.set('userLikes', []);
	Session.set('color', redHex);
	Session.set('colorImage', redTag);
	Session.set('colorRgb', redRgb);
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
		getLikes();

	Mousetrap.bind('esc', function() { 
		if(Session.get('playerPushedTop') == false && video) {
			Session.set('playerPushedTop', true);
			tlDropdown.reverse();
			Session.set('playerMinimized', false);
		}
	});

	Mousetrap.bind('right', function() { 
		if(video)
			video.nextVideo();
	});

	Mousetrap.bind('left', function() { 
		if(video)
			video.previousVideo();
	});

	Mousetrap.bind('down', function() { 
		if(Session.get('playerPushedTop') == true &&  Session.get('playerMinimized') == false && video) {
			tlDropdown.restart();
			Session.set('playerPushedTop', false);
		}
	});

	Mousetrap.bind('m', function() { 
		if(Session.get('playerPushedTop') == false && video) {
			if(tlMinimize == null){
				tlMinimize = new TimelineLite();
				tlMinimize.to(".playerContainer", 0.5, {ease: Expo.easeOut, width: "25%", height: "25%", bottom: 0, right: 0});
				Session.set('playerMinimized', true);
			} else if(Session.get('playerMinimized') == true){
				tlMinimize.reverse();
				Session.set('playerMinimized', false);
			} else {
				tlMinimize.play();
				Session.set('playerMinimized', true);
			}
		}
	});

	Mousetrap.bind('space', function() { 
		if(video && video.getPlayerState() == YT.PlayerState.PLAYING)
			video.pauseVideo();
		else
			video.playVideo();
	});

	// run these to set the rest of the colors
	changeColor("red");
});

var setPseudoClass = function (rule, prop, value) {
    _.forEach(document.styleSheets, function(sheet) {
    	_.forEach(sheet.cssRules, function(cssRule) {
    		if(cssRule.selectorText && cssRule.selectorText.indexOf(rule) == 0)
                cssRule.style[prop] = value;
    	});
    });
}

// ============== Accounts ============== //
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

// ============== Helpers ============== //
video = null;
var playButton = "playButton.png", 
		pauseButton = "pauseButton.png", tlMinimize = null, 
		tlDropdown = null, ytPlaylist = [];

Template.registerHelper('color', function() {
     return Session.get('color');
});

Template.registerHelper('colorImage', function() {
     return Session.get('colorImage');
});


var changeColor = function(color) {
	switch(color) {
		case "red":
			Session.set('color', redHex);
			Session.set('colorImage', redTag);
			Session.set('colorRgb', redRgb);
			break
		case "yellow":
			Session.set('color', yellowHex);
			Session.set('colorImage', yellowTag);
			Session.set('colorRgb', yellowRgb);
			break
		case "green":
			Session.set('color', greenHex);
			Session.set('colorImage', greenTag);
			Session.set('colorRgb', greenRgb);
			break
		default:
			break;
	}
	setPseudoClass("::-webkit-scrollbar-thumb", "background", Session.get('color'));
	setPseudoClass("#login-buttons .login-buttons-with-only-one-button .login-button", "background", Session.get('color'));
	setPseudoClass("#login-buttons .login-buttons-with-only-one-button .login-button", "border", "1px solid " + Session.get('colorRgb'));
	setPseudoClass(".single .selected", "border", "3px solid " + Session.get('color'));
	setPseudoClass(".single .overlay:hover", "background-color", Session.get('colorRgb'));
}

// ============== Header ============== //
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
	"click .red": function () {
		changeColor("red");	
  	},
	"click .green": function () {
		changeColor("green");	
  	},
	"click .yellow": function () {
		changeColor("yellow");	
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

// ============== Player ============== //
Template.player.helpers({
	needOverlay: function() {
		return Session.get('currentVideo') && Session.get('playerMinimized') == false && Session.get('playerPushedTop') == false;
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
		if(Session.get("currentVideo")) {
			var dateString = Session.get("currentVideo").youTubePostDate;
			var year = dateString.substring(0,4);
			var day = dateString.substring(5,7);
			var month = dateString.substring(8,10);
			return new Date(year, month, day, 0, 0, 0, 0).toDateString();
			return dateString;		
		}
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
		Session.set('playerMinimized', true);
	},
	"click .expandPlayer": function () {
		tlMinimize.reverse();
		Session.set('playerPushedTop', false);
		Session.set('playerMinimized', false);
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
		}
	}
});

// ============== Grid Thumbs ============== //
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
	featured: function() {
		if(this.rank == 1 || (this.rank - 1) % 13 == 0)
			return "featured"

		return "";
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

		var oldVid = Session.get('currentVideo');
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

			if(oldVid != null)
				video.playVideoAt(index);
			else
				renderVids(index);
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

// ============== Video Helpers ============== //
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
renderVids = function(index) {
	Session.set("stateImage",pauseButton);	
	videoTmp = new YT.Player("player", {
	events: {
		onReady: function (event) {
			if(index != null)
				event.target.loadPlaylist(Session.get('playlist'), index);
			else
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

