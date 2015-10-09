var express = require('express'),
    wonderRank = require('./helpers/wonderRank'),
    db = require("./helpers/db"),
	_ = require('lodash'),
	path = require('path');
var mongo = require('mongodb');

var startExpress = function() {
	var app = express();
	var blockedTitles = /Zepp Namba|Soundtrack Review|The Breakfast Club|Lollapalooza|Over\/Under|Album Review|Sound Advice|Birthday bash 20|covers|covering|:60 with|perform|Guitars and Bass Play|Behind the Scenes|Summer Jam|MTV News|Converse Rubber Tracks|2014|2015|Boiler Room|Trailer|BBC|Red Bull Session|Lip Sync Battle|\/15|.15|SKEE TV|Official Movie|GGN |^(?=.*Drake)(?=.*Tour).*$|Live @|Live in|Live at|\[live\]|\(live\)|Interview/i;
	var blockedPublished = /Comedy Central|Consequence of Sound|asQme|Bootleg Kev|TheBreakfastClub|Art ist D|3FM|John Clay|LadyGagaNewz|Power 106|ClevverTV|Play Too Much|Stoney Roads|NME|CBS News|triple j|timwestwoodtv|colt45maltliquor|Jimmy Kimmel Live|BigBoyTV|deathrockstar|Al Lindstrom|SwaysUniverse|HOT 97|djvlad|Hawk Media Vision|BBC|Chart Attack|Concert Daily|LiveMusiChannel|MONTREALITY|TODAY|The Tonight Show Starring Jimmy Fallon|The Late Late Show with James Corden|The A.V. Club|GQ Magazine|I.T. Channel/;

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
		db.blogs.find({ $where: "!this.tested" }, function(err, blogs) {
			res.render('picker', {
				url: blogs[0].url,
				urlNoRss: blogs[0].url.substring(0, blogs[0].url.indexOf('feed/')),
				id: blogs[0]._id
			});
		});
	});

	app.post('/blogs/tag/:id/:tag/', function (req, res) {
		console.log(req, req.body, req.params)
		db.blogs.update({_id:new mongo.ObjectID(req.params.id)},{$addToSet:{tags:req.params.tag}}, function(error, result) {
			console.log(error,result)
			res.send(error,result)
		})
	});
	
	return app;
}

module.exports = startExpress;