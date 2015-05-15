var _ = require('lodash');

var checkHipHop = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if(text.indexOf(' rapper') > -1 || text.indexOf(' rapping') > -1 
		|| text.indexOf('hip-hop') > -1 || text.indexOf('rap') > -1) {
		tags = ["Hip Hop"]
	}
	return tags;
}

var checkElectronic = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if (text.indexOf(' edm') > -1 || text.indexOf(' electonic') > -1 || 
		youTubeDescription.toLowerCase().indexOf('electonic') > -1 || youTubeDescription.toLowerCase().indexOf(' edm') > -1) {
		tags = ["Electonic"];
	}
	return tags;
}

var checkInterview = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if (text.indexOf('interview') > -1 || text.indexOf('Interview') > -1 || title.toLowerCase() == "SwaysUniverse" || uploader == 'NPR Music')
		tags = ["Interview"];
	return tags;
}

var checkLive = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if (text.indexOf(' live') > -1 || youTubeDescription.toLowerCase().indexOf(' live') > -1
		|| title.toLowerCase().indexOf(' live') > -1 || title.toLowerCase().indexOf(' bbc') > -1 || title.toLowerCase().indexOf('2015') > -1
		|| title.toLowerCase().indexOf('american idol') > -1 || uploader == 'MTV' || uploader == 'timwestwoodtv'
		|| title.toLowerCase().indexOf('jimmy fallon') > -1 || uploader == 'BBC Radio 1'|| title.toLowerCase().indexOf('boiler room') > -1
		|| title.toLowerCase().indexOf('dj set') > -1 || uploader == 'NPR Music') {
		tags = ["Live"];
	}
	return tags;
}

var checkMusicVideo = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if (title.toLowerCase().indexOf('official video') > -1 || title.toLowerCase().indexOf('music video') > -1) {
		tags = ["Music Video"];
	}
	return tags;
}

var checkTrailer = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if (title.toLowerCase().indexOf('trailer') > -1) {
		tags = ["Trailer"];
	}
	return tags;
}

var tagFunctions = [checkMusicVideo, checkInterview, checkTrailer, checkLive, checkElectronic, checkHipHop];
var getTag = function(html, $, youTubeDescription, title, uploader) {
	var tags = [];
	if (html.each) {
		html.each(function(i, el) {
			var text = $(this).text().toLowerCase();
			_.forEach(tagFunctions, function(tagIt) {
				tags = _.union(tags, tagIt(text, youTubeDescription, uploader, title));
			});
		});
	}
	return tags;
}

module.exports = getTag