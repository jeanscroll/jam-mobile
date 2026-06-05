# IMPLEMENTATION — Correctifs bugs app mobile (périmètre REPO)

> Phase CODE de l'EPCT. Toutes les modifs ci-dessous compilent (`npx tsc --noEmit` → exit 0).
> Périmètre : repo uniquement (décision utilisateur). Les dépendances Plasmic Studio sont listées en fin de doc.

## Changements réalisés

### Lot A — Anti auto-zoom iOS + safe-area (bug #6 zoom, prépare #9)
- **`pages/_app.tsx`** : ajout du meta viewport `width=device-width, initial-scale=1, viewport-fit=cover`.
  - `viewport-fit=cover` active `env(safe-area-inset-*)` (notch/Dynamic Island).
  - ⚠️ Volontairement **sans** `maximum-scale=1`/`user-scalable=no` (choix accessibilité de l'utilisateur).
- **`styles/globals.css`** : règle `@media (hover:none) and (pointer:coarse)` forçant `font-size:16px` sur `input/select/textarea` + champs Ant (`.ant-picker-input>input`, `.ant-input`, `.ant-select-selection-search-input`). C'est ce qui neutralise l'auto-zoom iOS tout en gardant le pinch-zoom.
- **`plasmic-library/forms/InputComboSelect/InputComboSelect.module.css`** : `.input` 14px → 16px (candidat direct du champ « temps de travail »).

### Lot B — Carte Mapbox (bug #1)
- **`plasmic-library/others/Map/Map.tsx`** :
  - Lecture token avec **fallback** : `process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || MAPBOX_PUBLIC_TOKEN_FALLBACK`.
  - **⚠️ ACTION REQUISE** : coller le token public Mapbox (`pk....`) dans `MAPBOX_PUBLIC_TOKEN_FALLBACK` (constante actuellement `""`). Sans token (ni env ni fallback) la carte affiche désormais un **message d'erreur visible** au lieu d'un écran vide silencieux.
  - Init Mapbox encapsulée dans `try/catch` + listener `map.on("error")` (token invalide / tuiles bloquées CORS-CSP webview) → logs explicites.
  - Garde-fou `minHeight:240` sur le conteneur (évite hauteur 0 si le parent Plasmic n'impose pas de hauteur).
  - État `mapError` rendu en overlay si la carte ne peut pas s'initialiser.

### Lot C — Crisp (bugs #4 et préparation #9)
- **`components/crispChat/CrispChat.tsx`** : **bug corrigé** — le masquage par route utilisait `router.pathname` qui vaut `/[[...catchall]]` pour toutes les pages Plasmic (ne matchait jamais `/alertes`, `/annonces`…). Remplacé par `router.asPath` normalisé (sans query/hash).
- **`pages/_app.tsx`** : ajout de `"/alertes"` à `CRISP_DISABLED_ROUTES` → le launcher Crisp ne recouvre plus le bouton « Paramètres » de /alertes.

### Lot D — Partage natif (bug #8, partie repo)
- **`@capacitor/share@^7.0.4`** installé (`package.json`).
- **`plasmic-library/others/ShareButton/ShareButton.tsx`** (nouveau) : bouton de partage avec cascade
  1. natif Capacitor (`Share.share`), 2. Web Share API (`navigator.share`), 3. repli copie de lien.
  - Gère l'annulation utilisateur sans remonter d'erreur ; slot `children` Plasmic + icône par défaut.
- **`ShareButton.meta.ts`** (nouveau) + export dans **`plasmic-library/components.ts`** (auto-enregistré par `registerComponents`).

### Lot F — Alerte vide au 1er chargement (bug #5, filet)
- **`plasmic-library/alerts/AlertManager/AlertManager.tsx`** : filtre les items sans `id` ou sans `message` avant affichage (évite une alerte fantôme avant l'arrivée des données). NB : ce composant est un gestionnaire de **toasts** ; si l'alerte vide vient de la liste d'alertes-emploi, le correctif réel est côté Studio (voir TODO).

### Lot H — /annonces loader infini (bug #7, filet)
- **`plasmic-library/others/DataGridOffre/DataGridOffre.tsx`** : timeout de 12 s sur l'état `isLoading` → affiche un message « Chargement trop long / vérifiez votre connexion » au lieu d'un « Chargement… » perpétuel. Diagnostic device toujours nécessaire pour la cause exacte (query Supabase non résolue en WebView).

### Lot G — Weglot (bug #3) : NON modifié (volontaire)
- Le switcher natif Weglot est délibérément affiché par `styles/globals.css` et constitue (cf. mémoire `weglot-project-deleted`) le chemin de traduction qui fonctionne. Le modifier à l'aveugle risquerait de **casser la traduction**. Le bug /profile (« langue système ») est côté Studio. → reporté en TODO + vérification device.

## Validation
- ✅ `npx tsc --noEmit` → exit 0 (aucune erreur de type).
- ✅ ESLint : aucune **nouvelle** erreur introduite (les warnings/erreurs signalés par les hooks sont **préexistants** : `any` sur globals augmentés, `<img>`, deps de hooks, vars inutilisées). Rappel : `next.config.mjs` a `eslint.ignoreDuringBuilds:true`.
- ⏳ `npx cap sync ios` non exécutable maintenant (nécessite `out/`). **À faire au build** : `npm run mobile:build` (= `build:capacitor` + `cap sync`) pour intégrer le pod natif du plugin Share.

## ⚠️ Actions requises (toi)
1. **Token Mapbox** : remplir `MAPBOX_PUBLIC_TOKEN_FALLBACK` dans `Map.tsx` (ou définir `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` dans l'env de build Appflow). Sans ça, la carte restera indisponible (mais avec message clair).
2. **Build mobile** : `npm run mobile:build` puis ouvrir Xcode (`npm run cap:open:ios`) pour récupérer le plugin Share et tester sur device.

## TODO Plasmic Studio (hors repo — à faire par toi)
- **/profile (#3)** : remplacer le sélecteur de langue par le `WeglotSelector` custom si c'est un `<select>` natif (à confirmer device). Vérifier que le changement de langue passe bien par Weglot et non par un contrôle natif iOS.
- **Détail annonce (#8)** : remplacer le bouton de partage actuel par le nouveau composant **`Share button`** (le brancher avec `url/title/text` de l'annonce). Dériver l'état favori réel et le passer en `state="liked"`/`isFavorite` au cœur.
- **/alertes (#5)** : passer `alerts=[]` (pas `[{}]`) tant que les données ne sont pas chargées.
- **/annonces (#7)** : vérifier la query Supabase de la page (résout-elle en WebView ? auth/session au cold start ?).
- **Pages avec `<Map>` (#1)** : s'assurer d'une hauteur résolue sur le conteneur parent.
- **Favoris (#2)** : optimistic update + table dédiée plutôt que réécriture `user_metadata`.

## Vérifications device prioritaires (TestFlight)
1. Carte visible (après token) ; sinon message d'erreur au lieu d'écran vide.
2. /alertes : focus « temps de travail » → le zoom ne se déclenche plus (ou se dézoome) ; bouton Paramètres cliquable.
3. Partage natif fonctionnel sur le détail (après wiring Studio + build).
4. /annonces : contenu chargé, ou message d'erreur après 12 s au lieu de « Chargement » infini.
5. Crisp fermable + ne recouvre plus Paramètres.
