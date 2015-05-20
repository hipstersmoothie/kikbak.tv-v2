var multiplier = function(days) {
	if (days <= 1)
		return 100;
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
		return 1;
	else {
		return 0;
	}
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

var hipsterViewMult = function(views) {
	if(views > 15000)
		return 0
	else if (views > 1500)
		return 3;
	else if (views > 500)
		return 2;
	else if (views > 100)
		return 1.5;
	else
		return 1;
}

var hipMult = function(days) {
	if (days <= 1)
		return 15;
	else if (days <= 2)
		return 13;
	else if (days <= 3)
		return 11;
	else if (days <= 4)
		return 8;
	else if (days <= 5)
		return 5;
	else if (days <= 6)
		return 3;
	else if (days <= 7)
		return 1;
	else {
		return 0;
	}
}

var ifMusicVideo = function(video) {
	if(video.tags && video.tags.indexOf("Music Video") > -1)
		return 1.5;
	return 1;
}
var sort = function(videos) {
	var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7;
	videos.sort(function(a, b) {
		var date1 = (Date.now() - Date.parse(a.youTubePostDate))/day;
		var date2 = (Date.now() - Date.parse(b.youTubePostDate))/day;
		var adg1 = multiplier(date1);
		var adg2 = multiplier(date2);
		var viewMultiplier1 = viewMultiplier(a.oldStats.viewCount);
		var viewMultiplier2 = viewMultiplier(b.oldStats.viewCount);
		a.wonderRank = (a.foundOn.length * adg1 * viewMultiplier1 * ifMusicVideo(a));
		b.wonderRank = (b.foundOn.length * adg2 * viewMultiplier2 * ifMusicVideo(b));

		return a.wonderRank - b.wonderRank;
	}).reverse();
}

var dampen = function(length) {
	return Math.ceil(length / 2);
}

var hipsterSort = function(videos) {
	var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7;
	videos.sort(function(a, b) {
		var date1 = (Date.now() - Date.parse(a.youTubePostDate))/day;
		var date2 = (Date.now() - Date.parse(b.youTubePostDate))/day;
		var adg1 = multiplier(date1);
		var adg2 = multiplier(date2);

		var post1 = (Date.now() - a.dateFound)/day;
		var post2 = (Date.now() - b.dateFound)/day;
		var padg1 = hipMult(post1);
		var padg2 = hipMult(post2);
		
		var hipsterViewMult1 = hipsterViewMult(parseInt(a.oldStats.viewCount));
		var hipsterViewMult2 = hipsterViewMult(parseInt(b.oldStats.viewCount));

		a.wonderRank = adg1 * padg1 * hipsterViewMult1 * ifMusicVideo(a);
		b.wonderRank = adg2 * padg2 * hipsterViewMult2 * ifMusicVideo(b);

		return a.wonderRank - b.wonderRank;
	}).reverse();
}

module.exports = {
	defaultSort : sort,
	hipsterSort : hipsterSort
}