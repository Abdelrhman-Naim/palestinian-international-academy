import { supabase } from '../supabase/client';
import { createNotification } from './notificationService';

/**
 * Generate a clean, unique certificate verification code (e.g., PIA-2026-X8K9L2)
 */
export function generateCertificateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PIA-${new Date().getFullYear()}-${rand}`;
}

/**
 * Update lesson completion status for a student in a course.
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

  try {
    const { data: existing } = await supabase
      .from('course_requests')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    let completedLessons = [];
    let prevProgress = 0;

    if (existing && existing.details?.completedLessons) {
      completedLessons = [...existing.details.completedLessons];
      prevProgress = existing.details.progress || 0;
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

    const details = {
      completedLessons,
      progress,
      lastLearnedAt: new Date().toISOString()
    };

    if (isNowCompleted && prevProgress < 100) {
      details.completedAt = new Date().toISOString();
      details.isEligibleForExam = true;

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
        console.warn('Error sending notification:', err);
      }
    }

    const updatePayload = {
      student_id: studentId,
      course_id: courseId,
      course_title: courseTitle,
      student_name: studentName,
      status: 'approved',
      progress,
      details,
      updated_at: new Date().toISOString()
    };
    if (existing?.id) {
      updatePayload.id = existing.id;
    }

    await supabase
      .from('course_requests')
      .upsert(updatePayload);

    return { success: true, progress, completedLessons, isNowCompleted };
  } catch (error) {
    console.error('Error updating lesson completion in Supabase:', error);
    return { success: false, error };
  }
}

/**
 * Fetch certificate by unique Certificate ID (for verification page)
 */
export async function getCertificateByCode(code) {
  if (!code) return null;
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_number', code.trim().toUpperCase())
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (err) {
    console.error('Error fetching certificate by code:', err);
    return null;
  }
}
