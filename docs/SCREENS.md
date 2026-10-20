# Écrans de l'application mobile

Base : 390 × 852 pt. Coordonnées `(x, y)` en pt depuis le coin haut-gauche, comme dans la source du prototype (repérer chaque écran par `data-screen-label`). Polices : Inter partout. Couleurs : voir `DESIGN_TOKENS.md`. Les textes entre guillemets sont les textes exacts (clés i18n FR). `{…}` = valeur calculée.

## Éléments communs

- **Bouton retour** : cercle 44 × 44 en (31, 68), contour intérieur 2 pt `red`, chevron 12 × 18 trait 2,4 `red`. Survol / appui : fond `redTint` (`#FBE9E9`). Variante « fermer » : croix 14 × 14.
- **Stepper d'onboarding** : en (94, 86), 260 × 12. Ligne 2 pt `rose` ; pastille faite = cercle r 5,5 `red` plein ; à venir = r 5 fond `cream` contour 1,6 `rose`. Nombre de pastilles = nombre d'étapes (5).
- **Titre d'écran** : 600, 32–34 pt, interligne 1,14, approche −0,025 em, `ink`, à x = 32, y ≈ 138–150. **Sous-titre** : 400, 16 pt, `olive`, 10–11 pt sous le titre.
- **Libellé de section** : 500, 13 pt, approche 0,07 em, capitales, `olive`.
- **Fond décoratif** : petits rectangles « tickets » `rose` (opacité 0,24–0,28), rayon 3, inclinés de −20° à +20°, et 1–2 courbes fines `rose` 1,4 pt ; le tout à opacité 0,5, non interactif, en bas d'écran.
- **Cadre « billet perforé »** : rectangle rayon 13, trait 2,6 pt, extrémités arrondies, `stroke-dasharray` irrégulier (ex. `150 12 58 12 190 12 70 12`) pour simuler la perforation. Utilisé pour les lignes, les types d'expérience, le compte et les paramètres.
- **CTA olive** : 328 × 60, rayon 8, `olive`, texte 500 16 pt capitales approche 0,06 em `cream` à gauche, flèche → à droite (26 × 18, trait 2,4). Appui : `oliveDark` (`#635F26`).
- **Bouton rouge** : hauteur 53–56, rayon 10, `red`, texte blanc 500 16 pt. Appui : `redDeep`. **Bouton contour** : fond `cream`, contour intérieur 2 pt `red`, texte `red`.
- **Encart** : fond `tilleulLight` (`#EAE7BF`), rayon 8, texte `oliveText` (`#5E5A22`).
- **Choix par « gare »** (Langue, Transport) : cercle 72 × 72 fond `cream`, anneau `red` trait 4 en pointillés irréguliers, posé sur l'illustration du réseau. Sélection : halo 6 pt `rgba(228,33,39,.18)` animé (pop), puis passage automatique à l'écran suivant après 380 ms.

---

## 01 Accueil
- Carte postale d'archive plein écran (niveaux de gris), cadrée sur le bâtiment ; le recadrage doit exclure le bandeau de crédits du scan.
- Dégradé vertical : `rgba(255,253,242,.1)` 0 % → transparent 40 % → `rgba(35,31,32,.5)` 74 % → `rgba(35,31,32,.82)` 100 %.
- Logo positif : x = −71, y = 63, largeur 533 (déborde volontairement à gauche).
- Colonne de boutons en (67, 624), largeur 257, écart 19 : « Se connecter » (rouge, h 53) ; « Continuer sans compte » (contour, h 53).
- Lien « Créer un compte » centré en y = 773 : blanc, 500 16 pt, souligné (décalage 3).

## 01b Connexion
- Retour → Accueil. Titre « Se connecter » ; sous-titre « Retrouvez vos points, cachets et parcours. »
- Champs en colonne (x 31, y 250, écart 18) : libellé (style libellé de section) + champ h 52, rayon 8, fond `cream`, contour intérieur 2 pt `tilleul` ; focus `olive` ; erreur `red`. Texte saisi 16 pt.
  - « E-MAIL » (placeholder « prenom@exemple.be »)
  - « MOT DE PASSE » (placeholder « •••••••• ») + bouton œil 44 × 44 à droite pour afficher le mot de passe.
- Lien « Mot de passe oublié ? » aligné à droite, 14 pt `olive` souligné.
- Bandeau d'erreur : fond `redTint`, rayon 8, icône + texte 14 pt `redDeep`.
- Bouton « Se connecter » (rouge, h 56) ; pendant l'envoi : « Un instant… ».
- Séparateur « ou » (traits 1 pt `tilleul`) en y = 640 ; « Continuer sans compte » (contour, h 52) en y = 676.
- Pied en y = 770 : « Pas encore de compte ? » + lien rouge « Créer un compte ».
- Erreurs : « Cette adresse e-mail ne semble pas valide. », « Saisissez votre mot de passe. » ; identifiants refusés par Supabase : « E-mail ou mot de passe incorrect. »

## 01c Inscription
- Titre « Créer un compte » ; sous-titre « Pour garder vos cachets et profiter des avantages partenaires. »
- Champs (y 262, écart 16) : « PRÉNOM » (« Camille »), « E-MAIL », « MOT DE PASSE » (« 8 caractères minimum »).
- Case 24 × 24 rayon 6 (cochée : fond `olive`, coche `cream`) + « J'accepte les conditions d'utilisation et la politique de confidentialité. » (liens soulignés).
- Bouton « Créer mon compte ». Pied : « Déjà inscrit ? » + « Se connecter ».
- Erreurs, dans cet ordre : « Indiquez votre prénom. », « Cette adresse e-mail ne semble pas valide. », « Le mot de passe doit contenir au moins 8 caractères. », « Acceptez les conditions pour créer votre compte. »
- Succès → Langue (ou retour à l'écran d'origine si ouvert depuis le Carnet ou le Lecteur).

## 01d Mot de passe oublié
- Formulaire : titre « Mot de passe oublié », texte « Saisissez l'e-mail de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe. », champ e-mail, bouton « Envoyer le lien ».
- Confirmation : cercle 96 (anneau rouge en pointillés) avec enveloppe ; « Vérifiez vos e-mails » ; « Un lien de réinitialisation a été envoyé à {email}. Il reste valable 1 heure. » ; « Rien reçu ? Regardez dans vos courriers indésirables. » ; boutons « Retour à la connexion » et « Renvoyer l'e-mail » (→ « E-mail renvoyé ✓ »).
- Utiliser `supabase.auth.resetPasswordForEmail` avec un deep link vers un écran « Nouveau mot de passe » (même style que la connexion).

## 02 Langue
- Surtitre « BIENVENUE - WELKOM - WELCOME » 500 15 pt `tilleul` ; titre « Votre langue ? » 600 31 pt.
- Illustration du réseau (traits `ink` 4,5 pt, pointillés, pastilles rouges et crème, repères rouges) — coordonnées dans la source.
- Trois « gares » 72 × 72 en x = 160, y = 276 / 416 / 557 : « FR », « NL », « EN » (500 20 pt).

## 02b Autorisations (2 étapes)
- Indicateur : 2 pilules 28 × 6 + « {n} sur 2 ».
- Illustration : cercle 150 à anneau rouge en pointillés ; étape 1 épingle de localisation avec halo pulsé ; étape 2 cloche qui vibre.
- Étape 1 : « Activez la localisation » ; « Pour situer votre position sur le tracé et vous prévenir à l'approche de chaque arrêt. » ; puces : « Choisissez Toujours pour être alerté téléphone en poche », « Votre position n'est ni stockée, ni partagée ». Bouton « Autoriser la localisation ».
- Étape 2 : « Activez les notifications » ; « Pour savoir qu'une carte postale vous attend, même application fermée. » ; puces : « Une alerte par arrêt, jamais de publicité », « Modifiable à tout moment dans les réglages ». Bouton « Autoriser les notifications ».
- Lien « Plus tard » sous chaque bouton. Le bouton déclenche la **vraie** demande système (la boîte iOS du prototype n'est qu'une illustration). Demander la localisation « pendant l'utilisation » puis « toujours » selon les règles de chaque OS.

## 03 Choix de ligne (défilant)
- Titre « Votre ligne ? » 600 34 pt.
- Encart proximité (328 × 48, y 205) : épingle + « Près de vous : la **{code}** passe à {distance}. » (ligne publiée la plus proche, distance au tracé). Si localisation refusée : contour `tilleul`, « Localisation désactivée » + lien rouge « Activer » (→ Autorisations).
- Liste des lignes (écart 18) : billet 328 × 74 (la ligne suggérée : 90 de haut).
  - Vignette 76 × 54 en (12, 10), bordure 2 pt `tilleul`, image en niveaux de gris + sépia 0,22.
  - Code 700 20 pt + nom italique 500 14 pt ; méta 400 12,5 / 15 pt : « {km}km · {n} arrêts · {accroche} ».
  - Cadre : `olive` pour la ligne suggérée, `ink` pour les autres, `greyDisabled` (`#8D8D80`) — texte inclus — pour « bientôt disponible ».
  - Pilule « Suggérée » en bas à droite : h 26, fond `tilleulLight`, texte `oliveText` 12,5 pt.
- Mode invité : carte 328 avec contour 2 pt `red` : « Mode invité » (600 15) ; « Aperçu gratuit de chaque expérience. Vos points et cachets ne seront pas conservés. » ; lien « Créer un compte gratuit ».

## 03b Détail de ligne
- Code 700 34 pt + nom italique 500 20 pt ; méta 14 pt `olive`.
- Carte postale 328 × 150 en y 214, bordure 2 pt `tilleul`.
- « SENS DE PARCOURS » : contrôle segmenté (contour 2 pt `tilleul`, rayon 10, padding 4) ; options h 38 rayon 7, 13,5 pt ; sélection fond `olive` texte `cream`. Libellés : « {départ} → {arrivée} » et l'inverse.
- Plan de ligne (y 478) : trait 3 pt `ink` ; **un point par arrêt**, répartis régulièrement sur 328 pt (point 15 pt ; visité = rouge plein ; à venir = fond crème, contour 3 pt `ink`). Extrémités libellées en capitales 700 11,5 pt approche 0,08 em ; arrêt courant libellé en `red`. Au-delà de 16 arrêts : points de 11 pt ; au-delà de 24 : barre de progression graduée.
- Encart d'état (y 556) avec cachet 40 pt, selon l'état :
  - Nouvelle : « {k} cachets à récolter » ; « ≈ {durée} à pied · {durée} à vélo » ; CTA « CHOISIR CETTE LIGNE ».
  - En cours : « En cours · {v}/{n} arrêts » ; « {points} points · {c}/{k} cachet · prochain : {arrêt} » ; CTA « REPRENDRE À {ARRÊT} » ; lien « Recommencer la ligne ».
  - Terminée : « Ligne terminée · {n}/{n} arrêts » ; « {points} points · {k}/{k} cachets obtenus » ; CTA « REVOIR LA LIGNE » ; lien « Voir le bilan de la ligne ».

## 04 Transport
- Titre « Votre mode de transport ? » ; « Un parcours qui s'adapte à votre rythme. »
- Même illustration de réseau ; gares 72 × 72 avec icônes `transport-pied` (23 × 31), `transport-velo` (28 × 24), `transport-voiture` (25 × 22).

## 05 Type d'expérience
- Titre « Votre type d'expérience ? » ; « Modifiable à tout moment. »
- Deux billets 328 × 136 (y 274 et 428) ; icône olive + titre 600 21 pt ; texte 400 14,5 / 1,38 :
  - « Expérience complète » — « Cartes postales animées + narration. Le lieu reprend vie sous vos yeux. »
  - « Audio uniquement » — « La narration seule, les yeux sur le paysage. Idéal en roulant. »

## 06 Prêt pour le départ
- Titre « Prêt pour le départ ! ».
- Récapitulatif (y 224) : lignes LANGUE / LIGNE / TRANSPORT / EXPÉRIENCE ; libellé à gauche (style libellé), valeur 500 16 pt à droite ; séparateurs 1 pt `tilleul` ; padding 17 / 4. Chaque ligne est modifiable depuis Paramètres.
- Encart (y 500) horloge + « {n} arrêts · {km} km · environ {durée} {à pied|à vélo|en voiture}. {k} cachets à récolter. »
- Carte de téléchargement 328 × 92 (y 586), fond `cream`, contour 2 pt `tilleul` :
  - À télécharger : « Télécharger la ligne » / « {taille} Mo · sans réseau » + bouton rond 44 `olive` (icône téléchargement).
  - En cours : « Téléchargement… {p} % » + « Annuler » ; barre 6 pt (fond `tilleulLight`, remplissage `olive`) ; « {x} Mo sur {taille} Mo · restez en Wi-Fi ».
  - Terminé : coche rouge 28 + « Ligne disponible hors connexion » / « {taille} Mo · vidéos, audio et carte ».
- CTA « COMMENCER LE PARCOURS » (y 700).

## 07 Carte du parcours
- Fond `cream`, tracé `ink` 7 pt extrémités rondes ; animation de tracé de la partie parcourue (1,1 s, ease-out) à l'ouverture.
- Arrêts : visité = disque r 13 `red` ; à venir = r 12 fond `cream`, contour 1,8 `rose` en pointillés (4 / 3,4) + petit cadenas `rose` si verrouillé. Noms en capitales 700 15 pt approche 1,1 `ink`.
- Position : point 16 `tilleul` cerclé de crème + halo pulsé `rgba(184,178,72,.24)` (2,2 s).
- En haut : pilule de ligne h 39 rayon 20 contour 2 pt `tilleul` (« {code} » 700 12 + nom 400 12) ; boutons ronds 39 contour `tilleul` icônes `olive` : Carnet, Paramètres, Cachets.
- Carte de progression (x 31, y 110, 123 de large, rayon 5, contour 2 pt `tilleul`) : « {v}/{n} arrêts », « {p}/{max} points », « {c}/{k} cachets » 12 / 17 pt `olive` + médaille `red`. Tap → fiche de ligne (stats + rangée de cachets 54 pt).
- Guidage en bas (328 × 85, y 745, rayon 8, `olive`) : flèche orientée vers le prochain arrêt, « {consigne} » 500 19 pt `cream`, « {mode} · prochain arrêt : {arrêt} » 12,5 pt `cream` 72 %, distance 16 pt à droite. Pour le PoC, la consigne est simple (« Continuez tout droit », « Tournez à gauche »…) calculée par rapport au tracé, pas de calcul d'itinéraire routier.
- Tap sur un arrêt → fiche du point d'intérêt.
- **Arrivée** : bandeau en haut (marges 12, y 14, rayon 18, contour 2 pt `olive`, ombre) : pastille rouge 40 avec épingle et halo, « Vous arrivez à {arrêt} » 600 15, « Arrêt {i} · l'expérience est prête » 13 `olive`, pilule « Ouvrir » `olive` ; petite croix pour ignorer. Entrée : glissement depuis le haut 0,45 s + vibration (2 secousses).
- **Hors connexion** : bandeau 40 pt `sepia` en haut : icône Wi-Fi barrée + « Hors connexion · ligne téléchargée » ou « … contenus non téléchargés ».
- **Pas de bon partenaire permanent sur la carte.**

## 08 Fiche du point d'intérêt (feuille du bas)
- Hauteur 374, rayon 20 20 40 40, fond `cream`, contour 2 pt `tilleul` ; poignée 44 × 5 `olive` ; voile `rgba(35,31,32,.3)` derrière (tap = fermer).
- Ligne du haut : distance (« à 150 m », « Arrêt 1 · visité ») 14 pt ; à droite pilule rouge « VOIR VOUCHER » (600 10,5 pt) si un avantage est visible ici.
- Nom 500 30 pt.
- Rangée des **7 services, toujours dans le même ordre** (café, parking, info, restaurant, gare, patrimoine, remise), écart 17, hauteur ≈ 22 pt ; présent = opacité 1, absent = 0,2.
- Description 12,5 / 1,38 pt (tronquée au-dessus des boutons).
- Bas (colonne ancrée, marges 32, bas 20, écart 10) :
  - Actif : bouton 71 de haut rayon 7 `olive` + icône play 16 + « Vivre l'expérience » / « Revivre l'expérience » 400 20 pt `cream`. Invité : « Aperçu gratuit » + « Mode invité · créez un compte pour tout voir ».
  - Passif (hors rayon) : fond `#EDEACB`, contour `#DCD8A8`, texte `#A9A67C` + « Disponible sur place ».
  - Non téléchargé (hors connexion) : même style passif, « Contenu non téléchargé » + « Téléchargez la ligne en Wi-Fi depuis l'écran « Prêt » ».
  - Lien « Plus tard » 12 pt `olive` souligné.

## 08b Bon partenaire (feuille du bas, depuis la fiche ou Mes avantages)
- Photo 250 pt en haut ; nom italique 700 22 ; adresse italique 600 + horaires ; description (remise en gras, cachet requis en italique) ; conditions 13 pt `grey` ; cachet en filigrane (opacité 0,28) en bas à gauche ; logo du partenaire en bas à droite ; croix de fermeture rouge sur pastille crème.

## 09 Lecteur
- Nom de l'arrêt 600 26 centré (y 74) ; « {code} - Arrêt {i} sur {n} - {année} » 16 `olive`.
- Média pleine largeur, 248 de haut, y 236 (vidéo ; en audio seul : carte postale fixe).
- Sous-titre courant entre guillemets, italique 600 19 pt centré.
- Progression : piste 5 pt `roseLight` (`#F6D3D5`), remplissage `red` ; temps 15 pt `rose`.
- Commandes : « ST » (sous-titres, cercle 58 contour rouge), lecture / pause (88, anneau rouge en pointillés), son (58) ; « Passer → » en bas.
- Invité : repère `olive` sur la barre à la fin de l'aperçu + « Aperçu gratuit jusqu'à {m:ss} » au-dessus des commandes. À la fin de l'aperçu : lecture stoppée, feuille « Fin de l'aperçu » (« {arrêt} · {m:ss} sur {durée} » ; « Créez un compte gratuit pour voir la suite de la carte postale animée, obtenir ce cachet et garder vos points. » ; « Créer un compte » ; « J'ai déjà un compte » ; « Retour à la carte »). Après inscription, retour au lecteur, lecture reprise.
- États à prévoir : chargement (spinner sur le média), erreur (« Lecture impossible. Réessayer »), connexion faible.

## 10 Hier & aujourd'hui (récompense)
- « {arrêt} » 500 22 `olive` ; « Hier & aujourd'hui » 600 26.
- Comparateur 390 × 248 (y 166) : photo actuelle dessous, archive dessus découpée par la poignée ; trait 4 pt `red` ; poignée ronde 64 `red` avec flèches ← → blanches ; années en haut à gauche / droite 20 pt. Sans photo actuelle : archive seule, sans poignée.
- « Vous avez obtenu » 19 `olive` ; lignes avec coche (disque rouge 30) : « {points} POINTS », « CACHET {nom} » 500 24 `olive` (apparition en pop décalée).
- Cachet 124 pt : animation de tampon (0,6 s, délai 0,55 s).
- CTA « CONTINUER LE PARCOURS » ; lien « Revoir la carte animée ». Dernier arrêt de la ligne → Ligne terminée.

## 10b Ligne terminée
- Croix (→ Carte). « {code} {nom} » 16 `olive` ; « Ligne terminée ! » 600 34 (pop) ; « {km} km parcourus, {n} gares revisitées. »
- 3 cases 92 de haut, bordure 2,6 `ink` rayon 4 : « {n}/{n} ARRÊTS », « {points} POINTS », « {k}/{k} CACHETS ».
- « CACHETS DE LA LIGNE » : cachets 58 pt qui tombent un à un (tampon, décalage 0,15 s), noms 11 pt centrés sous chacun (largeur 64, retour à la ligne).
- Encart « {x} avantage(s) partenaire débloqué(s) » → Mes avantages.
- CTA « CHOISIR UNE AUTRE LIGNE » ; lien « Voir mon carnet de voyage ».

## 11 Cachets
- Reprendre la frame Figma « Ligne détails 2 » (`AppLigneDTails` dans la source) : grille des cachets, obtenus en sépia, à obtenir estompés.
- « {c} cachets sur {total}. Chaque cachet débloque un avantage chez un partenaire de la ligne. » ; bouton contour « Voir mes avantages ».

## 11b Mes avantages
- Titre « Mes avantages » ; « Présentez le cachet validé dans l'application chez le partenaire. »
- Carte débloquée (contour 2 pt `olive`, rayon 12) : photo 72, nom 600 16, « {ville} · {titre} » 13,5 `olive`, pilule « Cachet {nom} obtenu ». Tap → bon partenaire, la fermeture revient ici.
- Carte à débloquer (contour `#DDD9B8`) : cadenas, « Avantage à débloquer », « Obtenez le cachet {nom} à {arrêt} ».
- Pied : « Chaque partenaire fixe ses propres conditions, précisées sur le bon. »

## 12 Carnet de voyage
- Titre « Carnet de voyage » 600 30.
- Bloc compte (billet perforé 328 × 195) : invité → avatar, « Se connecter », « Créer un compte » ; connecté → prénom, e-mail, « Se déconnecter ».
- 3 cases : ARRÊTS, POINTS, CACHETS (totaux de l'utilisateur).
- « OBJECTIFS » : encarts « Plus que {n} arrêts pour terminer la {code} », « Plus que {p} pts pour obtenir le cachet {nom} », « Plus que {c} cachets à obtenir sur la {code} ».
- « À REVOIR » : dernière expérience (vignette 140 + « {code} » + play).
- « HISTORIQUE » : lignes avec pilule « En cours {v}/{n} » ou « Terminée {n}/{n} ».

## 13 Paramètres
- Bloc perforé : LANGUE, PARCOURS (« Parcours adulte », désactivé), TRANSPORT, TAILLE DU TEXTE — libellé 16 `olive`, valeur 500 16 + chevron.
- Encart « Type d'expérience · {valeur} ».
- À ajouter (sans maquette, même style) : Compte, Conditions d'utilisation, Politique de confidentialité, Gérer les téléchargements (taille par ligne + supprimer).
