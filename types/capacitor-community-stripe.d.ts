declare module "@capacitor-community/stripe" {
  export interface StripeInitializationOptions {
    publishableKey: string;
    stripeAccount?: string;
    merchantIdentifier?: string;
  }

  export interface CreateApplePayOption {
    paymentIntentClientSecret: string;
    paymentSummaryItems: Array<{
      label: string;
      amount: number;
    }>;
    merchantIdentifier: string;
    merchantDisplayName?: string;
    countryCode: string;
    currency: string;
    requiredShippingContactFields?: Array<
      "postalAddress" | "phoneNumber" | "emailAddress" | "name"
    >;
    allowedCountries?: string[];
    allowedCountriesErrorDescription?: string;
  }

  export interface ApplePayResultInterface {
    paymentResult: ApplePayEventsEnum;
  }

  export enum ApplePayEventsEnum {
    Loaded = "applePayLoaded",
    FailedToLoad = "applePayFailedToLoad",
    Completed = "applePayCompleted",
    Canceled = "applePayCanceled",
    Failed = "applePayFailed",
    DidSelectShippingContact = "applePayDidSelectShippingContact",
    DidCreatePaymentMethod = "applePayDidCreatePaymentMethod",
  }

  // Google Pay Types
  export interface CreateGooglePayOption {
    paymentIntentClientSecret: string;
    paymentSummaryItems?: Array<{
      label: string;
      amount: number;
    }>;
    merchantDisplayName?: string;
    countryCode: string;
    currency: string;
  }

  export interface GooglePayResultInterface {
    paymentResult: GooglePayEventsEnum;
  }

  export enum GooglePayEventsEnum {
    Loaded = "googlePayLoaded",
    FailedToLoad = "googlePayFailedToLoad",
    Completed = "googlePayCompleted",
    Canceled = "googlePayCanceled",
    Failed = "googlePayFailed",
  }

  export interface PluginListenerHandle {
    remove: () => Promise<void>;
  }

  export interface StripePlugin {
    initialize(opts: StripeInitializationOptions): Promise<void>;
    // Apple Pay
    isApplePayAvailable(): Promise<void>;
    createApplePay(opts: CreateApplePayOption): Promise<void>;
    presentApplePay(): Promise<ApplePayResultInterface>;
    // Google Pay
    isGooglePayAvailable(): Promise<void>;
    createGooglePay(opts: CreateGooglePayOption): Promise<void>;
    presentGooglePay(): Promise<GooglePayResultInterface>;
    // Listeners
    addListener(
      eventName: ApplePayEventsEnum | GooglePayEventsEnum,
      listenerFunc: () => void
    ): PluginListenerHandle;
  }

  export const Stripe: StripePlugin;
}
