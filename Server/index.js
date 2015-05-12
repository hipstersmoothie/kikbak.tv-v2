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
    YouTube = require('youtube-node'),
    hypeBlogs = require('./blogs');
 
var app = express();
app.set('port', process.env.PORT || 4000); 
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
  res.send('<html><body><h1>Hello World</h1></body></html>');
});

app.get('/videosList', function (req, res) {
	db.videos.find(function(err, videos) {
		var buffer = "";
		videos.sort(function(a, b) {
			return a.foundOn.length - b.foundOn.length
		}).reverse();

		buffer += '<html><body>';
		_.forEach(videos.splice(0,20), function(video) {
			buffer += '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + video.videoId + '" frameborder="0" allowfullscreen></iframe>'
			//buffer += '<div><h1>' + video.title + '</h1><img src="' + video.thumbnail.medium.url + '"</div>';
		});
		buffer += '<body></html>';

		res.send(buffer);
	});
});

app.get('/videos', function (req, res) {
	db.videos.find(function(err, videos) {
		videos.sort(function(a, b) {
			return a.foundOn.length - b.foundOn.length
		}).reverse();

		res.send(videos);
	});
});

var youTube = new YouTube();
youTube.setKey('AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg');
 
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  compileVideos();
  //compileBlogs();
});

var blogs;

var compileVideos = function() {
	//db.videos.remove();
	var minutes = 10, the_interval = minutes * 30 * 1000;
	db.blogs.find({ }, function(err, myBlogs) {
		blogs = myBlogs;
		refreshData();
		setInterval(refreshData, the_interval);
	})
}

var compileBlogs = function() {
 	_.forEach(hypeBlogs, _.bind(testUrl, null, _, endings));
}

var clearWordpress = function() {
 	_.forEach(blogs,function(blog) {
 		if(blog.url.indexOf('wordpress') > -1) {
 			db.blogs.remove({url : blog.url});
 		}
 	});
}

var endings = [
	'video/feed/',
	'videos/feed/',
	'category/video/feed/',
	'category/videos/feed/',
	'videos/rss',
	'feed/'
];

var testUrl = function(url, endings) {
	if (endings.length == 0)
		return;

	var str = url.siteurl[url.siteurl.length - 1] == '/' ? url.siteurl + _.first(endings) : url.siteurl + '/' + _.first(endings)
	parser(str, function(err, posts) {
		if(!err) {
			db.blogs.update({url: str}, {$setOnInsert : {
				url : str
			}}, {upsert : true});
		} else {
			testUrl(url, _.rest(endings));
		}
  });
}

var refreshData = function() {
	console.log('pulling');
	_.forEach(blogs, parseFeed);
	_.delay(updateStatsForAllVids, 10000)
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

var handlePost = function($, blog) {
	var iframes = $('iframe');
	_.forEach(iframes, function(iframe) {
		if(iframe.attribs.src && iframe.attribs.src.indexOf('youtu') > -1)
			 addToDb(iframe.attribs.src, blog);
	});
}

var addToDb = function(url, blog) {
	var vidId = getYouTubeID(url);
  db.videos.find({ videoId : vidId }, function(err, video) {  
	  if (err) {
	    console.log('addToDb', err);
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
	var foundUrls = _.map(video.foundOn, function(url) { return url.url });
	if (!_.includes(foundUrls, blog.url)) {
		console.log('updating', video.title, video.foundOn, blog);
		video.foundOn.push(blog);
    db.videos.update({ videoId : vidId }, {$set: {
      foundOn : video.foundOn
    }});
	}
}

var newVid = function(vidId, url, blog) {
	youTube.getById(vidId, function(error, result) {
		if(result && result['items'] && result['items'].length > 0) {// && (result['items'][0]['snippet']['title'].indexOf('Trailer') == -1 || result['items'][0]['snippet']['title'].indexOf('music') != -1) //weirdness to remove trailers
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
				  avgCommentPerHalfHour : 0 
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
	request(post.link, function(error, response, html){
    // First we'll check to make sure no errors occurred when making the request
    if(!error){
      // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionalit
      var $ = cheerio.load(html);
      handlePost($, blog);
  	}
  })
}

