const admin = require('firebase-admin');
const path = require('path');

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    return admin.credential.cert(require(serviceAccountPath));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    return admin.credential.cert(JSON.parse(json));
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }

  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  const appConfig = {
    credential: getCredential(),
  };

  if (process.env.FIREBASE_PROJECT_ID) {
    appConfig.projectId = process.env.FIREBASE_PROJECT_ID;
  }

  admin.initializeApp(appConfig);
}

const db = admin.firestore();

module.exports = {
  admin,
  db,
};
