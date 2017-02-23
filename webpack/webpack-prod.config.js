var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, '../public/scripts');
var APP_DIR = path.resolve(__dirname, '../src/scripts');

module.exports = {
  entry: [
    APP_DIR + '/ohHell.jsx'
  ],
  output: {
    filename: 'ohHell.js',
    path: BUILD_DIR,
    publicPath: "/scripts/"
  },
  module: {
    rules: [{
      test: /\.jsx$/,
      loader: 'babel-loader',
      options: {
        presets: ['latest', 'react']
      }
    }]
  },
  plugins:[
    new webpack.DefinePlugin({
      'process.env':{
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress:{
        warnings: false
      }
    }),
    new webpack.optimize.DedupePlugin(), //dedupe similar code 
    new webpack.optimize.AggressiveMergingPlugin()//Merge chunks 
  ]
}
