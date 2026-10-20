# Dashboard d'administration — spécification fonctionnelle

Maquette cliquable : `prototype/source/Dashboard admin LLDS.dc.html` (source de vérité visuelle ; chaque écran a un `data-screen-label` A0 à A9). Interface en français, shadcn/ui habillé avec les tokens LLDS.

## Système visuel du dashboard
- **Fonds** : page `#F3F0DD` ; barre latérale, cartes et panneaux `#FFFDF2` ; zones secondaires `#F7F4E2`.
- **Bordures** : cartes `inset 0 0 0 1px #DDD9B8`, rayon 10 ; séparateurs de lignes `#EFEBD3` (en-tête `#E6E2C4`).
- **Champs** : hauteur 40, rayon 8, `inset 0 0 0 1.5px #B8B248`, focus 2 px `#77732F` ; champs en lecture seule fond `#F7F4E2` bordure `#DDD9B8`.
- **Libellés** : 500 12 px, approche 0,07 em, capitales, `#77732F`.
- **Titres** : page 600 28 px (−0,02 em) ; section 600 15–16 px. Corps 14 px ; secondaire 13 px `#585858`.
- **Boutons** : principal h 40 rayon 8 fond `#77732F` texte `#FFFDF2` (survol `#635F26`) ; secondaire contour 1,5 px `#77732F` ; destructif fond `#E42127` (survol `#8C191C`) ou lien rouge ; désactivé fond `#DDD9B8` texte `#8D8D80`.
- **Statuts** : Publiée (fond `#77732F`, texte crème), Brouillon (`#EAE7BF` / `#5E5A22`), Bientôt disponible (crème / `#77732F`).
- **Navigation latérale** : 236 px, fixe ; élément actif fond `#EAE7BF`, survol `#F1EED6`.
- **Panneaux latéraux** : largeur min(940 px, 100 vw), entrée glissée 0,3 s ; voile `rgba(35,31,32,.28)`. Colonne d'aperçu à droite (300 px, fond `#F3F0DD`).
- **Notifications** : toast sombre `#231F20` en bas au centre, 2,6 s.
- **Erreurs / manques** : pastille rouge `#E42127` sur l'élément concerné, texte rouge « Manque : … ».

## Accès
- Connexion e-mail + mot de passe (Supabase Auth). Seuls les profils `role = 'admin'` accèdent au dashboard. Le premier admin est créé par seed.

## Navigation latérale
Tableau de bord · Lignes · Cachets · Partenaires & avantages · Médiathèque · Utilisateurs · Réglages

## Tableau de bord
- Compteurs simples : lignes publiées / brouillons, arrêts, utilisateurs inscrits, arrêts sans média complet (liste cliquable des contenus incomplets).

## Lignes
- **Liste** : code, nom, statut, nombre d'arrêts (calculé), longueur (calculée), dernière publication. Réordonnancement par glisser.
- **Éditeur de ligne** (2 colonnes : formulaire à gauche, carte MapLibre à droite)
  - Code, nom et accroche en FR / NL / EN (onglets de langue), carte postale de couverture.
  - **Tracé** : import d'un fichier GPX, GeoJSON ou KML ; affiché sur la carte ; longueur recalculée.
  - **Arrêts** : liste ordonnée (glisser ou flèches pour réordonner), marqueurs numérotés (noir, rouge si sélectionné, pastille rouge si incomplet) ; « Ajouter un arrêt » passe la carte en mode placement (curseur en croix, consigne en haut) : le clic place l'arrêt **projeté sur le tracé** et l'insère dans l'ordre selon sa position le long de la ligne ; marqueurs déplaçables ; cercle du rayon de déclenchement visible autour de l'arrêt sélectionné.
  - **Contrôle avant publication** : tracé présent, au moins 1 arrêt, chaque arrêt a nom FR, carte postale et vidéo ou audio FR. Liste des manques affichée. **« Publier » reste désactivé tant qu'un point bloquant subsiste** ; les traductions NL / EN manquantes sont signalées mais non bloquantes (repli sur le FR).
  - **Taille de téléchargement** estimée (expérience complète / audio seul), calculée depuis les médias.
  - Statut : brouillon / bientôt disponible / publiée. Publier incrémente `content_version`.
- **Éditeur d'arrêt** (panneau ou page, onglets)
  - *Infos* : nom, année, description (FR / NL / EN), position, rayon, points, « disponible uniquement sur place ».
  - *Médias* : carte postale d'archive, photo actuelle (optionnelle), vidéo, audio seul et sous-titres (.vtt) par langue, durée d'aperçu invité, crédit / source de chaque archive.
  - *Services* : 7 cases à cocher avec les icônes LLDS (café, parking, info, restaurant, gare, patrimoine, remise).
  - *Récompense* : cachet associé (optionnel).
  - Colonne d'aperçu : fiche du point telle qu'elle apparaîtra dans l'app, mise à jour en direct (nom, services, description, état du bouton « Vivre l'expérience »).
  - Dans *Médias*, la grille langue × (vidéo, audio seul, sous-titres) signale en rouge « Téléverser — requis » quand il manque toute narration FR.

## Cachets
- Liste en grille ; création : nom (3 langues), image (PNG transparent, optionnelle → cachet générique), règle d'attribution : arrêt terminé, ligne terminée, ou seuil de points (+ valeur).

## Partenaires & avantages
- Partenaire : nom, adresse, horaires, photo, logo.
- Avantage : partenaire, titre, description, conditions (3 langues), cachet requis, arrêt à partir duquel il devient visible, dates de validité, actif / inactif. Aperçu du bon tel qu'affiché dans l'app.

## Médiathèque
- Tous les fichiers téléversés : type, taille, durée, utilisation (où le média est utilisé), crédit. Téléversement par glisser-déposer avec barre de progression ; formats acceptés : JPG / PNG / WebP, MP4 (H.264 + AAC), M4A / MP3, VTT. Avertissement au-delà de 200 Mo par vidéo.

## Utilisateurs
- Liste en lecture seule : prénom, e-mail, date d'inscription, lignes en cours / terminées, points, cachets. Action « Supprimer le compte » (RGPD) avec confirmation.

## Réglages
- Rayon de déclenchement par défaut, vitesses par mode (durées estimées), durée d'aperçu invité par défaut.
