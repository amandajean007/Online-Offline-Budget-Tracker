const WebpackPwaManifest = require('webpack-pwa-manifest');
const path = require('path');

const config = {
  entry: '.public/index.js',
  output: {
    path: __dirname + '/public',
    filename: 'bundle.js',
  },
  mode: 'production', // development, production
    plugins: [
    new WebpackPwaManifest({
      filename: 'manifest.json',
      inject: false,
      fingerprints: false,

      name: 'Budget Tracker app',
      short_name: 'Budget',
      description: 'An application that allows you to keep track of your budget both on and offline',
      background_color: '#000000',
      theme_color: '#ffffff',
      start_url: '/',
      display: 'standalone',

      icons: [
        {
          src: path.resolve(__dirname, 'public/icons/icon-512x512.png'),
          sizes: [192, 512],
        },
      ],
    }),
  ],
};

module.exports = config;