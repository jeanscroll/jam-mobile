# IMPLEMENTATION — bouton « Créer une offre d'emploi » ne répond pas (reviewer Apple, iPad iOS)

## Statut : ✅ Implémenté, typecheck OK (0 erreur projet)

## Cause racine
Sur iOS natif, le bouton « Créer une offre d'emploi » (StripeSubscriptionButton `create` /
StripeCheckoutButton — Stripe interdit hors IAP par l'App Store) ouvrait l'URL employeur via
`await Browser.open(...)` **sans `try/catch` ni `presentationStyle`**. Sur iPad, la présentation
SFSafariViewController peut échouer ; le rejet étant non géré, le bouton restait **sans réaction**
(« ne répond pas ») pour le reviewer Apple — aucun feedback, aucun repli.

## Modifications

### `lib/utils.ts`
- Ajout import `Browser` (`@capacitor/browser`).
- Nouveau helper exporté `openExternalUrl(url)` :
  - natif → `Browser.open({ url, presentationStyle: "fullscreen" })` (fiable iPad) ;
  - `try/catch` → repli `window.open(url, "_blank", "noopener,noreferrer")` ;
  - web → `window.open` ;
  - ne throw jamais ; garde anti-URL vide.

### `plasmic-library/buttons/StripeSubscriptionButton/StripeSubscriptionButton.tsx`
- Import `Browser` retiré, `openExternalUrl` ajouté (depuis `@/lib/utils`).
- Branche iOS `create` : `Browser.open(...)` → `openExternalUrl(...)`.

### `plasmic-library/buttons/StripeCheckoutButton/StripeCheckoutButton.tsx`
- Idem (import + branche iOS).

### `pages/parametres-abonnement.tsx`
- Import `openExternalUrl` ajouté.
- `openExternal` délègue désormais à `openExternalUrl` (mutualisation + robustesse).
- Import `Browser` conservé (toujours utilisé ailleurs dans le fichier, l.~534, inchangé).

## Vérifications effectuées
- `tsc --noEmit` (binaire projet) : **0 erreur** (global + fichiers modifiés).
- Câblage des imports/usages vérifié par grep.
- Faux positifs ignorés à juste titre : validateur « App Router » sur une app **Pages Router**
  (`getStaticProps`/`next/router`/`next/head` corrects ici, préexistants, hors périmètre) ;
  bruit ESLint = mismatch binaire global v10 vs config Next du projet (pas une erreur du code).

## Validation manuelle recommandée (équipe, hors environnement actuel)
1. Build iOS Capacitor, tester sur **iPad (natif iOS)** : tap « Créer une offre d'emploi »
   → SFSafariViewController **plein écran** sur la page offre employeur.
2. iPhone natif : non régressé.
3. Web (Safari iPad) : `window.open` ouvre bien l'onglet.
4. Confirmer dans **Plasmic Studio** que le bouton « Créer une offre d'emploi » est bien câblé
   sur `StripeSubscriptionButton`/`StripeCheckoutButton`. Sinon, appliquer `openExternalUrl`
   au composant réellement utilisé (le helper est générique et réutilisable).

## Hors périmètre (non traité volontairement)
- Config Plasmic Studio (hors repo).
- Refonte abonnement / IAP.
- Forwarding `onClick` des slots Plasmic (`cloneElement`) : piste secondaire possible,
  non spécifique iPad, documentée dans `explore.md` — non corrigée pour éviter une
  régression visuelle Plasmic.
