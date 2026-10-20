# Comportements

## Navigation
Expo Router, pile principale sans barre d'onglets.

~~~
Accueil ─┬─ Connexion ─┬─ Mot de passe oublié
         │             └─ Inscription
         ├─ Continuer sans compte (invité)
         └─ Créer un compte
   → Langue → Autorisations → Lignes → Détail de ligne → Transport → Expérience → Prêt → Carte
Carte ─┬─ Fiche du point (feuille) ─┬─ Lecteur → Récompense → (Carte | Ligne terminée)
       │                            └─ Bon partenaire (feuille)
       ├─ Fiche de ligne (feuille)
       ├─ Carnet ─ Connexion / Inscription
       ├─ Paramètres
       └─ Cachets ─ Mes avantages ─ Bon partenaire
~~~
- Au relancement : si une ligne est en cours, ouvrir directement la Carte ; l'onboarding n'est montré qu'au premier lancement (les choix restent modifiables dans Paramètres).

## Mode invité
- Activé par « Continuer sans compte ». Progression en local uniquement, non conservée.
- Expériences limitées à l'aperçu (`guest_preview_s` de l'arrêt) ; pas de points, de cachets ni d'avantages.
- Toute création de compte depuis le lecteur ramène au lecteur, lecture reprise.

## Géolocalisation et arrivée
- Distance au prochain arrêt et consigne de guidage recalculées à chaque mise à jour de position (filtrage : ignorer les précisions > 50 m).
- « Vivre l'expérience » est actif si l'utilisateur est dans le rayon de l'arrêt (ou si `requires_on_site` est faux), ou si l'arrêt est déjà terminé (« Revivre »).
- Entrée dans un rayon : notification locale (app fermée) ou bandeau (app ouverte) + vibration ; une seule fois par arrêt et par passage.
- Les avantages dont `visible_from_stop_id` correspond sont déverrouillés à l'arrivée.

## Points et cachets
- Une expérience est « terminée » quand la lecture atteint 90 % ou quand l'utilisateur touche « Passer » après 50 % (pour le PoC). L'app appelle l'Edge Function `complete-stop`, qui renvoie points et cachets gagnés → écran Récompense.
- Hors connexion : l'écran Récompense s'affiche à partir des données locales et la validation est mise en file d'attente.

## Téléchargement
- Wi-Fi recommandé (avertissement en données mobiles), reprenable, annulable. Vérification de l'espace disque avant de commencer (message : « Espace insuffisant : libérez {x} Mo »).
- Mise à jour : si `content_version` a changé, proposer « Mettre à jour la ligne ({x} Mo) ».

## Animations (valeurs exactes du prototype)
| Nom | Usage | Définition |
| --- | --- | --- |
| `in` | Entrée de chaque écran | opacité 0 → 1, translation Y 10 → 0, 0,34 s, `cubic-bezier(.2,.7,.2,1)` |
| `up` | Feuilles du bas | opacité 0 → 1, translation Y 60 → 0, 0,34 s, même courbe |
| `pop` | Sélections, badges, chiffres | échelle 0,6 → 1,08 (60 %) → 1, opacité 0 → 1, 0,3 s |
| `stamp` | Cachet obtenu | échelle 2,4 / rotation −16° → 0,93 / −4° (55 %) → 1,04 / −6° (75 %) → 1 / −5°, 0,6 s |
| `pulse` | Position, halo d'arrivée | échelle 1 → 1,9, opacité 0,55 → 0, 2,2 s en boucle |
| `draw` | Tracé parcouru | trait dessiné de 0 à 100 %, 1,1 s ease-out |
| `drop` | Bandeau d'arrivée | translation Y −120 % → 0, 0,45 s `cubic-bezier(.2,.8,.2,1)` |
| `buzz` | Vibration visuelle | ±5 pt horizontal, 0,5 s × 2 (accompagne `Haptics.notificationAsync`) |
| `blink` | Indice de défilement | opacité 1 → 0,25 → 1, 2,4 s en boucle |
Respecter « Réduire les animations » (OS) : remplacer par des fondus simples.
