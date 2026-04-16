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
      androidClientId: '245770560145-72htgnj8isfd7jhis0sr2pvk6f02rika.apps.googleusercontent.com',
      serverClientId: '245770560145-efjb7lm8247kpbe4ojakh9u6ape4val5.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
    Stripe: {
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.jam.mobile',
      enableGooglePay: false,
      enableApplePay: true,
      countryCode: 'FR',
      merchantDisplayName: 'JAM Mobile',
    },
  },
};

export default config;
