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
	db.videos.find({tags : {$nin : ["Live", "Interview"]}}, function(err, videos) {
		var buffer = "";
		sort(videos)

		buffer += '<html><body>';
		_.forEach(videos.splice(0,40), function(video) {
			buffer += '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + video.videoId + '" frameborder="0" allowfullscreen></iframe>'
			//buffer += '<div><h1>' + video.title + '</h1><img src="' + video.thumbnail.medium.url + '"</div>';
		});
		buffer += '<body></html>';

		res.send(buffer);
	});
});

var multiplier = function(days) {
	//console.log(days);
	if (days <= 1)
		return 50;
	else if (days <= 2)
		return 20;
	else if (days <= 3)
		return 10;
	else if (days <= 7)
		return 7;
	if (days < 31)
		return 6;
	else if (days < 50)
		return 4;
	else if (days < 150)
		return 0.1;
	else if (days < 365)
		return -1;
	else if (days < 600)
		return -2;
	else
		return 0.50;
}

var viewMultiplier = function(views, days) {
	if (views > 1500)
		return 3;
	else if (views > 500)
		return 2;
	else if (views > 100)
		return 1.5;
	else
		return 1;
}

var ratioMetric = function(views, likes) {
	var ratio = likes / views;
	if(views < 500)
		return 1;
	else if(ratio > 0.30)
		return 4;
	else if(ratio > 0.20)
		return 3;
	else if(ratio > 0.15)
		return 2;

}

var sort = function(videos) {
	var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7;
	videos.sort(function(a, b) {
		var date1 = (Date.now() - Date.parse(a.youTubePostDate))/day
		var date2 = (Date.now() - Date.parse(b.youTubePostDate))/day
		var adg1 = multiplier(date1);
		var adg2 = multiplier(date2);
		var viewMultiplier1 = viewMultiplier(a.avgViewPerHalfHour, date1);
		var viewMultiplier2 = viewMultiplier(a.avgViewPerHalfHour, date2);
		var metric1 = ratioMetric(a.oldStats.viewCount, a.oldStats.likeCount);
		var metric2 =ratioMetric(b.oldStats.viewCount, b.oldStats.likeCount);
		return (a.foundOn.length * adg1 * viewMultiplier1  * metric1) - (b.foundOn.length * adg2 * viewMultiplier2 *metric2);
	}).reverse();
}

app.get('/videos', function (req, res) {
	db.videos.find({tags : {$nin : ["Live", "Interview", "Trailer"]}}, function(err, videos) {
		console.log('newVids');
		sort(videos);
		res.send(videos.splice(0,100));
	});
});

app.get('/videos-hip-hop', function (req, res) {
	db.videos.find({tags: {$nin : ["Live", "Interview", "Trailer"], $in: ["Hip Hop"]}}, function(err, videos) {
		sort(videos);
		res.send(videos.splice(0,100));
	});
});

app.get('/electronic', function (req, res) {
	db.videos.find({tags: {$nin : ["Live", "Interview", "Trailer"], $in: ["Electonic"]}}, function(err, videos) {
		sort(videos);
		res.send(videos.splice(0,100));
	});
});

app.get('/interviews', function (req, res) {
	db.videos.find({tags: "Interview"}, function(err, videos) {
		sort(videos);
		res.send(videos.splice(0,100));
	});
});

app.get('/live', function (req, res) {
	db.videos.find({tags: {$nin : ["Music Video", "Trailer"], $in: ["Live"]}}, function(err, videos) {
		sort(videos);
		res.send(videos.splice(0,100));
	});
});

app.get('/trailers', function (req, res) {
	db.videos.find({tags: "Trailer"}, function(err, videos) {
		sort(videos);
		res.send(videos.splice(0,100));
	});
});

var youTube = new YouTube();
youTube.setKey('AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg');
 
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  compileVideos();
});


var blogs;

var compileVideos = function() {
	//db.videos.remove();
	var minutes = 30, the_interval = minutes * 60 * 1000;
	db.blogs.find({ }, function(err, myBlogs) {
		blogs = myBlogs;
		refreshData();
		setInterval(refreshData, the_interval);
	})
}

var refreshData = function() {
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
		if(err) {
			console.log('parseFeed', url, err);
		}
  	else {
  		_.forEach(posts, _.bind(getHtml, null, _, url));
  	}
  });
}

var getTag = function(html, $, youTubeDescription, title, uploader) {
	var tags = [];
	if (html.each) {
		html.each(function(i, el) {
			var text = $(this).text().toLowerCase();
			if(text.indexOf(' rapper') > -1 || text.indexOf(' rapping') > -1 
				|| text.indexOf('hip-hop') > -1 || text.indexOf('rap') > -1) {
				tags = _.union(tags, ["Hip Hop"])
			} 
			if (text.indexOf(' edm') > -1 || text.indexOf(' electonic') > -1 || 
				youTubeDescription.toLowerCase().indexOf('electonic') > -1 || youTubeDescription.toLowerCase().indexOf(' edm') > -1) {
				tags = _.union(tags, ["Electonic"]);
			}
			if (text.indexOf('interview') > -1 || text.indexOf('Interview') > -1 || title.toLowerCase() == "SwaysUniverse")
				tags = _.union(tags, ["Interview"]);
			if (text.indexOf(' live') > -1 || youTubeDescription.toLowerCase().indexOf(' live') > -1
				|| title.toLowerCase().indexOf(' live') > -1 || title.toLowerCase().indexOf(' bbc') > -1 || title.toLowerCase().indexOf('2015')
				|| title.toLowerCase().indexOf('american idol') > -1 || uploader == 'MTV' || uploader == 'timwestwoodtv'
				|| title.toLowerCase().indexOf('jimmy fallon') > -1 || uploader == 'BBC Radio 1'|| title.toLowerCase().indexOf('boiler room') > -1) {
				tags = _.union(tags, ["Live"]);
			}
			if (title.toLowerCase().indexOf('official video') > -1 || title.toLowerCase().indexOf('music video') > -1) {
				tags = _.union(tags, ["Music Video"]);
			}
		});
	}
	return tags;
}

var tagVideo = function(vidId, html, $) {
	youTube.getById(vidId, function(error, result) {
		if(!error) {
			var tags;
			if(result && result['items'] && result['items'][0] && result['items'][0]['snippet'])
				tags = getTag(html, $, result['items'][0]['snippet']['description'], result['items'][0]['snippet']['title'], result['items'][0]['snippet']['channelTitle']);
			else
				tags = getTag(html, $, '', '', '');
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
			if(video.length > 0){
	  		updateVid(video, blog, vidId, $);
			}
	  	else {
		    newVid(vidId, url, blog, $);
	  	}
	  }
  });
}

var updateVid = function(vidList, blog, vidId, $) {
	video = vidList[0];
	var foundUrls = _.map(video.foundOn, function(url) { return url.url });
	if (!_.includes(foundUrls, blog.url)) {
		console.log('updating', video.title, video.foundOn, blog);
		var tags = getTag($('p'), $, "", "", "");
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
				  tags : [getTag($('p'), $, result['items'][0]['snippet']['description'], result['items'][0]['snippet']['title'], result['items'][0]['snippet']['channelTitle'])]
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
	request(post.link, function(error, response, html){
    // First we'll check to make sure no errors occurred when making the request
    if(!error){
      // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionalit
      var $ = cheerio.load(html);
      handlePost($, blog);
  	}
  })
}

