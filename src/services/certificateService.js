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
    const { data: existingReq } = await supabase
      .from('course_requests')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    const { data: existingEnroll } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    const reqDone = Array.isArray(existingReq?.details?.completedLessons)
      ? existingReq.details.completedLessons
      : (Array.isArray(existingReq?.completed_lessons) ? existingReq.completed_lessons : []);
    const enrollDone = Array.isArray(existingEnroll?.completed_lessons)
      ? existingEnroll.completed_lessons
      : (Array.isArray(existingEnroll?.completedLessons) ? existingEnroll.completedLessons : []);

    const doneSet = new Set([...reqDone, ...enrollDone]);

    if (isCompleted) {
      doneSet.add(lessonId);
    } else {
      doneSet.delete(lessonId);
    }

    const completedLessons = Array.from(doneSet);
    const prevProgress = Math.max(existingReq?.details?.progress || 0, existingEnroll?.progress || 0);

    const progress = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));
    const isNowCompleted = progress === 100;

    const details = {
      ...(existingReq?.details || {}),
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
      completed_lessons: completedLessons,
      details,
      updated_at: new Date().toISOString()
    };
    if (existingReq?.id) {
      updatePayload.id = existingReq.id;
    }

    await supabase
      .from('course_requests')
      .upsert(updatePayload);

    const enrollPayload = {
      student_id: studentId,
      course_id: courseId,
      course_title: courseTitle,
      progress,
      completed_lessons: completedLessons,
      updated_at: new Date().toISOString()
    };
    if (existingEnroll?.id) {
      await supabase
        .from('enrollments')
        .update(enrollPayload)
        .eq('id', existingEnroll.id);
    } else {
      await supabase
        .from('enrollments')
        .insert([enrollPayload]);
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
