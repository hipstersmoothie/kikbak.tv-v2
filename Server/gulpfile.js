var gulp = require('gulp'),
    watch = require('gulp-watch'),
    server = require( 'gulp-develop-server');

gulp.task('server:start', function() {
    server.listen( { path: './index.js' } );
});

gulp.task('server:restart', function() {
    gulp.watch( [ './index.js' ], server.restart );
});

gulp.task('default', ['server:start', 'server:restart']);