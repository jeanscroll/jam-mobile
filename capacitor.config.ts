import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jam.mobile',
  appName: 'JAM Mobile',
  webDir: 'out',
  plugins: {
    Stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      merchantIdentifier: 'merchant.jam.mobile',
      enableGooglePay: true,
    },
  },
};

export default config;
