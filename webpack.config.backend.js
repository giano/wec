var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var path = require('path');
var config = require('config');

var folders = {
  SOURCE: path.resolve(__dirname, '../src'),
  BUILD: path.resolve(__dirname, '../dist'),
  BOWER: path.resolve(__dirname, './bower_components'),
  NPM: path.resolve(__dirname, './node_modules')
};

module.exports = {
  module: {
    loaders: [
      {
        test: /\.s?css$/,
        exclude: /node_modules/,
        loaders: [
          'style-loader', 'css-loader?modules&importLoaders=1', 'sass-loader?' + ['outputStyle=nested'].join('&'), 'postcss-loader'
        ]
      }, {
        test: /\.json$/,
        loader: 'json'
      }, {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        include: [__dirname + '/src'],
        loader: 'babel?presets[]=es2015&presets[]=es2016&plugins[]=add-module-exports'
      }
    ]
  },
  stats: {
    colors: true,
    reasons: true
  },
  externals: [nodeExternals()],
  target: 'node',
  entry: {
    server: './src/backend/entry.js'
  },
  node: {
    console: true,
    global: true,
    process: true,
    Buffer: true,
    __filename: true,
    __dirname: true,
    setImmediate: true
  },
  devtool: 'source-map',
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    chunkFilename: '[id].bundle.js'
  },
  resolve: {
    root: __dirname + '/dist',
    extensions: ["", ".js", ".jsx", '.es6']
  }
};
