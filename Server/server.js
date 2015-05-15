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
    router = require('./router');
 
var youTube = new YouTube();
youTube.setKey('AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg');
var app = router();
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  compileVideos();
});

var compileVideos = function() {
	var minutes = 30, the_interval = minutes * 60 * 1000;
	db.blogs.find({ }, function(err, myBlogs) {
		refreshData(myBlogs);
		setInterval(_.bind(refreshData, null, myBlogs), the_interval);
	})
}

var refreshData = function(blogs) {
	console.log('pulling');
	_.forEach(blogs, parseFeed);
	_.delay(updateStatsForAllVids, 15000)
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

var handlePost = function($, blog) {
	var iframes = $('iframe');

	_.forEach(iframes, function(iframe) {
		if(iframe.attribs.src && iframe.attribs.src.indexOf('youtu') > -1) {
			tagVideo(getYouTubeID(iframe.attribs.src), $('p'), $, "")
			addToDb(iframe.attribs.src, blog, $);
		}
	});
}

var addToDb = function(url, blog, $) {
	var vidId = getYouTubeID(url);
  db.videos.find({ videoId : vidId }, function(err, video) {  
	  if (err) {
	    console.log('addToDb', err);
	  } else {
			if (video.length > 0)
	  		updateVid(video, blog, vidId, $);
	  	else
		    newVid(vidId, url, blog, $);
	  }
  });
}

var updateVid = function(vidList, blog, vidId, $) {
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
	}
}

var newVid = function(vidId, url, blog, $) {
	youTube.getById(vidId, function(error, result) {
		if(result && result['items'] && result['items'].length > 0 
			&& result['items'][0]['snippet']['title'].toLowerCase().indexOf('official audio') == -1 
			&& result['items'][0]['snippet']['title'].toLowerCase().indexOf('(audio)') == -1 
			&& result['items'][0]['snippet']['title'].toLowerCase().indexOf('[audio]') == -1 
			&& result['items'][0]['snippet']['channelTitle'] != 'AllHipHopTV') {// && (result['items'][0]['snippet']['title'].indexOf('Trailer') == -1 || result['items'][0]['snippet']['title'].indexOf('music') != -1) //weirdness to remove trailers
			console.log('adding', url, vidId); 
			
			db.videos.update({ videoId : vidId }, {
		    $setOnInsert: {
		    	videoId : vidId,
				  foundOn : [blog],
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
				  avgCommentPerHalfHour : 0,
				  tags : [getTags($('p'), $, result['items'][0]['snippet']['description'], result['items'][0]['snippet']['title'], result['items'][0]['snippet']['channelTitle'])]
		    }
		  }, { upsert : true });
		}
	});
}

var updateStats = function(video) {
	var vidId = video.videoId;
	youTube.getById(vidId, function(error, result) {
		if(result && result['items'] && result['items'][0]) {
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
      handlePost($, blog);
  	} else {
  		console.log("getHtml", blog, post.link, error);
  	}
  })
}