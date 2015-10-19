var express = require('express'),
    wonderRank = require('./helpers/wonderRank'),
    db = require("./helpers/db"),
	_ = require('lodash'),
	path = require('path');
var mongo = require('mongodb');
var blockRegex = require('./helpers/blockRegex');

var startExpress = function() {
	var app = express();
	var blockedTitles = blockRegex.titles;
	var blockedPublished = blockRegex.publishers;

	app.set('port', process.env.PORT || 5000); 
	app.use(express.static(path.join(__dirname, 'public')));
	app.get('/', function (req, res) {
	  res.send('<html><body><h1>API is up.</h1></body></html>');
	});

	app.get('/videosList', function (req, res) {
		db.videos.find({tags : {$nin : ["Live", "Interview"]}}, function(err, videos) {
			var buffer = "";
			wonderRank.defaultSort(videos)

			buffer += '<html><body>';
			_.forEach(videos.splice(0,40), function(video) {
				buffer += '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + video.videoId + '" frameborder="0" allowfullscreen></iframe>'
				//buffer += '<div><h1>' + video.title + '</h1><img src="' + video.thumbnail.medium.url + '"</div>';
			});
			buffer += '<body></html>';

			res.send(buffer);
		});
	});

	var getEm = function(req, res, sort) {
		db.videos.find({
			$and: [
				{ title: { $not: blockedTitles } }, //live
				{ publishedBy: { $not: blockedPublished } }, //interviews
				{ tags : {$nin : ["Live", "Interview", "Trailer", "NotAVid"]}}
			]
		}, function(err, videos) {
			if(videos) {
				sort(videos);
				res.send(videos.splice(0,100));
			}
		});
	}

	app.get('/videos', function (req, res) {
		getEm(req, res, wonderRank.defaultSort)
	});

	function getGenre(req, res, genre) {
		db.videos.find({
			$and: [
				{ title: { $not: blockedTitles } }, //live
				{ publishedBy: { $not: blockedPublished } }, //interviews
				{ tags : 
					{$in: [genre]}
				},
				{ tags : 
					{$nin : ["Live", "Interview", "Trailer", "NotAVid"]}
				}
			]
		}, function(err, videos) {
			if(videos) {
				wonderRank.defaultSort(videos);
				res.send(videos.splice(0,100));
			}
		});
	}

	app.get('/hiphop', function (req, res) {
		getGenre(req, res, "Hip Hop")
	});

	app.get('/indie', function (req, res) {
		getGenre(req, res, "Indie")
	});

	app.get('/electronic', function (req, res) {
		getGenre(req, res, "Electronic")
	});
	
	app.get('/allstars', function (req, res) {
		db.videos.find({
			title: { $not: /(?=2015)(?=Boiler Room)/ }
		}, 
		function(err, videos) {
			if(videos) {
				wonderRank.topSort(videos);
				res.send(videos.splice(0,100));
			}
		});
	});

	app.get('/emerging', function (req, res) {
		getEm(req, res, wonderRank.hipsterSort);
	});

	app.get('/live', function (req, res) {
		db.videos.find({tags: {$nin : ["Music Video", "Trailer"], $in: ["Interview", "Live"]}}, function(err, videos) {
			if(videos) {
				wonderRank.defaultSort(videos);
				res.send(videos.splice(0,100));
			}
		});
	});

	//These routes are for local dev only
	if (process && process.env && process.env.NODE_ENV === 'development') {
		app.put('/flag/:videoId', function (req, res) {
			var tag = req.query.tag;
			db.videos.update({videoId : req.params.videoId}, {$addToSet: {tags: {$each: ["NotAVid", tag]}}}, function(err, result) {
				if(result)
					res.send("Video Flagged");
			});
		});

		app.set('views', __dirname );
		app.set('view engine', 'jade');
		app.use(express.bodyParser());
		app.use(express.static(path.join(__dirname, '')));
		app.get('/classify', function (req, res) {
			db.blogs.find({
					$and: [
						{ $where: "!this.tested" },
						{ tags : { $in: ["Indie"] } }
					]
				}, function(err, blogs) {
					var index = blogs[0].url.indexOf('feed/') > -1 ? blogs[0].url.indexOf('feed/') : blogs[0].url.indexOf('rss/');
					res.render('picker', {
						url: blogs[0].url,
						urlNoRss: blogs[0].url.substring(0, index),
						id: blogs[0]._id
					});
					console.log(blogs[0].url)
			});
		});

		app.post('/blogs/tag/:id/:tag/', function (req, res) {
			db.blogs.update({_id:new mongo.ObjectID(req.params.id)},{$addToSet:{tags:req.params.tag}}, function(error, result) {
				res.send(error,result)
			})
		});

		app.post('/blogs/:id/delete/', function (req, res) {
			db.blogs.remove({_id:new mongo.ObjectID(req.params.id)}, function(error, result) {
				res.send(false,true)
			})
		});

		app.post('/blogs/:id/verify/', function (req, res) {
			db.blogs.update({_id:new mongo.ObjectID(req.params.id)}, {$set: {tested:true}}, function(error, result) {
				res.send(false,true)
			})
		});

		app.post('/blogs/:id/tumblr/', function (req, res) {
			// var newUrl = req.params.url.split('/feed')[0] + '/rss/'; , {$set: {url:newUrl}},
			db.blogs.findOne({_id:new mongo.ObjectID(req.params.id)}, function(error, result) {
				if(result.url.indexOf('/feed') > -1) {
					var newUrl = result.url.split('/feed')[0] + '/rss/';
							console.log(newUrl)

					db.blogs.update({_id:new mongo.ObjectID(req.params.id)},{$set: {url:newUrl}}, function() {
						res.send(false,true)
					});
				}
				
			})
		});
	}
	
	return app;
}

module.exports = startExpress;