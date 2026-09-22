import { supabase } from '../supabase/client';
import { createNotification, notifyInstructor } from './notificationService';
import { generateCertificateCode } from './certificateService';

/**
 * Fetch the graduation exam for a specific course
 */
export async function getCourseExam(courseId) {
  if (!courseId) return null;
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('lessons')
      .eq('id', courseId)
      .maybeSingle();

    if (error || !data) return null;
    return data.lessons?.exam || data.exam_data || null;
  } catch {
    return null;
  }
}

/**
 * Save or update graduation exam for a course (by instructor or admin)
 */
export async function saveCourseExam(courseId, examData) {
  if (!courseId) return { success: false, error: 'Missing courseId' };
  try {
    const { error } = await supabase
      .from('courses')
      .update({
        exam_data: {
          ...examData,
          passPercentage: examData.passPercentage || 80,
          updatedAt: new Date().toISOString()
        }
      })
      .eq('id', courseId);

    if (error) throw error;
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
  answers,
  questions,
  passPercentage = 80
}) {
  if (!studentId || !courseId || !questions || questions.length === 0) {
    return { success: false, error: 'Invalid submission data' };
  }

  try {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && Number(answers[idx]) === Number(q.correctOption)) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= passPercentage;

    try {
      await supabase.from('exam_results').insert([{
        student_id: studentId,
        course_id: courseId,
        score
      }]);
    } catch (err) {
      console.warn('exam_results insert error:', err);
    }

    let certificate = null;

    if (passed) {
      const realStudentName = studentName || 'طالب المنصة';

      const certPayload = {
        student_id: studentId,
        student_name: realStudentName,
        course_id: courseId,
        course_title: courseTitle || 'الدورة الهندسية'
      };

      const { data: certData, error: certErr } = await supabase
        .from('certificates')
        .insert([certPayload])
        .select()
        .single();

      if (!certErr && certData) {
        certificate = certData;
      }

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

      try {
        await notifyInstructor({ instructor_id: instructorId, instructorName }, {
          title: 'طالب اجتاز اختبار التخرج بنجاح',
          title_en: 'Student Passed Graduation Exam',
          message: `اجتاز الطالب «${realStudentName}» اختبار التخرج لدورة «${courseTitle}» بنتيجة ${score}%.`,
          message_en: `Student "${realStudentName}" passed the graduation exam for "${courseTitle}" with ${score}%.`,
          link: `/instructor-dashboard/my-courses`,
          type: 'exam_passed'
        });
      } catch (err) {
        console.warn('Instructor notification error:', err);
      }
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
