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

  export interface PluginListenerHandle {
    remove: () => Promise<void>;
  }

  export interface StripePlugin {
    initialize(opts: StripeInitializationOptions): Promise<void>;
    isApplePayAvailable(): Promise<void>;
    createApplePay(opts: CreateApplePayOption): Promise<void>;
    presentApplePay(): Promise<ApplePayResultInterface>;
    addListener(
      eventName: ApplePayEventsEnum,
      listenerFunc: () => void
    ): PluginListenerHandle;
  }

  export const Stripe: StripePlugin;
}
