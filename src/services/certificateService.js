import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createNotification } from './notificationService';

/**
 * Generate a clean, unique certificate verification code (e.g., EDU-2026-X8K9L2)
 */
export function generateCertificateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EDU-${new Date().getFullYear()}-${rand}`;
}

/**
 * Update lesson completion status for a student in a course.
 * Automatically recalculates progress (0 - 100%) and generates a certificate if 100%.
 */
export async function toggleLessonCompletion({
  studentId,
  studentName,
  courseId,
  courseTitle,
  instructorName,
  lessonId,
  totalLessons,
  isCompleted
}) {
  if (!studentId || !courseId || totalLessons <= 0) return { success: false };

  const enrollmentId = `${studentId}_${courseId}`;
  const enrollRef = doc(db, 'enrollments', enrollmentId);

  try {
    const snap = await getDoc(enrollRef);
    let completedLessons = [];
    let prevProgress = 0;

    if (snap.exists()) {
      const data = snap.data();
      completedLessons = Array.isArray(data.completedLessons) ? [...data.completedLessons] : [];
      prevProgress = data.progress || 0;
    }

    if (isCompleted) {
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }
    } else {
      completedLessons = completedLessons.filter(id => id !== lessonId);
    }

    const progress = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));
    const isNowCompleted = progress === 100;

    const updatePayload = {
      completedLessons,
      progress,
      lastLearnedAt: serverTimestamp(),
    };

    let certificateId = null;

    // If student just reached 100% completion of all lectures
    if (isNowCompleted && prevProgress < 100) {
      updatePayload.completedAt = serverTimestamp();
      updatePayload.isEligibleForExam = true;

      // Send qualification notification to the student
      try {
        await createNotification({
          recipientId: studentId,
          recipientRole: 'student',
          title: '🎓 تهانينا! أصبحت مؤهلاً لخوض اختبار التخرج',
          title_en: '🎓 Congratulations! You are eligible for the graduation exam',
          message: `أكملت بنجاح جميع محاضرات دورة «${courseTitle}». يمكنك الآن خوض اختبار التخرج النهائي والحصول على شهادتك المعتمدة عند تحقيق 80% فما فوق!`,
          message_en: `You have completed all lectures in "${courseTitle}". You are now eligible to take the final graduation exam and earn your certificate!`,
          type: 'exam_eligible',
          link: `/courses/${courseId}`,
          courseId,
        });
      } catch (err) {
        console.warn('Error sending qualification notification:', err);
      }
    }

    await setDoc(enrollRef, updatePayload, { merge: true });
    return { success: true, progress, completedLessons, isNowCompleted };
  } catch (error) {
    console.error('Error updating lesson completion:', error);
    return { success: false, error };
  }
}

/**
 * Fetch certificate by unique Certificate ID (for verification page)
 */
export async function getCertificateByCode(code) {
  if (!code) return null;
  try {
    const q = query(collection(db, 'certificates'), where('certificateId', '==', code.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }
    return null;
  } catch (err) {
    console.error('Error fetching certificate by code:', err);
    return null;
  }
}
