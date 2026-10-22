// Transformeur Metro des SVG : aplatit les <svg> imbriqués (exports de la maquette) avant
// react-native-svg-transformer. react-native-svg recadre et met à l'échelle ces sous-viewports
// de travers (icônes tronquées ou déformées) ; un <g transform> équivalent s'affiche correctement.
// Les fichiers source restent intacts (métadonnées de provenance comprises).
const upstream = require('react-native-svg-transformer/expo');

const TAG = /<svg\b([^>]*?)(\/?)>|<\/svg>/g;

function attribute(attributes, name) {
  const match = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attributes);
  return match ? match[1] : undefined;
}

/** Transformation équivalente au viewport imbriqué, ou null s'il faut le garder tel quel. */
function nestedTransform(attributes) {
  // Sans overflow="visible", le viewport recadre : un <g> ne serait pas équivalent.
  if (attribute(attributes, 'overflow') !== 'visible') return null;
  const x = Number(attribute(attributes, 'x') ?? 0);
  const y = Number(attribute(attributes, 'y') ?? 0);
  const width = Number(attribute(attributes, 'width'));
  const height = Number(attribute(attributes, 'height'));
  const viewBox = (attribute(attributes, 'viewBox') ?? `0 0 ${width} ${height}`).trim().split(/[\s,]+/).map(Number);
  const [minX = 0, minY = 0, boxWidth = width, boxHeight = height] = viewBox;
  if (![x, y, width, height, minX, minY, boxWidth, boxHeight].every(Number.isFinite) || boxWidth <= 0 || boxHeight <= 0) {
    return null;
  }
  // preserveAspectRatio par défaut : xMidYMid meet.
  const scale = Math.min(width / boxWidth, height / boxHeight);
  const tx = x + (width - boxWidth * scale) / 2 - minX * scale;
  const ty = y + (height - boxHeight * scale) / 2 - minY * scale;
  const round = (value) => Number(value.toFixed(4));
  return Math.abs(scale - 1) < 1e-6
    ? `translate(${round(tx)} ${round(ty)})`
    : `translate(${round(tx)} ${round(ty)}) scale(${round(scale)})`;
}

const GEOMETRY = /\s(?:x|y|width|height|viewBox|overflow|preserveAspectRatio|xmlns(?::\w+)?)="[^"]*"/g;

function flattenNestedSvg(src) {
  const stack = [];
  return src.replace(TAG, (tag, attributes, selfClosing) => {
    if (tag === '</svg>') return stack.pop() ? '</g>' : tag;
    const nested = stack.length > 0;
    const transform = nested ? nestedTransform(attributes) : null;
    if (!selfClosing) stack.push(Boolean(transform));
    if (!transform) return tag;
    return `<g transform="${transform}"${attributes.replace(GEOMETRY, '')}${selfClosing}>`;
  });
}

module.exports.flattenNestedSvg = flattenNestedSvg;

module.exports.transform = (params) =>
  upstream.transform(params.filename.endsWith('.svg') ? { ...params, src: flattenNestedSvg(params.src) } : params);
