const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // Allow .bin files (TFJS model shards)
  config.resolver.assetExts.push("bin");

  return config;
})();
