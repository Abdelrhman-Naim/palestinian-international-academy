const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function translateText(text, targetLang = 'en') {
  if (!text) return text;
  if (Array.isArray(text)) {
    return Promise.all(text.map(t => translateText(t, targetLang)));
  }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data[0]) {
      return data[0].map(s => s[0]).join('');
    }
    return text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

async function backfill() {
  console.log("Starting backfill translation...");

  // 1. Categories
  const catDoc = await db.collection('config').doc('categories').get();
  if (catDoc.exists) {
    console.log("Translating categories...");
    const data = catDoc.data();
    const updates = {};
    if (data.courses && (!data.courses_en || data.courses_en.length !== data.courses.length)) {
      updates.courses_en = await translateText(data.courses);
    }
    if (data.library && (!data.library_en || data.library_en.length !== data.library.length)) {
      updates.library_en = await translateText(data.library);
    }
    if (Object.keys(updates).length > 0) {
      await db.collection('config').doc('categories').update(updates);
      console.log("Categories updated:", updates);
    }
  }

  // 2. Library
  console.log("Translating library...");
  const librarySnap = await db.collection('library').get();
  for (const doc of librarySnap.docs) {
    const data = doc.data();
    const updates = {};
    if (data.title && !data.title_en) updates.title_en = await translateText(data.title);
    if (data.author && !data.author_en) updates.author_en = await translateText(data.author);
    if (data.category && !data.category_en) updates.category_en = await translateText(data.category);
    
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`Translated book: ${data.title}`);
    }
  }

  // 3. Courses
  console.log("Translating courses...");
  const coursesSnap = await db.collection('courses').get();
  for (const doc of coursesSnap.docs) {
    const data = doc.data();
    const updates = {};
    if (data.title && !data.title_en) updates.title_en = await translateText(data.title);
    if (data.description && !data.description_en) updates.description_en = await translateText(data.description);
    if (data.instructor && !data.instructor_en) updates.instructor_en = await translateText(data.instructor);
    if (data.category && !data.category_en) updates.category_en = await translateText(data.category);
    if (data.level && !data.level_en) updates.level_en = await translateText(data.level);
    
    if (data.goals && (!data.goals_en || data.goals_en.length !== data.goals.length)) {
      updates.goals_en = await translateText(data.goals);
    }

    if (data.lectures && data.lectures.length > 0) {
      let needUpdate = false;
      const translatedLectures = await Promise.all(data.lectures.map(async (lec) => {
        if (!lec.title_en) {
          needUpdate = true;
          return { ...lec, title_en: await translateText(lec.title) };
        }
        return lec;
      }));
      if (needUpdate) {
        updates.lectures = translatedLectures;
      }
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`Translated course: ${data.title}`);
    }
  }

  console.log("Backfill complete!");
  process.exit(0);
}

backfill().catch(console.error);
