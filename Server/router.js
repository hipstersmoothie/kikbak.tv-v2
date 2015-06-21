var express = require('express'),
    wonderRank = require('./helpers/wonderRank'),
    db = require("./helpers/db"),
	_ = require('lodash'),
	path = require('path');

var startExpress = function() {
	var app = express();
	var blockedTitles = /Birthday bash 20|covers|covering|:60 with|perform|Guitars and Bass Play|Behind the Scenes|Summer Jam|MTV News|Converse Rubber Tracks|2014|2015|Boiler Room|Trailer|BBC|Red Bull Session|Lip Sync Battle|\/15|.15|SKEE TV|Official Movie|GGN |^(?=.*Drake)(?=.*Tour).*$|Live @|Live in|Live at|\[live\]|\(live\)|Interview/i;
	var blockedPublished = /3FM|John Clay|LadyGagaNewz|Power 106|ClevverTV|Play Too Much|Stoney Roads|NME|CBS News|triple j|timwestwoodtv|colt45maltliquor|Jimmy Kimmel Live|BigBoyTV|deathrockstar|Al Lindstrom|SwaysUniverse|HOT 97|djvlad|Hawk Media Vision|BBC|Chart Attack|Concert Daily|LiveMusiChannel|MONTREALITY|TODAY|The Tonight Show Starring Jimmy Fallon|The Late Late Show with James Corden|The A.V. Club|GQ Magazine|I.T. Channel/;

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
		db.videos.find(
		{
			$and: [
				{ title: { $not: blockedTitles } }, //live
				{ publishedBy: { $not: blockedPublished } },
				{ description: { $not: /GGN/ } } //interviews
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