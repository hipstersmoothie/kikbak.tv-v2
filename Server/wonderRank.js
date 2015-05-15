var multiplier = function(days) {
	//console.log(days);
	if (days <= 1)
		return 50;
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
		return 0.1;
	else if (days < 365)
		return -1;
	else if (days < 600)
		return -2;
	else
		return 0.50;
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

var ratioMetric = function(views, likes) {
	var ratio = likes / views;
	if(views < 500)
		return 1;
	else if(ratio > 0.30)
		return 4;
	else if(ratio > 0.20)
		return 3;
	else if(ratio > 0.15)
		return 2;

}

var sort = function(videos) {
	var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7;
	videos.sort(function(a, b) {
		var date1 = (Date.now() - Date.parse(a.youTubePostDate))/day
		var date2 = (Date.now() - Date.parse(b.youTubePostDate))/day
		var adg1 = multiplier(date1);
		var adg2 = multiplier(date2);
		var viewMultiplier1 = viewMultiplier(a.avgViewPerHalfHour, date1);
		var viewMultiplier2 = viewMultiplier(a.avgViewPerHalfHour, date2);
		var metric1 = ratioMetric(a.oldStats.viewCount, a.oldStats.likeCount);
		var metric2 =ratioMetric(b.oldStats.viewCount, b.oldStats.likeCount);
		return (a.foundOn.length * adg1 * viewMultiplier1  * metric1) - (b.foundOn.length * adg2 * viewMultiplier2 *metric2);
	}).reverse();
}

module.exports = {
	defaultSort : sort
}