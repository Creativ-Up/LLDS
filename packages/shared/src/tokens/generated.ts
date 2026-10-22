// Généré par packages/shared/scripts/build-tokens.ts depuis tokens/tokens.json — ne pas modifier.

export const tokens = {
  "color": {
    "palette": {
      "red900": "#8C191C",
      "red500": "#E42127",
      "red300": "#F0565E",
      "red200": "#F6A1A7",
      "olive700": "#77732F",
      "olive500": "#B8B248",
      "olive200": "#F4E789",
      "cream": "#FFFDF2",
      "brown900": "#563A29",
      "brown700": "#70462C",
      "brown500": "#A87551",
      "brown300": "#D3AF94"
    },
    "admin": {
      "page": "#F3F0DD",
      "surface": "#FFFDF2",
      "surfaceAlt": "#F7F4E2",
      "border": "#DDD9B8",
      "divider": "#EFEBD3",
      "dividerStrong": "#E6E2C4",
      "navActive": "#EAE7BF",
      "navHover": "#F1EED6",
      "navText": "#4A4243",
      "mapBg": "#FBF9EC",
      "missingBg": "#FFF8F4",
      "scrim": "rgba(35,31,32,0.28)",
      "scrimModal": "rgba(35,31,32,0.32)",
      "shadowSoft": "rgba(35,31,32,0.08)",
      "shadowCard": "rgba(35,31,32,0.1)",
      "shadowDrawer": "rgba(35,31,32,0.14)",
      "shadowModal": "rgba(35,31,32,0.22)",
      "shadowStrong": "rgba(35,31,32,0.25)",
      "selection": "rgba(228,33,39,0.16)",
      "radiusFill": "rgba(119,115,47,0.12)"
    },
    "cream": "#FFFDF2",
    "ink": "#231F20",
    "red": "#E42127",
    "redDeep": "#8C191C",
    "redTint": "#FBE9E9",
    "rose": "#F6A1A7",
    "roseLight": "#F6D3D5",
    "olive": "#77732F",
    "oliveDark": "#635F26",
    "oliveText": "#5E5A22",
    "tilleul": "#B8B248",
    "tilleulLight": "#EAE7BF",
    "sepia": "#563A29",
    "grey": "#585858",
    "greyDisabled": "#8D8D80",
    "passiveBg": "#EDEACB",
    "passiveBorder": "#DCD8A8",
    "passiveText": "#A9A67C",
    "scrim": "rgba(35,31,32,0.3)",
    "white": "#FFFFFF",
    "haloRed": "rgba(228,33,39,0.18)",
    "haloRedSoft": "rgba(228,33,39,0.16)",
    "haloTilleul": "rgba(184,178,72,0.24)",
    "photoBg": "#EDE7D6",
    "pressTilleul": "#F5F1D9",
    "overlayTop": "rgba(255,253,242,0.1)",
    "overlayMid": "rgba(35,31,32,0.5)",
    "overlayBottom": "rgba(35,31,32,0.82)",
    "scrimLine": "rgba(35,31,32,0.32)",
    "stampRing": "rgba(86,58,41,0.55)",
    "stampRingEmpty": "rgba(86,58,41,0.2)"
  },
  "font": {
    "family": "Inter",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "italic": [
      500,
      600
    ]
  },
  "type": {
    "screenTitle": {
      "size": 32,
      "lineHeight": 1.14,
      "weight": 600,
      "letterSpacing": -0.025
    },
    "pageTitle": {
      "size": 30,
      "lineHeight": 1.2,
      "weight": 600,
      "letterSpacing": -0.025
    },
    "poiName": {
      "size": 30,
      "lineHeight": 1.2,
      "weight": 500
    },
    "body": {
      "size": 16,
      "lineHeight": 1.4,
      "weight": 400
    },
    "bodySmall": {
      "size": 14.5,
      "lineHeight": 1.38,
      "weight": 400
    },
    "label": {
      "size": 13,
      "weight": 500,
      "letterSpacing": 0.07,
      "uppercase": true
    },
    "cta": {
      "size": 16,
      "weight": 500,
      "letterSpacing": 0.06,
      "uppercase": true
    },
    "button": {
      "size": 16,
      "weight": 500
    }
  },
  "radius": {
    "field": 8,
    "cta": 8,
    "card": 8,
    "button": 10,
    "ticket": 13,
    "box": 4,
    "poiButton": 7,
    "pill": 999,
    "sheetTop": 20,
    "sheetBottom": 40,
    "banner": 18
  },
  "stroke": {
    "control": 2,
    "ticket": 2.6,
    "mapTrack": 7,
    "linePlan": 3,
    "choiceRing": 4
  },
  "layout": {
    "baseWidth": 390,
    "baseHeight": 852,
    "sideMargin": 31,
    "minTouch": 44
  },
  "motion": {
    "easing": [
      0.2,
      0.7,
      0.2,
      1
    ],
    "screenIn": 340,
    "sheetUp": 340,
    "pop": 300,
    "stamp": 600,
    "pulse": 2200,
    "draw": 1100,
    "drop": 450,
    "autoAdvance": 380
  }
} as const;
