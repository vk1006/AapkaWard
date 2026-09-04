"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

const RECAPTCHA_CONTAINER_ID = "firebase-recaptcha";

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

function getDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function normalizeToE164(raw: string): string {
  const digits = getDigits(raw);
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (raw.trim().startsWith("+")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

function isIndianPhoneValid(raw: string): boolean {
  const digits = getDigits(raw);
  if (digits.startsWith("91")) {
    return digits.length === 12;
  }
  return digits.length === 10;
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
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const isLocalhost = useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && isLocalDevHost() && window.location.hostname === "localhost",
    () => false
  );
  const isMock = !isFirebaseOtpConfigured();

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  const hostWarning = isLocalhost
    ? (locale === "hi"
        ? "Firebase Phone OTP localhost पर काम नहीं करता। http://127.0.0.1:3000 खोलें।"
        : "Firebase Phone OTP does not work on localhost. Use http://127.0.0.1:3000 instead.")
    : "";

  // Initialize visible reCAPTCHA on the phone step
  useEffect(() => {
    if (isMock || step !== "phone") return;

    let isMounted = true;

    const timer = setTimeout(() => {
      if (!isMounted || recaptchaVerifierRef.current) return;

      const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
      if (!container) return;

      try {
        const auth = getFirebaseAuth();
        container.innerHTML = "";

        const verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
          size: "normal",
          callback: () => {
            if (isMounted) {
              setCaptchaSolved(true);
              setError("");
            }
          },
          "expired-callback": () => {
            if (isMounted) {
              setCaptchaSolved(false);
            }
          },
          "error-callback": () => {
            if (isMounted) {
              setCaptchaSolved(false);
            }
          },
        });

        verifier
          .render()
          .then((widgetId) => {
            if (isMounted) {
              widgetIdRef.current = widgetId;
              recaptchaVerifierRef.current = verifier;
            } else {
              try {
                verifier.clear();
              } catch {
                // ignore
              }
            }
          })
          .catch((err) => {
            if (isMounted) {
              devLogError("reCAPTCHA render error:", err);
              setError(getFirebaseOtpSendError(err, locale));
            }
          });
      } catch (err) {
        if (isMounted) {
          devLogError("reCAPTCHA creation error:", err);
          setError(getFirebaseOtpSendError(err, locale));
        }
      }
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
        widgetIdRef.current = null;
      }
    };
  }, [isMock, step, locale]);

  async function handleSendOtp() {
    if (!isMock && !captchaSolved) {
      setError(
        locale === "hi"
          ? "कृपया पहले ऊपर दिए गए reCAPTCHA चेकबॉक्स को पूरा करें।"
          : "Please complete the reCAPTCHA checkbox above before requesting OTP."
      );
      return;
    }

    if (!isIndianPhoneValid(phone)) {
      setError(
        locale === "hi"
          ? "कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।"
          : "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    const formattedPhone = normalizeToE164(phone);
    setLoading(true);
    setError("");

    try {
      const auth = getFirebaseAuth();
      if (!recaptchaVerifierRef.current) {
        throw new Error("reCAPTCHA is not ready. Please refresh the page.");
      }

      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );
      setStep("otp");
    } catch (err) {
      devLogError("Firebase OTP send error:", err);
      setError(getFirebaseOtpSendError(err, locale));

      // Reset the captcha widget so user can check it again cleanly without page refresh
      if (
        typeof window !== "undefined" &&
        (window as unknown as { grecaptcha?: { reset: (id: number) => void } }).grecaptcha &&
        widgetIdRef.current !== null
      ) {
        try {
          (window as unknown as { grecaptcha: { reset: (id: number) => void } }).grecaptcha.reset(
            widgetIdRef.current
          );
        } catch {
          // ignore
        }
      }
      setCaptchaSolved(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError("");

    try {
      let body: { phone?: string; code?: string; idToken?: string };

      if (isMock) {
        body = { phone: normalizeToE164(phone), code };
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
          const errCode = (err as { code?: string })?.code;
          devLogError("Firebase OTP confirm failed:", err);
          if (errCode === "auth/invalid-verification-code") {
            setError(locale === "hi" ? "गलत OTP। सही कोड डालें।" : "Wrong OTP. Enter the code from your SMS.");
            return;
          }
          if (errCode === "auth/code-expired") {
            setError(
              locale === "hi"
                ? "OTP समाप्त हो गया। फिर से OTP भेजें।"
                : "OTP expired. Send OTP again."
            );
            setStep("phone");
            setCaptchaSolved(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (step === "phone") {
      if (isMock) {
        setStep("otp");
      } else {
        await handleSendOtp();
      }
    } else {
      await handleVerify();
    }
  }

  const isPhoneValid = isIndianPhoneValid(phone);
  const canSendOtp = isMock ? isPhoneValid : (isPhoneValid && captchaSolved);

  return (
    <form onSubmit={handleSubmit} className={`mx-auto w-full max-w-md space-y-4 ${cardClass}`}>
      <h1 className="text-2xl font-bold text-[#3a00ff] dark:text-white">{t("title")}</h1>

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
          onChange={(e) => {
            setPhone(e.target.value);
            setError("");
          }}
          className={inputClass}
          required
          disabled={step === "otp"}
          autoComplete="tel"
          placeholder="+91 9876543210"
        />
      </div>

      {!isMock && step === "phone" && (
        <div className="space-y-2 py-1">
          <p className={`text-xs ${mutedTextClass}`}>{t("recaptchaHint")}</p>
          <div
            id={RECAPTCHA_CONTAINER_ID}
            className="flex min-h-[78px] items-center justify-center rounded-lg border border-dashed border-[#c7deec]/80 bg-[#eef7fc]/20 p-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
          {!captchaSolved && isPhoneValid && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {locale === "hi"
                ? "कृपया आगे बढ़ने के लिए ऊपर दिए गए चेकबॉक्स को पूरा करें।"
                : "Please check the box above to enable OTP generation."}
            </p>
          )}
        </div>
      )}

      {step === "phone" ? (
        <button
          type="submit"
          disabled={loading || !canSendOtp}
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
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
              setCaptchaSolved(false);
            }}
            className="w-full text-center text-xs font-semibold text-[#3a00ff] hover:underline dark:text-white"
          >
            {locale === "hi" ? "← नंबर बदलें / पुनः OTP भेजें" : "← Change number / Resend OTP"}
          </button>
        </div>
      )}

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {!isMock && (
        <p className={`text-[10px] leading-snug ${mutedTextClass}`}>{t("recaptchaLegal")}</p>
      )}
    </form>
  );
}
