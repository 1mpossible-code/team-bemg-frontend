const path = require('path');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      if (webpackConfig.optimization?.minimizer) {
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.map(
          (plugin) => {
            if (plugin.constructor.name === 'CssMinimizerPlugin') {
              return new CssMinimizerPlugin({
                minimizerOptions: {
                  preset: ['default', { calc: false }],
                },
              });
            }
            return plugin;
          }
        );
      }
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings ?? []),
        /Failed to parse source map/,
      ];

      return webpackConfig;
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  },
  style: {
    postcss: {
      plugins: [require('@tailwindcss/postcss')],
    },
  },
};
