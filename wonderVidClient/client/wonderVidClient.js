Session.setDefault('videoId', null);
Session.setDefault('stateImage', 'playButton.png');
Session.setDefault('selectedGenre', 'Top Videos');
var video = null, playButton = "playButton.png", pauseButton = "pauseButton.png";

Meteor.startup(function() {
})

//==============SET METEOR CALL BACK TO TOPVIDEOS==============
Template.gridThumbs.rendered = function() {
	getVideos();
}

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
		Session.set('selectedGenre', 'Top Videos');
	},
	'click .hipHopVideos': function() {
		Session.set('videos', null);
		Router.go('/hipHop');
		Meteor.call("hipHopVideos", setList);
		Session.set('selectedGenre', 'Hip Hop');
	},
	'click .interviewVideos': function() {
		Session.set('videos', null);
		Router.go('/interviews');
		Meteor.call("interviews", setList);
		Session.set('selectedGenre', 'Interviews');
	},
	'click .liveVideos': function() {
		Session.set('videos', null);
		Router.go('/live');
		Meteor.call("live", setList);
		Session.set('selectedGenre', 'Live');
	},
	'click .electronicVideos': function() {
		Session.set('videos', null);
		Router.go('/electronic');
		Meteor.call("electronic", setList);
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
    }
});

Template.header.events({
    
  });

Template.header.helpers({
	stateImage: function () {
		return Session.get("stateImage");
	}
});

Template.gridThumbs.helpers({
	videos: function () {
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
					// playlist = Session.get('playlist');
				 //    console.log(playlist);
				 //    var i = 0;

				 //    var index = playlist.indexOf(Session.get('videoId'));
				 //    session.set('videoId', playlist[index+1]);




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
