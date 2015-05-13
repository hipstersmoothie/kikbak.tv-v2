Session.setDefault('videoId', null);
Session.setDefault('stateImage', 'playButton.png');
var video = null, playButton = "playButton.png", pauseButton = "pauseButton.png";


Template.youtubePlayer.rendered = function () {
	console.log("Rendered");
    //enderVid(Session.get('videoId'));

    // Session.set("youtubePlayer", video);
}

// Template.youtubePlayer.helpers({
// 	setVideo: function () {
// 		console.log('loading video..');
// 		video = Popcorn.youtube('#youtube-video', 'http://www.youtube.com/embed/' + Session.get('videoId'));
// 		return;
//     }
// })
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
		Meteor.call("videos", function (error, result) { 
			Session.set('videos', result);
			Session.set('videoId', result[0].videoId);
			renderVid(result[0].videoId);
		});
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
	// video = Popcorn.youtube('#youtube-video', 'http://www.youtube.com/embed/' + videoId);
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
	    			Session.set('videoId', playlist[i + 1].videoId);
	    			renderVid(playlist[i + 1].videoId);
	    		}
	    	}
	    	i++;
	    }
	    Session.set('videos', playlist);
	});
};