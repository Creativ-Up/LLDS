// Plugin de configuration Expo : build Android natif sous Windows.
// Les fichiers objets CMake recopient le chemin complet des sources (« C_/Users/…/node_modules/… ») et
// dépassent 260 caractères dans un dossier profond. Le ninja livré avec CMake 3.22.1 (version par défaut
// d'AGP) ne gère pas ces chemins : on choisit un CMake du SDK dont le ninja les gère (la prise en charge
// des chemins longs doit être activée dans Windows). Propriété lue par le plugin racine d'Expo.
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'android.cmakeVersion';
const CMAKE_VERSION = '3.31.6';

module.exports = function withLongPathCmake(config) {
  return withGradleProperties(config, (gradle) => {
    gradle.modResults = gradle.modResults.filter((item) => !(item.type === 'property' && item.key === KEY));
    gradle.modResults.push({ type: 'property', key: KEY, value: CMAKE_VERSION });
    return gradle;
  });
};
