const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin')

module.exports = common.map(
  config => merge(config, {
    devtool: 'source-map',
    performance: {
      hints: 'warning'
    },
    output: {
      pathinfo: false
    },
    optimization: {
      namedModules: false,
      namedChunks: false,
      nodeEnv: 'production',
      flagIncludedChunks: true,
      occurrenceOrder: true,
      concatenateModules: true,
      splitChunks: {
        hidePathInfo: true,
        minSize: 30000,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
      },
      noEmitOnErrors: true,
      checkWasmTypes: true,
      minimize: true,
      minimizer: [
    	  new TerserPlugin({
	        terserOptions: {
	          keep_classnames: true,
            keep_fnames: true
	        }
	      })
    	]
    },
    plugins: [
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.NoEmitOnErrorsPlugin()
    ]
  })
);
