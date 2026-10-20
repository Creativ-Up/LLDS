# Handoff — Les lignes du souvenir (PoC)

Application mobile de tourisme patrimonial le long d'anciennes lignes de chemin de fer de Wallonie, et son **back-office d'administration**. Le visiteur choisit une ligne, la parcourt à pied, à vélo ou en voiture, et à chaque ancien arrêt il revoit le lieu tel qu'il était grâce à une carte postale d'archive animée et narrée. Il récolte des points et des cachets, qui débloquent des avantages chez des partenaires locaux.

**Objectif du PoC** : une application mobile fonctionnelle (iOS + Android) et un dashboard admin fonctionnel. Aucun objectif de métriques ou d'analytics à ce stade.

## À propos des fichiers de design

Les fichiers de ce dossier sont des **références de design réalisées en HTML** : un prototype qui montre l'apparence et le comportement attendus. **Ce n'est pas du code de production à copier.** La tâche consiste à recréer ces écrans dans la pile technique décrite dans `docs/ARCHITECTURE.md`, avec ses propres patterns et bibliothèques.

- `prototype/Prototype LLDS (autonome).html` : à ouvrir dans un navigateur, fonctionne hors ligne. Barre de boutons sous le téléphone pour sauter à chaque écran.
- `prototype/source/Dashboard admin LLDS.dc.html` : **maquette cliquable du dashboard admin** (même dossier, même serveur statique). Écrans repérés par `data-screen-label` (« A0 Connexion admin » … « A9 Réglages »).
- `prototype/source/Les lignes du souvenir - LLDS.dc.html` : **source de vérité au pixel près**. Tout est en styles inline ; chaque écran est repérable par son attribut `data-screen-label` (ex. `"07 Carte du parcours"`). La logique de démo est la classe `Component` en bas du fichier. Pour l'ouvrir, servir le dossier `prototype/source/` avec un serveur statique (`npx serve prototype/source`).

## Fidélité

**Haute fidélité (hifi)** pour l'application mobile : couleurs, typographie, espacements, textes et animations sont définitifs. Recréer au pixel près sur une base de 390 × 852 pt (iPhone 14/15), en restant fluide sur les autres tailles (marges latérales fixes de 31–32 pt, contenu centré, éléments en bas d'écran ancrés au bas de la zone sûre).

**Haute fidélité** aussi pour le dashboard admin (`prototype/source/Dashboard admin LLDS.dc.html`, spécifié dans `docs/ADMIN.md`) : desktop, fluide à partir de 1024 px de large. Le fond de carte de l'éditeur de ligne y est schématique : le vrai dashboard affiche une carte MapLibre avec le tracé réel.

## Règle d'or : tout est piloté par le back-office

Le prototype contient des valeurs de démonstration (11 arrêts sur la L87, 180 Mo, noms de cachets, partenaire « Au Chaudron des Légendes », dates historiques des descriptions). **Ce sont des hypothèses, à ne jamais coder en dur.** En particulier :

- **Nombre d'arrêts par ligne : libre**, défini par l'administrateur. Tous les compteurs (« Arrêt 3 sur N », « 4/N arrêts », points max, cachets de la ligne, plan de ligne, durée estimée) sont calculés.
- **Distance d'une ligne** : calculée à partir du tracé importé.
- **Taille du téléchargement** : calculée à partir de la taille réelle des médias.
- **Cachets, partenaires, avantages et conditions** : créés dans le back-office.
- **Textes des arrêts** (descriptions, sous-titres) : saisis dans le back-office en FR / NL / EN. Ceux du prototype sont des textes de remplissage **non vérifiés historiquement**.

## Documents

| Fichier | Contenu |
| --- | --- |
| `CLAUDE.md` | Instructions de travail pour Claude Code : ordre des jalons, conventions, critères d'acceptation |
| `docs/ARCHITECTURE.md` | Pile technique retenue et justification, structure du monorepo |
| `docs/DEVELOPPEMENT.md` | Installation, commandes du monorepo, services locaux |
| `docs/DATA_MODEL.md` | Schéma de base de données (Supabase / Postgres + PostGIS), règles d'accès |
| `docs/ADMIN.md` | Spécification fonctionnelle du dashboard admin |
| `docs/SCREENS.md` | Spécification écran par écran de l'app mobile (layout, valeurs, textes, états) |
| `docs/BEHAVIOR.md` | Navigation, géolocalisation, hors ligne, mode invité, récompenses, animations |
| `docs/DESIGN_TOKENS.md` | Couleurs, typographie, rayons, composants récurrents |
| `tokens/tokens.json`, `tokens/tokens.css` | Tokens machine-lisibles (mobile et admin) |
| `seed/demo-seed.json` | Jeu de données de démonstration (fictif) pour le développement |

## Assets

| Dossier | Contenu | Origine |
| --- | --- | --- |
| `assets/brand/` | Logo LLDS positif | Figma LLDS.fig |
| `assets/icons/` | 7 icônes de services, play, 3 icônes de transport, retour | Vecteurs du Figma LLDS.fig, renommés selon leur sens réel |
| `assets/stamps/` | Cachet « Bière locale » (le seul disponible) | Figma LLDS.fig |
| `assets/demo/` | Photos et cartes postales de démonstration | Figma LLDS.fig — **démo uniquement** |

Attention aux noms des icônes de service : dans le Figma, le « B » dans un anneau (`service-gare-sncb.svg`) est la **gare SNCB**, et la silhouette de bâtiments (`service-patrimoine.svg`) est le **patrimoine**.

Les illustrations du prototype (réseau ferré stylisé des écrans Langue et Transport, tickets roses en fond, stepper, cadres « billet perforé ») sont dessinées en SVG inline dans la source : les recréer avec `react-native-svg` à partir des coordonnées de la source.

## Points ouverts (à ne pas bloquer)

1. **Images des cachets** : une seule existe (Bière locale). Les autres seront téléversées dans le back-office ; prévoir un **cachet générique** de remplacement (cercle sépia `#563A29` + cercle intérieur en pointillés + coche, voir écran « Ligne terminée »).
2. **Logo négatif** : pas de fichier. Ne pas afficher le logo sur fond sombre dans l'app ; sur l'accueil, il est posé sur la partie claire de la carte postale.
3. **Droits des archives** : la carte postale de l'accueil provient d'un scan Delcampe (bandeau de crédits en bas, masqué par recadrage). Les droits de chaque archive sont à vérifier par le client avant diffusion publique.
4. **Stepper d'onboarding** : le Figma montre 7 pastilles ; le parcours actuel compte 5 étapes (Langue, Ligne, Transport, Expérience, Prêt). Implémenter un composant `Stepper` paramétrable et l'utiliser avec 5 étapes.
5. **« Parcours adulte »** (Paramètres) : une seule option pour le PoC ; garder la ligne, désactivée.
6. **Hors périmètre du PoC** : quiz de fin de parcours, indiçage, écran d'orientation, analytics.
