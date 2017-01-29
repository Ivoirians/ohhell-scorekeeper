var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, '../public/scripts');
var APP_DIR = path.resolve(__dirname, '../src/scripts');

module.exports = {
  entry: [
    APP_DIR + '/ohhell.jsx'
  ],
  output: {
  	filename: 'ohhell.js',
  	path: BUILD_DIR,
  	publicPath: '/public/'
  },
  module: {
    loaders: [
      {
      	test: /\.jsx$/,
      	exclude: /node_modules/,
      	loader: 'babel-loader'
      }
    ]
  }
}
