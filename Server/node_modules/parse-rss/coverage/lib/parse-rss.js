if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (typeof _$jscoverage['lib/parse-rss.js'] === 'undefined'){_$jscoverage['lib/parse-rss.js']=[];
_$jscoverage['lib/parse-rss.js'].source=['(function() {',
'  module.exports = function(url, callback) {',
'    var FeedParser, domain, options, request, rss;',
'    FeedParser = require(\'feedparser\');',
'    request = require(\'request\');',
'    options = {',
'      normalize: false,',
'      addmeta: true,',
'      feedurl: url',
'    };',
'    rss = [];',
'    domain = require(\'domain\').create();',
'    domain.on(\'error\', function(e) {',
'      return callback(e, null);',
'    });',
'    return domain.run(function() {',
'',
'      /* Module Initialize */',
'      var feedParser, req;',
'      req = request(url);',
'      feedParser = new FeedParser([options]);',
'',
'      /* REQUEST */',
'      req.on(\'error\', function(err) {',
'        return callback(err, null);',
'      });',
'      req.on(\'response\', function(res) {',
'        var stream;',
'        stream = this;',
'        if (res.statusCode !== 200) {',
'          return this.emit(\'error\', new Error(\'Bad status code\'));',
'        }',
'        return stream.pipe(feedParser);',
'      });',
'',
'      /* FEEDPARSER */',
'      feedParser.on(\'error\', function(err) {',
'        return callback(err, null);',
'      });',
'      feedParser.on(\'readable\', function() {',
'        var item, stream;',
'        stream = this;',
'        if (item = stream.read()) {',
'          return rss.push(item);',
'        }',
'      });',
'      return feedParser.on(\'end\', function() {',
'        if (rss.length === 0) {',
'          return callback(\'no articles\');',
'        }',
'        return callback(null, rss);',
'      });',
'    });',
'  };',
'',
'}).call(this);',
''];
_$jscoverage['lib/parse-rss.js'][30]=0;
_$jscoverage['lib/parse-rss.js'][1]=0;
_$jscoverage['lib/parse-rss.js'][33]=0;
_$jscoverage['lib/parse-rss.js'][3]=0;
_$jscoverage['lib/parse-rss.js'][2]=0;
_$jscoverage['lib/parse-rss.js'][38]=0;
_$jscoverage['lib/parse-rss.js'][5]=0;
_$jscoverage['lib/parse-rss.js'][4]=0;
_$jscoverage['lib/parse-rss.js'][37]=0;
_$jscoverage['lib/parse-rss.js'][12]=0;
_$jscoverage['lib/parse-rss.js'][11]=0;
_$jscoverage['lib/parse-rss.js'][6]=0;
_$jscoverage['lib/parse-rss.js'][42]=0;
_$jscoverage['lib/parse-rss.js'][19]=0;
_$jscoverage['lib/parse-rss.js'][16]=0;
_$jscoverage['lib/parse-rss.js'][14]=0;
_$jscoverage['lib/parse-rss.js'][13]=0;
_$jscoverage['lib/parse-rss.js'][40]=0;
_$jscoverage['lib/parse-rss.js'][24]=0;
_$jscoverage['lib/parse-rss.js'][21]=0;
_$jscoverage['lib/parse-rss.js'][20]=0;
_$jscoverage['lib/parse-rss.js'][48]=0;
_$jscoverage['lib/parse-rss.js'][25]=0;
_$jscoverage['lib/parse-rss.js'][27]=0;
_$jscoverage['lib/parse-rss.js'][28]=0;
_$jscoverage['lib/parse-rss.js'][29]=0;
_$jscoverage['lib/parse-rss.js'][31]=0;
_$jscoverage['lib/parse-rss.js'][41]=0;
_$jscoverage['lib/parse-rss.js'][43]=0;
_$jscoverage['lib/parse-rss.js'][44]=0;
_$jscoverage['lib/parse-rss.js'][47]=0;
_$jscoverage['lib/parse-rss.js'][49]=0;
_$jscoverage['lib/parse-rss.js'][51]=0;
}_$jscoverage['lib/parse-rss.js'][1]++;
(function() {
  _$jscoverage['lib/parse-rss.js'][2]++;
module.exports = function(url, callback) {
    _$jscoverage['lib/parse-rss.js'][3]++;
var FeedParser, domain, options, request, rss;
    _$jscoverage['lib/parse-rss.js'][4]++;
FeedParser = require('feedparser');
    _$jscoverage['lib/parse-rss.js'][5]++;
request = require('request');
    _$jscoverage['lib/parse-rss.js'][6]++;
options = {
      normalize: false,
      addmeta: true,
      feedurl: url
    };
    _$jscoverage['lib/parse-rss.js'][11]++;
rss = [];
    _$jscoverage['lib/parse-rss.js'][12]++;
domain = require('domain').create();
    _$jscoverage['lib/parse-rss.js'][13]++;
domain.on('error', function(e) {
      _$jscoverage['lib/parse-rss.js'][14]++;
return callback(e, null);
    });
    _$jscoverage['lib/parse-rss.js'][16]++;
return domain.run(function() {

      /* Module Initialize */
      _$jscoverage['lib/parse-rss.js'][19]++;
var feedParser, req;
      _$jscoverage['lib/parse-rss.js'][20]++;
req = request(url);
      _$jscoverage['lib/parse-rss.js'][21]++;
feedParser = new FeedParser([options]);

      /* REQUEST */
      _$jscoverage['lib/parse-rss.js'][24]++;
req.on('error', function(err) {
        _$jscoverage['lib/parse-rss.js'][25]++;
return callback(err, null);
      });
      _$jscoverage['lib/parse-rss.js'][27]++;
req.on('response', function(res) {
        _$jscoverage['lib/parse-rss.js'][28]++;
var stream;
        _$jscoverage['lib/parse-rss.js'][29]++;
stream = this;
        _$jscoverage['lib/parse-rss.js'][30]++;
if (res.statusCode !== 200) {
          _$jscoverage['lib/parse-rss.js'][31]++;
return this.emit('error', new Error('Bad status code'));
        }
        _$jscoverage['lib/parse-rss.js'][33]++;
return stream.pipe(feedParser);
      });

      /* FEEDPARSER */
      _$jscoverage['lib/parse-rss.js'][37]++;
feedParser.on('error', function(err) {
        _$jscoverage['lib/parse-rss.js'][38]++;
return callback(err, null);
      });
      _$jscoverage['lib/parse-rss.js'][40]++;
feedParser.on('readable', function() {
        _$jscoverage['lib/parse-rss.js'][41]++;
var item, stream;
        _$jscoverage['lib/parse-rss.js'][42]++;
stream = this;
        _$jscoverage['lib/parse-rss.js'][43]++;
if (item = stream.read()) {
          _$jscoverage['lib/parse-rss.js'][44]++;
return rss.push(item);
        }
      });
      _$jscoverage['lib/parse-rss.js'][47]++;
return feedParser.on('end', function() {
        _$jscoverage['lib/parse-rss.js'][48]++;
if (rss.length === 0) {
          _$jscoverage['lib/parse-rss.js'][49]++;
return callback('no articles');
        }
        _$jscoverage['lib/parse-rss.js'][51]++;
return callback(null, rss);
      });
    });
  };

}).call(this);
