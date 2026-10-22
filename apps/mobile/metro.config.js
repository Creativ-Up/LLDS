// Configuration Metro : import des SVG comme composants (react-native-svg-transformer,
// précédé de l'aplatissement des <svg> imbriqués, cf. svg-transformer.js).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('./svg-transformer.js'),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = config;
