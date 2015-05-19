Session.setDefault('videoId', null);
Session.setDefault('stateImage', 'playButton.png');
Session.setDefault('selectedGenre', 'Top Videos');
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
		return CurrentVideos.findOne({videoId:this.videoId}).rank;
	},
	backgroundImage: function () {
		return CurrentVideos.findOne({videoId:Session.get('videoId')}).thumbnail.high.url;
    },
	hidePlayer: function() {
		return Session.get('playerTuckedLeft');
	}
});

Template.gridThumbs.events({
    "click .single": function () {
      	Session.set('videoId', this.videoId);
    	if(video == null){
      		console.log("First: " + (this.rank - 1));
			TweenLite.to(".playerContainer", 0.5, {display:'inline-block'}).delay(0.5);
			TweenLite.to(".playerContainer", 0.5, {ease: Expo.easeOut, x:0, y:0,z:0}).delay(0.5);
			TweenLite.to(".container", 0.5, {ease: Expo.easeOut, width:"27%"});
			TweenLite.to(".togglePlayer", 0, {display:'inline-block'});
			TweenLite.to(".togglePlayer", 0.5, { x:0, y:0,z:0, rotation:360});
      		renderVids(this.rank - 1);
		}else{
      		console.log("after: " + (this.rank - 1));
			Session.set('playerTuckedLeft', "");
    		TweenLite.to(".playerContainer", 0.5, {display:'inline-block'}).delay(0.5);
    		TweenLite.to(".playerContainer", 0.5, {ease: Expo.easeOut, x:0, y:0,z:0}).delay(0.5);
    		TweenLite.to(".container", 0.5, {ease: Expo.easeOut, width:"27%"});
    		TweenLite.to(".togglePlayer", 0.5, { x:0, y:0,z:0, rotation:360});
    		video.playVideoAt(this.rank - 1);
		}
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
				} else if (event.data == YT.PlayerState.CUED) {
					event.target.playVideo();
				}
			}
		} 
    });
    video = videoTmp;
    YT.load();   	
};