"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseOtpConfigured } from "@/lib/firebase-client";
import { safeNextPath } from "@/shared/safe-next";
import { useAuth, type AuthUser } from "@/components/AuthProvider";
import { btnPrimaryClass, cardClass, inputClass, mutedTextClass } from "@/components/ui";
import { devLogError, isDevelopment, isLocalDevHost } from "@/shared/is-local-dev";
import { removeRecaptchaArtifacts } from "@/lib/recaptcha-cleanup";

const RECAPTCHA_CONTAINER_ID = "firebase-recaptcha";

/** Invisible reCAPTCHA is unreliable on phones; use the visible widget instead. */
function useMobileRecaptcha(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 640px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () => setMobile(narrow.matches || coarse.matches);
    update();
    narrow.addEventListener("change", update);
    coarse.addEventListener("change", update);
    return () => {
      narrow.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
    };
  }, []);

  return mobile;
}

function getFirebaseOtpSendError(error: unknown, locale: string): string {
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message ?? "";
  devLogError("Firebase OTP send failed:", error);

  const pick = (en: string, hi: string) => (locale === "hi" ? hi : en);

  if (code === "auth/operation-not-allowed" && /region/i.test(message)) {
    return isDevelopment()
      ? pick(
          "Enable India (+91) in Firebase → Authentication → Settings → SMS region policy.",
          "Firebase Console में India (+91) SMS region सक्षम करें।"
        )
      : pick("Phone sign-in is not available.", "फ़ोन साइन-इन उपलब्ध नहीं है।");
  }

  const userMessages: Record<string, { en: string; hi: string }> = {
    "auth/captcha-check-failed": {
      en: "reCAPTCHA verification failed. Complete the checkbox above and try again.",
      hi: "reCAPTCHA सत्यापन विफल। ऊपर वाला चेकबॉक्स पूरा करें और पुनः प्रयास करें।",
    },
    "auth/invalid-phone-number": {
      en: "Invalid phone number format.",
      hi: "अमान्य फ़ोन नंबर।",
    },
    "auth/too-many-requests": {
      en: "Too many attempts. Try again later.",
      hi: "बहुत अधिक प्रयास। बाद में पुनः प्रयास करें।",
    },
    "auth/quota-exceeded": {
      en: "SMS quota exceeded.",
      hi: "SMS कोटा समाप्त।",
    },
  };

  const devMessages: Record<string, { en: string; hi: string }> = {
    "auth/operation-not-allowed": {
      en: "Phone sign-in is not enabled in Firebase Console.",
      hi: "Firebase Console में Phone sign-in सक्षम नहीं है।",
    },
    "auth/billing-not-enabled": {
      en: "Firebase Blaze plan is required to send phone OTP.",
      hi: "Phone OTP के लिए Firebase Blaze plan जरूरी है।",
    },
    "auth/invalid-app-credential": {
      en: "reCAPTCHA/domain issue. Use http://127.0.0.1:3000 (not localhost), add 127.0.0.1 to Firebase authorized domains, and configure reCAPTCHA under Authentication → Settings.",
      hi: "reCAPTCHA/domain समस्या। http://127.0.0.1:3000 उपयोग करें, Firebase authorized domains में 127.0.0.1 जोड़ें, और Authentication → Settings में reCAPTCHA कॉन्फ़िगर करें।",
    },
  };

  const prodMessages: Record<string, { en: string; hi: string }> = {
    "auth/operation-not-allowed": {
      en: "Phone sign-in is not available.",
      hi: "फ़ोन साइन-इन उपलब्ध नहीं है।",
    },
    "auth/billing-not-enabled": {
      en: "Phone sign-in is temporarily unavailable.",
      hi: "फ़ोन साइन-इन अस्थायी रूप से उपलब्ध नहीं है।",
    },
    "auth/invalid-app-credential": {
      en: "reCAPTCHA verification failed. Refresh the page and try again.",
      hi: "reCAPTCHA सत्यापन विफल। पेज रिफ्रेश करें और पुनः प्रयास करें।",
    },
  };

  const table = isDevelopment() ? { ...userMessages, ...devMessages } : { ...userMessages, ...prodMessages };

  if (code && table[code]) {
    return pick(table[code].en, table[code].hi);
  }

  if (/already been rendered|recaptcha timeout/i.test(message)) {
    return locale === "hi"
      ? "reCAPTCHA समय समाप्त। पेज रिफ्रेश करें और पुनः प्रयास करें।"
      : "reCAPTCHA timed out. Refresh the page and try again.";
  }

  return locale === "hi" ? "OTP भेजने में विफल।" : "Failed to send OTP.";
}

export function LoginForm() {
  const t = useTranslations("login");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const isMock = !isFirebaseOtpConfigured();
  const mobileRecaptcha = useMobileRecaptcha();
  const [hostWarning, setHostWarning] = useState("");
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaModeRef = useRef<boolean | null>(null);

  async function destroyRecaptcha() {
    try {
      await recaptchaRef.current?.clear();
    } catch {
      // Widget may already be torn down.
    }
    recaptchaRef.current = null;
    recaptchaModeRef.current = null;
    setRecaptchaReady(false);
    const el = document.getElementById(RECAPTCHA_CONTAINER_ID);
    el?.replaceChildren();
    removeRecaptchaArtifacts();
  }

  async function ensureRecaptchaVerifier(visible: boolean): Promise<RecaptchaVerifier> {
    if (
      recaptchaRef.current &&
      recaptchaModeRef.current === visible &&
      document.getElementById(RECAPTCHA_CONTAINER_ID)?.childElementCount
    ) {
      return recaptchaRef.current;
    }

    await destroyRecaptcha();

    const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
    if (!container) {
      throw new Error("reCAPTCHA container missing");
    }

    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
      size: visible ? "normal" : "invisible",
      callback: () => setRecaptchaReady(true),
      "expired-callback": () => {
        void destroyRecaptcha();
      },
      "error-callback": () => {
        void destroyRecaptcha();
      },
    });

    await verifier.render();
    recaptchaRef.current = verifier;
    recaptchaModeRef.current = visible;
    setRecaptchaReady(true);
    return verifier;
  }

  useEffect(() => {
    if (!isLocalDevHost() || typeof window === "undefined") return;
    if (window.location.hostname === "localhost") {
      setHostWarning(
        locale === "hi"
          ? "Firebase Phone OTP localhost पर काम नहीं करता। http://127.0.0.1:3000 खोलें।"
          : "Firebase Phone OTP does not work on localhost. Use http://127.0.0.1:3000 instead."
      );
    }
  }, [locale]);

  useEffect(() => {
    if (isMock || step !== "phone") {
      if (step === "otp") void destroyRecaptcha();
      return;
    }

    let cancelled = false;
    setRecaptchaReady(false);

    void ensureRecaptchaVerifier(mobileRecaptcha).catch((err) => {
      if (!cancelled) {
        devLogError("reCAPTCHA init failed:", err);
        setError(getFirebaseOtpSendError(err, locale));
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-init when mobile layout changes
  }, [isMock, mobileRecaptcha, step]);

  useEffect(() => {
    return () => {
      void destroyRecaptcha();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSendOtp() {
    setLoading(true);
    setError("");

    try {
      const auth = getFirebaseAuth();
      const verifier = await ensureRecaptchaVerifier(mobileRecaptcha);
      confirmationRef.current = await signInWithPhoneNumber(auth, phone.trim(), verifier);
      await destroyRecaptcha();
      setStep("otp");
    } catch (err) {
      setError(getFirebaseOtpSendError(err, locale));
      await destroyRecaptcha();
      if (!isMock && step === "phone") {
        void ensureRecaptchaVerifier(mobileRecaptcha).catch(() => undefined);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let body: { phone?: string; code?: string; idToken?: string };

      if (isMock) {
        body = { phone, code };
      } else {
        if (!confirmationRef.current) {
          setError(locale === "hi" ? "पहले OTP भेजें।" : "Send OTP first.");
          return;
        }
        try {
          const credential = await confirmationRef.current.confirm(code.trim());
          const idToken = await credential.user.getIdToken(true);
          body = { idToken };
        } catch (err) {
          const code = (err as { code?: string })?.code;
          devLogError("Firebase OTP confirm failed:", err);
          if (code === "auth/invalid-verification-code") {
            setError(locale === "hi" ? "गलत OTP। सही कोड डालें।" : "Wrong OTP. Enter the code from your SMS.");
            return;
          }
          if (code === "auth/code-expired") {
            setError(
              locale === "hi"
                ? "OTP समाप्त हो गया। फिर से OTP भेजें।"
                : "OTP expired. Send OTP again."
            );
            setStep("phone");
            confirmationRef.current = null;
            return;
          }
          throw err;
        }
      }

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        const message =
          locale === "hi"
            ? (data.error?.messageHi ?? data.error?.messageEn)
            : (data.error?.messageEn ?? data.error?.messageHi);
        setError(message ?? "Login failed");
        return;
      }

      const loggedIn: AuthUser = {
        id: data.user.id,
        phone: data.user.phone,
        name: data.user.name ?? null,
        role: data.user.role,
        locale: data.user.locale,
      };
      setUser(loggedIn);
      await destroyRecaptcha();
      removeRecaptchaArtifacts();

      const next = safeNextPath(searchParams.get("next"), "/suggestions");
      router.push(next);
      router.refresh();
    } catch (err) {
      devLogError("OTP verify failed:", err);
      setError(locale === "hi" ? "सत्यापन विफल।" : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className={`mx-auto w-full max-w-md space-y-4 ${cardClass}`}>
      <h1 className="text-2xl font-bold text-orange-700 dark:text-orange-300">{t("title")}</h1>

      {hostWarning && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          {hostWarning}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">{t("phone")}</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          required
          disabled={step === "otp"}
          autoComplete="tel"
        />
      </div>

      {!isMock && step === "phone" && (
        <>
          {mobileRecaptcha && (
            <p className={`text-xs ${mutedTextClass}`}>{t("recaptchaHint")}</p>
          )}
          <div
            id={RECAPTCHA_CONTAINER_ID}
            className={
              mobileRecaptcha
                ? "flex min-h-[78px] justify-center overflow-x-auto py-1"
                : "min-h-px"
            }
          />
        </>
      )}

      {step === "phone" ? (
        <button
          type="button"
          onClick={isMock ? () => setStep("otp") : handleSendOtp}
          disabled={loading || (!isMock && !recaptchaReady)}
          className={btnPrimaryClass}
          aria-busy={loading}
        >
          {loading ? "..." : isMock ? t("continue") : t("sendOtp")}
        </button>
      ) : null}

      {step === "otp" && (
        <div className="animate-page-enter space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("otp")}</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputClass}
              placeholder={isMock ? "123456" : ""}
              required
            />
            {isMock && <p className={`mt-1 text-xs ${mutedTextClass}`}>{t("mockHint")}</p>}
          </div>
          <button type="submit" disabled={loading} className={btnPrimaryClass} aria-busy={loading}>
            {loading ? "..." : t("verify")}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isMock && (
        <p className={`text-[10px] leading-snug ${mutedTextClass}`}>{t("recaptchaLegal")}</p>
      )}
    </form>
  );
}
