# EXPLORE — Bug : bouton « Créer une offre d'emploi » ne répond pas (employeur Apple, iPad)

## Contexte technique
- App = Next.js 14 + Capacitor/Ionic (iOS/Android) + UI **Plasmic Studio** (pages rendues via `pages/[[...catchall]].tsx`).
- Les boutons et leur câblage `onClick` sont **configurés dans Plasmic Studio**, pas dans le repo. Seuls les *code components* sont dans `plasmic-library/`.
- Auth = Supabase. OAuth natif Apple/Google via `lib/auth/oauthNative.ts`.

## Constat clé : `errors.md`
`errors.md` est un dump de logs d'un flux **OAuth Apple** :
`https://idwomihieftgogbgivic.supabase.co/auth/v1/authorize?provider=apple&redirect_to=com.jam.mobile://auth/callback`
→ « Apple » fait très probablement référence à une inscription via **Sign in with Apple**, pas à une société nommée Apple.

## Candidat principal au bug : `StripeSubscriptionButton`
Fichier : `plasmic-library/buttons/StripeSubscriptionButton/StripeSubscriptionButton.tsx`
- `stripeAction` défaut = `"create"`. Commentaire dans le code (l.32-37) : *« Defaults to the employer offer page »* → c'est très probablement le bouton **« Créer une offre d'emploi »** (création d'abonnement employeur).
- Rendu via `cloneElement` :
```tsx
{isValidElement(children)
  ? cloneElement(children, { onClick: handleClick, disabled: disabled || loading, ref })
  : (<button type="button" ref={ref} disabled={disabled || loading} onClick={handleClick}>…</button>)}
```
  ⚠️ **Risque 1** : si le slot `children` (Plasmic) contient un élément/composant qui **ne reforwarde pas `onClick` vers un `<button>` DOM**, le clic est ignoré → « ne répond pas ».
- Branche iOS native (l.79-84) :
```tsx
if (stripeAction === "create" && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
  await Browser.open({ url: iosFallbackUrl || "https://job-around-me.com/offre-employeur" });
  return;
}
```
  ⚠️ **Risque 2** : sur iPad **en app native iOS**, `getPlatform() === "ios"` → ouvre `Browser.open`. Si `@capacitor/browser` échoue/ne présente pas le SFSafariViewController, perception « rien ne se passe » (un `alert` devrait toutefois apparaître en cas de reject).
- ⚠️ **Risque 3** : `disabled || loading`. Si `disabled` est bindé dans Plasmic à une condition (ex. « pas de customerId/email/abonnement ») vraie pour un employeur fraîchement inscrit via Apple (email relais privé Apple, ligne `user` non créée comme pour le flux email/mot de passe) → bouton rendu **disabled** → aucune réponse.

## Flux Apple OAuth (`lib/auth/oauthNative.ts`)
- iOS natif : `signInWithAppleNative()` → `SignInWithApple.authorize` → `supabase.auth.signInWithIdToken({provider:"apple"})` → `syncSessionToCookies`.
- Apple ne renvoie l'email/nom qu'au **premier** consentement ; option « Masquer mon e-mail » → email relais. Si Plasmic binde `customerEmail`/`customerId` du bouton sur des données utilisateur absentes après inscription Apple → bouton désactivé ou action Stripe en échec.
- Le flux email/mot de passe (`SignUp.tsx`) et le flux Apple ne créent potentiellement pas les mêmes données (rôle `employer`, ligne table `user`/société).

## Autres pistes responsive (à confirmer en repro)
- `ConfirmModal.tsx` : overlay `fixed inset-0 bg-black/50 z-50`. Pour `stripeAction="create"`, `handleClick` n'ouvre PAS la modale (modale réservée à `cancel`/`update`) → peu probable ici, mais un overlay résiduel (Weglot `z-index:99999`, splash) reste à vérifier sur iPad.
- Breakpoints Tailwind par défaut (`md:768`, `lg:1024`). iPad portrait = 768 (`md`), paysage = 1024 (`lg`). Aucun breakpoint custom iPad.

## Ce qui manque pour trancher (hors repo)
1. Sens de « Apple » : inscription via **Sign in with Apple** vs société nommée « Apple ».
2. Contexte de repro : **app native iOS sur iPad** vs **web responsive en viewport iPad** (Safari).
3. Quel composant Plasmic est exactement le bouton « Créer une offre d'emploi » et comment ses props (`disabled`, `customerEmail`, `customerId`, `onClick`/slot) sont bindées dans Plasmic Studio.

## Fichiers pertinents
- `plasmic-library/buttons/StripeSubscriptionButton/StripeSubscriptionButton.tsx` (l.79-84, 175-190)
- `plasmic-library/buttons/StripeSubscriptionButton/ConfirmModal.tsx` (l.38, 70-72)
- `lib/auth/oauthNative.ts` (l.143-183, 234-266)
- `plasmic-library/buttons/JamButton/JamButton.tsx` (forwarde bien onClick)
- `middleware.ts` (routes publiques : `/register-company`, `/accueil-employeur`)
- `pages/auth/oauth-callback.tsx`, `pages/callback.tsx`
