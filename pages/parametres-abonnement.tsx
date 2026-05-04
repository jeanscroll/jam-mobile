import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/components";
import { cn, getApiBaseUrl } from "@/lib/utils";
import StripeSubscriptionButton from "@/plasmic-library/buttons/StripeSubscriptionButton/StripeSubscriptionButton";
import StripeCheckoutButton from "@/plasmic-library/buttons/StripeCheckoutButton/StripeCheckoutButton";
import GooglePayButton from "@/plasmic-library/buttons/GooglePayButton/GooglePayButton";

// ---------- Types ----------

type StripeInfo = {
  customer_id: string;
  user_id: string | null;
  subscription_id: string | null;
  price_id: string | null;
  product_id: string | null;
  status: string | null;
  recharge_classic: number | null;
  recharge_lastminute: number | null;
  recharge_boost: number | null;
  session_id: string | null;
};

type UserProfile = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

type MonthlyRecharges = {
  subscription?: { remainingPercent?: number } | null;
  solde?: {
    totalClassic?: number;
    totalLastMinute?: number;
    totalBoost?: number;
  } | null;
};

type StripeProduct = {
  product_id: string;
  name: string;
};

type HistoryItem = {
  customer_id: string;
  purchased_at: string;
  total_amount: number | null;
  invoice_url: string | null;
  invoice_title: string | null;
  customer_email: string | null;
  products: unknown;
};

type PriceInfo = {
  productId: string;
  priceId: string;
  amount: number | null;
  currency: string;
  interval: string | null;
};

type PricesResponse = {
  subscriptions: { basic: PriceInfo | null; premium: PriceInfo | null };
  recharges: { classic: PriceInfo | null; minute: PriceInfo | null; boost: PriceInfo | null };
};

// ---------- Helpers ----------

const formatPrice = (amount: number | null, currency: string = "eur") => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

// Subscription create/update redirects use ?subscription=success so the
// prorata sync effect can fire on return. Recharges use ?credit=success.
// The cancel button doesn't redirect (handled in-place).
const SUBSCRIPTION_SUCCESS_PATH = "parametres-abonnement?subscription=success";
const SUBSCRIPTION_CANCEL_PATH = "parametres-abonnement?paiement=cancel";
const RECHARGE_SUCCESS_PATH = "parametres-abonnement?credit=success";
const RECHARGE_CANCEL_PATH = "parametres-abonnement?paiement=cancel";

// On iOS, App Store Review rejects in-app non-IAP purchases of digital
// content. The Stripe buttons fall back to opening this URL in the system
// browser so the user pays on the web — the standard "reader app" pattern
// (Spotify, Netflix, Patreon).
const IOS_FALLBACK_URL = "https://job-around-me.com/parametres-abonnement";

const ACTIVE_STATUSES = ["active", "complete", "completed"];
const isActiveStatus = (status: string | null | undefined) =>
  !!status && ACTIVE_STATUSES.includes(status);

// Prorata multipliers used when upgrading mid-period (matches the Plasmic
// version: 8 classic, 4 last-minute, 2 boost recharges per Premium month).
const PRORATA_MULTIPLIERS = { classic: 8, lastminute: 4, boost: 2 } as const;

// On Capacitor, the user may have signed in via a Plasmic form that stores its
// session in cookies (createBrowserClient) rather than localStorage (the native
// client used by createClient()). We try both and use whichever has a session.
async function resolveSupabaseClient(
  primary: SupabaseClient
): Promise<{ client: SupabaseClient; userId: string; email: string | null } | null> {
  const {
    data: { session: primarySession },
  } = await primary.auth.getSession();
  if (primarySession?.user) {
    return {
      client: primary,
      userId: primarySession.user.id,
      email: primarySession.user.email ?? null,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const cookieClient = createBrowserClient(url, anon);
  const {
    data: { session: cookieSession },
  } = await cookieClient.auth.getSession();
  if (cookieSession?.user) {
    return {
      client: cookieClient,
      userId: cookieSession.user.id,
      email: cookieSession.user.email ?? null,
    };
  }
  return null;
}

async function fetchMonthlyRecharges(
  customerId: string
): Promise<MonthlyRecharges | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;
  try {
    const url = new URL(`${supabaseUrl}/functions/v1/monthly_recharges`);
    url.searchParams.set("customer_id", customerId);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${anonKey}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.response ?? json) as MonthlyRecharges;
  } catch (err) {
    console.warn("monthly_recharges fetch failed:", err);
    return null;
  }
}

// ---------- Page ----------

export default function ParametresAbonnementPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [info, setInfo] = useState<StripeInfo | null>(null);
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prices, setPrices] = useState<PricesResponse | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRecharges | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // iOS Capacitor: hide all "calls to action for purchase outside of the app"
  // to comply with App Store Review Guideline 3.1.3(d) (Free Stand-Alone Apps).
  // Account-management actions (cancel, manage card, view counters & history)
  // remain available — only the BUY/UPGRADE entry points are removed.
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    setIsIOS(
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"
    );
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Resolve the active Supabase client (handles Capacitor's
      // localStorage-vs-cookies session split).
      const resolved = await resolveSupabaseClient(supabase);
      if (!resolved) {
        setError("Vous devez être connecté pour accéder à cette page.");
        setLoading(false);
        return;
      }
      const { client, userId, email: authEmail } = resolved;
      setUserEmail(authEmail);

      // Query 2 (Plasmic getUserStripeInfos): stripe_info + user JOIN to fetch
      // first_name / last_name / email — needed to filter history by email.
      // The prices endpoint can fail (e.g. not yet deployed in prod, or CORS
      // issues from Capacitor) — wrap it so it never breaks the rest of the page.
      const pricesPromise: Promise<PricesResponse | null> = fetch(
        `${getApiBaseUrl()}/api/stripe/list-stripe-prices`
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch((err) => {
          console.warn("list-stripe-prices fetch failed:", err);
          return null;
        });

      const [{ data: infoRow }, { data: productsRow }, pricesRes] = await Promise.all([
        client
          .from("stripe_info")
          .select(
            "customer_id, user_id, subscription_id, price_id, product_id, status, recharge_classic, recharge_lastminute, recharge_boost, session_id, user:user_id(email, first_name, last_name)"
          )
          .eq("user_id", userId)
          .maybeSingle(),
        client.from("stripe_products").select("product_id, name"),
        pricesPromise,
      ]);

      const joinedUser = (infoRow as any)?.user as UserProfile | null | undefined;
      const profileData: UserProfile = {
        email: joinedUser?.email ?? authEmail ?? null,
        first_name: joinedUser?.first_name ?? null,
        last_name: joinedUser?.last_name ?? null,
      };
      setProfile(profileData);

      // Strip the joined `user` payload before storing the row as StripeInfo.
      const { user: _omit, ...infoFlat } = (infoRow as any) ?? {};
      setInfo(((infoRow ? infoFlat : null) as StripeInfo | null) ?? null);
      setProducts((productsRow as StripeProduct[] | null) ?? []);
      // Empty fallback so price lookups return null cleanly downstream.
      const emptyPrices: PricesResponse = {
        subscriptions: { basic: null, premium: null },
        recharges: { classic: null, minute: null, boost: null },
      };
      setPrices(pricesRes ?? emptyPrices);

      // Query 3 (getStripeHistory): match Plasmic's filter on customer_email.
      const billingEmail = profileData.email;
      if (billingEmail) {
        const { data: historyRows } = await client
          .from("stripe_history")
          .select(
            "customer_id, purchased_at, total_amount, invoice_url, invoice_title, customer_email, products"
          )
          .eq("customer_email", billingEmail)
          .order("purchased_at", { ascending: false })
          .limit(50);
        setHistory((historyRows as HistoryItem[] | null) ?? []);
      } else {
        setHistory([]);
      }

      // Query 4 (userMonthlyRecharge): edge function aggregating subscription
      // remainingPercent + recharge balances. Used both for display and for
      // the prorata calculation when upgrading mid-period.
      if (infoRow?.customer_id) {
        const monthlyData = await fetchMonthlyRecharges(infoRow.customer_id);
        setMonthly(monthlyData);
      } else {
        setMonthly(null);
      }
    } catch (err: any) {
      console.error("parametres-abonnement load error:", err);
      setError(err?.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAll();

    // Listen for auth changes — on Capacitor the session sometimes hydrates
    // after mount (cookies vs. localStorage timing), so we re-run the load
    // whenever Supabase reports a new session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadAll();
      }
    });
    return () => subscription.unsubscribe();
  }, [loadAll, supabase]);

  // Plan name resolution
  const currentPlanName = useMemo(() => {
    if (!info?.product_id) return null;
    const product = products.find((p) => p.product_id === info.product_id);
    return product?.name ?? null;
  }, [info, products]);

  // Resolve the "Basic" product_id (= classicSubPid in the Plasmic page) so we
  // know whether the just-purchased plan should add prorata recharges or not.
  const basicProductId = useMemo(
    () =>
      products.find(
        (p) => p.name?.toLowerCase() === "basic"
      )?.product_id ?? null,
    [products]
  );

  // Idempotent prorata sync: when the user returns from Stripe Checkout with
  // ?subscription=success, recompute recharge counters with prorata and push
  // them to validate-subscription?action=update, then clean the URL.
  const prorataAppliedRef = React.useRef(false);
  useEffect(() => {
    if (prorataAppliedRef.current) return;
    if (router.query.subscription !== "success") return;
    if (!info?.customer_id || !monthly || !info.product_id) return;

    prorataAppliedRef.current = true;
    (async () => {
      const remainingPercent = monthly.subscription?.remainingPercent ?? 0;
      const isReturningToBasic =
        !!basicProductId && info.product_id === basicProductId;

      const proratedClassic = isReturningToBasic
        ? 0
        : Math.ceil(PRORATA_MULTIPLIERS.classic * (remainingPercent / 100));
      const proratedLastminute = isReturningToBasic
        ? 0
        : Math.ceil(PRORATA_MULTIPLIERS.lastminute * (remainingPercent / 100));
      const proratedBoost = isReturningToBasic
        ? 0
        : Math.ceil(PRORATA_MULTIPLIERS.boost * (remainingPercent / 100));

      const newClassic =
        (monthly.solde?.totalClassic ?? 0) + proratedClassic;
      const newLastminute =
        (monthly.solde?.totalLastMinute ?? 0) + proratedLastminute;
      const newBoost = (monthly.solde?.totalBoost ?? 0) + proratedBoost;

      const params = new URLSearchParams({
        action: "update",
        customer_id: info.customer_id,
        classic: String(newClassic),
        lastminute: String(newLastminute),
        boost: String(newBoost),
      });
      try {
        await fetch(
          `${getApiBaseUrl()}/api/stripe/validate-subscription?${params.toString()}`
        );
      } catch (err) {
        console.warn("validate-subscription update failed:", err);
      }

      router.replace("/parametres-abonnement?paiement=ok", undefined, {
        shallow: true,
      });
      loadAll();
    })();
  }, [router, info, monthly, basicProductId, loadAll]);

  const statusActive = isActiveStatus(info?.status);
  const isBasic =
    currentPlanName?.toLowerCase() === "basic" && info?.status !== "cancel";
  const isPremium =
    currentPlanName?.toLowerCase() === "premium" && info?.status !== "cancel";
  const hasActiveSubscription = statusActive && (isBasic || isPremium);
  const isCanceled = info?.status === "cancel";

  // Success modal triggered by Stripe redirect query params
  const successQuery =
    typeof router.query.paiement === "string" ? router.query.paiement : "";
  const stripeQuery =
    typeof router.query.stripe === "string" ? router.query.stripe : "";
  const subscriptionQuery =
    typeof router.query.subscription === "string"
      ? router.query.subscription
      : "";
  const creditQuery =
    typeof router.query.credit === "string" ? router.query.credit : "";
  const showSuccessModal =
    successQuery === "ok" ||
    stripeQuery === "success" ||
    subscriptionQuery === "success" ||
    creditQuery === "success";

  const closeSuccessModal = useCallback(() => {
    router.replace("/parametres-abonnement", undefined, { shallow: true });
  }, [router]);

  // Customer portal
  const openCustomerPortal = useCallback(async () => {
    if (!info?.customer_id) return;
    setPortalLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/stripe/create-portal-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: info.customer_id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur ouverture portail");
      }
      const { url } = await res.json();
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
      } else {
        window.location.href = url;
      }
    } catch (err: any) {
      alert(err?.message ?? "Erreur lors de l'ouverture du portail");
    } finally {
      setPortalLoading(false);
    }
  }, [info?.customer_id]);

  // ---------- Render ----------

  if (loading) {
    return (
      <PageShell>
        <div className="flex h-64 items-center justify-center text-grey-600">
          Chargement…
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="rounded-2xl bg-error-50 border border-error-200 p-6 text-error-700">
          {error}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-pine-500">Mon abonnement</h1>
      </header>

      {isCanceled && (
        <div className="mb-6 rounded-2xl border border-warning-border bg-warning-background p-4 text-warning-text">
          Vous avez résilié votre abonnement. Il se terminera à la fin du mois.
        </div>
      )}

      <SubscriptionSection
        info={info}
        currentPlanName={currentPlanName}
        prices={prices}
        userEmail={userEmail}
        isBasic={isBasic}
        isPremium={isPremium}
        hasActiveSubscription={!!hasActiveSubscription}
        isCanceled={isCanceled}
        isIOS={isIOS}
        onChange={loadAll}
      />

      <RechargesSection
        info={info}
        monthly={monthly}
        prices={prices}
        userEmail={profile?.email ?? userEmail}
        isIOS={isIOS}
        onChange={loadAll}
      />

      {info?.customer_id && (
        <PaymentMethodSection
          onClick={openCustomerPortal}
          loading={portalLoading}
        />
      )}

      <HistorySection history={history} />

      {showSuccessModal && <SuccessModal onClose={closeSuccessModal} />}
    </PageShell>
  );
}

// ---------- Shell ----------

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>Abonnement et recharges — JAM</title>
      </Head>
      <main className="min-h-screen bg-grey-50 py-8 px-4">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </>
  );
}

// ---------- Sections ----------

type SubscriptionSectionProps = {
  info: StripeInfo | null;
  currentPlanName: string | null;
  prices: PricesResponse | null;
  userEmail: string | null;
  isBasic: boolean;
  isPremium: boolean;
  hasActiveSubscription: boolean;
  isCanceled: boolean;
  isIOS: boolean;
  onChange: () => void;
};

function SubscriptionSection({
  info,
  currentPlanName,
  prices,
  userEmail,
  isBasic,
  isPremium,
  hasActiveSubscription,
  isCanceled,
  isIOS,
  onChange,
}: SubscriptionSectionProps) {
  const basic = prices?.subscriptions.basic ?? null;
  const premium = prices?.subscriptions.premium ?? null;

  return (
    <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-pine-500">
          Détails de votre abonnement
        </h2>
        {info?.status && <StatusBadge status={info.status} />}
      </div>

      {hasActiveSubscription ? (
        <div>
          {!isIOS && (
            <p className="mb-4 text-sm text-grey-600">
              Plus d'annonces, plus de talents, passez à un niveau supérieur.
            </p>
          )}
          <p className="text-grey-700">
            Abonnement actuel :{" "}
            <span className="font-semibold text-pine-500">
              {currentPlanName}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {/* Upgrade / downgrade CTAs hidden on iOS — App Store guideline 3.1.3(d). */}
            {!isIOS && isBasic && premium && (
              <StripeSubscriptionButton
                stripeAction="update"
                priceId={premium.priceId}
                customerId={info?.customer_id ?? undefined}
                customerEmail={userEmail ?? undefined}
                successUrl={SUBSCRIPTION_SUCCESS_PATH}
                cancelUrl={SUBSCRIPTION_CANCEL_PATH}
                iosFallbackUrl={IOS_FALLBACK_URL}
                onSuccess={onChange}
                confirmTitle="Passer au plan Premium ?"
                confirmDescription="La facturation est ajustée au prorata de la période en cours."
              >
                <PrimaryBtn>
                  Passer à Premium
                  {premium.amount != null &&
                    ` · ${formatPrice(premium.amount, premium.currency)}/mois`}
                </PrimaryBtn>
              </StripeSubscriptionButton>
            )}

            {!isIOS && isPremium && basic && (
              <StripeSubscriptionButton
                stripeAction="update"
                priceId={basic.priceId}
                customerId={info?.customer_id ?? undefined}
                customerEmail={userEmail ?? undefined}
                successUrl={SUBSCRIPTION_SUCCESS_PATH}
                cancelUrl={SUBSCRIPTION_CANCEL_PATH}
                iosFallbackUrl={IOS_FALLBACK_URL}
                onSuccess={onChange}
                confirmTitle="Repasser au plan Basic ?"
                confirmDescription="Le changement prend effet immédiatement (prorata appliqué)."
              >
                <SecondaryBtn>Repasser à Basic</SecondaryBtn>
              </StripeSubscriptionButton>
            )}

            {/* Cancel is account management — explicitly allowed by 3.1.3. */}
            <StripeSubscriptionButton
              stripeAction="cancel"
              customerId={info?.customer_id ?? undefined}
              customerEmail={userEmail ?? undefined}
              onSuccess={onChange}
              confirmTitle="Voulez-vous résilier votre abonnement ?"
              confirmDescription="Votre abonnement sera actif jusqu'à la fin du mois en cours. Sans abonnement, vous ne pourrez plus utiliser la plateforme Job Around Me."
            >
              <DangerBtn>Résilier mon abonnement</DangerBtn>
            </StripeSubscriptionButton>
          </div>
        </div>
      ) : isIOS ? (
        // No purchase CTAs on iOS — App Store 3.1.3(d) Free Stand-Alone Apps.
        <p className="text-grey-700">
          Aucun abonnement actif sur ce compte.
        </p>
      ) : (
        <div>
          <p className="text-grey-700">
            {isCanceled
              ? "Votre abonnement est en cours d'annulation. Vous pouvez en relancer un nouveau ci-dessous."
              : "Aucun abonnement actif. Choisissez une formule pour démarrer."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <PlanCard
              title="Basic"
              price={basic}
              cta={
                basic && (
                  <StripeSubscriptionButton
                    stripeAction="create"
                    priceId={basic.priceId}
                    customerId={info?.customer_id ?? undefined}
                    customerEmail={userEmail ?? undefined}
                    successUrl={SUBSCRIPTION_SUCCESS_PATH}
                    cancelUrl={SUBSCRIPTION_CANCEL_PATH}
                    iosFallbackUrl={IOS_FALLBACK_URL}
                    onSuccess={onChange}
                  >
                    <PrimaryBtn>Choisir Basic</PrimaryBtn>
                  </StripeSubscriptionButton>
                )
              }
            />
            <PlanCard
              title="Premium"
              highlight
              price={premium}
              cta={
                premium && (
                  <StripeSubscriptionButton
                    stripeAction="create"
                    priceId={premium.priceId}
                    customerId={info?.customer_id ?? undefined}
                    customerEmail={userEmail ?? undefined}
                    successUrl={SUBSCRIPTION_SUCCESS_PATH}
                    cancelUrl={SUBSCRIPTION_CANCEL_PATH}
                    iosFallbackUrl={IOS_FALLBACK_URL}
                    onSuccess={onChange}
                  >
                    <PrimaryBtn>Choisir Premium</PrimaryBtn>
                  </StripeSubscriptionButton>
                )
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}

function PlanCard({
  title,
  price,
  cta,
  highlight,
}: {
  title: string;
  price: PriceInfo | null;
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight ? "border-lime-400 bg-lime-50" : "border-grey-200 bg-white"
      )}
    >
      <div className="text-lg font-semibold text-pine-500">{title}</div>
      <div className="mt-1 text-grey-700">
        {price
          ? `${formatPrice(price.amount, price.currency)}${price.interval ? ` / ${price.interval === "month" ? "mois" : price.interval}` : ""}`
          : "Tarif indisponible"}
      </div>
      <div className="mt-3">{cta}</div>
    </div>
  );
}

type RechargesSectionProps = {
  info: StripeInfo | null;
  monthly: MonthlyRecharges | null;
  prices: PricesResponse | null;
  userEmail: string | null;
  isIOS: boolean;
  onChange: () => void;
};

const RECHARGE_DEFS: Array<{
  key: "classic" | "minute" | "boost";
  counterLabel: string;
  productLabel: string;
  counterField: keyof Pick<
    StripeInfo,
    "recharge_classic" | "recharge_lastminute" | "recharge_boost"
  >;
  soldeField: keyof NonNullable<MonthlyRecharges["solde"]>;
}> = [
  {
    key: "classic",
    counterLabel: "Classiques",
    productLabel: "Offre classique",
    counterField: "recharge_classic",
    soldeField: "totalClassic",
  },
  {
    key: "minute",
    counterLabel: "Last Minute",
    productLabel: "Offre Last Minute",
    counterField: "recharge_lastminute",
    soldeField: "totalLastMinute",
  },
  {
    key: "boost",
    counterLabel: "Boostées",
    productLabel: "Offre Boostées",
    counterField: "recharge_boost",
    soldeField: "totalBoost",
  },
];

const DOT_COLOR: Record<"classic" | "minute" | "boost", string> = {
  classic: "bg-pine-500",
  minute: "bg-error-500",
  boost: "bg-lime-500",
};

function RechargesSection({
  info,
  monthly,
  prices,
  userEmail,
  isIOS,
  onChange,
}: RechargesSectionProps) {
  const [quantities, setQuantities] = useState<
    Record<"classic" | "minute" | "boost", number>
  >({
    classic: 0,
    minute: 0,
    boost: 0,
  });
  const [promoCode, setPromoCode] = useState("");

  // Prefer monthly_recharges edge function data (real-time balance, prorated)
  // and fall back to the raw stripe_info counters when it's unavailable.
  const counterFor = (
    soldeField: keyof NonNullable<MonthlyRecharges["solde"]>,
    fallback: number | null
  ): number => {
    const fromMonthly = monthly?.solde?.[soldeField];
    if (typeof fromMonthly === "number") return fromMonthly;
    return fallback ?? 0;
  };

  const setQty = (key: "classic" | "minute" | "boost", value: number) =>
    setQuantities((prev) => ({ ...prev, [key]: Math.max(0, value) }));

  const lineTotalCents = (key: "classic" | "minute" | "boost") =>
    (prices?.recharges[key]?.amount ?? 0) * quantities[key];

  const totalCents =
    lineTotalCents("classic") + lineTotalCents("minute") + lineTotalCents("boost");

  // Build the items payload only when at least one quantity > 0.
  const checkoutItems = RECHARGE_DEFS.flatMap((def) => {
    const price = prices?.recharges[def.key];
    const qty = quantities[def.key];
    if (!price || qty <= 0) return [];
    return [{ price: price.priceId, quantity: qty }];
  });

  const nativeItems = RECHARGE_DEFS.flatMap((def) => {
    const price = prices?.recharges[def.key];
    const qty = quantities[def.key];
    if (!price || qty <= 0) return [];
    return [
      {
        label: def.productLabel,
        amount: (price.amount ?? 0) / 100,
        quantity: qty,
      },
    ];
  });

  const hasItems = checkoutItems.length > 0;

  return (
    <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-pine-500">Recharges</h2>

      {/* Compteurs courants (VOS ANNONCES) — always visible: this is account
          information, not a purchase entry point. */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {RECHARGE_DEFS.map((def) => (
          <CounterTile
            key={def.key}
            label={def.counterLabel}
            counter={counterFor(def.soldeField, info?.[def.counterField] ?? 0)}
          />
        ))}
      </div>

      {/* On iOS, everything below is purchase UI — hidden to comply with
          App Store Review guideline 3.1.3(d) (Free Stand-Alone Apps). */}
      {!isIOS && (
        <>
          <div className="divide-y divide-grey-100 border-y border-grey-100">
            {RECHARGE_DEFS.map((def) => {
              const price = prices?.recharges[def.key] ?? null;
              const qty = quantities[def.key];
              const lineTotal = lineTotalCents(def.key);
              return (
                <div
                  key={def.key}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      DOT_COLOR[def.key]
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-pine-500">{def.productLabel}</span>
                  <span className="w-12 text-right text-grey-700">
                    {price?.amount != null
                      ? formatPrice(price.amount, price.currency)
                      : "—"}
                  </span>
                  <QuantityStepper
                    value={qty}
                    onChange={(v) => setQty(def.key, v)}
                    disabled={!price}
                  />
                  <span className="w-16 text-right font-semibold text-pine-500">
                    {formatPrice(lineTotal, price?.currency ?? "eur")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <label
              htmlFor="recharge-promo"
              className="text-xs font-medium uppercase tracking-wide text-grey-600"
            >
              Code promotionnel
            </label>
            <input
              id="recharge-promo"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="CODEPROMO"
              className="mt-1 w-full rounded-md border border-grey-200 px-3 py-2 text-sm uppercase placeholder:text-grey-400 focus:border-pine-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-grey-600">
              Vous pourrez le valider à l'étape de paiement.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-md bg-lime-50 px-4 py-3">
            <span className="text-sm font-semibold text-pine-500">Total</span>
            <span className="text-sm font-bold text-pine-500">
              {formatPrice(totalCents)} HT
            </span>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3">
            <StripeCheckoutButton
              items={checkoutItems}
              customerEmail={userEmail ?? undefined}
              clientReferenceId={info?.customer_id}
              successUrl={RECHARGE_SUCCESS_PATH}
              cancelUrl={RECHARGE_CANCEL_PATH}
              iosFallbackUrl={IOS_FALLBACK_URL}
              onSuccess={onChange}
              disabled={!hasItems}
            >
              <PrimaryBtn disabled={!hasItems}>
                Acheter les crédits →
              </PrimaryBtn>
            </StripeCheckoutButton>

            {hasItems && info?.customer_id && (
              <GooglePayButton
                items={nativeItems}
                customerId={info.customer_id}
                customerEmail={userEmail ?? undefined}
                onSuccess={onChange}
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}

function CounterTile({
  label,
  counter,
}: {
  label: string;
  counter: number;
}) {
  return (
    <div className="rounded-xl border border-grey-200 bg-grey-50 p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-grey-600">
        {label} :
      </div>
      <div className="mt-1 text-2xl font-bold text-pine-500">{counter}</div>
    </div>
  );
}

function QuantityStepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-grey-200">
      <input
        type="number"
        min={0}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="w-10 border-0 px-2 py-1 text-center text-sm focus:outline-none disabled:bg-grey-50"
      />
      <div className="flex flex-col border-l border-grey-200 text-grey-700">
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={disabled}
          className="h-4 px-1 text-[10px] leading-none hover:bg-grey-100 disabled:opacity-40"
          aria-label="Augmenter"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled}
          className="h-4 border-t border-grey-200 px-1 text-[10px] leading-none hover:bg-grey-100 disabled:opacity-40"
          aria-label="Diminuer"
        >
          ▼
        </button>
      </div>
    </div>
  );
}

function PaymentMethodSection({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-xl font-semibold text-pine-500">
        Méthode de paiement
      </h2>
      <p className="text-sm text-grey-600">
        Mettez à jour votre carte, consultez vos reçus et téléchargez vos factures depuis le portail Stripe.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={cn(
          "mt-4 inline-flex items-center justify-center rounded-full bg-pine-500 px-5 py-2.5 text-sm font-semibold text-lime-300 transition hover:bg-pine-700 disabled:opacity-60"
        )}
      >
        {loading ? "Ouverture…" : "Gérer ma carte et mes factures"}
      </button>
    </section>
  );
}

function HistorySection({ history }: { history: HistoryItem[] }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-pine-500">
        Historique de consommation &amp; Factures
      </h2>

      {history.length === 0 ? (
        <p className="text-sm text-grey-600">Aucun achat pour le moment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-grey-200 text-xs uppercase tracking-wide text-grey-600">
              <tr>
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Titre du document</th>
                <th className="py-2 pr-3 font-semibold">Montant</th>
                <th className="py-2 font-semibold text-right">Télécharger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {history.map((item) => (
                <tr
                  key={`${item.purchased_at}-${item.invoice_title ?? item.customer_id}`}
                  className="text-grey-700"
                >
                  <td className="py-3 pr-3 text-xs text-grey-600">
                    {formatDate(item.purchased_at)}
                  </td>
                  <td className="py-3 pr-3 font-medium text-pine-500">
                    {item.invoice_title || "Achat"}
                  </td>
                  <td className="py-3 pr-3 font-semibold text-pine-500">
                    {item.total_amount != null
                      ? formatPrice(item.total_amount * 100)
                      : "—"}
                  </td>
                  <td className="py-3 text-right">
                    {item.invoice_url ? (
                      <a
                        href={item.invoice_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs font-medium text-pine-500 underline hover:text-pine-700"
                      >
                        Télécharger
                      </a>
                    ) : (
                      <span className="text-xs text-grey-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-background text-success-text">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-bold text-pine-500">
          Paiement reçu !
        </h3>
        <p className="mb-4 text-sm text-grey-700">
          Votre paiement a bien abouti et vos crédits sont prêts à être utilisés !
        </p>
        <div className="flex justify-end gap-2">
          <SecondaryBtn onClick={onClose}>Fermer</SecondaryBtn>
        </div>
      </div>
    </div>
  );
}

// ---------- Buttons (visual primitives) ----------

function PrimaryBtn({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-pine-500 px-5 py-2.5 text-sm font-semibold text-lime-300 transition hover:bg-pine-700 disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-pine-500 bg-white px-5 py-2.5 text-sm font-semibold text-pine-500 transition hover:bg-pine-500 hover:text-lime-300 disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function DangerBtn({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-error-300 bg-white px-5 py-2.5 text-sm font-semibold text-error-700 transition hover:bg-error-50 disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = isActiveStatus(status);
  const isCancel = status === "cancel";
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        isActive && "bg-success-background text-success-text",
        isCancel && "bg-warning-background text-warning-text",
        !isActive && !isCancel && "bg-grey-100 text-grey-700"
      )}
    >
      {isActive ? "Actif" : isCancel ? "Résilié" : status}
    </span>
  );
}

// Required for the Capacitor static export: without an explicit getStaticProps,
// Next.js doesn't emit `_next/data/<buildId>/parametres-abonnement.json`, and
// client-side navigations from other (Plasmic) pages then fail with
// "Failed to load static props" inside the Android WebView.
export const getStaticProps: GetStaticProps = async () => ({ props: {} });
