var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var package = require('./package.json');
var config = require('config');
var _ = require('lodash');
var utils = require('./lib/utils');

var aliases = utils.extractAliases('fullpath');

var folders = {
  SOURCE: path.resolve(__dirname, '../src'),
  BUILD: path.resolve(__dirname, '../dist'),
  BOWER: path.resolve(__dirname, './bower_components'),
  NPM: path.resolve(__dirname, './node_modules')
};

module.exports = {
  module: {
    loaders: [{
      test: /\.(pug|jade)/,
      loader: 'pug?pretty'
    }, {
      test: /\.s?css$/,
      exclude: /node_modules/,
      loaders: [
        'style-loader', 'css-loader?modules&importLoaders=1', 'sass-loader?' + ['outputStyle=nested'].join('&'),
        'postcss-loader'
      ]
    }, {
      test: /\.json$/,
      loader: 'json'
    }, {
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      include: [__dirname + '/src'],
      loader: 'babel?presets[]=es2015&presets[]=es2016&plugins[]=add-module-exports'
    }]
  },
  stats: {
    colors: true,
    reasons: true
  },
  externals: [nodeExternals()],
  target: 'web',
  entry: {
    frontend: ['./src/frontend/requirejs_config.js', './src/frontend/entry.js', './src/frontend/styles/style.scss']
  },
  devtool: 'source-map',
  output: {
    path: __dirname + '/dist',
    filename: '[name].[hash].js',
    chunkFilename: '[id].bundle.[chunkhash].js'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin(config.get('webpack.html')),
    new webpack.optimize.UglifyJsPlugin()
  ],
  resolve: {
    alias: aliases,
    modulesDirectories: ['bower_components', 'node_modules'],
    root: __dirname + '/dist',
    extensions: ["", ".js", ".jsx", '.es6']
  }
};
