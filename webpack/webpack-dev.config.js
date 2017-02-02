var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, '../public/scripts');
var APP_DIR = path.resolve(__dirname, '../src/scripts');

module.exports = {
  entry: [
    APP_DIR + '/ohHell.jsx'
  ],
  output: {
  	filename: '/ohHell.js',
  	path: BUILD_DIR,
    publicPath: '/scripts/'
  },
  module: {
    loaders: [
      {
      	test: /\.jsx$/,
      	exclude: /node_modules/,
      	loader: 'babel-loader',
        query: {
          presets: ['latest', 'react']
        }
      }
    ]
  }
}
