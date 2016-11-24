/*jslint node:true, es6:true, this:true */

'use strict';

const gulp = require('gulp-param')(require('gulp'), process.argv, 'cb');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const named = require('vinyl-named');
const del = require('del');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;
const uglify = require('gulp-uglify');
const bust = require('gulp-buster');
const path = require('path');
const shell = require('gulp-shell');
const config = require('config');
const _ = require('lodash');
const distPath = path.join(__dirname, 'dist');

const webpackCfgBackend = require('./webpack.config.backend.js');
const webpackCfgFrontend = require('./webpack.config.frontend.js');

var paths = {
  frontend: [
    'src/frontend/**/*.js', 'src/frontend/**/*.jsx'
  ],
  backend: ['src/backend/**/*.js', 'src/backend/**/*.jsx', 'src/webcomponents/**/*.js', 'src/webcomponents/**/*.jsx', 'src/webcomponents/**/*.css']
};

gulp.task('clean', function () {
  return del(['dist/**/*', '.tmp/**/*', '.pm2/server.log', '.pm2/server.error.log']);
});

gulp.task('watch', function () {
  gulp.watch(paths.frontend, ['webpack-frontend']);
  gulp.watch(paths.backend, ['webpack-backend']);
});

gulp.task('webpack-backend', ['webpack-frontend'], function () {
  return gulp.src(['./src/backend/entry.js']).pipe(named()).pipe(webpackStream(webpackCfgBackend, webpack)).pipe(gulp.dest('dist/backend/')).pipe(bust({
    relativePath: 'dist/'
  })).pipe(gulp.dest('.'));
});

gulp.task('webpack-frontend', function () {
  return gulp.src(['./src/frontend/entry.js']).pipe(named()).pipe(webpackStream(webpackCfgFrontend, webpack)).pipe(gulp.dest('dist/frontend/')).pipe(bust({
    relativePath: 'dist/frontend/'
  })).pipe(gulp.dest('.'));
});

gulp.task('stop', ['stop-mongo'], function (cb) {
  execFile('./node_modules/.bin/pm2', ['delete', 'process.json'], {
    cwd: __dirname
  }, function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
    process.exit(err ? 1 : 0);
  });
});

gulp.task('mongoose-gen', shell.task([
  './node_modules/.bin/mongoose-gen',
], {
  interactive: true
}));


gulp.task('migrate', ['run-mongo'], function (action, name, cb) {
  var migMongooseClass = require('migrate-mongoose');
  var migrator = new migMongooseClass({
    dbConnectionUri: config.get('mongoose.uri'),
    es6Templates: true,
    autosync: true
  });

  var ended_cb = function (error) {
    cb(error);
    process.exit(error ? 1 : 0);
  };

  if (action == "create") {
    migrator.create(name).then(ended_cb).catch(ended_cb);
  } else if (action == "up") {
    migrator.run(name, "up").then(ended_cb).catch(ended_cb);
  } else if (action == "down") {
    migrator.run(name, "down").then(ended_cb).catch(ended_cb);
  } else if (action == "list") {
    migrator.list().then(ended_cb).catch(ended_cb);
  } else if (action == "sync") {
    migrator.sync().then(ended_cb).catch(ended_cb);
  } else if (action == "prune") {
    migrator.prune().then(ended_cb).catch(ended_cb);
  } else {
    cb("Action not implemented");
  }
});

gulp.task('run-mongo', function (cb) {
  execFile('./startMongoIfNotRunning.sh', {
    cwd: __dirname
  }, function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('stop-mongo', function (cb) {
  execFile('./stopMongoIfRunning.sh', {
    cwd: __dirname
  }, function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('server', [
  'run-mongo', 'webpack-frontend', 'webpack-backend'
], function (cb) {
  execFile('./node_modules/.bin/pm2', ['start', 'process.json'], {
    cwd: __dirname
  }, function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
    process.exit(err ? 1 : 0);
  });
});

gulp.task('build', ['clean', 'webpack-frontend', 'webpack-backend']);
gulp.task('default', ['watch', 'build']);
gulp.task('start', ['default', 'server']);
