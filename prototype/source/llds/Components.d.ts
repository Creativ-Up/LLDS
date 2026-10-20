// Components.d.ts — the complete catalog of the 1 component(s) in
// Components.bundle.js. READ THIS FILE BEFORE USING THE BUNDLE: component
// names are derived from Figma layer names (sanitized to PascalCase,
// deduplicated) and may differ from what the design calls them — the
// "figma layer" comment above each interface maps them back.
// After the bundle <script> loads, every component is a window global
// (e.g. window.AppLigneDTails) and usable directly in JSX.
import * as React from 'react';

// figma layer: "App ligne détails" (node 330:6044)
export interface AppLigneDTailsProps {
  className?: string;
  style?: React.CSSProperties;
}

declare const AppLigneDTails: React.FC<AppLigneDTailsProps>;
declare global {
  interface Window {
    AppLigneDTails: React.FC<AppLigneDTailsProps>;
  }
}
