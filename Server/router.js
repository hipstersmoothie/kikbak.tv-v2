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

	app.get('/emerging', function (req, res) {
		getEm(req, res, wonderRank.hipsterSort);
	});

	function getGenre(req, res, genre, exclude) {
		db.videos.find({
			$and: [
				{ title: { $not: blockedTitles } }, //live
				{ publishedBy: { $not: blockedPublished } }, //interviews
				{ tags : 
					{$in: genre}
				},
				{ tags : 
					{$nin : exclude}
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
		getGenre(req, res, ["Hip Hop"], ["Live", "Interview", "Trailer", "NotAVid"])
	});

	app.get('/indie', function (req, res) {
		getGenre(req, res, ["Indie"], ["Metal", "Pop", "Live", "Interview", "Trailer", "NotAVid"])
	});

	app.get('/electronic', function (req, res) {
		getGenre(req, res, ["Electronic"], ["Live", "Interview", "Trailer", "NotAVid"])
	});

	app.get('/rock', function (req, res) {
		getGenre(req, res, ["Rock", "Metal"], ["Live", "Interview", "Trailer", "NotAVid"])
	});
	
	app.get('/allstars', function (req, res) {
		db.videos.find({
			$and: [
				{ title: { $not: /(?=2015)(?=Boiler Room)/ } },
				{ tags : 
					{$nin : ["Interview", "Trailer", "NotAVid"]}
				}
			]
		}, 
		function(err, videos) {
			if(videos) {
				wonderRank.topSort(videos);
				res.send(videos.splice(0,100));
			}
		});
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
				console.log(blogs[0])
				var index = blogs[0].url.indexOf('feed/') > -1 ? blogs[0].url.indexOf('feed/') : blogs[0].url.indexOf('rss/');
				
				db.blogs.find({
					url: new RegExp(extractDomain(blogs[0].url))
				}, function(err, videosDups) {
					console.log(videosDups)
					res.render('picker', {
						dups: videosDups,
						url: blogs[0].url,
						urlNoRss: blogs[0].url.substring(0, index),
						id: blogs[0]._id
					}); 
					console.log(blogs[0].url)
				});	
			});
		});

		function extractDomain(url) {
		    var domain;
		    //find & remove protocol (http, ftp, etc.) and get domain
		    if (url.indexOf("://") > -1) {
		        domain = url.split('/')[2];
		    }
		    else {
		        domain = url.split('/')[0];
		    }

		    //find & remove port number
		    domain = domain.split(':')[0];

		    return domain;
		}

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
					db.blogs.update({_id:new mongo.ObjectID(req.params.id)},{$set: {url:newUrl}}, function() {
						res.send(false,true)
					});
				}
				
			})
		});

		app.use(express.json());       // to support JSON-encoded bodies
		app.use(express.urlencoded()); // to support URL-encoded bodies
		app.post('/blogs/:id/update_url/:newUrl', function (req, res) {
			db.blogs.update({_id:new mongo.ObjectID(req.params.id)}, {$set: {url:req.params.newUrl}}, function(error, result) {
				res.send(false,true)
			});
		});

		app.get('/bucket/:tag', function (req, res) {
			db.buckets.findOne({ tag: req.params.tag }, function(err, bucket) {	
				var dictionary = {};
				var subtractedKeywords = _.difference(bucket.keywords, bucket.entities);
				subtractedKeywords = _.difference(subtractedKeywords, bucket.approvedKeywords);
				var nodupes = _.uniq(subtractedKeywords, false);
		
				_.forEach(subtractedKeywords, function(index) {
					if(dictionary[index] === undefined) dictionary[index] = 0;
					dictionary[index]++;
				});

				bySortedValue(dictionary, function(tuples) {
					res.render('bucket', {
						bucket: req.params.tag,
						keywords: tuples,
						approvedKeywords: bucket.approvedKeywords
					}); 
				});			
			});
		});

		function bySortedValue(obj, callback, context) {
		    var tuples = [];

		    for (var key in obj) tuples.push([key, obj[key]]);

		    tuples.sort(function(a, b) { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0 });
			callback(tuples);
		}	

		app.post('/buckets/:tag/moveKeywords/:keywords', function (req, res) {
			var moveKeywords = req.params.keywords.split(',');
			console.log(req.params)
			db.buckets.update({ tag : req.params.tag }, {
				$addToSet : { approvedKeywords: {$each : moveKeywords} }
			}, function(err, result) {
				console.log(err, result)
				res.send(false,true)
			})
		});
	}
	
	return app;
}

module.exports = startExpress;