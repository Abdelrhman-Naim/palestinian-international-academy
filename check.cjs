const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
  const doc = await db.collection('config').doc('categories').get();
  console.log(JSON.stringify(doc.data(), null, 2));
  process.exit(0);
}
check();
