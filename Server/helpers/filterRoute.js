var db = require("./db"),
	blockRegex = require('./blockRegex'),
	blockedTitles = blockRegex.titles,
	blockedPublished = blockRegex.publishers,
	analyzePost = require('./alchemyHelper'),
	_ = require('lodash'),
	wonderRank = require('./wonderRank');

function analyzePosts(sort, callback) {
	db.videos.find({
		$and: [
			{ title: { $not: blockedTitles } }, //live
			{ publishedBy: { $not: blockedPublished } }, //interviews
			{ tags : {$nin : ["Live", "Interview", "Trailer", "NotAVid"]}}
		]
	}, function(err, videos) {
		if(videos) {
			sort(videos);
			videos = videos.splice(0,100);
			_.forEach(videos, function(video) {
				analyzePost(video.origPosts[0], function(tag) {
					if (tag) {
						console.log('tagged https://www.youtube.com/watch?v=' + video.videoId + ' ' + tag);
						db.videos.update({videoId: video.videoId}, {$addToSet:{tags:tag}})
					}
				})
			});
		}
	});
}

analyzePosts(wonderRank.hipsterSort)