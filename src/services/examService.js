import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createNotification, notifyInstructor } from './notificationService';
import { generateCertificateCode } from './certificateService';

/**
 * Fetch the graduation exam for a specific course
 */
export async function getCourseExam(courseId) {
  if (!courseId) return null;
  try {
    const examRef = doc(db, 'course_exams', courseId);
    const snap = await getDoc(examRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.error('Error fetching course exam:', err);
    return null;
  }
}

/**
 * Save or update graduation exam for a course (by instructor or admin)
 */
export async function saveCourseExam(courseId, examData) {
  if (!courseId) return { success: false, error: 'Missing courseId' };
  try {
    const examRef = doc(db, 'course_exams', courseId);
    const payload = {
      ...examData,
      courseId,
      passPercentage: examData.passPercentage || 80,
      updatedAt: serverTimestamp(),
    };
    await setDoc(examRef, payload, { merge: true });
    return { success: true };
  } catch (err) {
    console.error('Error saving course exam:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Submit student's graduation exam attempt and compute score
 */
export async function submitExamAttempt({
  studentId,
  studentName,
  courseId,
  courseTitle,
  instructorName,
  instructorId,
  answers, // { [questionIndex]: selectedOptionIndex }
  questions,
  passPercentage = 80
}) {
  if (!studentId || !courseId || !questions || questions.length === 0) {
    return { success: false, error: 'Invalid submission data' };
  }

  try {
    // 1. Calculate Score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && Number(answers[idx]) === Number(q.correctOption)) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= passPercentage;

    const enrollmentId = `${studentId}_${courseId}`;
    const enrollRef = doc(db, 'enrollments', enrollmentId);

    // 2. Save exam attempt record
    const attemptData = {
      studentId,
      studentName: studentName || 'طالب المنصة',
      courseId,
      courseTitle: courseTitle || 'الدورة',
      score,
      correctCount,
      totalQuestions,
      passed,
      passPercentage,
      answers,
      submittedAt: serverTimestamp()
    };
    await addDoc(collection(db, 'exam_attempts'), attemptData);

    let certificate = null;

    // 3. If passed (>= 80%), issue verified certificate and update enrollment
    if (passed) {
      // Resolve actual student full name
      let realStudentName = (studentName && studentName !== 'طالب' && studentName !== 'طالب المنصة' && studentName !== 'Student') 
        ? studentName 
        : null;

      if (!realStudentName && studentId) {
        try {
          const userSnap = await getDoc(doc(db, 'users', studentId));
          if (userSnap.exists()) {
            const udata = userSnap.data();
            realStudentName = udata.fullName || udata.name;
          }
        } catch (e) {
          console.warn('Error fetching user full name for cert:', e);
        }
      }
      realStudentName = realStudentName || studentName || 'طالب المنصة';

      const certRef = doc(db, 'certificates', enrollmentId);
      const certSnap = await getDoc(certRef);

      let certCode = null;
      if (!certSnap.exists()) {
        certCode = generateCertificateCode();
        const newCert = {
          certificateId: certCode,
          studentId,
          studentName: realStudentName,
          courseId,
          courseTitle: courseTitle || 'الدورة الهندسية',
          instructorName: instructorName || 'المدرب',
          gradeScore: score,
          issueDate: serverTimestamp(),
          formattedDate: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
          formattedDateEn: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          enrollmentId,
          verified: true
        };
        await setDoc(certRef, newCert);
        certificate = { id: enrollmentId, ...newCert };
      } else {
        certificate = { id: certSnap.id, ...certSnap.data() };
        certCode = certificate.certificateId;
        // Auto-heal existing certificate if saved previously as generic 'طالب'
        if ((!certificate.studentName || certificate.studentName === 'طالب' || certificate.studentName === 'طالب المنصة') && realStudentName && realStudentName !== 'طالب') {
          await updateDoc(certRef, { studentName: realStudentName }).catch(() => {});
          certificate.studentName = realStudentName;
        }
      }

      // Update enrollment status
      await updateDoc(enrollRef, {
        passedExam: true,
        examScore: score,
        certificateId: certCode,
        examPassedAt: serverTimestamp()
      }).catch(err => console.warn('Could not update enrollment with exam pass:', err));

      // 4. Send Notifications
      // A) To Student
      try {
        await createNotification({
          recipientId: studentId,
          recipientRole: 'student',
          title: '🎓 مبارك! اجتزت اختبار التخرج وحصلت على الشهادة',
          title_en: '🎓 Congratulations! You passed the graduation exam and earned your certificate',
          message: `تهانينا الحارة! لقد اجتزت اختبار التخرج لدورة «${courseTitle}» بنتيجة ${score}% (الحد الأدنى ${passPercentage}%). شهادتك المعتمدة جاهزة الآن للعرض والتحميل!`,
          message_en: `Congratulations! You passed the graduation exam for "${courseTitle}" with ${score}%. Your certificate is now available!`,
          type: 'certificate',
          link: '/dashboard/certificates',
          courseId,
          metadata: { certificateId: certCode, score }
        });
      } catch (err) {
        console.warn('Student notification error:', err);
      }

      // B) To Instructor
      try {
        await notifyInstructor({ instructorId, instructor: instructorName }, {
          title: 'طالب اجتاز اختبار التخرج بنجاح',
          title_en: 'Student Passed Graduation Exam',
          message: `اجتاز الطالب «${studentName}» اختبار التخرج لدورة «${courseTitle}» بنتيجة ${score}%.`,
          message_en: `Student "${studentName}" passed the graduation exam for "${courseTitle}" with ${score}%.`,
          link: `/instructor-dashboard/my-courses`,
          type: 'exam_passed'
        });
      } catch (err) {
        console.warn('Instructor notification error:', err);
      }
    } else {
      // If student did not pass (< 80%)
      await updateDoc(enrollRef, {
        lastExamScore: score,
        lastExamAttemptAt: serverTimestamp()
      }).catch(err => console.warn('Enrollment attempt update error:', err));
    }

    return {
      success: true,
      score,
      correctCount,
      totalQuestions,
      passed,
      passPercentage,
      certificate
    };
  } catch (error) {
    console.error('Error submitting exam attempt:', error);
    return { success: false, error: error.message };
  }
}
