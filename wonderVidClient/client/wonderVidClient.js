Session.setDefault('videoId', null);
Session.setDefault('stateImage', 'playButton.png');
Session.setDefault('selectedGenre', 'Top Videos');
var video = null, playButton = "playButton.png", pauseButton = "pauseButton.png";

Meteor.startup(function() {
})

//==============SET METEOR CALL BACK TO TOPVIDEOS==============
// Template.gridThumbs.rendered = function() {
// 	getVideos();
// }

getVideos = function() {
	console.log('here')
	Meteor.call("videos", setList);
}

setList = function(error, result) {
	Session.set('videos', result);
	Session.set('videoId', result[0].videoId);
	Session.set('playlist', _.pluck(result, "videoId"));
	renderVids();
}

Template.header.helpers({
	genres: function() {
		return [{type:"Top Videos", className: "topVideos"}, 
             	{type:"Hip Hop", className: "hipHopVideos"},
             	{type:"Electronic", className: "electronicVideos"},
             	{type:"Interviews", className: "interviewVideos"},
             	{type:"Live", className: "liveVideos"}];
	},
	selectedGenre: function() {
		return Session.get('selectedGenre');
	}
});

Template.header.events({
	'click .topVideos': function() {
		Session.set('videos', null);
		video.destroy(); 
		Router.go('/');
		Session.set('selectedGenre', 'Top Videos');
	},
	'click .hipHopVideos': function() {
		Session.set('videos', null);
		video.destroy(); 
		Router.go('/hipHop');
		Session.set('selectedGenre', 'Hip Hop');
	},
	'click .interviewVideos': function() {
		Session.set('videos', null);
		video.destroy(); 
		Router.go('/interviews');
		Session.set('selectedGenre', 'Interviews');
	},
	'click .liveVideos': function() {
		Session.set('videos', null);
		video.destroy(); 
		Router.go('/live');
		Session.set('selectedGenre', 'Live');
	},
	'click .electronicVideos': function() {
		Session.set('videos', null);
		video.destroy(); 
		Router.go('/electronic');
		Session.set('selectedGenre', 'Electronic');
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
    "click .prevButton": function () {
		Session.set('stateImage', pauseButton);
		video.prevVideo();	
    }

});

Template.header.helpers({
	stateImage: function () {
		return Session.get("stateImage");
	}
});

Template.app.helpers({
	backgroundImage: function () {
		var index = Session.get('playlist').indexOf(Session.get('videoId'));
		var videos = Session.get('videos');
		console.log("HIGH:" + videos[index].thumbnail.high.url);
		return Session.get('videos')[index].thumbnail.high.url;
    },
	hidePlayer: function() {
		return Session.get('playerTuckedLeft');
	}
});

Template.app.events({
    "click .togglePlayer": function () {
    	if(Session.get('playerTuckedLeft') == "tuckedLeft"){
			Session.set('playerTuckedLeft', "");
    		TweenLite.to(".playerContainer", 0.5, {display:'inline-block'}).delay(0.5);
    		TweenLite.to(".playerContainer", 0.5, {ease: Expo.easeOut, x:0, y:0,z:0}).delay(0.5);
    		TweenLite.to(".container", 0.5, {ease: Expo.easeOut, width:"27%"});
    	}else{
			Session.set('playerTuckedLeft', "tuckedLeft");
    		TweenLite.to(".playerContainer", 0.5, { x:-screen.width, y:0,z:0, display:'none'});
    		TweenLite.to(".container", 0.5, { width:screen.width}).delay(0.5);
    	}
    }
})

Template.gridThumbs.helpers({
	videos: function () {
		console.log('gotem')
		return Session.get('videos');
    },
    isSelected: function () {
  		return Session.equals("videoId", this.videoId) ? "selected" : '';
	},
	rank: function(){
		return Session.get('playlist').indexOf(this.videoId) + 1;
	}
});

Template.gridThumbs.events({
    "click .single": function () {
      	Session.set('videoId', this.videoId);
      	var index = Session.get('playlist').indexOf(this.videoId);
		video.playVideoAt(index);
    }
  });

var renderVids = function() {
	Session.set("stateImage",pauseButton);	
	console.log(Session.get('playlist'))

	console.log($("player"));
	video = new YT.Player("player", {
        loadPlaylist:{
	        listType: 'playlist',
	        list: Session.get('playlist'),
	        index: 0,
	    },
		events: {
			onReady: function (event) {
				console.log('ready')
                event.target.loadPlaylist(Session.get('playlist'));
            },
			onStateChange: function (event) {
				if(event.data == YT.PlayerState.PLAYING) {
					Session.set("stateImage",pauseButton);
				}else if (event.data == YT.PlayerState.PAUSED) {
					Session.set("stateImage",playButton);
				}else if (event.data == YT.PlayerState.ENDED) {
					playlist = Session.get('playlist');
				    console.log(playlist);

				    var index = playlist.indexOf(Session.get('videoId'));
				    session.set('videoId', playlist[index+1]);




				    // for(current in playlist){
				    // 	if(playlist[current] == Session.get('videoId')){
				    // 		console.log("Found this video: " + playlist[current] + ", Next Vid: " + playlist[i + 1]);
				    // 		if(playlist.length <= i + 1){
				    // 			Session.set('videoId', playlist[0]);
				    // 		}else{
				    // 			//console.log(playlist[i])
				    // 			var newID = playlist[i + 1]
				    // 			Session.set('videoId', newID);
				    // 		}
				    // 	}
				    // 	i++;
				    // }
				    Session.set('videos', playlist);
				}
			}
		} 
    });
    
    YT.load();   	
};


