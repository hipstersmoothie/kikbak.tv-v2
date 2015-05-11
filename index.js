var http = require('http'),
    express = require('express'),
    path = require('path'),
    db = require("./db"),
    _ = require('lodash'),
    parser = require('parse-rss'),
    request = require('request'),
    cheerio = require('cheerio'),
    getYouTubeID = require('get-youtube-id'),
    youtubeThumbnail = require('youtube-thumbnail'),
    YouTube = require('youtube-node');
 
var app = express();
app.set('port', process.env.PORT || 3000); 
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
  res.send('<html><body><h1>Hello World</h1></body></html>');
});

app.get('/videos', function (req, res) {
	db.videos.find(function(err, videos) {
		res.send('<html><body><h1>' + JSON.stringify(videos) + '</html>');
	});
});

var youTube = new YouTube();
youTube.setKey('AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg');
 
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  compileVideos();
});

var blogs = [
    'http://pigeonsandplanes.com/category/video-2/feed/',
    'http://www.stereogum.com/video/feed/',
    'http://www.gorillavsbear.net/category/video/feed/',
    'http://www.aquariumdrunkard.com/feed/',
    'http://assets.complex.com/feeds/channels/music.xml',
    'http://noisey.vice.com/videos/rss', 
    'http://www.fakeshoredrive.com/feed/',
    'http://drownedinsound.com/feed',
    'http://dancingastronaut.com/videos/feed/',
    'http://www.popjustice.com/videos/feed/',
    'http://www.youredm.com/feed/',
    'http://allhiphop.com/category/videos/feed/',
    'http://2dopeboyz.com/category/video/feed/',
    'http://www.factmag.com/feed/',
    'http://hypetrak.com/category/videos/feed/'
  ];

var compileVideos = function() {
	//db.videos.remove();
	_.forEach(blogs, parseFeed);
	_.delay(updateStatsForAllVids, 10000)
}

var updateStatsForAllVids = function() {
	//console.log('asdfasdfasdf')
	db.videos.find({ }, function(err, videos) {  	
	  if (err)
	    console.log(err);
	  else 
			_.forEach(videos, updateStats);
  });
}

var parseFeed = function(url) {
	parser(url, function(err, posts) {
  	_.forEach(posts, _.bind(getHtml, null, _, url));
  });
}

var handlePost = function($, blog) {
	var iframes = $('iframe');

	_.forEach(iframes, function(iframe) {
		if(iframe.attribs.src.indexOf('youtu') > -1)
			 addToDb(iframe.attribs.src, blog);
	});
}

var addToDb = function(url, blog) {
	var vidId = getYouTubeID(url);
  db.videos.find({ videoId : vidId }, function(err, video) {  
	  if (err) {
	    console.log(err);
	  } else {
			if(video.length > 0)
	  		updateVid(video, blog, vidId);
	  	else {
		    newVid(vidId, url, blog);
	  	}
	  }
  });
}

var updateVid = function(vidList, blog, vidId) {
	video = vidList[0];
	if (!_.includes(video.foundOn, blog)) {
		console.log('updating', video.foundOn, blog);
		video.foundOn.push(blog);
    db.videos.update({ videoId : vidId }, {$set: {
      foundOn : video.foundOn
    }});
  }
}

var newVid = function(vidId, url, blog) {
	youTube.getById(vidId, function(error, result) {
		if(result['items'].length > 0) {
			console.log('adding', url, vidId);
			db.videos.insert({
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
			  avgCommentPerHalfHour : 0
			});
		}
	});
}

var updateStats = function(video) {
	var vidId = video.videoId;
	youTube.getById(vidId, function(error, result) {
		var oldStats = video.oldStats;
		var newStats = result['items'][0]['statistics'];
		var newViews = (parseInt(newStats.viewCount) - parseInt(oldStats.viewCount));
		var newLikes = (parseInt(newStats.likeCount) - parseInt(oldStats.likeCount));
		var newDislikes = (parseInt(newStats.dislikeCount) - parseInt(oldStats.dislikeCount));
		var newFavorites = (parseInt(newStats.favoriteCount) - parseInt(oldStats.favoriteCount));
		var newComments = (parseInt(newStats.commentCount) - parseInt(oldStats.commentCount));

		db.videos.update({ videoId : vidId }, {$set: {
    	oldStats : newStats,
    	avgViewPerHalfHour : video.avgViewPerHalfHour ? (video.avgViewPerHalfHour + newViews)/2 : newViews,
    	avgLikePerHalfHour : video.avgLikePerHalfHour ? (video.avgLikePerHalfHour + newLikes)/2 : newLikes,
    	avgDislikePerHalfHour : video.avgDislikePerHalfHour ? (video.avgDislikePerHalfHour + newDislikes)/2 : newDislikes,
    	avgFavoritePerHalfHour : video.avgFavoritePerHalfHour ? (video.avgFavoritePerHalfHour + newFavorites)/2 : newFavorites,
    	avgCommentPerHalfHour : video.avgCommentPerHalfHour ? (video.avgCommentPerHalfHour + newComments)/2 : newComments
    }});
	});
}

var getHtml = function(post, blog) {
	request(post.link, function(error, response, html){
    // First we'll check to make sure no errors occurred when making the request
    if(!error){
      // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionalit
      var $ = cheerio.load(html);
      handlePost($, blog);
  	}
  })
}

