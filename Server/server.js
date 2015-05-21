var http = require('http'),
		db = require("./db"),
		_ = require('lodash'),
		parser = require('parse-rss'),
		request = require('request-enhanced'),
		cheerio = require('cheerio'),
		getYouTubeID = require('get-youtube-id'),
		youtubeThumbnail = require('youtube-thumbnail'),
		YouTube = require('youtube-node'),
		getTags = require('./getTags'),
		router = require('./router'),
		schedule = require('node-schedule');
 
var youTube = new YouTube();
var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7, OLDVIDEOMAXDAYS = 150;
youTube.setKey('AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg');
var app = router();
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
	startScheduler();
});

var startScheduler = function() {
	var scrapeBlogs = new schedule.RecurrenceRule();
	scrapeBlogs.minute = [29, 59];
	scrapeBlogs.hour = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 , 20];
	var j = schedule.scheduleJob(scrapeBlogs, refreshBlogsFeeds);

	var updateYoutubeData = new schedule.RecurrenceRule();
	updateYoutubeData.minute = [14, 44];
	updateYoutubeData.hour = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 , 20];
	var i = schedule.scheduleJob(updateYoutubeData, updateStatsForAllVids);

	var updateShareCounts = new schedule.RecurrenceRule();
	updateShareCounts.hour = [8, 16];
	var i = schedule.scheduleJob(updateShareCounts, refreshShareCounts);
}

var refreshBlogsFeeds = function() {
	console.log('Finding new videos...');
	db.blogs.find({ }, function(err, blogs) {
		_.forEach(blogs, parseFeed);
	});
}

var refreshShareCounts = function() {
	db.videos.find({ }, function(err, videos) {
		if (err)
			console.log(err);
		else 
			_.forEach(videos, getShareCounts);
	});
}

var getShareCounts = function(video) {
	request.get({
		url: 'https://free.sharedcount.com/url?url=https://www.youtube.com/watch?v=' + video.videoId + '&apikey=e420ebc7ae101c3055a305fa522d65b9075c2edb'
	}, function(error, response){
		if(!error){
			db.videos.update({ videoId : video.videoId }, {$set: {
				shareCounts : JSON.parse(response)
			}});
		} 
	})
}

var updateStatsForAllVids = function() {
	db.videos.find({ }, function(err, videos) {  	
		if (err)
			console.log(err);
		else 
			_.forEach(videos, updateStats);
	});
}

var parseFeed = function(url) {
	parser(url, function(err, posts) {
		if(err)
			console.log('parseFeed', url, err);
		else 
			_.forEach(posts, _.bind(getHtml, null, _, url));
	});
}

var tagVideo = function(vidId, html, $) {
	youTube.getById(vidId, function(error, result) {
		if(!error) {
			var tags;
			if(result && result['items'] && result['items'][0] && result['items'][0]['snippet'])
				tags = getTags(html, $, result['items'][0]['snippet']['description'], result['items'][0]['snippet']['title'], result['items'][0]['snippet']['channelTitle']);
			else
				tags = getTags(html, $, '', '', '');
			db.videos.update({ videoId : vidId }, {$addToSet: {
				tags : {$each:tags}
			}});
		}
	});
}

var handlePost = function($, blog, link) {
	var iframes = $('iframe');

	_.forEach(iframes, function(iframe) {
		if(iframe.attribs.src && iframe.attribs.src.indexOf('youtu') > -1) {
			tagVideo(getYouTubeID(iframe.attribs.src), $('p'), $, "")
			addToDb(iframe.attribs.src, blog, $, link);
		}
	});
}

var addToDb = function(url, blog, $, link) {
	var vidId = getYouTubeID(url);
	db.videos.find({ videoId : vidId }, function(err, video) {  
		if (err) {
			console.log('addToDb', err);
		} else {
			if (video.length > 0)
				updateVid(video, blog, vidId, $, link);
			else
				newVid(vidId, url, blog, $, link);
		}
	});
}

var updateVid = function(vidList, blog, vidId, $, link) {
	video = vidList[0];
	var foundUrls = _.map(video.foundOn, function(url) { return url.url });
	if (!_.includes(foundUrls, blog.url)) {
		console.log('updating', video.title, video.foundOn, blog);
		var tags = getTags($('p'), $, "", "", "");
		db.videos.update({ videoId : vidId }, {
			$addToSet: {
				foundOn : blog
			}
		});
		db.videos.update({ videoId : vidId }, {$addToSet: {
			tags : {$each:tags}
		}});
		db.videos.update({ videoId : vidId }, {$addToSet: {
			origPosts : link
		}});
	}
}

var newVid = function(vidId, url, blog, $, url) {
	youTube.getById(vidId, function(error, result) {
		if(result && result['items'] && result['items'].length > 0 
			&& result['items'][0]['snippet']['title'].toLowerCase().indexOf('official audio') == -1 
			&& result['items'][0]['snippet']['title'].toLowerCase().indexOf('(audio)') == -1 
			&& result['items'][0]['snippet']['title'].toLowerCase().indexOf('[audio]') == -1 
			&& result['items'][0]['snippet']['channelTitle'] != 'AllHipHopTV') {
			if ((Date.now() - Date.parse(result['items'][0]['snippet']['publishedAt']))/day > OLDVIDEOMAXDAYS)//dont add old videos
				return;
			
			console.log('adding', url, vidId, (Date.now() - Date.parse(result['items'][0]['snippet']['publishedAt']))/day); 
			db.videos.update({ videoId : vidId }, {
				$setOnInsert: {
					youTubePostDate : result['items'][0]['snippet']['publishedAt'],
					videoId : vidId,
					foundOn : [blog],
					origPosts : [link],
					dateFound : _.now(),
					thumbnail : youtubeThumbnail(url),
					title : result['items'][0]['snippet']['title'],
					description : result['items'][0]['snippet']['description'],
					publishedBy : result['items'][0]['snippet']['channelTitle'],
					oldStats : result['items'][0]['statistics'],
					avgViewPerHalfHour : 0,
					avgLikePerHalfHour : 0,
					avgDislikePerHalfHour : 0,
					avgFavoritePerHalfHour : 0,
					avgCommentPerHalfHour : 0
				},
				$addToSet: {
					tags : {
						$each: getTags($('p'), $, result['items'][0]['snippet']['description'], result['items'][0]['snippet']['title'], result['items'][0]['snippet']['channelTitle'])
					}
				}
			}, { upsert : true });
		}
	});
}

var updateStats = function(video) {
	var vidId = video.videoId;
	youTube.getById(vidId, function(error, result) {
		if(result && result['items'] && result['items'][0]) {
			if ((Date.now() - Date.parse(result['items'][0]['snippet']['publishedAt']))/day > OLDVIDEOMAXDAYS) {
				db.videos.remove({ videoId : vidId });
				console.log('removed', vidId, (Date.now() - Date.parse(result['items'][0]['snippet']['publishedAt']))/day);
				return;
			}

			var oldStats = video.oldStats;
			var newStats = result['items'][0]['statistics'];
			var newViews = (parseInt(newStats.viewCount) - parseInt(oldStats.viewCount));
			var newLikes = (parseInt(newStats.likeCount) - parseInt(oldStats.likeCount));
			var newDislikes = (parseInt(newStats.dislikeCount) - parseInt(oldStats.dislikeCount));
			var newFavorites = (parseInt(newStats.favoriteCount) - parseInt(oldStats.favoriteCount));
			var newComments = (parseInt(newStats.commentCount) - parseInt(oldStats.commentCount));
			// console.log(parseInt(newStats.viewCount), '-', parseInt(oldStats.viewCount), '=', newViews, video.avgViewPerHalfHour, (video.avgViewPerHalfHour + newViews)/2)
			db.videos.update({ videoId : vidId }, {$set: {
				youTubePostDate : result['items'][0]['snippet']['publishedAt'],
				oldStats : newStats,
				avgViewPerHalfHour : video.avgViewPerHalfHour ? (video.avgViewPerHalfHour + newViews)/2 : newViews,
				avgLikePerHalfHour : video.avgLikePerHalfHour ? (video.avgLikePerHalfHour + newLikes)/2 : newLikes,
				avgDislikePerHalfHour : video.avgDislikePerHalfHour ? (video.avgDislikePerHalfHour + newDislikes)/2 : newDislikes,
				avgFavoritePerHalfHour : video.avgFavoritePerHalfHour ? (video.avgFavoritePerHalfHour + newFavorites)/2 : newFavorites,
				avgCommentPerHalfHour : video.avgCommentPerHalfHour ? (video.avgCommentPerHalfHour + newComments)/2 : newComments
			}});
		}
	});
}

var getHtml = function(post, blog) {
	request.get(post.link, function(error, response){
		// First we'll check to make sure no errors occurred when making the request
		if(!error){
			// Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionalit
			var $ = cheerio.load(response);
			handlePost($, blog, post.link);
		} else {
			//console.log("getHtml", blog, post.link, error);
		}
	});
}