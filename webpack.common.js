const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

/*
class RsyncPlugin {
  constructor(opts) {
    this.from = opts.from;
    this.to = opts.to;
  }
  // Define `apply` as its prototype method which is supplied with compiler as its argument
  apply(compiler) {
    compiler.hooks.done.tap("rsync", (stats) => {
      const { path: outputPath } = stats.compilation.options.output;
      const rsync = new Rsync()
        .archive()
        .source(this.from)
        .destination(path.join(outputPath, this.to));
      rsync.execute((error, code, cmd) => {
        console.log('rsync\'ed', this.from, 'to', this.to);
      });
    });
  }
}
*/

let config = {
  module: {
    rules: [
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: '/fonts/',
            },
          },
        ],
      },
      {
        test: /\.html$/,
        loader: 'file-loader?name=[name].[ext]&context=./src/react/static',
      },
      {test: /\.css$/, loader: ['style-loader', 'css-loader']},
      {
        test: /\.(ts|tsx)$/,
        include: [path.resolve(__dirname, 'src')],
        loader: ['ts-loader'],
      },
      {
        test: /\.(js|jsx)$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/lance-gg/'),
          fs.realpathSync('./node_modules/lance-gg/'),
        ],
        loader: 'babel-loader',
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
  },
};

var bundleConfig = Object.assign({}, config, {
  entry: './src/client/main.jsx',
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new CopyPlugin([
      {from: './src/client/images/', to: './images', cache: true},
      {from: './src/client/sounds/', to: './sounds', cache: true},
      {from: './src/client/favicon.ico', to: './favicon.ico', cache: true},
    ]),
  ],
});

module.exports = [bundleConfig];
