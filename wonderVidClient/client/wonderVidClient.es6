var red = {
	hex : '#D6373A',
	light: '#C04848',
	dark : '#480048',
	rgb : 'rgba(214,55,58,0.5)',
	tag : "url('/images/rankBackgroundRed.png')"
}
var green = {
	hex : '#31C663',
	light: '#1D976C',
	dark : '#93F9B9',
	rgb : 'gba(49,198,99,0.5)',
	tag : "url('/images/rankBackground.png')"
}
var blue = {
	hex : '#406EAA',
	light: '#7474BF',
	dark : '#348AC7',
	rgb : 'gba(64,110,170,0.5)',
	tag : "url('/images/rankBackgroundBlue.png')"
}
var yellow = {
	hex : '#F7DD72',
	light: '#F09819',
	dark : '#EDDE5D',
	rgb : 'gba(247,221,114,0.5)',
	tag : "url('/images/rankBackgroundYellow.png')"
}
currentTime = null;

Meteor.startup(() => {
	currentTime = new Date();
	Session.set('currentVideo', null);
	Session.set('userLikes', []);
	Session.setDefault('stateImage', 'playButton.png');
	Session.setDefault('selectedGenre', 'Top Videos');
	Session.set('playerPushedTop', true);
	Session.set('playerMinimized', false);
	if(!Cookie.get('color'))
		changeColor(blue);
	else
		changeColor(JSON.parse(Cookie.get('color')));

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
});

var minimizeVideo = () => { 
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

var clearScreen = () => { 
	if(Session.get('playerPushedTop') == false && video) {
		Session.set('playerPushedTop', true);
		tlDropdown.reverse();
		Session.set('playerMinimized', false);
	}
}

var pullVideoDown = () => { 
	if(Session.get('playerPushedTop') == true &&  Session.get('playerMinimized') == false && video) {
		tlDropdown.restart();
		TweenLite.to(".playerContainer", 0, {autoAlpha:1, display:"block"});
		Session.set('playerPushedTop', false);
	}
}

var videoShortcut = function(direction) { // needs a this context
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
var scrollToCurrentVideo = direction => {
	var selectedElement = $(".single > .selected").parent();
	selectedElement = direction == "right" ? selectedElement.next() : selectedElement.prev();
	var left = selectedElement.offset().left;
	var right = selectedElement.width() + left;

	if (left < window.scrollX) 
		window.scrollTo(left, window.scrollY);
	else if (right > window.scrollX + window.innerWidth) 
		window.scrollTo(right - window.innerWidth, window.scrollY);
}

var togglePlayState = () => {
	if(video && video.getPlayerState() == YT.PlayerState.PLAYING)
		video.pauseVideo();
	else
		video.playVideo();
}

var setPseudoClass = (rule, prop, value) => {
	document.styleSheets.forEach(sheet => {
		sheet.cssRules.forEach(cssRule => {
			if(cssRule.selectorText && cssRule.selectorText.indexOf(rule) == 0)
      	cssRule.style[prop] = value;
		})
	});
}

// ============== Accounts ============== //
var _logout = Meteor.logout;
Meteor.logout = function customLogout() {
	Session.set('userLikes', []);
	_logout.apply(Meteor, arguments);
}

Accounts.onLogin(getLikes);
var getLikes = () => {
	Meteor.call('likedVideos', (err, res) => {
		if(!err) 
			Session.set('userLikes', res);
	}); 
}

var reRank = videos => {
	return videos.map((video, rank) => {
		video.rank = rank + 1;
		return video;
	});
}

var hitLikeButton = video => {
	if(!Meteor.user())
		AntiModals.overlay('simpleModal');
	else {
		var index = likesIds().indexOf(video.videoId);
		if(index > -1) 
			likeVid(video, index, 'none');
		else
			likeVid(video, index, 'like');
	}
}

var likeVid = (video, index, rating) => {
	var likes = Session.get('userLikes');
	Meteor.call('likeVideo', video.videoId, rating, res => {
		if (!res || !res.error) {
			if (rating == 'none')
				likes.splice(index, 1);
			else
				likes.unshift(video);
			Session.set('userLikes', reRank(likes));
		}
	});
}

// ============== Helpers ============== //
video = null;
var playButton = "playButton.png", 
		pauseButton = "pauseButton.png", tlMinimize = null, 
		tlDropdown = null, ytPlaylist = [];

Template.registerHelper('color', () => {
     return Session.get('color');
});

Template.registerHelper('colorImage', ()  => {
     return Session.get('colorImage');
});

var colorSwap = color => {
	Session.set('color', color.hex);
	Session.set('colorImage', color.tag);
	Session.set('colorRgb', color.rgb);
	setPseudoClass(".middle", "background", `-webkit-linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);
	setPseudoClass(".middle", "background", `-moz-linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);
	setPseudoClass(".middle", "background", `-webkit-linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);
	setPseudoClass(".middle", "background", `-o-linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);
	setPseudoClass(".middle", "background", `linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);
}

var changeColor = function(color) {
	Cookie.set('color', JSON.stringify(color));
	console.log(color)
	colorSwap(color);

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
		changeColor(red);	
 	},
	"click .green": () => {
		changeColor(green);	
 	},
	"click .yellow": () => {
		changeColor(yellow);	
  	},
	"click .blue": () => {
		changeColor(blue);	
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
	return Session.equals("color", yellow.hex) ? dark : white;
}

Template.player.helpers({
	needOverlay() {
		return Session.get('currentVideo') && Session.get('playerMinimized') == false && Session.get('playerPushedTop') == false;
	},
	currentVideo() {
		return Session.get('currentVideo') ? Session.get('currentVideo') : {description:""};
	},
	sharedata() {
		var video = Session.get('currentVideo');
		if(video) {
			return {
	      facebook: true,
	      twitter: true,
	      pinterest: false,
	      shareData: {
	        url : 'youtu.be/v=' + video.videoId,
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
			return `${dateString.substring(5,7)} • ${dateString.substring(8,10)} • ${dateString.substring(0,4)}`;
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