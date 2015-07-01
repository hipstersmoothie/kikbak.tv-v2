var greenHex = '#31C663';
var greenRgb = 'rgba(49,198,99,0.5)';
var greenTag = "url('/images/rankBackground.png')";
var blueHex = '#406EAA';
var blueRgb = 'rgba(64,110,170,0.5)';
var blueTag = "url('/images/rankBackgroundBlue.png')";
var yellowHex = '#F7DD72';
var yellowRgb = 'rgba(247,221,114,0.5)';
var yellowTag = "url('/images/rankBackgroundYellow.png')";
var redHex = '#D6373A';
var redRgb = 'rgba(214,55,58,0.5)';
var redTag = "url('/images/rankBackgroundRed.png')";
currentTime = null;

Meteor.startup(function () {
	currentTime = new Date();
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
	});
	if(Meteor.user())
		getLikes();


	Mousetrap.bind('esc', clearScreen);
	Mousetrap.bind('right', videoShortcut.bind(null, "right"));
	Mousetrap.bind('left', videoShortcut.bind(null, "left"));
	Mousetrap.bind('down', pullVideoDown);
	Mousetrap.bind('m',  minimizeVideo);
	Mousetrap.bind('space', togglePlayState);
	// run this to set the colors
	if(!Cookie.get('color'))
		changeColor("blue");
	else
		changeColor(Cookie.get('color'));
});

var minimizeVideo = function() { 
	if(tlMinimize == null){
		tlMinimize = new TimelineLite();
		tlMinimize.to(".playerNavBar", 0.25, {ease: Expo.easeIn, right: "15%"});
		tlMinimize.to(".playerSideBar", 0.25, {ease: Expo.easeIn, left: "23%"});
		tlMinimize.insert( new TweenLite(".player", 0.5, {width: "100%", height: "100%", right: 0}), 0);
		tlMinimize.to(".playerContainer", 0.5, {ease: Expo.easeOut, width: "25%", height: "25%", bottom: 0, right: 0, top: "initial"});
		tlMinimize.to(".playerNavBarMinimized", 0, {display: "block"});
		tlMinimize.to(".playerNavBarMinimized", 0.25, {top: "-20%"});
		Session.set('playerMinimized', true);
	} else if(Session.get('playerMinimized') == true){
		reverseMinimizeAnimation();
	}else{
		tlMinimize.restart();
		Session.set('playerMinimized', true);		
	}

	if(Session.get('playerPushedTop') == false && video) {
		if(tlMinimize == null){
			tlMinimize = new TimelineLite();
			tlMinimize.to(".playerNavBar", 0.25, {ease: Expo.easeIn, right: "15%"});
			tlMinimize.to(".playerSideBar", 0.25, {ease: Expo.easeIn, left: "23%"});
			tlMinimize.to(".playerContainer", 0.5, {ease: Expo.easeOut, width: "25%", height: "25%", bottom: 0, right: 0, top: "initial"});
			tlMinimize.to(".player", 0.2, {width: "100%", height: "100%", right: 0});
			tlMinimize.to(".playerNavBarMinimized", 0, {display: "block"});
			tlMinimize.to(".playerNavBarMinimized", 0.25, {top: "-20%"});
			Session.set('playerMinimized', true);
			
		} else if(Session.get('playerMinimized') == true){
			reverseDropDownAnimation();
		} else {
			tlMinimize.play();
			Session.set('playerMinimized', true);
		}
	}
}

var clearScreen = function() { 
	if(Session.get('playerPushedTop') == false && video) {
		Session.set('playerPushedTop', true);
		tlDropdown.reverse();
		Session.set('playerMinimized', false);
	}
}

var pullVideoDown = function() { 
	if(Session.get('playerPushedTop') == true &&  Session.get('playerMinimized') == false && video) {
		tlDropdown.restart();
		TweenLite.to(".playerContainer", 0, {autoAlpha:1, display:"block"});
		Session.set('playerPushedTop', false);
	}
}

var videoShortcut = function(direction) {
	if(video) {
		if(event)
			event.preventDefault();
		scrollToCurrentVideo(direction);
		video.previousVideo();
	}
}

/**
 * Scrolls window to a video ina certain direction
 * @param  {String} direction "left" or "right"
 */
var scrollToCurrentVideo = function(direction){
	var selectedElement = $(".single > .selected").parent();
	if (direction == "right") {
		selectedElement = selectedElement.next();
	} else if (direction == "left") {
		selectedElement = selectedElement.prev();
	}

	var left = selectedElement.offset().left;
	var right = selectedElement.width() + left;

	if (left < window.scrollX) {
		window.scrollTo(left, window.scrollY);
	} else if (right > window.scrollX + window.innerWidth) {
		window.scrollTo(right - window.innerWidth, window.scrollY);
	}
}

var togglePlayState = function() {
	if(video && video.getPlayerState() == YT.PlayerState.PLAYING)
		video.pauseVideo();
	else
		video.playVideo();
}

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
	getLikes();
});
Accounts.onLogin(getLikes);

var getLikes = function() {
	Meteor.call('likedVideos', function(err, res) {
		if(!err) 
			Session.set('userLikes', res);
	}); 
}

var reRank = function (videos) {
	return _.map(videos, function(video, rank) {
		video.rank = rank + 1;
		return video;
	});
}

var hitLikeButton = function(video) {
	if(!Meteor.user())
		AntiModals.overlay('simpleModal');
	else {
		var likes = Session.get('userLikes');
		var index = likesIds().indexOf(video.videoId);

		if(index > -1) {
			Meteor.call('likeVideo', video.videoId, 'none', function(res){
				if (!res || !res.error) {
					likes.splice(index, 1);
					Session.set('userLikes', reRank(likes));
				} else {
					// remove for production
					throw res;
				}
			});
		} else {
			Meteor.call('likeVideo', video.videoId, 'like', function(res){
				if (!res || !res.error) {
					likes.unshift(video);
					Session.set('userLikes', reRank(likes));
				} else {
					// remove for production
					throw res;
				}
			});
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
	Cookie.set('color', color);
	switch(color) {
		case "red":
			Session.set('color', redHex);
			Session.set('colorImage', redTag);
			Session.set('colorRgb', redRgb);
			setPseudoClass(".middle", "background", "-webkit-linear-gradient(90deg, #C04848 10%, #480048 90%)");
			setPseudoClass(".middle", "background", "-moz-linear-gradient(90deg, #C04848 10%, #480048 90%)");
			setPseudoClass(".middle", "background", "-webkit-linear-gradient(90deg, #C04848 10%, #480048 90%)");
			setPseudoClass(".middle", "background", "-o-linear-gradient(90deg, #C04848 10%, #480048 90%)");
			setPseudoClass(".middle", "background", "linear-gradient(90deg, #C04848 10%, #480048 90%)");
			break
		case "yellow":
			Session.set('color', yellowHex);
			Session.set('colorImage', yellowTag);
			Session.set('colorRgb', yellowRgb);
			setPseudoClass(".middle", "background", "-webkit-linear-gradient(90deg, #F09819 10%, #EDDE5D 90%)");
			setPseudoClass(".middle", "background", "-moz-linear-gradient(90deg, #F09819 10%, #EDDE5D 90%)");
			setPseudoClass(".middle", "background", "-webkit-linear-gradient(90deg, #F09819 10%, #EDDE5D 90%)");
			setPseudoClass(".middle", "background", "-o-linear-gradient(90deg, #F09819 10%, #EDDE5D 90%)");
			setPseudoClass(".middle", "background", "linear-gradient(90deg, #F09819 10%, #EDDE5D 90%)");
			break
		case "green":        
			Session.set('color', greenHex);
			Session.set('colorImage', greenTag);
			Session.set('colorRgb', greenRgb);
			setPseudoClass(".middle", "background", "-webkit-linear-gradient(90deg, #1D976C 10%, #93F9B9 90%)");
			setPseudoClass(".middle", "background", "-moz-linear-gradient(90deg, #1D976C 10%, #93F9B9 90%)");
			setPseudoClass(".middle", "background", "-webkit-linear-gradient(90deg, #1D976C 10%, #93F9B9 90%)");
			setPseudoClass(".middle", "background", "-o-linear-gradient(90deg, #1D976C 10%, #93F9B9 90%)");
			setPseudoClass(".middle", "background", "linear-gradient(90deg, #1D976C 10%, #93F9B9 90%)");
			break
		case "blue":
			Session.set('color', blueHex);
			Session.set('colorImage', blueTag);
			Session.set('colorRgb', blueRgb);
			setPseudoClass(".middle", "background", "-webkit-linear-gradient(90deg, #7474BF 10%, #348AC7 90%)");
			setPseudoClass(".middle", "background", "-moz-linear-gradient(90deg, #7474BF 10%, #348AC7 90%)");
			setPseudoClass(".middle", "background", "-webkit-linear-gradient(90deg, #7474BF 10%, #348AC7 90%)");
			setPseudoClass(".middle", "background", "-o-linear-gradient(90deg, #7474BF 10%, #348AC7 90%)");
			setPseudoClass(".middle", "background", "linear-gradient(90deg, #7474BF 10%, #348AC7 90%)");
			break
		default:
			break;
	}


	setPseudoClass("::-webkit-scrollbar-thumb", "background", Session.get('color'));
	setPseudoClass("#login-buttons .login-buttons-with-only-one-button .login-button", "background", Session.get('color'));
	setPseudoClass("#login-buttons .login-button:hover, .accounts-dialog .login-button:hover", "color", Session.get('color'));
	setPseudoClass("#login-buttons .login-buttons-with-only-one-button .login-button", "border", "1px solid " + Session.get('colorRgb'));
	setPseudoClass(".single .selected", "border", "3px solid " + Session.get('color'));
	setPseudoClass(".single .overlay:hover", "background-color", Session.get('colorRgb'));
}

Template.simpleModal.helpers({
	loggedIn() {
		AntiModals.dismissOverlay($('.anti-modal-box'));
		if(Meteor.user())
			return "You're logged in!";
		else
			return "You're not logged in!";
	},
})

Template.helpModal.helpers({
	shortcut() {
		return [{ key:'m', exp:'Minimize the player' },
						{ key:'esc', exp:'Push the player to the top' },
						{ key:'down', exp:'Bring the player down from the top' },
						{ key:'->', exp:'Next song' },
						{ key:'<-', exp:'Previous song' },
						{ key:'space', exp:'Pause the song' }];
	}
});

Template.helpModal.events({
	'click .about': (evt, f) => {
		AntiModals.dismissOverlay( AntiModals.dismissOverlay($(f.firstNode).parent()));
	}
})

// ============== Header ============== //
Template.about.events({
	'click .goBack': () => {
		Router.go('/');
	}
})

Template.header.helpers({
	genres() { 
		return [{type:"Top Videos", className: "topVideos"}, 
						{type:"Emerging", className: "emergingVideos"},
						{type:"All Star", className: "allStarVideos"},
						// {type:"Hip Hop", className: "hipHopVideos"},
						// {type:"Electronic", className: "electronicVideos"},
						{type:"Live", className: "liveVideos"}];
	},
	selectedGenre() {
		return Session.get('selectedGenre');
	},
	currentVideo() {
		return Session.get('currentVideo');
	},
	stateImage() {
		return Session.get("stateImage");
	},
	isLiked() {
		return likesIds().indexOf(Session.get('currentVideo').videoId) > -1;
	},
	isVideo() {
		return Session.get('currentVideo') != null;
	}
});

var likesIds = () => {
	return Session.get('userLikes').map(like => like.videoId);
}

CurrentVideos = null;
Template.header.events({
	'click .aboutDrop': () => {
		Router.go('/about');
	},
	'click .help': () => {
		AntiModals.overlay('helpModal');
	},
	'click .topVideos': () => {
		Router.go('/');
	},
	'click .allStarVideos': () => {
		Router.go('/allStar');
	},
	'click .hipHopVideos': () => {
		Router.go('/hipHop');
	},
	'click .liveVideos': () => {
		Router.go('/live');
	},
	'click .electronicVideos': () => {
		Router.go('/electronic');
	},
	'click .emergingVideos': () => {
		Router.go('/emerging');
	},
	"click .playButton":  () => {
		if(Session.equals("stateImage",playButton)){
			video.playVideo();
			Session.set('stateImage', pauseButton);
		}else{
			video.pauseVideo();
			Session.set('stateImage', playButtonn);
		}
		if(Session.equals('playerPushedTop', true) && Session.equals('playerMinimized', false)){
			restartDropDown();
		}
	},
	"click .nextButton": () => {
		Session.set('stateImage', pauseButton);
		video.nextVideo();	
	},
	"click .prevButton": () => {
		Session.set('stateImage', pauseButton);
		video.previousVideo();	
  },
	"click .red": () => {
		changeColor("red");	
 	},
	"click .green": () => {
		changeColor("green");	
 	},
	"click .yellow": () => {
		changeColor("yellow");	
  	},
	"click .blue": () => {
		changeColor("blue");	
  	},
	'click .likedVideos' : () => {
		if(!Meteor.user())
			AntiModals.overlay('simpleModal');
		else
			Router.go('/likes');
	},
	'click .like': () => {
		hitLikeButton(Session.get("currentVideo"));
	}
});

// ============== Body ============== //
Template.body.rendered = () => {
	$("body").mousewheel(function(event, delta, deltaX, deltaY) {
	  var singleDelta = (Math.abs(deltaX)>Math.abs(deltaY)) ? (-1 * deltaX) : deltaY; 
    if(Session.get('playerPushedTop') == true || Session.get('playerMinimized') == true) {
     	event.preventDefault();

   		// Determine the proper way to scroll (vert or horizontal) by
   		// checking if the scrolling width exceeds the window width, and 
   		// if the scrolling height exceeds the window height.
   		if (this.scrollWidth > this.clientWidth) {
   			window.scrollBy(singleDelta * -30, 0);
   		} else if (this.scrollHeight > this.clientHeight) {
   			window.scrollBy(0, singleDelta * -30);
   		}
    }		
	});
}

// ============== Player ============== //
var determineColor = function(dark, white) {
	return Session.equals("color", yellowHex) ? dark : white;
}

Template.player.helpers({
	needOverlay() {
		return Session.get('currentVideo') && Session.get('playerMinimized') == false && Session.get('playerPushedTop') == false;
	},
	currentVideo() {
		return Session.get('currentVideo') ? Session.get('currentVideo') : {description:""};
	},
	sharedata() {
		var video =  Session.get('currentVideo');
		if(video) {
			var url = 'youtu.be/v=' + video.videoId;
			return {
	      facebook: true,
	      twitter: true,
	      pinterest: false,
	      shareData: {
	        url,
	        defaultShareText: ' -- Found on Kikbak.tv'
	      }
	    }
		} else
			return {};
	},
	minimized() {
		return Session.get('playerMinimized');
	},
	pushedTop() {
		return Session.get('playerPushedTop') && Session.get('currentVideo') != null;
	},
	formedDate() {
		if(Session.get("currentVideo")) {
			var dateString = Session.get("currentVideo").youTubePostDate;
			var year = dateString.substring(0,4);
			var day = dateString.substring(5,7);
			var month = dateString.substring(8,10);
			dateString = month + " • " + day + " • " + year;
			return dateString;
		}
	},
	fontColor: _.bind(determineColor, null, "#151515", "white"),
	colorFontClose: _.bind(determineColor, null, "cancel.png", "cancelWhite.png"),
	colorFontExpand: _.bind(determineColor, null, "expand.png", "expandWhite.png"),
	colorFontMinimize: _.bind(determineColor, null, "minimize.png", "minimizeWhite.png"),
	colorFontFlag: _.bind(determineColor, null, "flag.png", "flagWhite.png")
});

Template.player.events({
	'click .blackOverlay': () => {
		reverseDropDownAnimation();
	},
	"click .togglePlayer": () => {
		if(Session.equals('playerPushedTop', false)){
			video.pauseVideo();
			reverseDropDownAnimation();
		}
	},
	"click .minimizePlayer": () => {
		minimizePlayerAnimation();
	},
	"click .expandPlayer": () => {
		tlMinimize.reverse();
		Session.set('playerPushedTop', false);
		Session.set('playerMinimized', false);
	},
	"click .closePlayer": () => {
		reverseMinimizeAnimation();
	},
	"click .downArrow": () => {
		if(Session.equals('playerPushedTop', true) && Session.equals('playerMinimized', false)){
			restartDropDown();
		}
	},
	'click .flagVideo': () => {
		new Confirmation({
		  message: "Are you sure this isnt a video?",
		  title: "Flag Video",
		  cancelText: "Cancel",
		  okText: "Ok",
		  success: true // wether the button should be green or red
		}, ok => {
			Meteor.call('flagVideo', Session.get('currentVideo').videoId, () => {
				Router.go(Router.current());
			});
		});
	}
});

// ============== Grid Thumbs ============== //
Template.gridThumbs.helpers({
	isSelected() {
		return Session.get('currentVideo') ? Session.get('currentVideo').videoId == this.videoId : false;
	},
	isLiked() {
		return likesIds().indexOf(this.videoId) > -1;
	},
	hidePlayer() {
		return Session.get('playerTuckedLeft');
	},
	featured() {
		return (this.rank == 1 || (this.rank - 1) % 13 == 0) ? "featured" : "";
	},
	fontColor() {
		return determineColor("#151515", "white")
	},
	videos() {
		return Session.get('videos');
	}
});

Template.gridThumbs.events({
	"click .single": function (event) { // needs its own this
		if (event.target.classList[0] == 'like' || event.target.nodeName == 'P')
			return

		var index = Session.get('playlist').indexOf(this.videoId);
		if (index == -1) {
			Session.set('currentVideo', Session.get('videos')[this.rank + 1]);
			return video.playVideoAt(this.rank);
		}

		hitSquare(this, index);
	},
	'click .like': function() { // needs its own this
		if(!Meteor.user())
			AntiModals.overlay('simpleModal');
		else
			hitLikeButton(this);
	}
});

var reverseDropDownAnimation = () => {
	Session.set('playerPushedTop', true);
	tlDropdown.reverse();
	Session.set('playerMinimized', false);
}

var reverseMinimizeAnimation = () => {
	setTimeout(() => {
		tlMinimize.reverse();
		document.getElementById("playerNavBar").style.right = "15%";
		document.getElementById("playerSideBar").style.left = "23%";
		document.getElementById("playerNavBarMinimized").style.top = "0%";
	}, 500);
	Session.set('playerPushedTop', true);
	Session.set('playerMinimized', false);
	TweenLite.to(".playerContainer", 0.5, {autoAlpha:0, display:"none"});
	video.pauseVideo();
}

var minimizePlayerAnimation = () =>  {
	if(tlMinimize == null){
		tlMinimize = new TimelineLite();
		tlMinimize.to(".playerNavBar", 0.25, {ease: Expo.easeIn, right: "15%"});
		tlMinimize.to(".playerSideBar", 0.25, {ease: Expo.easeIn, left: "23%"});
		tlMinimize.insert( new TweenLite(".player", 0.5, {width: "100%", height: "100%", right: 0}), 0);
		tlMinimize.to(".playerContainer", 0.5, {ease: Expo.easeOut, width: "25%", height: "25%", bottom: 0, right: 0, top: "initial"});
		tlMinimize.to(".playerNavBarMinimized", 0, {display: "block"});
		tlMinimize.to(".playerNavBarMinimized", 0.25, {top: "-20%"});
	} else{
		tlMinimize.restart();
	}
	Session.set('playerMinimized', true);
}

var restartDropDown = () => {	
	Session.set('playerPushedTop', false);
	Session.set('playerMinimized', false);
	document.getElementById("playerNavBar").style.right = "15%";
	document.getElementById("playerSideBar").style.left = "23%";
	document.getElementById("playerNavBarMinimized").style.top = "0%";
	tlDropdown.restart();
	TweenLite.to(".playerContainer", 0, {autoAlpha:1, display:"block"});
}

var createDropDownAnimation = () => {
	Session.set('playerPushedTop', false);
	Session.set('playerMinimized', false);
	document.getElementById("playerNavBar").style.right = "15%";
	document.getElementById("playerSideBar").style.left = "23%";
	document.getElementById("playerNavBarMinimized").style.top = "0%";
	tlDropdown = new TimelineLite();
	TweenLite.to(".playerContainer", 0, {autoAlpha:1, display:"block"});
	tlDropdown.from(".playerContainer", 0.5, {x:0, y: -screen.height, z: 0});
	tlDropdown.to(".playerContainer", 0.5, {ease: Expo.easeIn, x:0, y: 0, z: 0});
	tlDropdown.to(".playerNavBar", 0.55, {ease: Expo.easeIn, right: "-20px"});
	tlDropdown.to(".playerSideBar", 0.5, {ease: Expo.easeIn, left: "0%"}, '-=0.5');
}

var hitSquare = (thisVid, index) => {
	var oldVid = Session.get('currentVideo');
	Session.set('currentVideo', thisVid);
	if (oldVid && oldVid.videoId == thisVid.videoId && Session.equals("playerMinimized",true)){
		video.playVideo();
		tlMinimize.reverse();
		Session.set('playerPushedTop', false);
		Session.set('playerMinimized', false);
	} else if (Session.equals('playerMinimized', true)){
		video.playVideoAt(index);
	} else if (tlDropdown == null || Session.equals('playerPushedTop', true)){
		console.log("First: " + index);
		createDropDownAnimation();

		if(nextList) {
			video.loadPlaylist(nextList.videoIds, index);
			nextList = null;
		}	else if(oldVid != null)
			video.playVideoAt(index);
		else
			renderVids(index);
	}else{
		console.log("after: " + index);
		restartDropDown();
		if(nextList) {
			video.loadPlaylist(nextList.videoIds, index); //need to test
			nextList = null;
			//updateList(video);
		}
		else
			video.playVideoAt(index);
	}
}
// ============== Video Helpers ============== //
var findVid = videoId => {
	return _.find(Session.get('videos'), video => {
		return video.videoId == videoId;
	});
}

var updateList = event => {
	if (video.route != nextList.name) { // new page play first
		event.loadPlaylist(nextList.videoIds);
		Session.set('currentVideo', Session.get('videos')[0]);
	} else { // reload on same page, play next rank. SHOULD try to find id first then play rank if it can find it
		event.loadPlaylist(nextList.videoIds, Session.get('currentVideo').rank);
		Session.set('currentVideo', Session.get('videos')[Session.get('currentVideo').rank]);
	}
	video.route = nextList.name;
	nextList = null;
}

firstPlay = true, nextList = null;
renderVids = index => {
	Session.set("stateImage",pauseButton);	
	videoTmp = new YT.Player("player", {
		events: {
			onReady(event) {
				if(index != null)
					event.target.loadPlaylist(Session.get('playlist'), index);
				else
					event.target.cuePlaylist(Session.get('playlist'));
			},
			onStateChange(event) {
				if (firstPlay && event.data == YT.PlayerState.PLAYING) {
					firstPlay = false;
					Session.set('playlist', video.getPlaylist());
				}
				if(event.data == YT.PlayerState.PLAYING) {
					var nextVid = findVid(event.target.getVideoUrl().match(/[?&]v=([^&]+)/)[1]);
					Session.set('currentVideo', nextVid);
					Session.set("stateImage", pauseButton);
				} else if (event.data == YT.PlayerState.PAUSED) {
					Session.set("stateImage", playButton);
				} else if (event.data == YT.PlayerState.ENDED) {
					if(nextList)
						updateList(event.target);
					else {
						var nextVid = findVid(event.target.getVideoUrl().match(/[?&]v=([^&]+)/)[1]);
						Session.set('currentVideo', nextVid);
					}
				}
			},
			onError(errorCode) { //video unavailable
				if(errorCode.data == 100 || errorCode.data == 150)
					video.nextVideo();
			}
		} 
	});
	video = videoTmp;
	video.route = Router.current().route.getName();

	YT.load();   	
};