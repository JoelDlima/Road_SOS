const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Stub react-dom so web-only transitive deps (e.g. react-aria) don't crash Metro
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    'react-dom': path.resolve(__dirname, 'shims/react-dom.js'),
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
