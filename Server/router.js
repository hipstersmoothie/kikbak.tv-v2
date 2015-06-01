var express = require('express'),
    wonderRank = require('./helpers/wonderRank'),
    db = require("./helpers/db"),
	_ = require('lodash'),
	path = require('path');

var startExpress = function() {
	var app = express();
	var blockedTitles = /2015|Boiler Room|Trailer|BBC|Red Bull Session|Lip Sync Battle|\/15|SKEE TV|Official Movie/;
	var blockedPublished = /SwaysUniverse|HOT 97|djvlad|Hawk Media Vision|BBC|Chart Attack|Concert Daily|LiveMusiChannel|MONTREALITY|TODAY/;

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

	app.get('/videos', function (req, res) {
		db.videos.find({
			$and: [
				{ title: { $not: blockedTitles } }, //live
				{ publishedBy: { $not: blockedPublished } } //interviews
			]
		}, 
		function(err, videos) {
			console.log('newVids');
			if(videos) {
				wonderRank.defaultSort(videos);
				res.send(videos.splice(0,100));
			}
		});
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
		db.videos.find({
			$and: [
				{ title: { $not: blockedTitles } }, //live
				{ publishedBy: { $not: blockedPublished } }, //interviews
				{tags : {$nin : ["Live", "Interview", "Trailer"]}}
			]
		}, function(err, videos) {
			if(videos) {
				wonderRank.hipsterSort(videos);
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
	
	return app;
}

module.exports = startExpress;