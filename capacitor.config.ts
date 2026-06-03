import type { CapacitorConfig } from "@capacitor/cli";

// Note: process.env ne fonctionne pas pour le config natif, on hardcode la clé
const STRIPE_PUBLISHABLE_KEY =
  "pk_live_51Rgj4ZFVPXc61qf6Cuqgss6kG6T9r0PJixqXb9NUljpU02sKHT9ewFIxpEW56wACxzuHOqzDyDpivmyML2Tqtyy400tvnYfXSu";

const config: CapacitorConfig = {
  appId: "com.jam.mobile",
  appName: "JAM Mobile",
  webDir: "out",
  server: {
    androidScheme: "https",
    // iOS servait l'app depuis `capacitor://localhost` : une origine non-standard
    // que l'API de traduction Weglot (soumise au CORS) n'autorise pas → les
    // dictionnaires EN n'étaient jamais chargés → "le drapeau ne fait rien".
    // Cf. https://support.weglot.com/article/390-weglot-and-cors-policies
    iosScheme: "https",
    // On sert le bundle LOCAL (webDir) sous l'origine du domaine prod déjà
    // autorisé dans le projet Weglot (où la version web se traduit : job-around-me.com).
    // Weglot voit alors un domaine reconnu → CORS OK → switchTo('en') traduit.
    // NB: l'OAuth natif (Google/Apple) passe par le schéma `com.jam.mobile://`,
    // indépendant de cette origine → non impacté. Seul effet de bord : la session
    // Supabase (localStorage, scoping par origine) impose UNE reconnexion.
    hostname: "job-around-me.com",
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      iosClientId:
        "245770560145-pfll9kc88lhach85fp9r8l563ogcesph.apps.googleusercontent.com",
      // ⚠️ Le fork @southdevs passe la clé lue ici à requestIdToken() côté Android,
      // qui EXIGE le Web client ID (un Android client ID => code:10 DEVELOPER_ERROR).
      // Ordre de lecture Android : androidClientId → clientId → R.string.server_client_id
      // (la clé serverClientId est ignorée sur Android). On met donc le Web client ID
      // dans clientId et on NE met PAS androidClientId : l'Android OAuth client
      // (SHA-1 + package) est associé automatiquement par Play Services, son ID n'a
      // pas besoin d'être référencé. iOS utilise iosClientId + serverClientId.
      clientId:
        "245770560145-efjb7lm8247kpbe4ojakh9u6ape4val5.apps.googleusercontent.com",
      serverClientId:
        "245770560145-efjb7lm8247kpbe4ojakh9u6ape4val5.apps.googleusercontent.com",
      forceCodeForRefreshToken: false,
    },
    Stripe: {
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      // Apple Pay disabled on iOS — the app now uses StoreKit / In-App
      // Purchase via RevenueCat for digital content (App Store guideline 3.1.1).
      // Google Pay stays available on Android.
      enableGooglePay: false,
      enableApplePay: false,
      countryCode: "FR",
      merchantDisplayName: "JAM Mobile",
    },
  },
};

export default config;
