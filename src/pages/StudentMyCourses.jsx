import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCourses } from '../context/CoursesContext';
import { getOrCreateDirectChat } from '../services/chatService';
import CertificateModal from '../components/CertificateModal';

const StudentMyCourses = () => {
  const { t, dir } = useLanguage();
  const { currentUser } = useAuth();
  const { courses } = useCourses();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messagingInstructorId, setMessagingInstructorId] = useState(null);
  const [activeCertificate, setActiveCertificate] = useState(null);

  const userId = currentUser?.uid || currentUser?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchEnrollments = async () => {
      try {
        const { data: reqs, error: reqErr } = await supabase
          .from('course_requests')
          .select('*')
          .eq('student_id', userId);

        if (reqErr) console.warn('course_requests fetch error:', reqErr);

        const list = (reqs || []).map(d => ({
          id: d.id,
          courseId: d.course_id || d.courseId,
          courseTitle: d.course_title || d.courseTitle,
          studentName: d.student_name || d.studentName,
          status: d.status || 'approved',
          progress: d.details?.progress || d.progress || 0,
          completedLessons: d.details?.completedLessons || d.completedLessons || [],
          instructor: d.instructor_name || d.instructor,
          ...d
        }));

        setEnrollments(list);
      } catch (err) {
        console.error('Fetch enrollments error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();

    const channel = supabase
      .channel(`my_courses_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_requests', filter: `student_id=eq.${userId}` }, () => {
        fetchEnrollments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleMessageInstructor = async (enroll) => {
    if (!currentUser) return;
    setMessagingInstructorId(enroll.id);
    try {
      let instructorUid = enroll.instructorId || enroll.instructor_id;
      let instructorName = enroll.instructor || 'المدرب';

      if (!instructorUid && enroll.courseId) {
        const { data: cData } = await supabase
          .from('courses')
          .select('instructor_id, instructor_name')
          .eq('id', enroll.courseId)
          .single();

        if (cData) {
          instructorUid = cData.instructor_id;
          instructorName = cData.instructor_name || instructorName;
        }
      }

      if (!instructorUid) {
        const { data: instData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'instructor')
          .limit(1)
          .single();

        if (instData) {
          instructorUid = instData.id;
          instructorName = instData.full_name || instructorName;
        }
      }

      if (!instructorUid) {
        alert(dir === 'rtl' ? 'لم يتم العثور على حساب المدرب' : 'Instructor account not found');
        return;
      }

      const chatId = await getOrCreateDirectChat(
        userId,
        instructorUid,
        currentUser.name || currentUser.email || 'طالب',
        instructorName,
        'student',
        'instructor'
      );
      navigate(`/dashboard/messages?chatId=${chatId?.id || chatId}`);
    } catch (err) {
      console.error('Error starting chat with instructor:', err);
    } finally {
      setMessagingInstructorId(null);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingModal || selectedRating === 0) return;
    setIsSubmitting(true);
    try {
      await supabase
        .from('reviews')
        .upsert({
          target_type: 'course',
          target_id: ratingModal.courseId,
          user_id: userId,
          rating: selectedRating,
          updated_at: new Date()
        });

      setRatingModal(null);
      setSelectedRating(0);
    } catch (err) {
      console.error("Error saving rating:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-dark dark:text-white transition-colors">{t('submittedAssignments.myCourses')}</h2>
          <Link to="/courses" className="flex items-center gap-2 text-sm font-bold text-primary hover:text-orange-700 dark:text-orange-400 transition-colors">
            <i className="fa-solid fa-plus"></i>
            {t('studentMyCourses.browseNew')}
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('studentMyCourses.subtitle')}</p>

        {loading ? (
          <div className="text-center py-16 text-gray-400 font-bold">{t('common.loading')}</div>
        ) : enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] dark:border-gray-700 py-20 text-gray-400">
            <i className="fa-solid fa-book-open text-4xl mb-4 text-gray-300 dark:text-gray-600"></i>
            <p className="font-bold text-gray-500 dark:text-gray-400">{t('studentMyCourses.noCourses')}</p>
            <Link to="/courses" className="mt-4 text-primary hover:underline text-sm font-bold">{t('studentMyCourses.browseCourses')}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enroll) => {
              const matchingCourse = courses.find(c => c.id === enroll.courseId);
              const totalLecs = matchingCourse?.lectures?.length || matchingCourse?.lessons?.length || 0;
              const completedList = Array.isArray(enroll.completedLessons) ? enroll.completedLessons : [];
              const liveProgress = totalLecs > 0 
                ? Math.min(100, Math.round((completedList.length / totalLecs) * 100))
                : (enroll.progress || 0);

              return (
              <div
                key={enroll.id}
                className="group rounded-2xl border border-[#E8E2D5] bg-white p-5 transition-all hover:border-[#D4AF37] hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/60"
              >
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="w-full sm:w-28 h-20 bg-[#FAF7F2] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                    <i className="fa-solid fa-book text-2xl"></i>
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-dark dark:text-white group-hover:text-secondary transition-colors">
                          {enroll.courseTitle || enroll.course_title || t('studentMyCourses.unknownCourse')}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleMessageInstructor(enroll)}
                            disabled={messagingInstructorId === enroll.id}
                            className="text-sm font-semibold text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary flex items-center gap-1.5 transition-colors group cursor-pointer"
                            title={t('chat.messageInstructor')}
                          >
                            <i className="fa-solid fa-chalkboard-user text-xs text-gray-400 group-hover:text-primary"></i>
                            <span>{enroll.instructor || '—'}</span>
                            {enroll.instructor && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all flex items-center gap-1 font-bold">
                                <span className="material-symbols-outlined text-[12px]">chat</span>
                                <span>{messagingInstructorId === enroll.id ? t('chat.loading') : t('chat.messageInstructor')}</span>
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-col items-end shrink-0">
                        {liveProgress >= 100 && (
                          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px] px-2.5 py-1 rounded-lg font-bold">
                            {t('studentMyCourses.completed')}
                          </span>
                        )}
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold text-primary dark:bg-orange-900/30">
                          {enroll.category || t('studentMyCourses.learningTrack')}
                        </span>
                        <button 
                          onClick={() => { setRatingModal(enroll); setSelectedRating(enroll.rating || 0); }}
                          className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                        >
                          {enroll.rating ? t('studentMyCourses.editRating') : t('studentMyCourses.addRating')} <i className="fa-solid fa-star text-[9px] mr-1"></i>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="text-gray-500 dark:text-gray-400">{t('studentMyCourses.progress')}</span>
                        <span className={liveProgress >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-secondary'}>
                          {liveProgress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${liveProgress >= 100 ? 'bg-emerald-500' : 'bg-secondary'}`}
                          style={{ width: `${liveProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 flex-wrap items-center">
                      <Link
                        to={`/dashboard/messages?chatId=group_${enroll.courseId}`}
                        className="bg-primary text-white hover:bg-secondary px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-base">forum</span>
                        {t('chat.openGroup')}
                      </Link>

                      <Link
                        to={`/courses/${enroll.courseId}`}
                        className="bg-secondary/10 text-secondary hover:bg-secondary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center"
                      >
                        <i className="fa-solid fa-play ml-1 text-xs"></i>
                        {t('studentMyCourses.viewCourse')}
                      </Link>

                      <Link
                        to={`/dashboard/assignments?courseId=${enroll.courseId}`}
                        className="bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center"
                      >
                        <i className="fa-regular fa-file-lines ml-1 text-xs"></i>
                        {t('studentMyCourses.assignments')}
                      </Link>

                      {liveProgress >= 100 && (
                        enroll.passedExam || enroll.certificateId ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const { data: certData } = await supabase
                                .from('certificates')
                                .select('*')
                                .eq('student_id', userId)
                                .eq('course_id', enroll.courseId)
                                .single();

                              if (certData) {
                                setActiveCertificate(certData);
                              } else {
                                navigate('/dashboard/certificates');
                              }
                            }}
                            className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span className="material-symbols-outlined text-base">verified</span>
                            <span>{dir === 'rtl' ? 'عرض الشهادة' : 'Certificate'}</span>
                          </button>
                        ) : (
                          <Link
                            to={`/courses/${enroll.courseId}`}
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span className="material-symbols-outlined text-base">quiz</span>
                            <span>{dir === 'rtl' ? 'اختبار التخرج' : 'Graduation Exam'}</span>
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {activeCertificate && (
        <CertificateModal
          certificate={activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}

      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-center text-dark dark:text-white mb-2">{t('studentMyCourses.rateTitle')}</h3>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">{ratingModal.courseTitle}</p>
            
            <div className="flex justify-center gap-2 mb-8 flex-row-reverse">
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className={`text-3xl transition-colors ${star <= selectedRating ? 'text-orange-400' : 'text-gray-200 dark:text-gray-700'} hover:text-orange-300`}
                >
                  <i className="fa-solid fa-star"></i>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setRatingModal(null); setSelectedRating(0); }}
                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-xl transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={isSubmitting || selectedRating === 0}
                className="flex-1 py-3 text-sm font-bold text-white bg-primary hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t('studentCourses.saving') : t('studentCourses.saveRating')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMyCourses;
