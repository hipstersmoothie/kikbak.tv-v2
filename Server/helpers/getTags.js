var _ = require('lodash');
var blockedTitles = /documentary|Birthday bash 20|covers|covering|:60 with|perform|Guitars and Bass Play|Behind the Scenes|Summer Jam|MTV News|Converse Rubber Tracks|2014|2015|Boiler Room|Trailer|BBC|Red Bull Session|Lip Sync Battle|\/15|.15|SKEE TV|Official Movie|GGN |^(?=.*Drake)(?=.*Tour).*$|Live @|Live in|Live at|\[live\]|\(live\)|Interview/i;
var blockedPublished = /LadyGagaNewz|NPR Music|Power 106|ClevverTV|Play Too Much|Stoney Roads|NME|CBS News|triple j|timwestwoodtv|colt45maltliquor|Jimmy Kimmel Live|BigBoyTV|deathrockstar|Al Lindstrom|SwaysUniverse|HOT 97|djvlad|Hawk Media Vision|BBC|Chart Attack|Concert Daily|LiveMusiChannel|MONTREALITY|TODAY|The Tonight Show Starring Jimmy Fallon|The Late Late Show with James Corden|The A.V. Club|GQ Magazine|I.T. Channel/;
var checkLive = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if (blockedTitles.test(title))
		tags = ['Live'];
	if (blockedPublished.test(uploader))
		tags = ['Live'];
	if(youTubeDescription.indexOf('GGN') > -1) 
		tags = ['Live'];
	if ((youTubeDescription.indexOf('2015') > -1 || youTubeDescription.indexOf('/15') > -1 || youTubeDescription.indexOf('.15') > -1)
	 && (title.indexOf('official video') == -1 || title.indexOf('music video') == -1 || uploader.indexOf('vevo') == -1))
		tags = ['Live'];
	return tags;
}

var checkMusicVideo = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if (title.toLowerCase().indexOf('official video') > -1 || title.toLowerCase().indexOf('music video') > -1
	 || uploader.toLowerCase().indexOf('vevo') > -1) {
		tags = ["Music Video"];
	}
	return tags;
}

var tagFunctions = [checkMusicVideo, checkLive];
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

var getTagBasedOnVid = function(youTubeDescription, title, uploader) {
	var tags = [];
	_.forEach(tagFunctions, function(tagIt) {
		tags = _.union(tags, tagIt(null, youTubeDescription, uploader, title));
	});
	return tags;
}

module.exports = {
	getTag : getTag,
	getTagBasedOnVid : getTagBasedOnVid
}