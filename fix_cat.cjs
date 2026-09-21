const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function translateText(text, targetLang = 'en') {
  if (!text) return text;
  try {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=" + targetLang + "&dt=t&q=" + encodeURIComponent(text);
    const response = await fetch(url);
    const data = await response.json();
    if (data && data[0]) {
      return data[0].map(s => s[0]).join('');
    }
    return text;
  } catch (error) {
    console.error("Translation error for " + text, error.message);
    return text;
  }
}

async function run() {
  const docSnap = await db.collection('config').doc('categories').get();
  const data = docSnap.data();
  
  if (data.library) {
    const library_en = [];
    for (const cat of data.library) {
      console.log("Translating: " + cat);
      const en = await translateText(cat);
      library_en.push(en);
      await new Promise(r => setTimeout(r, 1000)); // wait 1 sec to avoid rate limit
    }
    
    // Also remove the corrupted '_en' field
    await db.collection('config').doc('categories').update({
      library_en: library_en,
      _en: require('firebase-admin/firestore').FieldValue.delete()
    });
    console.log("Done!");
  }
  process.exit(0);
}
run();
