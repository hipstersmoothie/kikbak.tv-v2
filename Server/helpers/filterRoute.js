var db = require("./db"),
	blockRegex = require('./blockRegex'),
	blockedTitles = blockRegex.titles,
	blockedPublished = blockRegex.publishers,
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
			var i = 0;
			videos = videos.splice(0,100);
			var inter = setInterval(function() {
				if(i === videos.length)
					return clearInterval(inter);

				var video = videos[i++]
			}, 500)
		}
	});
}

analyzePosts(wonderRank.defaultSort)
