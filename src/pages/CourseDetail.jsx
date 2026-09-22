import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp, collection, query, where, getDocs, onSnapshot, db } from '../firebase/config';
import { supabase } from '../supabase/client';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import { autoEnrollStudentInCourseGroup, getOrCreateDirectChat } from '../services/chatService';
import { createNotification, notifyInstructor, notifyAdmins } from '../services/notificationService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import screenImg from '../assets/screen.png';
import { useLanguage } from '../context/LanguageContext';
import PageLoader from '../components/PageLoader';
import { toggleLessonCompletion } from '../services/certificateService';
import { getCourseExam } from '../services/examService';
import CertificateModal from '../components/CertificateModal';
import GraduationExamModal from '../components/GraduationExamModal';
import ReviewSection from '../components/ReviewSection';

export default function CourseDetail() {
  const { t, dir } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { courses, loading } = useCourses();
  const { currentUser, userData, userRole } = useAuth();
  const course = courses.find(c => c.id === id);

  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [messagingInstructor, setMessagingInstructor] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [updatingLesson, setUpdatingLesson] = useState(null);
  const [earnedCertificate, setEarnedCertificate] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [courseExam, setCourseExam] = useState(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examPassed, setExamPassed] = useState(false);
  const [showEnrollConfirmModal, setShowEnrollConfirmModal] = useState(false);

  // Fetch course graduation exam
  useEffect(() => {
    if (!id) return;
    getCourseExam(id).then(exam => {
      setCourseExam(exam);
    }).catch(err => console.warn('Could not load course exam:', err));
  }, [id]);

  // Check if already enrolled & listen to real-time progress
  useEffect(() => {
    if (!currentUser || !id) return;
    const uid = currentUser.uid || currentUser.id;

    const checkEnrollmentStatus = async () => {
      try {
        const enrollRef = doc(db, 'enrollments', `${uid}_${id}`);
        const snap = await getDoc(enrollRef);

        const { data: reqData } = await supabase
          .from('course_requests')
          .select('*')
          .eq('student_id', uid)
          .eq('course_id', id)
          .maybeSingle();

        if (snap.exists() || reqData) {
          setEnrolled(true);
          const data = snap.exists() ? snap.data() : reqData;
          const doneList = Array.isArray(data.completedLessons) || Array.isArray(data.details?.completedLessons)
            ? (data.completedLessons || data.details?.completedLessons)
            : [];
          setCompletedLessons(doneList);

          const totalLecs = course?.lectures?.length || 0;
          const computedProgress = totalLecs > 0 
            ? Math.min(100, Math.round((doneList.length / totalLecs) * 100))
            : (data.progress || data.details?.progress || 0);

          setProgressPercent(computedProgress);
          const hasPassedExam = !!(data.passedExam || data.details?.passedExam);
          setExamPassed(hasPassedExam);

          if (hasPassedExam) {
            const cRef = doc(db, 'certificates', `${uid}_${id}`);
            const cSnap = await getDoc(cRef);
            if (cSnap.exists()) {
              setEarnedCertificate({ id: cSnap.id, ...cSnap.data() });
            }
          }
        } else {
          setEnrolled(false);
          setCompletedLessons([]);
          setProgressPercent(0);
          setEarnedCertificate(null);
          setExamPassed(false);
        }
      } catch (err) {
        console.warn('Error checking enrollment status:', err);
      }
    };

    checkEnrollmentStatus();

    const enrollRef = doc(db, 'enrollments', `${uid}_${id}`);
    const unsub = onSnapshot(enrollRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setEnrolled(true);
        const doneList = Array.isArray(data.completedLessons) ? data.completedLessons : [];
        setCompletedLessons(doneList);
        setExamPassed(!!data.passedExam);

        const totalLecs = course?.lectures?.length || 0;
        const computedProgress = totalLecs > 0 
          ? Math.min(100, Math.round((doneList.length / totalLecs) * 100))
          : (data.progress || 0);

        setProgressPercent(computedProgress);

        if (totalLecs > 0 && computedProgress !== data.progress) {
          updateDoc(enrollRef, { progress: computedProgress }).catch(e => console.warn('Sync progress error:', e));
        }

        const hasPassedExam = !!data.passedExam;
        setExamPassed(hasPassedExam);

        if (hasPassedExam) {
          const cRef = doc(db, 'certificates', `${uid}_${id}`);
          const cSnap = await getDoc(cRef);
          if (cSnap.exists()) {
            setEarnedCertificate({ id: cSnap.id, ...cSnap.data() });
          } else {
            setEarnedCertificate(null);
          }
        } else {
          setEarnedCertificate(null);
        }
      }
    });

    return () => unsub();
  }, [currentUser, id, course?.lectures?.length]);

  const handleToggleLesson = async (lecIndex, lecTitle) => {
    if (!currentUser || !enrolled || updatingLesson !== null) return;
    const lessonId = `lesson_${lecIndex}`;
    const isCompleted = completedLessons.includes(lessonId);
    const newCompleted = !isCompleted;

    setUpdatingLesson(lessonId);
    try {
      const totalLessons = course?.lectures?.length || 1;
      const resolvedStudentName = userData?.fullName || userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'طالب المنصة';

      const res = await toggleLessonCompletion({
        studentId: currentUser.uid,
        studentName: resolvedStudentName,
        courseId: id,
        courseTitle: course.title,
        instructorName: course.instructor,
        lessonId,
        totalLessons,
        isCompleted: newCompleted
      });

      if (res.success) {
        setCompletedLessons(res.completedLessons);
        setProgressPercent(res.progress);
      }
    } catch (err) {
      console.error('Failed to toggle lesson:', err);
    } finally {
      setUpdatingLesson(null);
    }
  };

  const handleMessageInstructor = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setMessagingInstructor(true);
    try {
      let instructorUid = course.instructorId;
      let instructorName = course.instructor || t('adminInstructors.instructor');

      // If not in course doc, find instructor by name in users collection
      if (!instructorUid && course.instructor) {
        const uQuery = query(collection(db, 'users'), where('role', '==', 'instructor'));
        const uSnap = await getDocs(uQuery);
        const match = uSnap.docs.find(d => {
          const data = d.data();
          return data.fullName === course.instructor || data.name === course.instructor;
        });
        if (match) {
          instructorUid = match.id;
          instructorName = match.data().fullName || match.data().name || instructorName;
        }
      }

      if (!instructorUid) {
        alert(dir === 'rtl' ? 'لم يتم العثور على حساب المدرب' : 'Instructor account not found');
        return;
      }

      const chatId = await getOrCreateDirectChat(
        { uid: currentUser.uid, name: currentUser.name || currentUser.displayName || t('studentAssignments.student'), role: userRole || 'student' },
        { uid: instructorUid, name: instructorName, role: 'instructor' }
      );

      const targetPath = userRole === 'admin' 
        ? `/admin-dashboard/messages?chatId=${chatId}` 
        : userRole === 'instructor' 
        ? `/instructor-dashboard/messages?chatId=${chatId}` 
        : `/dashboard/messages?chatId=${chatId}`;

      navigate(targetPath);
    } catch (err) {
      console.error('Error opening chat with instructor:', err);
    } finally {
      setMessagingInstructor(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900" dir={dir}>
        <Navbar />
        <main className="grow flex items-center justify-center">
          <PageLoader message={dir === 'rtl' ? 'جاري تحميل تفاصيل الدورة...' : 'Loading course details...'} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900" dir={dir}>
        <Navbar />
        <main className="grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4"></p>
            <h1 className="text-2xl font-bold text-dark dark:text-white mb-2">{t('courseDetail.notFound')}</h1>
            <button onClick={() => navigate('/courses')} className="mt-4 text-primary hover:underline font-bold"> {t('common.back')}</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const levelMap = { BEGINNER: t('addCourse.beginner'), INTERMEDIATE: t('addCourse.intermediate'), ADVANCED: t('addCourse.advanced') };

  const handleEnroll = async () => {
    if (!currentUser) { navigate('/login'); return; }
    if (enrolled || enrolling) return;
    setEnrolling(true);
    setShowEnrollConfirmModal(false);
    try {
      const studentUid = currentUser.uid || currentUser.id;
      const studentName = userData?.fullName || userData?.name || currentUser.displayName || currentUser.name || currentUser.email?.split('@')[0] || 'طالب جديد';

      // 1. Write to course_requests table in Supabase
      try {
        await supabase.from('course_requests').upsert({
          student_id: studentUid,
          student_name: studentName,
          student_email: currentUser.email,
          course_id: id,
          course_title: course.title,
          instructor_id: course.instructorId || null,
          instructor_name: course.instructor || null,
          status: 'approved',
          payment_method: 'free',
          created_at: new Date()
        });
      } catch (reqErr) {
        console.warn('course_requests upsert error:', reqErr);
      }

      // 2. Write to enrollments table
      await setDoc(doc(db, 'enrollments', `${studentUid}_${id}`), {
        uid: studentUid,
        courseId: id,
        courseTitle: course.title,
        instructor: course.instructor,
        enrolledAt: serverTimestamp(),
        progress: 0,
      });

      // Increment students count
      await updateDoc(doc(db, 'courses', id), {
        students: increment(1)
      });

      // Auto-enroll newly registered student into course group chat if exists
      try {
        await autoEnrollStudentInCourseGroup(id, currentUser.uid);
      } catch (chatErr) {
        console.warn('Could not auto-enroll in course group:', chatErr);
      }

      // Send real-time notifications
      try {
        const studentName = currentUser.displayName || currentUser.name || 'طالب جديد';

        // 1. Notify Student
        await createNotification({
          recipientId: currentUser.uid,
          recipientRole: 'student',
          title: 'تم التسجيل بنجاح',
          title_en: 'Enrolled Successfully',
          message: `تهانينا! تم تسجيلك بنجاح في دورة «${course.title}». يمكنك الآن بدء التعلم ومتابعة المحاضرات.`,
          message_en: `Congratulations! You have enrolled in "${course.title}". Start learning now!`,
          link: '/dashboard/my-courses',
          type: 'enrollment',
          courseId: id,
        });

        // 2. Notify Instructor
        await notifyInstructor(course, {
          title: 'طالب جديد في دورتك',
          title_en: 'New Enrolled Student',
          message: `انضم الطالب «${studentName}» إلى دورة «${course.title}».`,
          message_en: `Student "${studentName}" has enrolled in your course "${course.title}".`,
          link: '/instructor-dashboard/my-courses',
          type: 'enrollment',
          courseId: id,
          metadata: {
            studentName,
            studentId: currentUser.uid,
            courseId: id,
            courseTitle: course.title
          }
        });

        // 3. Notify Admins
        await notifyAdmins({
          title: 'تسجيل جديد في دورة',
          title_en: 'New Course Enrollment',
          message: `سجل الطالب «${studentName}» في دورة «${course.title}».`,
          message_en: `Student "${studentName}" enrolled in "${course.title}".`,
          link: `/admin-dashboard/users?search=${encodeURIComponent(studentName)}`,
          type: 'enrollment',
          courseId: id,
          metadata: {
            studentName,
            studentId: currentUser.uid,
            courseId: id,
            courseTitle: course.title
          }
        });
      } catch (notifErr) {
        console.warn('Could not send enrollment notifications:', notifErr);
      }

      setEnrolled(true);
    } finally {
      setEnrolling(false);
    }
  };

  const handleOpenEnrollModal = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (enrolled || enrolling) return;
    setShowEnrollConfirmModal(true);
  };

  const EnrollButton = ({ className }) => {
    const { t } = useLanguage();
    if (enrolled) return (
      <button disabled className={`${className} bg-emerald-500 text-white cursor-default flex items-center gap-2`}>
        <span className="material-symbols-outlined text-lg">check_circle</span>
        {t('courseDetail.alreadyEnrolled')}
      </button>
    );
    return (
      <button onClick={handleOpenEnrollModal} disabled={enrolling} className={`${className} bg-primary hover:bg-orange-700 text-white flex items-center gap-2 disabled:opacity-60 cursor-pointer`}>
        <span className="material-symbols-outlined text-lg">school</span>
        {enrolling ? t('courseDetail.enrolling') : t('courseDetail.enroll')}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors" dir={dir}>
      <Navbar />
      <main className="grow">
        {/* Breadcrumb Navigation */}
        <nav className="bg-[#FAF7F2] dark:bg-gray-900 pt-6 px-4 transition-colors" aria-label="Breadcrumb">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 overflow-x-auto py-2 border-b border-[#E8E2D5]/60 dark:border-gray-800">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1 shrink-0 font-medium">
              <span className="material-symbols-outlined text-base">home</span>
              <span>{dir === 'rtl' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <span className="material-symbols-outlined text-xs rtl:rotate-180 shrink-0 text-gray-400">chevron_right</span>
            
            <Link to="/courses" className="hover:text-primary transition-colors shrink-0 font-medium">
              {dir === 'rtl' ? 'الكورسات' : 'Courses'}
            </Link>
            
            {course.category && (
              <>
                <span className="material-symbols-outlined text-xs rtl:rotate-180 shrink-0 text-gray-400">chevron_right</span>
                <span className="shrink-0 font-medium text-gray-600 dark:text-gray-300">
                  {course.category}
                </span>
              </>
            )}
            
            <span className="material-symbols-outlined text-xs rtl:rotate-180 shrink-0 text-gray-400">chevron_right</span>
            <span className="font-bold text-dark dark:text-white truncate max-w-xs sm:max-w-md">
              {course.title}
            </span>
          </div>
        </nav>

        {/* Hero */}
        <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white py-14 px-4 border-b border-[#E8E2D5] dark:border-gray-800 relative overflow-hidden transition-colors">
          <div className="absolute inset-0">
            <img src={screenImg} alt="" className="w-full h-full object-cover opacity-10" />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full border border-primary/25 font-bold uppercase">{course.category}</span>
              {course.level && <span className="bg-[#F3EFE6] dark:bg-gray-800 text-dark dark:text-white text-xs px-3 py-1 rounded-full border border-[#E8E2D5] dark:border-gray-700 font-bold uppercase">{levelMap[course.level] || course.level}</span>}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-dark dark:text-white">{course.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl leading-relaxed mb-6">
              {course.description || t('courseDetail.courseDesc')}
            </p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-8">
              <span 
                onClick={handleMessageInstructor}
                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group"
                title={t('chat.messageInstructor')}
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-xs group-hover:scale-105 transition-transform">{course.instructor?.[0] || ''}</div>
                <span className="font-semibold underline underline-offset-4 decoration-primary/40 group-hover:decoration-primary flex items-center gap-1">
                  {course.instructor}
                  <span className="material-symbols-outlined text-sm text-primary">chat</span>
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-orange-400">star</span>
                <span className="text-dark dark:text-white font-bold">{course.rating?.toFixed?.(1) ?? '0.0'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">group</span>
                {course.students || 0} {t('common.students')}
              </span>
              {course.lectures?.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">play_circle</span>
                  {course.lectures.length} {t('courseDetail.lectures')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="text-3xl font-extrabold text-success">
                {course.price === 'Free' || !course.price ? t('courseDetail.free') : course.price}
              </div>
              <EnrollButton className="px-8 py-3.5 rounded-xl font-bold text-lg transition-colors shadow-xl" />
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 border border-[#E8E2D5] dark:border-gray-700 hover:border-primary text-dark dark:text-white px-6 py-3.5 rounded-xl font-bold transition-colors bg-white dark:bg-gray-800">
                {t('common.back')}
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {course.goals?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 text-dark dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">emoji_objects</span>{t('courseDetail.whatYouLearn')}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.goals.map((goal, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-main dark:text-gray-400">
                        <span className="material-symbols-outlined text-success text-base mt-0.5 shrink-0">check_circle</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {course.lectures?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100 dark:border-gray-700">
                    <div>
                      <h2 className="text-xl font-bold text-dark dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">play_lesson</span>
                        {t('addCourse.courseContent')}
                      </h2>
                      <p className="text-xs text-stone-400 mt-1">
                        {course.lectures.length} {t('courseDetail.lectures')}
                        {enrolled && ` • ${completedLessons.length} من ${course.lectures.length} مكتملة`}
                      </p>
                    </div>

                    {/* Progress Percentage Badge if Enrolled */}
                    {enrolled && (
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <span className="text-xs font-bold text-stone-400 block">{dir === 'rtl' ? 'نسبة الإنجاز:' : 'Progress:'}</span>
                          <span className={`text-base font-extrabold ${progressPercent >= 100 ? 'text-emerald-500' : 'text-primary'}`}>
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="w-24 h-2.5 bg-stone-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Graduation Exam Qualification & Certificate Banners when 100% */}
                  {enrolled && progressPercent >= 100 && (
                    <>
                      {/* Case 1: Already passed exam and earned certificate */}
                      {earnedCertificate && examPassed ? (
                        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                              <span className="material-symbols-outlined text-xl">verified</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-dark dark:text-white">
                                {dir === 'rtl' ? '🎉 مبارك! اجتزت اختبار التخرج وحصلت على الشهادة المعتمدة' : '🎉 Congratulations! You passed the graduation exam and earned your certificate'}
                              </h4>
                              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                                ID: {earnedCertificate.certificateId} {earnedCertificate.gradeScore ? `• الدرجة: ${earnedCertificate.gradeScore}%` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowCertModal(true)}
                              className="px-4 py-2 rounded-xl bg-primary hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span>
                              <span>{dir === 'rtl' ? 'عرض الشهادة والطباعة' : 'View Certificate'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Case 2: Finished all lectures, now eligible for graduation exam */
                        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-orange-500/15 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                          <div className="flex items-start sm:items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/25 shrink-0">
                              <span className="material-symbols-outlined text-2xl">school</span>
                            </div>
                            <div>
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-extrabold uppercase mb-1">
                                {dir === 'rtl' ? 'أتممت جميع المحاضرات 100%' : 'All Lectures Completed'}
                              </span>
                              <h4 className="text-base font-extrabold text-dark dark:text-white">
                                {dir === 'rtl' 
                                  ? 'أنت الآن مؤهل لخوض اختبار التخرج النهائي من هذا الكورس!' 
                                  : 'You are now eligible to take the final graduation exam!'}
                              </h4>
                              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                {dir === 'rtl'
                                  ? 'اجتياز الاختبار بنسبة 80% فما فوق يمنحك شهادة الإتمام الرسمية المعتمدة فوراً.'
                                  : 'Scoring 80% or higher unlocks your official verified certificate instantly.'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowExamModal(true)}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                          >
                            <span className="material-symbols-outlined text-base">quiz</span>
                            <span>{dir === 'rtl' ? 'بدء اختبار التخرج الآن' : 'Take Graduation Exam'}</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Lectures List with Interactive Tracking */}
                  <div className="space-y-2">
                    {course.lectures.map((lec, i) => {
                      const lessonId = `lesson_${i}`;
                      const isDone = completedLessons.includes(lessonId);
                      const isProcessing = updatingLesson === lessonId;

                      const handleOpenLecture = (e) => {
                        // If student hasn't completed it yet and clicks the lecture, mark as completed automatically
                        if (enrolled && !isDone && !isProcessing) {
                          handleToggleLesson(i, lec.title);
                        }
                      };

                      return (
                        <div 
                          key={i} 
                          className={`flex items-center gap-3 p-3.5 rounded-xl transition-all border ${
                            isDone 
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-500/20 dark:border-emerald-500/20' 
                              : 'border-transparent hover:bg-[#FAF7F2] dark:hover:bg-gray-700/50'
                          } group`}
                        >
                          {/* Completion Checkbox Button (Only if Enrolled) */}
                          {enrolled ? (
                            <button
                              type="button"
                              onClick={() => handleToggleLesson(i, lec.title)}
                              disabled={isProcessing}
                              title={isDone ? (dir === 'rtl' ? 'إلغاء وضع علامة مكتمل' : 'Mark as incomplete') : (dir === 'rtl' ? 'تحديد كمكتمل' : 'Mark as completed')}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all cursor-pointer ${
                                isDone 
                                  ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/25 ring-2 ring-emerald-500/30' 
                                  : 'bg-stone-100 dark:bg-gray-700 text-stone-500 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 border border-stone-200 dark:border-gray-600'
                              }`}
                            >
                              {isProcessing ? (
                                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : isDone ? (
                                <span className="material-symbols-outlined text-lg">check</span>
                              ) : (
                                <span className="text-xs font-bold">{lec.number || i + 1}</span>
                              )}
                            </button>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                              {lec.number || i + 1}
                            </div>
                          )}

                          {/* Title and auto-complete trigger */}
                          <div 
                            className="flex-1 cursor-pointer select-none"
                            onClick={() => {
                              if (enrolled) {
                                handleToggleLesson(i, lec.title);
                              }
                            }}
                          >
                            <span className={`text-sm font-medium transition-colors block ${
                              isDone ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-dark dark:text-gray-200 hover:text-primary'
                            }`}>
                              {lec.title || ` ${i + 1}`}
                            </span>
                            {enrolled && (
                              <span className="text-[11px] text-stone-400 block mt-0.5">
                                {isDone ? (dir === 'rtl' ? '✓ تم إكمال هذه المحاضرة' : '✓ Completed') : (dir === 'rtl' ? 'انقر لتحديد المحاضرة كمكتملة' : 'Click to mark completed')}
                              </span>
                            )}
                          </div>

                          {/* Completed text pill */}
                          {enrolled && isDone && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg hidden sm:inline-block border border-emerald-500/20">
                              {dir === 'rtl' ? 'مكتمل' : 'Completed'}
                            </span>
                          )}

                          {lec.link && (
                            <a 
                              href={lec.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              onClick={handleOpenLecture}
                              className="text-primary hover:text-orange-700 opacity-80 group-hover:opacity-100 transition-opacity p-2 rounded-xl hover:bg-primary/10 flex items-center gap-1 text-xs font-bold" 
                              title={dir === 'rtl' ? 'فتح المحاضرة' : 'Open Lecture'}
                            >
                              <span className="material-symbols-outlined text-base">open_in_new</span>
                              <span className="hidden md:inline">{dir === 'rtl' ? 'مشاهدة' : 'Watch'}</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-[#E8E2D5] dark:border-gray-700 shadow-sm">
                <img src={screenImg} alt={course.title} className="w-full h-44 object-cover" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-dark dark:text-white mb-4">{t('addCourse.courseDetails')}</h3>
                <ul className="space-y-3 text-sm">
                  {[
                    { 
                      icon: 'person', 
                      label: t('adminInstructors.instructor'), 
                      value: (
                        <button
                          type="button"
                          onClick={handleMessageInstructor}
                          className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          title={t('chat.messageInstructor')}
                        >
                          <span>{course.instructor}</span>
                          <span className="material-symbols-outlined text-sm">chat</span>
                        </button>
                      )
                    },
                    { icon: 'category', label: t('adminAddBook.category'), value: course.category },
                    { icon: 'signal_cellular_alt', label: t('addCourse.level'), value: levelMap[course.level] || course.level },
                    { icon: 'payments', label: t('courseDetail.price'), value: course.price === 'Free' ? t('courseDetail.free') : course.price },
                    { icon: 'group', label: t('common.students'), value: `${course.students || 0}` },
                    { icon: 'star', label: t('courseDetail.rating'), value: `${(course.ratingAverage ?? course.rating ?? 0).toFixed(1)} (${course.ratingCount || 0})` },
                  ].map(item => (
                    <li key={item.label} className="flex items-center gap-2 text-text-main dark:text-gray-400">
                      <span className="material-symbols-outlined text-base text-primary">{item.icon}</span>
                      <span className="font-semibold text-dark dark:text-white">{item.label}:</span>
                      <span className="mr-auto">{item.value || ''}</span>
                    </li>
                  ))}
                </ul>
                <EnrollButton className="w-full mt-6 py-3 rounded-xl font-bold transition-colors shadow-sm justify-center" />
              </div>
            </div>
          </div>

          {/* Course Reviews Section */}
          <div className="mt-12 pt-8 border-t border-[#E8E2D5] dark:border-gray-800">
            <ReviewSection 
              targetType="course" 
              targetId={id} 
              canReview={enrolled}
              cannotReviewReason={!enrolled ? (dir === 'rtl' ? 'يمكنك تقييم هذه الدورة وتدوين مراجعتك فور التسجيل بها والانضمام لطلابها.' : 'Reviews are available for enrolled students.') : ''}
              targetTitle={course.title}
            />
          </div>
        </section>
      </main>

      {/* Graduation Exam Modal */}
      {showExamModal && (
        <GraduationExamModal
          exam={courseExam}
          course={course}
          currentUser={currentUser}
          onClose={() => setShowExamModal(false)}
          onExamPassed={(cert) => {
            if (cert) {
              setEarnedCertificate(cert);
              setExamPassed(true);
              setShowCertModal(true);
            }
          }}
        />
      )}

      {/* Full Certificate Modal */}
      {showCertModal && earnedCertificate && (
        <CertificateModal
          certificate={earnedCertificate}
          onClose={() => setShowCertModal(false)}
        />
      )}

      {/* Enrollment Confirmation Modal */}
      {showEnrollConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E8E2D5] dark:border-gray-700 shadow-2xl animate-in fade-in zoom-in duration-200" dir={dir}>
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            
            <h3 className="text-xl font-bold text-dark dark:text-white text-center mb-2">
              {dir === 'rtl' ? 'تأكيد التسجيل في الدورة' : 'Confirm Course Enrollment'}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
              {dir === 'rtl'
                ? `هل أنت تأكد من رغبتك في التسجيل في دورة «${course.title}»؟ سيتم إضافة الكورس إلى لوحة تحكمك فوراً.`
                : `Are you sure you want to enroll in "${course.title}"? It will be added to your student dashboard immediately.`}
            </p>

            <div className="bg-[#FAF7F2] dark:bg-gray-900/60 rounded-2xl p-4 mb-6 border border-[#E8E2D5] dark:border-gray-700 space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-500">{dir === 'rtl' ? 'المدرب:' : 'Instructor:'}</span>
                <span className="font-bold text-dark dark:text-white">{course.instructor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-500">{dir === 'rtl' ? 'المحاضرات:' : 'Lectures:'}</span>
                <span className="font-bold text-dark dark:text-white">{course.lectures?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-500">{dir === 'rtl' ? 'التكلفة:' : 'Price:'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {course.price === 'Free' || !course.price ? (dir === 'rtl' ? 'مجاني' : 'Free') : course.price}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling}
                className="flex-1 bg-primary hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {enrolling ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                )}
                <span>{dir === 'rtl' ? 'تأكيد التسجيل' : 'Confirm Enrollment'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowEnrollConfirmModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm cursor-pointer"
              >
                {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

