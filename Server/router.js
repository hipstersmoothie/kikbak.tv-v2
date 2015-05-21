var express = require('express'),
    wonderRank = require('./wonderRank'),
    db = require("./db"),
	_ = require('lodash'),
	path = require('path');

var startExpress = function() {
	var app = express();

	app.set('port', process.env.PORT || 5000); 
	app.use(express.static(path.join(__dirname, 'public')));
	app.get('/', function (req, res) {
	  res.send('<html><body><h1>Hello World</h1></body></html>');
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
		db.videos.find({tags : {$nin : ["Live", "Interview", "Trailer"]}}, function(err, videos) {
			console.log('newVids');
			wonderRank.defaultSort(videos);
			res.send(videos.splice(0,100));
		});
	});

	app.get('/emerging', function (req, res) {
		db.videos.find({tags : {$nin : ["Live", "Interview", "Trailer"]}}, function(err, videos) {
			wonderRank.hipsterSort(videos);
			res.send(videos.splice(0,100));
		});
	});

	app.get('/videos-hip-hop', function (req, res) {
		db.videos.find({tags: {$nin : ["Live", "Interview", "Trailer"], $in: ["Hip Hop"]}}, function(err, videos) {
			wonderRank.defaultSort(videos);
			res.send(videos.splice(0,100));
		});
	});

	app.get('/electronic', function (req, res) {
		db.videos.find({tags: {$nin : ["Live", "Interview", "Trailer"], $in: ["Electonic"]}}, function(err, videos) {
			wonderRank.defaultSort(videos);
			res.send(videos.splice(0,100));
		});
	});

	app.get('/interviews', function (req, res) {
		db.videos.find({tags: {$nin : ["Music Video", "Trailer"], $in: ["Interview"]}}, function(err, videos) {
			wonderRank.defaultSort(videos);
			res.send(videos.splice(0,100));
		});
	});

	app.get('/live', function (req, res) {
		db.videos.find({tags: {$nin : ["Music Video", "Trailer"], $in: ["Live"]}}, function(err, videos) {
			wonderRank.defaultSort(videos);
			res.send(videos.splice(0,100));
		});
	});

	app.get('/trailers', function (req, res) {
		db.videos.find({tags: {$nin : ["Music Video"], $in: ["Trailer"]}}, function(err, videos) {
			wonderRank.defaultSort(videos);
			res.send(videos.splice(0,100));
		});
	});

	return app;
}

module.exports = startExpress;