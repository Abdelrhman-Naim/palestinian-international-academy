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
    if (data.lessons && typeof data.lessons === 'object' && !Array.isArray(data.lessons) && data.lessons.exam) {
      return data.lessons.exam;
    }
    if (data.lessons && typeof data.lessons === 'object' && !Array.isArray(data.lessons) && data.lessons.questions) {
      return data.lessons;
    }
    return data.exam_data || null;
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
    const formattedExam = {
      ...examData,
      title: examData.title || '',
      description: examData.description || '',
      passPercentage: Number(examData.passPercentage) || 80,
      timeLimitMinutes: Number(examData.timeLimitMinutes) || 20,
      questions: Array.isArray(examData.questions) ? examData.questions : [],
      updatedAt: new Date().toISOString()
    };

    // 1. Fetch current course record to preserve existing lessons/sessions
    const { data: courseRow } = await supabase
      .from('courses')
      .select('lessons')
      .eq('id', courseId)
      .maybeSingle();

    const currentLessons = courseRow?.lessons;
    let newLessons;

    if (Array.isArray(currentLessons)) {
      newLessons = {
        sessions: currentLessons,
        exam: formattedExam
      };
    } else if (currentLessons && typeof currentLessons === 'object') {
      newLessons = {
        ...currentLessons,
        exam: formattedExam
      };
    } else {
      newLessons = {
        exam: formattedExam
      };
    }

    // 2. Primary save: update the `lessons` JSON column on `courses`
    const { error: lessonsErr } = await supabase
      .from('courses')
      .update({ lessons: newLessons })
      .eq('id', courseId);

    if (lessonsErr) {
      console.warn('Notice updating course lessons with exam:', lessonsErr.message);
    }

    // 3. Fallback/secondary save: if courses table has `exam_data` column or custom schema, try updating it safely without throwing schema error
    try {
      await supabase
        .from('courses')
        .update({
          exam_data: formattedExam
        })
        .eq('id', courseId);
    } catch (e) {
      // Ignore schema missing column notice
    }

    return { success: true };
  } catch (err) {
    console.error('Error saving course exam:', err);
    return { success: false, error: err.message || 'فشل حفظ بيانات الاختبار' };
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
      const certCode = generateCertificateCode();

      const certPayload = {
        certificate_number: certCode,
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

      if (certErr) {
        console.warn('certificates insert notice:', certErr.message);
      }

      certificate = {
        id: certData?.id || `cert_${Date.now()}`,
        certificate_number: certData?.certificate_number || certCode,
        certificateId: certData?.certificate_number || certCode,
        student_id: studentId,
        student_name: realStudentName,
        studentName: realStudentName,
        course_id: courseId,
        course_title: courseTitle,
        courseTitle: courseTitle,
        gradeScore: score,
        issue_date: certData?.issue_date || new Date().toISOString()
      };

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
          metadata: { certificateId: certData?.id || '', score }
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
