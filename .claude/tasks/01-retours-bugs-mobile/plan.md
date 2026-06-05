# PLAN — Correctifs bugs app mobile (périmètre REPO uniquement)

> Basé sur `explore.md`. Décisions utilisateur :
> 1. Token Mapbox : **probablement absent du build** → traiter de façon fiable depuis le repo.
> 2. **Périmètre repo uniquement** → correctifs code ; dépendances Plasmic Studio = documentées en TODO, non implémentées.
> 3. Zoom iOS : **inputs ≥16px + `viewport-fit`** (pas de `user-scalable=no`, accessibilité préservée).

## Principe de découpage
Chaque bug est séparé en **[FIX REPO]** (ce que je code) et **[TODO STUDIO]** (à faire par toi dans Plasmic, hors périmètre). Ordre = impact × confiance, quick wins d'abord.

---

## Lot A — Quick wins transverses (confiance très haute)

### A1. Meta viewport global → corrige #6 (zoom) + #9 (safe-area Crisp)
**[FIX REPO]**
- **Créer `pages/_document.tsx`** (n'existe pas) avec `<Head>` contenant :
  `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />`
  - `maximum-scale=1` : empêche que l'auto-zoom iOS sur input reste bloqué (le dézoom revient).
  - `viewport-fit=cover` : active `env(safe-area-inset-*)` (nécessaire pour Crisp/notch).
  - **Pas** de `user-scalable=no` (choix accessibilité).
  - ⚠️ Le viewport doit être dans `_document` (ou via `next/head` côté page) — Next.js recommande `_document` pour les meta statiques globales. Vérifier qu'on n'introduit pas de doublon avec un viewport injecté par défaut.
- **Pourquoi `_document` et pas `_app`** : éviter un viewport dupliqué/écrasé ; `_document` est le point canonique pour les balises `<head>` globales en pages router.

**Validation** : sur device, focus d'un champ <16px → vérifier que le dézoom revient (même avant A2).

### A2. Forcer `font-size: 16px` sur les inputs (ceinture+bretelles) → #6
**[FIX REPO]**
- **CSS global** (`styles/globals.css`) : règles ciblées
  - `input, select, textarea { font-size: 16px; }` (ou `@media (max-width: 768px)` pour ne pas impacter desktop).
  - Ant Design : `.ant-picker-input input, .ant-select-selection-search-input, .ant-input { font-size: 16px; }`
- **Ant ConfigProvider** : envelopper les composants Ant concernés (`JamDatePicker`, sélecteurs) avec `<ConfigProvider theme={{ token: { fontSize: 16 } }}>` si non déjà présent. Vérifier d'abord s'il existe un ConfigProvider racine.
- Cibler en priorité le champ « temps de travail » : confirmer le composant exact (`forms/JamDatePicker` Ant TimePicker/Select OU `forms/InputComboSelect` dont le CSS:22 est à 14px) puis remonter à 16px.

**Fichiers** : `styles/globals.css`, `plasmic-library/forms/InputComboSelect/InputComboSelect.module.css:22`, éventuellement wrapper Ant dans `JamDatePicker.tsx`.

---

## Lot B — Carte Mapbox (#1) — confiance haute

### B1. Token Mapbox fiable depuis le repo
**[FIX REPO]** — le repo hardcode déjà des clés publiques (Stripe/Google dans `capacitor.config.ts`). On applique le même pragmatisme pour le **token public Mapbox** (restreignable par domaine côté Mapbox) :
- Lire le token via `process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` **avec fallback** sur une constante token public commitée (à fournir par toi — ⚠️ ACTION REQUISE : me communiquer le token public Mapbox `pk.…`).
- **Échec parlant** : si aucun token → `console.error("[Map] Mapbox token manquant")` + rendu d'un état d'erreur visible (au lieu du `return` muet `Map.tsx:82`).

### B2. Garde hauteur conteneur
**[FIX REPO]** défensif dans `Map.tsx` : `minHeight` de secours (ex. `min-height: 320px` ou `100dvh` selon contexte) sur le conteneur, pour éviter l'invisibilité si le parent Plasmic n'impose pas de hauteur.

**[TODO STUDIO]** : s'assurer que le wrapper qui héberge `<Map>` a une hauteur résolue (ex. `height: 100%` sur toute la chaîne parente, ou hauteur fixe).

**Validation** : device — `console.log` du token au mount ; carte visible.

---

## Lot C — Crisp (#9 croix non cliquable, #4 recouvre Paramètres) — confiance moyenne/haute

### C1. Croix non cliquable (#9)
**[FIX REPO]**
- Dépend d'A1 (`viewport-fit=cover`) pour les safe-areas.
- Si la croix reste sous le notch : pousser une config de position/offset Crisp ou injecter du CSS ciblant le conteneur Crisp pour respecter `env(safe-area-inset-top)`.
- **À VÉRIFIER device d'abord** (le correctif exact dépend de la position réelle de la fenêtre Crisp). Ne pas sur-coder à l'aveugle.

### C2. Launcher recouvre le bouton « Paramètres » sur /alertes (#4)
**[FIX REPO]** — **bug identifié dans `CrispChat.tsx`** :
- `CrispChat.tsx:28` utilise `router.pathname` pour `disabledRoutes`. Or pour une page Plasmic servie par le catchall, `router.pathname` = `/[[...catchall]]`, **jamais `/alertes`**. → le masquage par route **ne peut pas matcher** les URLs Plasmic.
- **Correctif** : comparer sur `router.asPath` (URL réelle) au lieu de `router.pathname`, normalisé (sans query/hash).
- Permet ensuite de **masquer/décaler Crisp sur `/alertes`** (et de fiabiliser le `/parametres-abonnement` existant qui souffre probablement du même souci s'il passe par le catchall — à vérifier : c'est un fichier physique `pages/parametres-abonnement.tsx`, donc `pathname` matche pour celui-là, mais pas pour les pages Plasmic).
- Option retenue à arbitrer en CODE : masquer Crisp sur /alertes (`chat:hide`) **ou** décaler le launcher. Masquer est le plus simple et cohérent avec le pattern existant.

**Validation** : device — sur /alertes, bouton Paramètres cliquable ; Crisp fermable partout.

---

## Lot D — Partage annonce (#8 partie repo) — confiance haute (plugin)

### D1. Plugin de partage natif
**[FIX REPO]**
- `npm i @capacitor/share` (aligner version sur Capacitor 7.x déjà présent) puis `npx cap sync`.
- Créer un composant Plasmic-enregistrable `ShareButton` (dans `plasmic-library/`) qui appelle :
  `import { Share } from '@capacitor/share'; await Share.share({ title, text, url, dialogTitle })`, avec fallback web `navigator.share`/copie d'URL si `!Capacitor.isNativePlatform()`.
- Enregistrer le composant dans `plasmic-library/components.ts` + `index.ts` (pattern des autres composants lib).
- ⚠️ Vérifier l'API exacte v7 via doc officielle au moment du CODE (`Share.canShare()`, signature).

**[TODO STUDIO]** : remplacer le bouton partage actuel (non fonctionnel) de la page détail par ce `ShareButton` et lui passer `url/title/text` de l'annonce.

### D2. État du cœur sur la page détail (#8 partie données)
**[TODO STUDIO]** (hors repo) : la page détail doit **dériver l'état favori réel** (depuis Supabase / liste favoris de l'utilisateur) et le passer en `state="liked"` / `isFavorite` au composant cœur. Documenté, non codé.
- **[FIX REPO] optionnel** : exposer proprement `isFavorite`/`state` + un eventHandler dans `JobCard.meta.ts` pour faciliter le wiring Studio.

---

## Lot E — Favoris latence (#2) — confiance moyenne, dépend du wiring

**[TODO STUDIO]** : la logique d'ajout favori est probablement en element actions Plasmic (appel API synchrone). Recommandation : optimistic update + table dédiée plutôt que réécriture `user_metadata`.
**[FIX REPO] possible** : si `JobCard` possède l'état du cœur, ajouter un **feedback optimiste** (toggle visuel immédiat) + état de chargement, en exposant le handler dans la meta. À confirmer selon où vit réellement la logique (audit Studio requis).
→ **Décision** : porter ce lot **après** clarification device/Studio ; livrer d'abord A–D. Documenté.

---

## Lot F — Alerte vide au 1er chargement (#5) — confiance moyenne

**[FIX REPO] défensif** dans `AlertManager.tsx` :
- Filtrer les items « vides » avant rendu (ex. ignorer un item sans `id`/sans contenu utile) dans le calcul `visibleAlerts` (`:32`).
- Distinguer un état « loading » d'un état « vide » si une prop le permet.
- Confirmer le composant réellement importé (`alerts/AlertManager` vs doublon `ui/AlertManager`) via `plasmic-library/components.ts` ; si doublon mort, le signaler (ne pas supprimer sans validation).

**[TODO STUDIO]** : ne pas initialiser `alerts` avec `[{}]` ; passer `[]` tant que les données ne sont pas chargées.

---

## Lot G — Langue / Weglot (#3) — confiance moyenne

**[FIX REPO]** :
- **Supprimer le switcher natif Weglot injecté sur mobile** (source de confusion vs le `WeglotSelector` custom). Deux voies : (a) config Weglot `hide_switcher`/désactiver le switcher mobile dans `WeglotScript.tsx` si paramétrable côté snippet, (b) CSS pour masquer le switcher injecté. Vérifier l'API Weglot au CODE (doc officielle, Weglot absent de Context7).
- **Fiabiliser le timing** dans `WeglotSelector.tsx` : garantir que `switchTo` n'est appelé qu'après `Weglot.initialized` (écouter l'event d'init plutôt qu'un poll borné à 5 s), avec file d'attente du dernier choix si clic précoce.

**[TODO STUDIO]** (bug /profile « langue système ») : identifier et remplacer le sélecteur de langue de la page /profile s'il s'agit d'un `<select>` natif → utiliser le `WeglotSelector` custom. **Décisif et hors repo** — nécessite inspection Studio + device.

---

## Lot H — /annonces page blanche « Chargement » (#7) — à investiguer device

**[FIX REPO] défensif** dans `DataGridOffre.tsx` :
- Ajouter un **timeout** : si `isLoading` > N s, afficher un état d'erreur/retry au lieu d'un loader infini (`:383-390`).
- Logguer l'état de la query (pour diagnostic on-device).
**[TODO INVESTIGATION device]** : confirmer si la query Supabase de /annonces résout ; selon résultat, le vrai correctif peut être Studio/Supabase (auth/session au cold start). **Ne pas présumer** — livrer le filet de sécurité repo + diagnostiquer.

---

## Ordre d'exécution recommandé (CODE)
1. **A1 + A2** (viewport + inputs 16px) — règle #6, prépare #9. Faible risque, fort impact.
2. **B1 + B2** (Mapbox token + garde hauteur) — débloque le test du reste (la carte conditionne tout). ⚠️ nécessite le token de ta part.
3. **C2** (fix `router.asPath` Crisp + masquage /alertes) — règle #4.
4. **C1** (#9) — après vérif device safe-area.
5. **D1** (plugin Share + composant) — règle la partie repo de #8.
6. **F** (AlertManager défensif) — #5.
7. **G** (Weglot switcher natif + timing) — #3 partie repo.
8. **H** (DataGridOffre filet) — #7.
9. **D2/E** : exposer props meta + documenter Studio.

## Risques & points d'attention
- **NEXT_PUBLIC_* inliné au build** : tout fix token Mapbox doit être présent au moment de `build:capacitor`. Le fallback constante commitée garantit l'indépendance vis-à-vis du CI.
- **`maximum-scale=1`** peut être ignoré par certaines versions iOS pour le pinch manuel, mais bloque bien l'auto-zoom input → suffisant pour #6 combiné à A2.
- **Crisp** : ne pas coder le fix safe-area à l'aveugle (C1) — valider device.
- **Doublon AlertManager** : ne rien supprimer sans confirmation de l'import réel.
- **Pas de modif Plasmic Studio** dans ce périmètre : les bugs #2 (logique), #3 (/profile), #7 (données), #8 (état cœur) resteront partiellement ouverts côté Studio — clairement listés en TODO.

## Validation globale (avant livraison)
- `npm run lint` + typecheck (`tsc`/build) verts.
- `npm run build:capacitor` réussit (export statique).
- Tests device TestFlight via panneau debug on-device (pas d'inspecteur Safari) : carte visible, zoom alertes réversible, Crisp fermable + Paramètres cliquable, partage natif, /annonces (loader → contenu ou erreur explicite).

## Liste des fichiers repo touchés (prévisionnel)
- `pages/_document.tsx` (créer) — A1
- `styles/globals.css` — A2
- `plasmic-library/forms/InputComboSelect/InputComboSelect.module.css` (+ éventuel ConfigProvider Ant) — A2
- `plasmic-library/others/Map/Map.tsx` — B1, B2
- `components/crispChat/CrispChat.tsx` — C1, C2
- `package.json` / `package-lock.json` + `plasmic-library/<ShareButton>/…` + `plasmic-library/components.ts`/`index.ts` — D1
- `plasmic-library/cards/JobCard/JobCard.meta.ts` (+ types) — D2/E (exposition props)
- `plasmic-library/alerts/AlertManager/AlertManager.tsx` — F
- `components/weglot/WeglotScript.tsx`, `plasmic-library/others/WeglotSelector/WeglotSelector.tsx` — G
- `plasmic-library/others/DataGridOffre/DataGridOffre.tsx` — H

## TODO STUDIO (à te transmettre — hors repo)
- /profile : remplacer sélecteur de langue natif par `WeglotSelector` (#3).
- Page détail : dériver état favori → `state/isFavorite` ; remplacer bouton partage par `ShareButton` (#8).
- /alertes : passer `alerts=[]` au lieu de `[{}]` ; vérifier position bouton Paramètres (#5, #4).
- /annonces : vérifier la source de données / query Supabase (#7).
- Pages avec `<Map>` : hauteur résolue du conteneur (#1).
- Favoris : optimistic update + table dédiée vs `user_metadata` (#2).
