const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const translations = {
  "سلاسل وموسوعات": "Series and encyclopedias",
  "الأدب العربي": "Arabic Literature",
  "الأدب العالمي": "World Literature",
  "قانون": "Law",
  "لغة": "Language",
  "صحة وطب": "Health and Medicine",
  "فنون": "Arts",
  "إقتصاد وأعمال": "Business and Economics",
  "بيوغرافيا ومذكرات": "Biography and Memoirs",
  "كتب أطفال": "Children's Books",
  "تاريخ وجغرافيا": "History and Geography",
  "غرائب وأساطير": "Oddities and Myths",
  "صحافة وإعلام": "Journalism and Media",
  "المرأة والعائلة": "Women and Family",
  "مراجع": "References",
  "كتب دينية": "Religious Books",
  "علوم إسلامية": "Islamic Sciences",
  "العلوم والطبيعة": "Science and Nature",
  "كتب سياسية": "Political Books",
  "كتب الفلسفة": "Philosophy Books",
  "علوم إجتماعية": "Social Sciences",
  "سفر ورحلات": "Travel and Journeys",
  "علوم عسكرية": "Military Sciences",
  "علم النفس": "Psychology",
  "كتب التنمية البشرية": "Human Development Books",
  "كتب منوعة": "Miscellaneous Books",
  "كتب الخيال العلمي": "Science Fiction Books",
  "كتب تعليم لغات": "Language Learning Books",
  "علوم الحيوان": "Animal Science",
  "كتب علوم الهندسة": "Engineering Books",
  "كتب طرائف و نوادر": "Anecdotes and Rarities",
  "كتب تعليمية": "Educational Books",
  "طبخ وطعام": "Cooking and Food",
  "رياضة وتسالي": "Sports and Entertainment",
  "قضايا فكرية": "Intellectual Issues"
};

async function run() {
  const docSnap = await db.collection('config').doc('categories').get();
  const data = docSnap.data();
  
  if (data.library) {
    const library_en = data.library.map(cat => translations[cat] || cat);
    
    await db.collection('config').doc('categories').update({
      library_en: library_en
    });
    console.log("Done!");
  }
  process.exit(0);
}
run();
