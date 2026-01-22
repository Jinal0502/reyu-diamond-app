import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const serviceAccountPath = path.resolve(__dirname, "../../secrets/serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("Firebase serviceAccountKey.json not found at " + serviceAccountPath);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

export const db = admin.firestore();
export const messaging = admin.messaging();
