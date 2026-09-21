const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

async function run() {
  const credPath = path.resolve(__dirname, 'serviceAccountKey.json');
  initializeApp({ credential: cert(require(credPath)) });
  const db = getFirestore();

  const enrollmentsSnap = await db.collection('enrollments').get();
  const courseCounts = {};
  
  enrollmentsSnap.forEach(doc => {
    const courseId = doc.data().courseId;
    if (courseId) {
      courseCounts[courseId] = (courseCounts[courseId] || 0) + 1;
    }
  });

  const coursesSnap = await db.collection('courses').get();
  const batch = db.batch();
  
  coursesSnap.forEach(doc => {
    const currentCount = doc.data().students || 0;
    const actualCount = courseCounts[doc.id] || 0;
    if (currentCount !== actualCount) {
      batch.update(doc.ref, { students: actualCount });
      console.log(`Updated course ${doc.id} students from ${currentCount} to ${actualCount}`);
    }
  });

  await batch.commit();
  console.log('Successfully updated student counts.');
  process.exit(0);
}

run().catch(console.error);
