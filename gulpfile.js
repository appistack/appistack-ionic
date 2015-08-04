var gulp = require('gulp'),
  gutil = require('gulp-util'),
  bower = require('bower'),
  concat = require('gulp-concat'),
  sass = require('gulp-sass'),
  minifyCss = require('gulp-minify-css'),
  rename = require('gulp-rename'),
  sh = require('shelljs'),
  _ = require('underscore'),
  ngConstant = require('gulp-ng-constant'),
  pkg = require('./package.json'),
  config = require('./config.json');

var paths = {
  sass: ['./scss/**/*.scss']
};

var node_env = process.env.NODE_ENV || 'development',
  conf = _.extend(
    _.pick(pkg, 'title', 'description', 'author'),
    config['common'],
    config[node_env]
  );

gulp.task('default', ['config', 'sass']);

gulp.task('config', function() {
  conf['apiHost'] = conf['apiProtocol'] + '://' + conf['apiHost'];
  conf['apiUrl'] = conf['apiHost'] + conf['apiUrl'];

  return ngConstant({
      name: 'appistack.config',
      stream: true,
      constants: { ENV: conf }
    })
    .pipe(concat('config.js'))
    .pipe(gulp.dest('www/js'));
});

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
