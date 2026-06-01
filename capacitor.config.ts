import type { CapacitorConfig } from '@capacitor/cli';

// Note: process.env ne fonctionne pas pour le config natif, on hardcode la clé
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51Rgj4ZFVPXc61qf6Cuqgss6kG6T9r0PJixqXb9NUljpU02sKHT9ewFIxpEW56wACxzuHOqzDyDpivmyML2Tqtyy400tvnYfXSu';

const config: CapacitorConfig = {
  appId: 'com.jam.mobile',
  appName: 'JAM Mobile',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      iosClientId: '245770560145-pfll9kc88lhach85fp9r8l563ogcesph.apps.googleusercontent.com',
      // ⚠️ Le fork @southdevs passe la clé lue ici à requestIdToken() côté Android,
      // qui EXIGE le Web client ID (un Android client ID => code:10 DEVELOPER_ERROR).
      // Ordre de lecture Android : androidClientId → clientId → R.string.server_client_id
      // (la clé serverClientId est ignorée sur Android). On met donc le Web client ID
      // dans clientId et on NE met PAS androidClientId : l'Android OAuth client
      // (SHA-1 + package) est associé automatiquement par Play Services, son ID n'a
      // pas besoin d'être référencé. iOS utilise iosClientId + serverClientId.
      clientId: '245770560145-efjb7lm8247kpbe4ojakh9u6ape4val5.apps.googleusercontent.com',
      serverClientId: '245770560145-efjb7lm8247kpbe4ojakh9u6ape4val5.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
    Stripe: {
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      // Apple Pay disabled on iOS — the app now uses StoreKit / In-App
      // Purchase via RevenueCat for digital content (App Store guideline 3.1.1).
      // Google Pay stays available on Android.
      enableGooglePay: false,
      enableApplePay: false,
      countryCode: 'FR',
      merchantDisplayName: 'JAM Mobile',
    },
  },
};

export default config;
