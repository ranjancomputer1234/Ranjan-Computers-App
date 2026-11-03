const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * @react-native/virtualized-lists@0.87.1 imports this private module by
 * package subpath. react-native@0.87.1 does not list it in "exports", so
 * Metro warns and falls back to the file. Resolve it directly.
 */
const REACT_NATIVE_FEATURE_FLAGS = path.join(
  __dirname,
  'node_modules',
  'react-native',
  'src',
  'private',
  'featureflags',
  'ReactNativeFeatureFlags.js',
);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * On Windows + Android emulator, Metro's multipart/mixed chunked bundle
 * download often fails in OkHttp (ProtocolException / stuck at 100%).
 * Strip multipart Accept so Metro serves plain application/javascript.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        const accept = req.headers.accept;
        if (
          typeof accept === 'string' &&
          accept.includes('multipart/mixed') &&
          typeof req.url === 'string' &&
          req.url.includes('.bundle')
        ) {
          req.headers.accept = accept
            .split(',')
            .map((part) => part.trim())
            .filter((part) => !part.includes('multipart/mixed'))
            .join(', ');
          if (!req.headers.accept) {
            req.headers.accept = 'application/javascript';
          }
        }
        return middleware(req, res, next);
      };
    },
  },
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (
        moduleName ===
          'react-native/src/private/featureflags/ReactNativeFeatureFlags' ||
        moduleName ===
          'react-native/src/private/featureflags/ReactNativeFeatureFlags.js'
      ) {
        return {
          type: 'sourceFile',
          filePath: REACT_NATIVE_FEATURE_FLAGS,
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
