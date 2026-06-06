const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const zustandDir = path.resolve(__dirname, 'node_modules/zustand');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'react-native-maps' || moduleName === 'react-native-web-maps')) {
    // react-native-web-maps uses React.createFactory which was removed in React 19.
    // Stub both to empty; MapErrorBoundary catches the render-time failure.
    return { type: 'empty' };
  }
  if (platform === 'web' && moduleName.startsWith('@nozbe/watermelondb/adapters/sqlite')) {
    return { type: 'empty' };
  }
  if (platform === 'web' && moduleName === 'better-sqlite3') {
    return { type: 'empty' };
  }
  if (platform === 'web' && (
      moduleName === '@stripe/stripe-terminal-react-native' ||
      moduleName === 'react-native-signature-canvas' ||
      moduleName === 'react-native-webview'
  )) {
    return { type: 'empty' };
  }
  // Zustand v5 ESM build uses import.meta.env which is invalid outside ES modules.
  // Force the CJS build on web so Metro's non-module bundle doesn't crash.
  if (platform === 'web' && moduleName === 'zustand') {
    return { type: 'sourceFile', filePath: path.join(zustandDir, 'index.js') };
  }
  if (platform === 'web' && moduleName.startsWith('zustand/')) {
    const subpath = moduleName.slice('zustand/'.length);
    return { type: 'sourceFile', filePath: path.join(zustandDir, `${subpath}.js`) };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
