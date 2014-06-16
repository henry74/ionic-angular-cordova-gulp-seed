var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');

var coffee = require('gulp-coffee');
var livereload = require('gulp-livereload');
var changed = require('gulp-changed');
var ripple = require('ripple-emulator');
var open = require('open');
var http = require('http');
var path = require('path');
var ecstatic = require('ecstatic');
var notify = require('gulp-notify');
var clean = require('gulp-clean');
var runSequence = require('run-sequence');

var paths = {
  styles: ['app/scss/**/*.scss'],
  scripts: {
    app: ['app/js/**/*.coffee']
  },
  templates: ['app/**/*.html']
};

var destinations = {
  styles: 'www/css',
  scripts: 'www/js',
  templates: 'www',
  livereload: ['www/**']
};

var options = {
  open: true,
  httpPort: 4400,
  riddlePort: 4400
};

gulp.task('clean', function() {
  return gulp.src(['www/js', 'www/css', 'www/templates'], {
    read: false
  })
    .pipe(clean());
});


gulp.task('styles', function(done) {
  gulp.src(paths.styles)
    .pipe(sass())
    .pipe(gulp.dest(destinations.styles))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(gulp.dest(destinations.styles))
    .on('end', done);
});

gulp.task('scripts', function() {
  return gulp.src(paths.scripts.app)
    .pipe(coffee({
      sourceMap: false
    }))
    .pipe(concat('app.js'))
    .pipe(gulp.dest(destinations.scripts));
});

gulp.task('templates', function() {
  return gulp.src(paths.templates)
    .pipe(changed(destinations.templates, {
      extension: '.html'
    }))
    .pipe(gulp.dest(destinations.templates));
});

gulp.task('watch', function() {
  var livereloadServer = livereload();

  gulp.watch(paths.scripts.app, ['scripts']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.templates, ['templates']);

  return gulp.watch(destinations.livereload).on('change', function(file) {
    return livereloadServer.changed(file.path);
  });
});

gulp.task('emulator', function() {
  var url = "http://localhost:" + options.ripplePort + "/?enableripple=cordova-3.0.0-HVGA";

  ripple.emulate.start(options);

  gutil.log(gutil.colors.blue("Ripple-Emulator listening on " + options.ripplePort));

  if (options.open) {
    open(url);
    return gutil.log(gutil.colors.blue("Opening " + url + " in the browser..."));
  }
});

gulp.task('server', function() {
  var url = "http://localhost:" + options.httpPort + "/";

  http.createServer(ecstatic({
    root: "www"
  })).listen(options.httpPort);

  gutil.log(gutil.colors.blue("HTTP server listening on " + options.httpPort));

  if (options.open) {
    open(url);
    return gutil.log(gutil.colors.blue("Opening " + url + " in the browser..."));
  }
});

gulp.task('build', function(cb) {
  return runSequence(
    'clean', ['styles', 'scripts', 'templates'],
    cb
  );
});

gulp.task('default', function(cb) {
  return runSequence(
    // 'build', ['watch', 'server'],
    'build', ['watch'],
    cb
  );
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
