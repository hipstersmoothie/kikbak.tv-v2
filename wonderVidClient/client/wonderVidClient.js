Session.setDefault('videoId', null);
Session.setDefault('stateImage', 'playButton.png');
Session.setDefault('selectedGenre', 'Top Videos');
var video = null, playButton = "playButton.png", pauseButton = "pauseButton.png";

Meteor.startup(function() {

})

Template.youtubePlayer.rendered = function () {
	console.log("Rendered");
    //enderVid(Session.get('videoId'));

    // Session.set("youtubePlayer", video);
}

Template.gridThumbs.rendered = function() {
	Meteor.call("topVideos", function (error, result) { 
		Session.set('videos', result);
		Session.set('videoId', result[0].videoId);
		renderVid(result[0].videoId);
	});
}

// Template.youtubePlayer.helpers({
// 	setVideo: function () {
// 		console.log('loading video..');
// 		video = Popcorn.youtube('#youtube-video', 'http://www.youtube.com/embed/' + Session.get('videoId'));
// 		return;
//     }
// })

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
		Meteor.call("hipHopVideos", function (error, result) { 
			console.log(result);
			Session.set('videos', result);
			Session.set('videoId', result[0].videoId);
			renderVid(result[0].videoId);
		});
		Session.set('selectedGenre', 'Hip Hop');
	},
	'click .interviewVideos': function() {
		Meteor.call("interviews", function (error, result) { 
			Session.set('videos', result);
			Session.set('videoId', result[0].videoId);
			renderVid(result[0].videoId);
		});
		Session.set('selectedGenre', 'Interviews');
	},
	'click .liveVideos': function() {
		Meteor.call("live", function (error, result) { 
			Session.set('videos', result);
			Session.set('videoId', result[0].videoId);
			renderVid(result[0].videoId);
		});
		Session.set('selectedGenre', 'Live');
	},
	'click .electronicVideos': function() {
		Meteor.call("electronic", function (error, result) { 
			Session.set('videos', result);
			Session.set('videoId', result[0].videoId);
			renderVid(result[0].videoId);
		});
		Session.set('selectedGenre', 'Electronic');
	}
});

Template.header.events({
    "click .playButton": function () {
		if(Session.equals("stateImage",playButton)){
			video.play();
			Session.set('stateImage', pauseButton);
		}else{
			video.pause();
			Session.set('stateImage', playButtonn);
		}
    }
  });

Template.header.helpers({
	stateImage: function () {
		return Session.get("stateImage");
	}
});

Template.body.helpers({
	video: function () {
		console.log( Session.get('videoId'));
		return Session.get('videoId') != null;
	}
});

Template.gridThumbs.helpers({
	videos: function () {
		return Session.get('videos');
    },
    isSelected: function () {
  		return Session.equals("videoId", this.videoId) ? "selected" : '';
	}
});

Template.gridThumbs.events({
    "click .single": function () {
      	Session.set('videoId', this.videoId);
		renderVid(this.videoId);
    }
  });

var renderVid = function(videoId) {
	if(video != null){
  		video.destroy();
	}
	console.log(videoId);
	Session.set("stateImage",pauseButton);
	video = Popcorn.smart('#youtube-video', 'http://www.youtube.com/embed/' + videoId + '&html5=1');
	 //video = Popcorn.youtube('#youtube-video', 'http://www.youtube.com/embed/' + videoId);
	video.play();
	video.on("playing", function() {
		Session.set("stateImage",pauseButton);
	});
	video.on("pause", function() {
		Session.set("stateImage",playButton);
	});
	video.on("ended", function() {
	    playlist = Session.get('videos');
	    console.log(playlist);
	    var i = 0;
	    for(current in playlist){
	    	console.log("[" + playlist[current].videoId + "]");

	    	if(playlist[current].videoId == Session.get('videoId')){
	    		console.log("Found this video: " + playlist[current].videoId + ", Next Vid: " + playlist[i + 1].videoId);
	    		if(playlist.length <= i + 1){
	    			Session.set('videoId', playlist[0].videoId);
	    			renderVid(playlist[0].videoId);
	    		}else{
	    			//console.log(playlist[i])
	    			var newID = playlist[i + 1].videoId
	    			Session.set('videoId', newID);
	    			renderVid(newID);
	    		}
	    	}
	    	i++;
	    }
	    Session.set('videos', playlist);
	});
};