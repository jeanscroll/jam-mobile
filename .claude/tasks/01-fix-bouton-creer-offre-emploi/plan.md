# PLAN — Correction : bouton « Créer une offre d'emploi » ne répond pas (reviewer Apple, iPad iOS natif)

## Contexte confirmé (réponses utilisateur)
- « Apple » = un **reviewer Apple App Store** testant l'app.
- Contexte = **app native iOS sur iPad** (`Capacitor.isNativePlatform()` = true, `getPlatform()` = `"ios"`).
- Le bouton « Créer une offre d'emploi » côté Plasmic = inconnu, mais c'est **forcément** un bouton de création d'abonnement employeur → câblé sur `StripeSubscriptionButton` (`stripeAction="create"`) ou `StripeCheckoutButton` (les deux pointent par défaut sur `https://job-around-me.com/offre-employeur`, la « page offre employeur »).

## Cause racine (preuve dans le code)

Sur iOS natif, ces deux boutons court-circuitent Stripe (refusé par l'App Store hors IAP) et ouvrent l'URL web via `@capacitor/browser` :

`StripeSubscriptionButton.tsx` l.79-84 et `StripeCheckoutButton.tsx` l.54-60 :
```ts
if (stripeAction === "create" && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
  await Browser.open({ url: iosFallbackUrl || "https://job-around-me.com/offre-employeur" });
  return;
}
```

**Problèmes :**
1. **`await Browser.open(...)` sans `try/catch`.** Si `Browser.open` rejette/échoue (cas connu sur **iPad** : présentation SFSafariViewController), le rejet est **non géré et silencieux** → le bouton « ne répond pas » exactement comme rapporté (contrairement au chemin Stripe qui a `try/catch` + `alert`).
2. **Pas de `presentationStyle`.** Sur iPad, SFSafariViewController peut se présenter en feuille (page-sheet) dismissible/peu visible. `presentationStyle: 'fullscreen'` donne un comportement net et fiable sur iPad.
3. **Aucun repli.** Si l'in-app browser échoue, aucune alternative → action perdue.
4. Le projet **sait déjà** que cette surface est fragile : `pages/parametres-abonnement.tsx` l.133-141 documente *« Capacitor WebViews don't always honour external URLs — use the system browser »* via un helper `openExternal` — mais ce helper n'a lui-même **ni try/catch ni presentationStyle**, et les 2 boutons Stripe ne l'utilisent pas.

→ Pour le reviewer Apple sur iPad, le tap sur « Créer une offre d'emploi » déclenche `Browser.open` qui échoue silencieusement : **bouton sans réaction**.

## Stratégie de correction

Créer **un helper partagé robuste** d'ouverture d'URL externe, et l'utiliser partout, avec :
- `presentationStyle: 'fullscreen'` sur iOS (fiable iPad + iPhone) ;
- `try/catch` autour de `Browser.open` ;
- repli `window.open(url, "_blank")` si l'in-app browser échoue ;
- log clair en cas d'échec.

### Fichier 1 (nouveau) : `lib/utils/openExternalUrl.ts`
```ts
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Ouvre une URL externe de façon fiable.
 * iOS/Android natif : @capacitor/browser (presentationStyle fullscreen — fiable iPad).
 * Échec natif → repli window.open. Web → window.open.
 * Ne throw jamais : garantit qu'un tap produit toujours une action.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url, presentationStyle: "fullscreen" });
      return;
    } catch (err) {
      console.error("[openExternalUrl] Browser.open a échoué, repli window.open:", err);
    }
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
```

### Fichier 2 : `plasmic-library/buttons/StripeSubscriptionButton/StripeSubscriptionButton.tsx`
- Importer `openExternalUrl`.
- Remplacer le bloc iOS (l.79-84) par :
```ts
if (stripeAction === "create" && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
  await openExternalUrl(iosFallbackUrl || "https://job-around-me.com/offre-employeur");
  return;
}
```
- (`finally { setLoading(false) }` existe déjà → état non bloqué.)

### Fichier 3 : `plasmic-library/buttons/StripeCheckoutButton/StripeCheckoutButton.tsx`
- Importer `openExternalUrl`.
- Remplacer le bloc iOS (l.55-60) par :
```ts
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
  await openExternalUrl(iosFallbackUrl || "https://job-around-me.com/offre-employeur");
  return;
}
```

### Fichier 4 : `pages/parametres-abonnement.tsx`
- Remplacer le corps de `openExternal` (l.135-141) par un appel à `openExternalUrl` (mutualisation + robustesse), en gardant la signature synchrone (fire-and-forget : `void openExternalUrl(url)`).

### Robustesse complémentaire (slot Plasmic)
Dans les 2 boutons, le rendu `isValidElement(children) ? cloneElement(children,{onClick}) : <button>`. Si le slot Plasmic contient un élément qui ne reforwarde pas `onClick`, le clic est ignoré (cause possible secondaire, non spécifique iPad). **Mitigation sûre et non régressive** : envelopper le `cloneElement` dans un `<span role="presentation" onClick={handleClick} style={{display:"contents"}}>` n'est pas fiable (`display:contents` + events). → On garde `cloneElement` mais on ajoute un wrapper `<span onClick={handleClick} className="contents">` uniquement si nécessaire. **Décision : NE PAS** sur-corriger ce point dans ce ticket (risque de régression visuelle Plasmic) ; le documenter comme point de vérification post-fix. Le cœur du bug iPad/Apple est le `Browser.open` silencieux.

## Vérification / Tests
1. `npm run lint` + `tsc --noEmit` (typecheck) propres sur les fichiers modifiés.
2. Test logique : simuler `Browser.open` qui rejette → vérifier que `window.open` est appelé (test unitaire léger si infra de test présente dans `tests/`, sinon revue manuelle).
3. Build Capacitor iOS (`CAPACITOR_BUILD=true npm run build`) ne casse pas.
4. Validation manuelle recommandée côté équipe : iPad (natif iOS) — tap « Créer une offre d'emploi » → SFSafariViewController **plein écran** sur la page offre employeur ; iPhone : non régressé ; web/iPad Safari : `window.open` fonctionne.
5. Vérifier dans Plasmic Studio quel composant porte le libellé « Créer une offre d'emploi » et confirmer qu'il est bien `StripeSubscriptionButton`/`StripeCheckoutButton` (sinon, appliquer le même helper au composant concerné).

## Hors périmètre
- Refonte du flux d'abonnement / IAP.
- Modification de la config Plasmic Studio (hors repo).
- Correctif générique du forwarding `onClick` des slots Plasmic (documenté, non traité ici pour éviter une régression).

## Risques & atténuation
- **Régression iPhone/web** : helper conserve le comportement existant (Browser.open natif, window.open web) + `presentationStyle:'fullscreen'` (déjà le défaut effectif iPhone). Risque faible.
- **`presentationStyle` non supporté** : option officielle `@capacitor/browser` v7 (confirmé Context7), ignorée hors iOS. Aucun risque.
