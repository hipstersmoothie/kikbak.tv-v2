var multiplier = function(days) {
	if (days <= 1)
		return 200;
	else if (days <= 2)
		return 80;
	else if (days <= 3)
		return 40;
	else if (days <= 4)
		return 20;
	else if (days <= 5)
		return 10;
	else if (days <= 6)
		return 5;
	else if (days <= 7)
		return 3;
	if (days < 31)
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

var shareRatio = function(video) {
	if(video.shareCounts.Facebook.total_count == 0) {
		return 0;
	} 
	var faceRate = video.avgFaceBookShares / video.shareCounts.Facebook.total_count;
	// console.log(video.avgFaceBookShares, '/', video.shareCounts.Facebook.total_count, '=', faceRate);
	return faceRate;
}

var ifMusicVideo = function(video) {
	if(video.tags && video.tags.indexOf("Music Video") > -1)
		return 2;
	return 1;
}

var dampen = function(length, date) {
	if (date > 10)
		return 0.25 * length
	return length;
}

var sort = function(videos) {
	var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7;
	if(videos)
		videos.sort(function(a, b) {
			var date1 = (Date.now() - Date.parse(a.youTubePostDate))/day;
			var date2 = (Date.now() - Date.parse(b.youTubePostDate))/day;
			var adg1 = multiplier(date1);
			var adg2 = multiplier(date2);
			// var ratio1 = shareRatio(a);
			// var ratio2 = shareRatio(b);
			var viewMultiplier1 = viewMultiplier(a.avgViewPerHalfHour);
			var viewMultiplier2 = viewMultiplier(b.avgViewPerHalfHour);
			a.wonderRank = (dampen(a.foundOn.length, date1) * adg1 * viewMultiplier1 * ifMusicVideo(a));
			b.wonderRank = (dampen(b.foundOn.length, date2) * adg2 * viewMultiplier2 * ifMusicVideo(b));

			return (a.wonderRank) - (b.wonderRank);
		}).reverse();
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

var topSort = function(videos) {
	if(videos)
		videos.sort(function(a, b) {
			var ratio1 = a.shareCounts ? a.shareCounts.Facebook.total_count +  a.shareCounts.Twitter : 1;
			var ratio2 = b.shareCounts ? b.shareCounts.Facebook.total_count +  b.shareCounts.Twitter : 1;
			a.wonderRank = (a.foundOn.length * a.oldStats.viewCount * ratio1) / 100000;
			b.wonderRank = (b.foundOn.length * b.oldStats.viewCount * ratio2) / 100000;

			return (a.wonderRank) - (b.wonderRank);
		}).reverse();
}

module.exports = {
	defaultSort : sort,
	hipsterSort : hipsterSort,
	topSort: topSort
}
