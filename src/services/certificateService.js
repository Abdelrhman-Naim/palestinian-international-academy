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
    // 1. Fetch current enrollment record
    let { data: existingEnroll } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!existingEnroll) {
      const { data: byUid } = await supabase
        .from('enrollments')
        .select('*')
        .eq('uid', studentId)
        .eq('course_id', courseId)
        .maybeSingle();
      existingEnroll = byUid;
    }

    let completedLessons = [];
    if (existingEnroll && Array.isArray(existingEnroll.completed_lessons)) {
      completedLessons = [...existingEnroll.completed_lessons];
    } else if (existingEnroll && Array.isArray(existingEnroll.completedLessons)) {
      completedLessons = [...existingEnroll.completedLessons];
    }

    if (isCompleted) {
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }
    } else {
      completedLessons = completedLessons.filter(id => id !== lessonId);
    }

    const prevProgress = existingEnroll?.progress || 0;
    const progress = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));
    const isNowCompleted = progress === 100;

    if (isNowCompleted && prevProgress < 100) {
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

    const enrollPayload = {
      student_id: studentId,
      uid: studentId,
      course_id: courseId,
      course_title: courseTitle,
      instructor: instructorName,
      progress,
      completed_lessons: completedLessons
    };

    if (existingEnroll?.id) {
      const { error: updateErr } = await supabase
        .from('enrollments')
        .update(enrollPayload)
        .eq('id', existingEnroll.id);
      if (updateErr) console.warn('Error updating enrollments:', updateErr);
    } else {
      const { error: insertErr } = await supabase
        .from('enrollments')
        .insert([enrollPayload]);
      if (insertErr) console.warn('Error inserting enrollments:', insertErr);
    }

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
