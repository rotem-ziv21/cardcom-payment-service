const admin = require('firebase-admin');

// Initialize Firebase Admin with application default credentials or service account
let app;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Use service account if provided
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "payment-26a09"
  });
} else {
  // Use application default credentials
  app = admin.initializeApp({
    projectId: "payment-26a09"
  });
}

const db = admin.firestore();

module.exports = { admin, db };
