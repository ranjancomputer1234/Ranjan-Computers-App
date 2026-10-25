const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

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
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
