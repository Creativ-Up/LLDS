# Instructions pour Claude Code

Lis d'abord `README.md`, puis tous les fichiers de `docs/`. Le prototype (`prototype/source/…dc.html`) fait foi pour toute valeur visuelle non précisée dans la doc.

## Livrables
1. `apps/mobile` — application Expo (iOS + Android).
2. `apps/admin` — dashboard d'administration Next.js.
3. `supabase/` — migrations SQL, politiques RLS, seed de démo, Edge Functions.
4. `packages/shared` — types TypeScript, schémas zod, tokens.

## Conventions
- TypeScript strict partout. Pas de `any`.
- **Aucun texte d'interface en dur** : tout passe par i18n (FR par défaut, NL, EN). Les clés FR reprennent exactement les textes du prototype.
- **Aucun compteur en dur** : nombre d'arrêts, points, cachets, durées, distances et tailles sont calculés à partir des données.
- Les contenus (lignes, arrêts, médias, cachets, partenaires) viennent **uniquement** de Supabase ; le seed sert au développement.
- Les couleurs, polices et rayons viennent de `packages/shared/tokens` (généré depuis `tokens/tokens.json`).
- Cibles tactiles ≥ 44 × 44 pt.
- Prévoir un **mode simulation de position** (menu développeur) pour tester les arrivées aux arrêts sans se déplacer.

## Jalons et critères d'acceptation

**M0 — Socle**
- Monorepo pnpm + Turborepo ; Supabase local (`supabase start`) ; migrations du `docs/DATA_MODEL.md` ; seed importé depuis `seed/demo-seed.json` (médias placeholder dans Storage).
- ✅ `pnpm dev` lance l'admin et l'app ; le seed est visible en base.

**M1 — Back-office**
- Recréer la maquette `prototype/source/Dashboard admin LLDS.dc.html`. Connexion admin, CRUD lignes et arrêts, import du tracé (GPX / GeoJSON / KML), placement et réordonnancement des arrêts sur la carte, téléversement des médias, services, cachets, partenaires et avantages, publication.
- ✅ Un admin crée une ligne de 3 arrêts de zéro, la publie, et elle apparaît dans l'app.

**M2 — Onboarding mobile**
- Polices Inter, tokens, composants récurrents ; écrans Accueil → Connexion / Inscription / Mot de passe oublié → Langue → Autorisations → Lignes → Détail de ligne → Transport → Expérience → Prêt.
- ✅ Parcours complet en compte réel (Supabase Auth) et en invité ; validation des formulaires conforme aux messages du prototype.

**M3 — Carte et arrêts**
- Carte MapLibre au style LLDS, tracé et arrêts depuis la base, position de l'utilisateur, guidage vers le prochain arrêt, geofencing en arrière-plan, notification et vibration d'arrivée, fiche du point d'intérêt.
- ✅ En simulant la position, l'entrée dans le rayon d'un arrêt déclenche la notification et déverrouille « Vivre l'expérience ».

**M4 — Expérience**
- Lecteur vidéo (et mode audio seul), sous-titres, récompense (comparateur hier / aujourd'hui, points, cachet).
- ✅ Terminer une expérience crédite les points et le cachet une seule fois, côté serveur.

**M5 — Hors ligne**
- Téléchargement d'une ligne (médias + données), progression, annulation, reprise ; bandeau hors connexion ; état « Contenu non téléchargé ».
- ✅ En mode avion, une ligne téléchargée se parcourt entièrement.

**M6 — Collection et compte**
- Cachets, Mes avantages, bon partenaire, Carnet de voyage, Ligne terminée, Paramètres, restrictions du mode invité (aperçu limité).
- ✅ Un invité est bloqué à la fin de l'aperçu et peut créer un compte sans quitter le lecteur.

**M7 — Finitions**
- Animations du `docs/BEHAVIOR.md`, accessibilité (VoiceOver / TalkBack, taille du texte), traductions complètes, builds EAS (TestFlight + test interne Play).
