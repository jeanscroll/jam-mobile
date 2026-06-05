# EXPLORE — Retours bugs app mobile (build TestFlight)

> Phase EXPLORE du workflow EPCT. Lecture seule, aucune modification.
> Date : 2026-06-05. Stack : **Next.js 14 (pages router) + Capacitor (webview iOS/Android, `output: export`) + Plasmic loader + Mapbox GL + Weglot + Crisp + Supabase + RevenueCat**.

## 0. Contexte technique vérifié (transversal)

- **Origine webview iOS = `capacitor://localhost`** (`capacitor.config.ts:13` `iosScheme:"capacitor"`), Android = `https`. ⚠️ Donc **PAS `file://`** : les théories « CSS cassé en file:// » sont **écartées**. Les assets `/_next/...` se servent normalement.
- **Build Capacitor = export statique** (`next.config.mjs:8` `output:'export'` quand `CAPACITOR_BUILD=true`). Conséquences : `getStaticPaths` `fallback:false`, **`middleware.ts` ne s'exécute PAS** en natif, service worker désactivé.
- **AUCUN meta `viewport` dans toute l'app** : `pages/_app.tsx` `<Head>` ne contient que `<link rel="manifest">` (ligne 119-121), **pas de `pages/_document.tsx`**, zéro occurrence de `viewport`/`maximum-scale`/`viewport-fit`/`safe-area` dans `pages|components|styles|public`. → **cause racine partagée** de plusieurs bugs (zoom iOS, notch/safe-area Crisp).
- **Données dynamiques 100% côté client** : le catchall Plasmic skippe `extractPlasmicQueryData` et passe `queryCache:{}` (`pages/[[...catchall]].tsx:80-85`). Toutes les pages chargent leurs données Supabase au runtime → écrans « Chargement » dépendent de la résolution de ces queries dans la webview.
- ⚠️ **Beaucoup de bugs sont câblés côté Plasmic Studio** (pages, element actions, props passées aux composants), pas dans le repo. Cf. marquage `[REPO]` vs `[PLASMIC]` ci-dessous.

---

## 1. [GÉNÉRAL] Aucune carte affichée — `[REPO]` (confiance haute)

**Fichiers** : `plasmic-library/others/Map/Map.tsx:64,82` ; `.env` (vide) ; `next.config.mjs`.

**Cause racine #1 (très probable) — token Mapbox absent du build.**
- `Map.tsx:64` : `const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;`
- `Map.tsx:82` : `if (!mapContainerRef.current || mapRef.current || !accessToken) return;` → si le token est `undefined`, **la carte ne s'initialise jamais, silencieusement** (aucun log, aucun fallback UI).
- Preuve : `.env` fait **0 octet**, et `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` n'est référencé **nulle part ailleurs** (pas de `.env.local`/`.env.production` sur disque). Les vars `NEXT_PUBLIC_*` sont inlinées au build → si absent au moment du `build:capacitor`, le bundle natif contient `undefined`.
- **À VÉRIFIER (bloquant)** : la var est-elle injectée dans l'environnement de build (Appflow / CI) ? Si le build mobile se fait sans cette var → c'est LA cause. Vérifier sur device via console : `console.log(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN)`.

**Cause racine #2 (probable, cumulable) — hauteur du conteneur = 0.**
- `Map.tsx` conteneur final : `style={{ width:"100%", height:"100%" }}`. Mapbox exige une hauteur résolue. Si le parent (page Plasmic) n'impose pas de hauteur explicite, `height:100%` → 0 → carte invisible même avec token valide.
- À vérifier : hauteur du wrapper Plasmic qui héberge `<Map>` (Studio).

**Pistes correctives (à détailler en PLAN)** : garantir le token au build + log d'erreur explicite si absent ; ajouter un garde « hauteur min » ; surfacer une erreur visible plutôt qu'un `return` muet.

---

## 2. [GÉNÉRAL] Latence ~5 s à l'ajout aux favoris — `[REPO]` + `[PLASMIC]` (confiance moyenne)

**Fichiers** : `plasmic-library/cards/JobCard/JobCard.tsx:46,97-100,132-140` ; `JobCard/types.ts:20` ; `JobCard.meta.ts` ; `pages/api/supabase/insert-table.ts`, `update-user.ts:31-34`.

**Causes racines (par probabilité)** :
1. **Pas d'optimistic update** : le cœur attend le round-trip réseau complet (client → API route → Supabase → retour) avant de réagir → ~5 s ressenti sur réseau mobile. Aucun feedback immédiat dans `JobCard`.
2. **Stockage favoris possiblement dans `user_metadata`** (`update-user.ts`) → réécriture de toute la metadata user à chaque favori (coûteux et croissant). À confirmer : table dédiée `favorites` vs `user_metadata`.
3. **Wiring Plasmic** : `onFavoriteClick` (`JobCard.tsx:46`) n'est pas exposé proprement en eventHandler dans `JobCard.meta.ts` → la logique d'ajout est probablement branchée en **element actions Plasmic** (Studio), à auditer là-bas.

**À VÉRIFIER** : Network tab device sur un clic favori (quel endpoint, durée) ; où sont stockés les favoris (Supabase). 

---

## 3. [GÉNÉRAL + /profile] Le changement de langue ne fonctionne pas / s'applique au système — `[REPO]` + `[PLASMIC]` + natif (confiance moyenne, à investiguer device)

**Fichiers** : `components/weglot/WeglotScript.tsx:18-30` ; `plasmic-library/others/WeglotSelector/WeglotSelector.tsx` ; `pages/_app.tsx:125` ; tâche antérieure `.claude/tasks/02-traduction-drapeau-ios`.

**Fait vérifié — la clé Weglot est VALIDE et le projet ACTIF** (≠ bug juin 2026) :
- `curl https://cdn.weglot.com/projects-settings/d329a44473da57760d76b809239d58082.json` → `deleted_at:null`, `language_from:"fr"`, `auto_switch:false`, clé = celle de `WeglotScript.tsx:20`.
- La config projet définit un **switcher natif Weglot mobile** (`custom_settings.switchers[0]` : `display_device:"mobile"`, `is_dropdown:true`, `with_flags:true`). ⚠️ Donc Weglot **injecte son propre switcher** sur mobile, en plus du `WeglotSelector` custom → **deux switchers possibles**, source de confusion (cf. mémoire `weglot-project-deleted`).

**Bug A — « changement de langue ne fonctionne pas » (causes par probabilité)** :
1. **Race de timing** : `WeglotSelector` poll `window.Weglot` ~5 s (100 ms × 50) ; un clic avant chargement du CDN appelle `switchTo` dans le vide → échec silencieux (retry limité). Sur réseau lent / cold start natif, fenêtre dépassée.
2. **Course Plasmic ↔ Weglot** : Plasmic injecte le DOM après `Weglot.initialize()` ; si l'observation des mutations rate la fenêtre, contenu non traduit. `dynamic:true` est configuré (`WeglotScript.tsx`), mais à valider sur device.
3. À écarter : clé supprimée (vérifié actif).

**Bug B — /profile : « la langue s'applique au système (batterie/status bar) »** :
- Hypothèse #1 (forte) : le sélecteur de langue sur /profile est un **`<select>` HTML natif** (pattern présent dans `forms/JamDropdown` / `forms/PhoneSelector`) → sur iOS le tap ouvre le picker natif ; mal câblé, l'utilisateur perçoit une action « système ». OU c'est le **switcher natif Weglot** injecté qui s'affiche au mauvais endroit.
- Hypothèse #2 : confusion visuelle avec la **status bar iOS** (langue de la status bar non gérée — aucune ref `@capacitor/status-bar`).
- **À VÉRIFIER (Plasmic Studio + device)** : quel composant exact sert de sélecteur de langue sur la page `/profile` (WeglotSelector custom ? select natif ? switcher Weglot injecté ?). C'est le point décisif.

---

## 4. [/alertes] Bouton « Paramètres » recouvert par le bouton chat — `[REPO]` (confiance haute)

**Fichiers** : `components/crispChat/CrispChat.tsx:40` ; `plasmic-library/alerts/AlertManager/AlertManager.module.css:7` (z-index:1000) ; `styles/globals.css` (Weglot fixed z-index:99999).

**Cause racine** : le **launcher Crisp** (position fixed `right`, z-index interne très élevé ~2147483xxx) se superpose au bouton « Paramètres » de /alertes (positionné bottom, z-index local faible). Conflit de superposition + position.
- À noter : Crisp n'est configuré qu'avec `position:'right'` (`CrispChat.tsx:40`), aucun offset / safe-area.
**Pistes** : repositionner le launcher Crisp sur /alertes (offset / `chat:hide` contextuel comme déjà fait pour `/parametres-abonnement`), ou décaler le bouton Paramètres. À arbitrer en PLAN.

---

## 5. [/alertes] Alerte vide au premier chargement — `[REPO]` + `[PLASMIC]` (confiance moyenne)

**Fichiers** : `plasmic-library/alerts/AlertManager/AlertManager.tsx:30-35` ; `AlertManager.meta.ts:10-12` (`defaultValue:[]`) ; **doublon** `plasmic-library/ui/AlertManager/` (vérifier lequel est rendu via `plasmic-library/components.ts`).

**Causes (par probabilité)** :
1. **Init Plasmic avec un item vide** : la page `/alertes` (Studio) passe probablement `alerts=[{}]` ou un placeholder → un item fantôme rendu avant données. `AlertManager.tsx:32` `setVisibleAlerts(alerts.slice(0,maxAlerts))` propage l'objet vide.
2. **Rendu avant données async** : liste rendue pendant que la query Supabase n'a pas répondu (pas d'état « loading » distinct de « vide »).
3. **Doublon de composant** (`alerts/` vs `ui/`) : confirmer le composant réellement importé.

**À VÉRIFIER** : props passées à AlertManager sur la page /alertes (Studio) ; état initial `alerts` au mount (log device).

---

## 6. [/alertes] Zoom non annulable au choix du « temps de travail » — `[REPO]` (confiance TRÈS haute)

**Fichiers** : `pages/_app.tsx:119-121` (**pas de meta viewport**) ; champs de formulaire alerte : `forms/JamDatePicker/JamDatePicker.tsx` (Ant Design, fontSize 14px par défaut), `forms/InputComboSelect/InputComboSelect.module.css:22` (14px), `styles/presets.ts:309,328` (`selectStyle`/`textareaStyle` 15px).

**Cause racine (quasi certaine)** : comportement natif iOS — focus sur un `<input>/<select>` avec **`font-size < 16px` déclenche un auto-zoom**, et **sans meta viewport `maximum-scale=1`/`user-scalable=no`, le dézoom ne revient jamais**. Les champs du formulaire d'alerte (« temps de travail » = Ant DatePicker/TimePicker ou InputComboSelect) sont à 14-15px.
- Confirmé : aucun meta viewport global (cf. §0) + plusieurs champs <16px.

**Piste corrective haute-leverage (touche aussi §8/safe-area)** : ajouter le meta viewport global (`width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover` ± `user-scalable=no`) ET/OU forcer `font-size:16px` sur les inputs (Ant `ConfigProvider token.fontSize=16` + CSS `.ant-picker-input`). À arbitrer : `user-scalable=no` dégrade l'accessibilité.

---

## 7. [/annonces] Page blanche « Chargement », sans style — `[PLASMIC]` + `[REPO]` (confiance moyenne, **à investiguer device en priorité**)

**Fichiers** : `pages/[[...catchall]].tsx:50-67,80-85` ; `plasmic-library/others/DataGridOffre/DataGridOffre.tsx:372,383-390,572-574` ; `DataGridOffre.module.css`.

**Faits** :
- `DataGridOffre` est `dynamic(..,{ssr:false})` → rend `null` avant mount, puis `<div class=loading><spinner/><p>Chargement...</p></div>` tant que `isLoading=true` (`:383-390`). C'est la source la plus probable du texte « Chargement ».
- Le catchall passe `queryCache:{}` → **toutes les données viennent du client** ; si la query Supabase de la page /annonces ne résout jamais (session non prête en natif, query bloquée), `isLoading` reste vrai → **chargement infini**.

**Causes (par probabilité)** :
1. **Query Supabase de /annonces jamais résolue** en webview (timing session / provider Plasmic Supabase au cold start natif) → loader permanent.
2. **« Sans style »** : à clarifier — soit le loader minimal `styles.loading` n'a pas son CSS (peu probable en `capacitor://`), soit l'utilisateur décrit l'écran de loader nu (spinner+texte) hors layout. **Indice clé à vérifier device**.
3. **Page /annonces absente du build** (`getStaticPaths` `fallback:false`) → mais donnerait un 404 (`NextError`), pas « Chargement » → moins probable.

**À VÉRIFIER (device, prioritaire)** : logs console sur /annonces (la query offers résout-elle ? erreur ? `isLoading` bascule-t-il ?) ; confirmer quel composant Plasmic compose /annonces (DataGridOffre back-office vs liste JobCard) ; vérifier que `/annonces.html` est généré dans `out/`.

---

## 8. [/annonces détail] Cœur déjà-favori non reflété + bouton partage cassé — `[PLASMIC]` + `[REPO]` (confiance moyenne/haute)

**Fichiers** : `plasmic-library/cards/JobCard/JobCard.tsx:132-140` (cœur affiché si `state==="liked"|"applied"`) ; `JobCard/types.ts:20` (`isFavorite` déclaré mais **non exposé** en meta) ; `package.json` (**pas de `@capacitor/share`**).

**Bug cœur (état non reflété)** :
- `JobCard` n'affiche un cœur « plein » que si la prop `state` vaut `liked`/`applied`. Aucune logique ne **dérive `state` depuis l'état favori réel** de l'utilisateur. La page détail (Plasmic) passe vraisemblablement `state="default"` → cœur « ajoutable » alors que déjà favori.
- ⚠️ Le **bouton partage et le cœur de la page détail** ne semblent **pas** dans `JobCard` (JobCard n'a pas de bouton share) → ils sont **construits côté Plasmic Studio** sur la page détail. Confirmation nécessaire.

**Bug partage** :
1. **`@capacitor/share` absent** du `package.json` → aucune API de partage native disponible. `navigator.share` n'est pas fiable en webview iOS Capacitor sans plugin. → bouton sans effet.
2. Handler probablement non câblé (Plasmic).

**Pistes** : installer `@capacitor/share` + brancher un composant/handler partage ; calculer l'état favori côté données et le passer à `state`/`isFavorite`. À arbitrer en PLAN.

---

## 9. [Chat Crisp] Croix de fermeture non cliquable — `[REPO]` (confiance moyenne, à investiguer device)

**Fichiers** : `components/crispChat/CrispChat.tsx:38-45` ; `pages/_app.tsx:119-121` (pas de `viewport-fit=cover`).

**Causes (par probabilité)** :
1. **Safe-area / notch iOS** : sans `viewport-fit=cover` ni offset Crisp, la fenêtre Crisp peut s'étendre sous le notch / Dynamic Island → **la croix (`.cc-...`) est sous la zone non cliquable** en haut. Cohérent avec l'absence totale de gestion safe-area (§0).
2. Aucun `config` Crisp de safe-area/offset (`CrispChat.tsx` ne pousse que `position:'right'`).

**Pistes** : `viewport-fit=cover` + insets safe-area ; éventuellement config Crisp d'offset ; vérifier en inspectant la webview que la croix n'est pas hors viewport/sous le notch. À valider device.

---

## Synthèse — classement & nature des correctifs

| # | Bug | Nature | Confiance cause | Fix repo possible |
|---|-----|--------|-----------------|-------------------|
| 1 | Carte non affichée | token Mapbox absent build (+ hauteur) | Haute | Oui (+ vérif env build) |
| 6 | Zoom alertes non annulable | pas de meta viewport + inputs <16px | Très haute | **Oui** |
| 4 | Paramètres recouvert par chat | z-index/position launcher Crisp | Haute | Oui |
| 9 | Croix Crisp non cliquable | safe-area / viewport-fit absent | Moyenne | Oui (à valider device) |
| 2 | Latence favoris 5s | pas d'optimistic update / metadata | Moyenne | Partiel (Plasmic) |
| 8 | Cœur détail + partage | state non dérivé + `@capacitor/share` absent | Moy/Haute | Partiel (Plasmic + plugin) |
| 5 | Alerte vide 1er chargement | init Plasmic item vide / doublon comp. | Moyenne | Partiel (Plasmic) |
| 3 | Langue (général + /profile) | race Weglot + sélecteur natif | Moyenne | Partiel — Studio décisif |
| 7 | /annonces page blanche | query Supabase non résolue en natif | Moyenne | **À investiguer device** |

### Quick win transverse
**Ajouter le meta viewport global** (`_app.tsx` ou nouveau `_document.tsx`) avec `width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover` règle/atténue **#6 (zoom)** et **#9 (safe-area Crisp)** d'un coup. C'est la première chose à cadrer en PLAN.

### Dépendances Plasmic Studio (hors repo) — à auditer/aligner
- Page /profile : composant sélecteur de langue (#3)
- Page /alertes : props AlertManager + position bouton Paramètres (#4, #5)
- Page détail annonce : wiring cœur + bouton partage (#8)
- Page /annonces : source de données / query Supabase (#7)
- Pages hébergeant `<Map>` : hauteur du conteneur (#1)

### Vérifications device prioritaires (TestFlight, panneau debug on-device — pas d'inspecteur Safari dispo)
1. `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` défini dans le bundle ? (#1)
2. /annonces : la query offers résout-elle, `isLoading` bascule-t-il, erreurs ? (#7)
3. /profile : quel élément déclenche le changement de langue (#3)
4. Crisp : position réelle de la croix vs notch (#9)
5. Réseau d'un clic favori (#2)

---

## Librairies à documenter via Context7 en phase PLAN/CODE
- `@capacitor/share` (ajout plugin partage — #8)
- Mapbox GL JS (init/erreurs/hauteur — #1)
- Weglot JS snippet (switchTo / dynamic / event languageChanged — #3)
- Crisp `$crisp` config (offset/safe-area — #9, #4)
- Next.js pages router viewport / `_document` (#6, #9)
- Ant Design `ConfigProvider` token.fontSize (#6)
