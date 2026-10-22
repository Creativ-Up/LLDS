// SVG importés comme composants (react-native-svg-transformer, cf. metro.config.js).
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: FC<SvgProps>;
  export default content;
}

// Images empaquetées par Metro (identifiant d'asset).
declare module '*.png' {
  import type { ImageRequireSource } from 'react-native';

  const content: ImageRequireSource;
  export default content;
}

declare module '*.jpg' {
  import type { ImageRequireSource } from 'react-native';

  const content: ImageRequireSource;
  export default content;
}
