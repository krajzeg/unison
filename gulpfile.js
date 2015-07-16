var gulp = require('gulp');
var path = require('path');

gulp.task('default', ['compile']);

gulp.task('test', ['compile'], function() {
	var mocha = require('gulp-mocha');
	return gulp.src('dist/test/**/*.js', {read: false})
			.pipe(mocha());
});

gulp.task('compile', ['compile-browser', 'compile-lib', 'compile-test']);

gulp.task('clean-lib', makeCleanTask('dist/lib'));
gulp.task('compile-lib', ['clean-lib'], makeES6CompileTask('lib'));
gulp.task('clean-test', makeCleanTask('dist/test'));
gulp.task('compile-test', ['clean-test'], makeES6CompileTask('test'));

gulp.task('compile-browser', makeBrowserifyTask('lib/browser.js'));

function makeCleanTask(directory) {
  var del = require('del');
  return function(cb) {
    del(directory, cb);
  }
}

function makeES6CompileTask(sourceDirectory) {
	var sources = path.join(sourceDirectory, '**/*.js');
	var destination = path.join('dist', sourceDirectory);

	return function() {
		var babel = require('gulp-babel');
		var sourcemaps = require('gulp-sourcemaps');

    return gulp.src(sources)
        .pipe(sourcemaps.init())
        .pipe(babel({retainLines: true}))
        .pipe(sourcemaps.write('.', {
            sourceRoot: '../../' + sourceDirectory
        }))
        .pipe(gulp.dest(destination));
	}
}

function makeBrowserifyTask(sourceFile) {
	var browserify = require('browserify');
	var babelify = require('babelify');
	var source = require('vinyl-source-stream');

	return function() {
	    return browserify({
		    entries: [sourceFile],
		    transform: [babelify]
	    })
	    .bundle()
	    .on('error', logErrors)
	    .pipe(source('main.js'))
	    .pipe(gulp.dest('./dist/browser'));
	};
}

function logErrors(e) {
	console.error("Build error:", e.message);
}
