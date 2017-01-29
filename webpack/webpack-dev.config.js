var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, '../public/scripts');
var APP_DIR = path.resolve(__dirname, '../src/scripts');

module.exports = {
  entry: [
    APP_DIR + '/ohhell.jsx'
  ],
  output: {
  	filename: '[name].js',
  	path: BUILD_DIR + '/public',
  	publicPath: '/public'
  },
  module: {
    loaders: [{
    	test: /\.jsx$/,
    	exclude: /node_modules/,
    	loader: 'babel-loader'
    }]
  }
}
