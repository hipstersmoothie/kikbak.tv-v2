// Goes through all of the blogs
var http = require('http'),
	db = require("./../helpers/db"),
	_ = require('lodash'),
	parser = require('parse-rss'),
	request = require('request-enhanced'),
	requestOrig = require('request'),
	cheerio = require('cheerio'),
	getYouTubeID = require('get-youtube-id'),
	youtubeThumbnail = require('youtube-thumbnail'),
	YouTube = require('youtube-node'),
	getTags = require('./../helpers/getTags');

var youTube = new YouTube();
var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7, OLDVIDEOMAXDAYS = 50;
var youtubeKey = 'AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg';
youTube.setKey(youtubeKey);

var refreshBlogsFeeds = function() {
	console.log('Finding new videos...');
	db.blogs.find({ tested : true}, function(err, blogs) {
		_.forEach(blogs, parseFeed);
	});
}

var posts = 0;
var parseFeed = function(url) {
	parser(url.url, function(err, postsData) {
		if(err) {
			// console.log('parseFeed', url, err);
		}
		else  {
			_.forEach(postsData, _.bind(getHtml, null, _, url));
		}
	});
}

var getHtml = function(post, blog) {
	request.get({
		url: post.link,
		maxAttempts:3,
		maxConcurrent: 50
	}, function(error, response){
		// First we'll check to make sure no errors occurred when making the request
		if(!error){
			// Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionalit
			var $ = cheerio.load(response);
			handlePost($, blog, post.link);
		} else {
			// console.log("getHtml", blog, post.link, error);
		}
	});
}

var handlePost = function($, blog, link) {
	var iframes = $('iframe');

	_.forEach(iframes, function(iframe) {
		if(iframe.attribs.src && iframe.attribs.src.indexOf('youtu') > -1) {
			addToDb(iframe.attribs.src, blog, $, link);
		}
	});
}

var tagVideo = function(vidId, html, $) {
	youTube.getById(vidId, function(error, result) {
		if(!error) {
			var tags;
			if(result && result['items'] && result['items'][0] && result['items'][0]['snippet'])
				tags = getTags.getTag(html, $, result['items'][0]['snippet']['description'], result['items'][0]['snippet']['title'], result['items'][0]['snippet']['channelTitle']);
			else
				tags = getTags.getTag(html, $, '', '', '');
			db.videos.update({ videoId : vidId }, {$addToSet: {
				tags : {$each:tags}
			}});
		}
	});
}

var addToDb = function(url, blog, $, link) {
	var vidId = getYouTubeID(url);
	db.videos.find({ videoId : vidId }, function(err, video) {  
		if (err) {
			// console.log('addToDb', err);
		} else {
			if (video.length > 0)
				updateVid(video, blog, vidId, $, link);
			else
				newVid(vidId, url, blog, $, link);
		}
	});
}

var updateVid = function(vidList, blog, vidId, $, link) {
	video = vidList[0];
	var foundUrls = _.map(video.foundOn, function(url) { return url.url });
	if (!_.includes(foundUrls,  blog.url)) {
		console.log('updating', video.title, video.foundOn, blog);
		var blogs = blog.tags ? blog.tags : [];
		var tags = _.union(getTags.getTag($('p'), $, "", "", ""), blogs);
		db.videos.update({ videoId : vidId }, {
			$addToSet: {
				foundOn : blog
			}
		});
		db.videos.update({ videoId : vidId }, {$addToSet: {
			tags : {$each:tags}
		}});
		db.videos.update({ videoId : vidId }, {$addToSet: {
			origPosts : link
		}});
	}
	posts++;
}

var newVid = function(vidId, url, blog, $, link) {
	//checkstills
	request.get({
		url: 'https://www.googleapis.com/youtube/v3/videos?part=statistics%2Csnippet&id=' + vidId  + '&key=' + youtubeKey,
		maxAttempts:3,
		maxConcurrent: 50
	}, function(error, result) {
		result = JSON.parse(result);
		if(result && result['items'] && result['items'].length > 0 
			&& /official audio|\(audio\)|\[audio\]|audio only/i.exec(result['items'][0]['snippet']['title']) == null) {
			if ((Date.now() - Date.parse(result['items'][0]['snippet']['publishedAt']))/day > OLDVIDEOMAXDAYS)
				return;

			analyzePost(link, function(data) {
				var keywords, taxonomy;
				if (data.keywords)
					keywords = data.keywords;
				if (data.taxonomy)
					taxonomy = data.taxonomy;

				compareStills({
					videoId: vidId
				}, function(isSame) {
					var bigThumb;
					var smallThumb;
					if(result['items'][0]['snippet']['thumbnails'].maxres) {
						bigThumb = result['items'][0]['snippet']['thumbnails'].maxres.url;
					} else if (result['items'][0]['snippet']['thumbnails'].standard) {
						bigThumb = result['items'][0]['snippet']['thumbnails'].standard.url;
					} else {
						bigThumb = result['items'][0]['snippet']['thumbnails'].high.url;
					}

					if(result['items'][0]['snippet']['thumbnails'].standard) {
						smallThumb = result['items'][0]['snippet']['thumbnails'].standard.url;
					} else {
						smallThumb = result['items'][0]['snippet']['thumbnails'].high.url;
					}

					var blogs = blog.tags ? blog.tags : [];
					var tags =  _.union(getTags.getTag($('p'), $, result['items'][0]['snippet']['description'], result['items'][0]['snippet']['title'], result['items'][0]['snippet']['channelTitle']), blogs)
					if(isSame)
						tags.push('NotAVid')
					
					console.log('adding', result['items'][0]['snippet']['title'], vidId); 
					db.videos.update({ videoId : vidId }, {
						$setOnInsert: {
							youTubePostDate : result['items'][0]['snippet']['publishedAt'],
							videoId : vidId,
							foundOn : [blog],
							origPosts : [link],
							dateFound : _.now(),
							thumbnail : youtubeThumbnail(url),
							thumbHQ: bigThumb,
							thumbSmall: smallThumb,
							title : result['items'][0]['snippet']['title'],
							description : result['items'][0]['snippet']['description'],
							publishedBy : result['items'][0]['snippet']['channelTitle'],
							oldStats : result['items'][0]['statistics'],
							avgViewPerHalfHour : 0,
							avgLikePerHalfHour : 0,
							avgDislikePerHalfHour : 0,
							avgFavoritePerHalfHour : 0,
							avgCommentPerHalfHour : 0,
							taxonomy: taxonomy,
							keywords: keywords
						},
						$addToSet: {
							tags : {
								$each: tags
							}
						}
					}, { upsert : true }, function(err, res) {
						console.log(err, res)
					});
					posts++;
				}); 
			})
			
		} else if (error) {
			// console.log(error);
		}			
	});
}

var lastPosts;
setInterval(function() {
	if (lastPosts == posts) {
		console.log('searched', posts, 'posts');
		process.exit();
	} else {
		lastPosts = posts
	}
}, 120000)

var async = require('async');
var fs = require('fs');
var gm = require('gm');

var download = function(uri, filename, callback){
	requestOrig(uri).pipe(fs.createWriteStream(filename)).on('close', callback).on('error', function  (error) {
		console.log(error)
	});
};

function compareStills(video, cback) {
	var still1 = 'http://img.youtube.com/vi/' + video.videoId + '/1.jpg';
	var still2 = 'http://img.youtube.com/vi/' + video.videoId + '/2.jpg';
	var still3 = 'http://img.youtube.com/vi/' + video.videoId + '/3.jpg';
	var stills = [still1, still2, still3];
	var images = [];

	async.each(stills, function(still, callback, index) {
		download(still, video.videoId + stills.indexOf(still) + '.jpg', function(){
		  images.push('./' + video.videoId + stills.indexOf(still) + '.jpg');

		  callback();
		});
	}, function(err){
	    if( err ) {
	      console.log('A file failed to process');
	      _.forEach(images, fs.unlink)
	      cback(false)
	    } else {		
	    	gm.compare(images[0], './workers/noPicture.jpg', 0.02, function (err, isEqual, equality, raw, path1, path2) {
			  if (err) return cback(err);
			  if(isEqual) {
			  	_.forEach(images, fs.unlink)
			  	cback(false)
			  } else {
			  	gm.compare(images[0], images[1], 0.002, function (err, isEqual, equality, raw, path1, path2) {
				  if (err) return handle(err);				 
				  if(isEqual) {
				  	gm.compare(images[1], images[2], 0.002, function (err, isEqual, equality, raw, path1, path2) {
					  if (err) return handle(err);
					  _.forEach(images, fs.unlink)
					  cback(isEqual)
					  if(isEqual)
					  	console.log('still video', 'https://www.youtube.com/watch?v=' + video.videoId)
					});
				  } else {
				  	_.forEach(images, fs.unlink)
				  	cback(isEqual)
				  }
				});
			  }
			});
		}
	});
}

function findStills () {
	db.videos.find({ }, function(err, videos) {
		var i = 0;
		setInterval(function() {
			(function(video) {
				compareStills(video, function(isSame) {
					if(isSame === true)
						db.videos.update({ videoId : video.videoId }, {$addToSet: {
							tags : "NotAVid"
						}});
				});
			})(videos[i]);
			i++;
		}, 200)
	});
}

var AlchemyAPI = require('./../javascripts/alchemyapi');
var alchemyapi = new AlchemyAPI();

function analyzePost(url, callback) {
	alchemyapi.combined('url', url, {
		extract: ['keyword', 'taxonomy', 'entities']
	}, function(response) {
		console.log("extracted: ", response)
		callback(response);
	});
}

var buckets = [
	{
		tag: 'Live',
		keywords: [
			"performance"
		],
		taxonomy: [
			"/art and entertainment/movies and tv/talk shows"
		],
		entities: [
			"Aubrey O’Day"
		]
	},
	{
		tag: 'Interview',
		keywords: [],
		taxonomy: [],
		entities: []
	},
	{
		tag: 'Trailer',
		keywords: [],
		taxonomy: [],
		entities: []
	}
]

// analyzePost('http://pigeonsandplanes.com/2015/10/watch-purity-ring-perform-begin-again-kimmel/', function(response) {
// 	console.log(response)
// })
function gatherInfo(genre) {
	db.buckets.find({tag: genre}, function(err, frame) {
		console.log(err, frame)
		if(err)
			return console.log(err)

		var searchedPosts = frame.searchedPosts;
		db.videos.find({tags:genre}, function(err, videos) {
			if(!err) {
				_.forEach(videos, function(video) { // all videos
					_.forEach(video.origPosts, function(url) { // go through post found 
						if(!_.includes(searchedPosts, url)) { // exclude already visited posts
							searchedPosts = _.union(searchedPosts, url);
							analyzePost(url, function(data) {
								console.log(data)
								var keywords = data.keywords ? _.pluck(data.keywords, 'text') : [];
								var taxonomy = data.taxonomy ? _.pluck(data.taxonomy, 'label') : [];	
								var entities = data.entities ? _.pluck(data.entities, 'text') : [];	
				
								db.buckets.update({tag: genre}, {
									$addToSet: {
										'taxonomy' : { $each : taxonomy },
										'keywords' : { $each : keywords },
										'entities' : { $each : entities },
										'searchedPosts' : url
									}
								})
							});
						}
					});
				});
			} else {
				console.log(err)
			}
		});
	});
}

gatherInfo("Live");

// refreshBlogsFeeds();
