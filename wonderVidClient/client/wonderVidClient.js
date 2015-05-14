Session.setDefault('videoId', null);
Session.setDefault('stateImage', 'playButton.png');
Session.setDefault('selectedGenre', 'Top Videos');
var video = null, playButton = "playButton.png", pauseButton = "pauseButton.png";

Meteor.startup(function() {
})

//==============SET METEOR CALL BACK TO TOPVIDEOS==============
Template.gridThumbs.rendered = function() {
	setTimeout(function() {
		renderVids();
	}, 1000)
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

CurrentVideos = null;
Template.header.events({
	'click .topVideos': function() {
		Session.set('videos', null);
		if(video)
			video.destroy(); 
		Router.go('/');
		Session.set('selectedGenre', 'Top Videos');
	},
	'click .hipHopVideos': function() {
		Session.set('videos', null);
		if(video)
			video.destroy(); 
		Router.go('/hipHop');
		Session.set('selectedGenre', 'Hip Hop');
	},
	'click .interviewVideos': function() {
		Session.set('videos', null);
		if(video)
			video.destroy(); 
		Router.go('/interviews');
		Session.set('selectedGenre', 'Interviews');
	},
	'click .liveVideos': function() {
		Session.set('videos', null);
		if(video)
			video.destroy(); 
		Router.go('/live');
		Session.set('selectedGenre', 'Live');
	},
	'click .electronicVideos': function() {
		Session.set('videos', null);
		if(video)
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

Template.gridThumbs.helpers({
    isSelected: function () {
  		return Session.equals("videoId", this.videoId);
	},
	rank: function(){
		var video = CurrentVideos.findOne({videoId:this.videoId});
		return video.rank;
	},
	backgroundImage: function () {
		var index = Session.get('playlist').indexOf(Session.get('videoId'));
		var videos = Session.get('videos');
		return Session.get('videos')[index].thumbnail.high.url;
    },
	hidePlayer: function() {
		return Session.get('playerTuckedLeft');
	}
});

Template.gridThumbs.events({
    "click .single": function () {
      	Session.set('videoId', this.videoId);
      	var index = Session.get('playlist').indexOf(this.videoId);
      	console.log(index)
		video.playVideoAt(index);
    },
    "click .togglePlayer": function () {
    	if(Session.get('playerTuckedLeft') == "tuckedLeft"){
			Session.set('playerTuckedLeft', "");
    		TweenLite.to(".playerContainer", 0.5, {display:'inline-block'}).delay(0.5);
    		TweenLite.to(".playerContainer", 0.5, {ease: Expo.easeOut, x:0, y:0,z:0}).delay(0.5);
    		TweenLite.to(".container", 0.5, {ease: Expo.easeOut, width:"27%"});
    		TweenLite.to(".togglePlayer", 0.5, { x:0, y:0,z:0, rotation:360});

    	}else{
			Session.set('playerTuckedLeft', "tuckedLeft");
			TweenLite.to(".togglePlayer", 0.5, { x:-screen.width/1.56, y:0,z:0, rotation:180});
    		TweenLite.to(".playerContainer", 0.5, { x:-screen.width, y:0,z:0, display:'none'});
    		TweenLite.to(".container", 0.5, { width:"94%"}).delay(0.5);
    	}
    }
  });

renderVids = function() {
	Session.set("stateImage",pauseButton);	
	videoTmp = new YT.Player("player", {
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
            playVid: function (event) {
				console.log('playing')
            },
			onStateChange: function (event) {
				if(event.data == YT.PlayerState.PLAYING) {
					Session.set("stateImage",pauseButton);
				} else if (event.data == YT.PlayerState.PAUSED) {
					Session.set("stateImage",playButton);
				} else if (event.data == YT.PlayerState.ENDED) {
					var playlist = Session.get('playlist'),
						index = playlist.indexOf(Session.get('videoId'));

				    if(index + 1 >= playlist.length)
				    	Session.set('videoId', playlist[0]);
				    else
				    	Session.set('videoId', playlist[index+1]);
				}
			}
		} 
    });
    video = videoTmp;
    YT.load();   	
};


