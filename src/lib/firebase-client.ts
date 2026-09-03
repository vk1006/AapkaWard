import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return { apiKey, authDomain, projectId, appId };
}

export function isFirebaseOtpConfigured(): boolean {
  return process.env.NEXT_PUBLIC_OTP_ADAPTER === "firebase" && getFirebaseConfig() !== null;
}

export function getFirebaseAuth(): Auth {
  const config = getFirebaseConfig();
  if (!config) {
    throw new Error("Firebase client config is not set");
  }

  const app: FirebaseApp =
    getApps().length > 0 ? getApps()[0]! : initializeApp(config);

  return getAuth(app);
}
