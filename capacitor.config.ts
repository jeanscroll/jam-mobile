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
    Stripe: {
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.jam.mobile',
      enableGooglePay: true,
      enableApplePay: true,
      countryCode: 'FR',
      merchantDisplayName: 'JAM Mobile',
    },
  },
};

export default config;
