import admin from 'firebase-admin';

// firebase admin stuff
let serviceAccount = require('../../onlinetown-401f0-firebase-adminsdk-gab3z-1a7a54c2da.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const db = admin.firestore();
export const auth = admin.auth();