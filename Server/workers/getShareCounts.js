var	request = require('request-enhanced'),
	db = require("./../db"),
	_ = require('lodash');

var vidlength, done = 0;
var refreshShareCounts = function() {
	console.log('refreshShareCounts')
	db.videos.find({ }, function(err, videos) {
		if (err)
			console.log(err);
		else {
			vidlength = videos.length;
			_.forEach(videos, getShareCounts);
		}
	});
}

var getShareCounts = function(video, index) {
	request.get({
		url: 'https://free.sharedcount.com/url?url=https://www.youtube.com/watch?v=' + video.videoId + '&apikey=e420ebc7ae101c3055a305fa522d65b9075c2edb',
		maxAttempts:3,
		pool: {maxSockets: 10}
	}, function(error, response){
		if(!error){
			db.videos.update({ videoId : video.videoId }, {$set: {
				shareCounts : JSON.parse(response)
			}});
		} 
		done++;
		if(vidlength == done) {
			process.exit();
		}
	});
}

refreshShareCounts();