const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withAndroidPackagingOptions(config) {
  return withGradleProperties(config, (config) => {
    // Check if the property already exists to avoid duplicates
    const existing = config.modResults.find(
      (prop) => prop.type === 'property' && prop.key === 'android.packagingOptions.pickFirsts'
    );

    if (!existing) {
      const packagingOptions =
        'lib/arm64-v8a/libexpo-gl.so,lib/armeabi-v7a/libexpo-gl.so,lib/x86/libexpo-gl.so,lib/x86_64/libexpo-gl.so';

      config.modResults.push({
        type: 'property',
        key: 'android.packagingOptions.pickFirsts',
        value: packagingOptions,
      });
    }

    return config;
  });
};
