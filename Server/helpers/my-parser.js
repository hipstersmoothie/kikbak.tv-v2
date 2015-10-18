// This code was for importing new blogs. shouldn't be needed now that we have imported
// var newBlogs = require('./../newBlogs.json'),
//     _ = require('lodash'),
//     db = require("./db");

// function getCurrentBlogs() {
//   console.log('Finding blogs...');
//   var newBlogNameArray = newBlogsNames();
//   db.blogs.find({ }, function(err, blogs) {
//     // _.forEach(blogs, function(blog) {
//     //   var parts = blog.url.split('//')
//     //   var domain = parts[1] ? parts[1] : parts[0];
//     //   domain = domain.trim();

//     //   domain = domain.split('/')[0];

//     //   if(_.includes(newBlogNameArray, domain)) {
//     //     var blogIndex = newBlogNameArray.indexOf(domain);
//     //     var newBlog = newBlogs[blogIndex];
//     //     var genre = newBlog.Genre === 'All' ? 'Multi' : newBlog.Genre; 

//     //     // db.blogs.update({url:blog.url},
//     //     //   {
//     //     //     $addToSet: {tags: genre},
//     //     //   }
//     //     // );
//     //   }
//     // });
//     var blogDomains = _.map(blogs, function(blog) {
//       var parts = blog.url.split('//')
//       var domain = parts[1] ? parts[1] : parts[0];
//       domain = domain.trim();
//       domain = domain.split('/')[0];
//       return domain;
//     });

//     _.forEach(newBlogs, function(newBlog) {
//       if(!_.includes(blogDomains, newBlog.Url)) {
//         var goodUrl = newBlog.Url.trim()
//         if(goodUrl[goodUrl.length - 1] === '/')
//           goodUrl += 'feed/';
//         else
//           goodUrl += '/feed/';
//         db.blogs.insert({
//           url: goodUrl,
//           tags: newBlog.Genre ? [newBlog.Genre] : [],
//           location: newBlog.Location,
//           tested: false
//         })
//       }
//     });
//   });
// }

// function newBlogsNames() {
//   return _.map(newBlogs, function(blog) {
//     var parts = blog.Url.split('//')
//     var domain = parts[1] ? parts[1] : parts[0];
//     domain = domain.trim();
//     if (domain[domain.length - 1] === '/') 
//       domain = domain.substring(0, domain.length - 1);

//     return domain;
//   });
// }
// // newBlogsPrint()

// getCurrentBlogs();