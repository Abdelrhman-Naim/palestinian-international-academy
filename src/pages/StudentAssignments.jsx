import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { notifyInstructor } from '../services/notificationService';

const StudentAssignments = () => {
  const { t, dir } = useLanguage();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const courseIdFilter = searchParams.get('courseId');

  const [filter, setFilter] = useState('all');
  const [previewModal, setPreviewModal] = useState(null);
  const [submitModal, setSubmitModal] = useState(null);
  const [submitText, setSubmitText] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    // 1. Get enrollments
    const qEnrollments = query(collection(db, 'enrollments'), where('uid', '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(qEnrollments, async (enrollmentsSnap) => {
      const courseIds = enrollmentsSnap.docs.map(d => d.data().courseId);
      
      if (courseIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // 2. Fetch assignments
      const assignmentsSnap = await getDocs(collection(db, 'assignments'));
      
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const coursesData = {};
      coursesSnap.forEach(doc => { coursesData[doc.id] = doc.data(); });
      setCoursesMap(coursesData);

      // 3. Fetch submissions for current user to know status
      const qSubmissions = query(collection(db, 'submissions'), where('studentId', '==', currentUser.uid));
      const submissionsSnap = await getDocs(qSubmissions);
      const userSubmissions = {};
      submissionsSnap.forEach(doc => { 
        userSubmissions[doc.data().assignmentId] = doc.data(); 
      });

      const allAssignments = assignmentsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(a => courseIds.includes(a.courseId))
        .map(a => {
          const sub = userSubmissions[a.id];
          return {
            ...a,
            course: coursesData[a.courseId]?.title || 'دورة',
            instructor: coursesData[a.courseId]?.instructor || 'المدرب', 
            deadline: a.dueDate || a.date,
            status: sub ? (sub.grade ? 'graded' : 'submitted') : 'pending',
            grade: sub?.grade || null,
          };
        });
        
      setAssignments(allAssignments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!submitText.trim() && !submitFileName) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'submissions'), {
        assignmentId: submitModal.id,
        assignment: submitModal.title,
        courseId: submitModal.courseId,
        studentId: currentUser.uid,
        student: currentUser.name || currentUser.displayName || 'طالب',
        content: submitText,
        fileName: submitFileName,
        date: new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }),
        timestamp: serverTimestamp(),
      });
      
      // Update local state temporarily so user sees change immediately
      setAssignments(prev => prev.map(a => 
        a.id === submitModal.id ? { ...a, status: 'submitted' } : a
      ));

      // Notify the course instructor in real-time
      try {
        const studentName = currentUser.name || currentUser.displayName || 'طالب';
        await notifyInstructor(submitModal.courseId, {
          title: 'تسليم واجب جديد',
          title_en: 'New Assignment Submission',
          message: `قام الطالب «${studentName}» بتسليم حل واجب «${submitModal.title}» في دورة «${submitModal.course || 'دورتك'}».`,
          message_en: `Student "${studentName}" submitted assignment "${submitModal.title}".`,
          type: 'submission',
          link: `/instructor-dashboard/submissions/${submitModal.courseId}`,
          courseId: submitModal.courseId,
          metadata: {
            assignmentId: submitModal.id,
            studentName,
            studentId: currentUser.uid,
            courseId: submitModal.courseId,
            courseTitle: submitModal.course
          }
        });
      } catch (notifErr) {
        console.warn('Could not notify instructor of submission:', notifErr);
      }
      
      setSubmitModal(null);
    } catch (err) {
      console.error("Error submitting assignment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMap = {
    pending: { label: t('studentAssignments.pending'), color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    submitted: { label: t('studentAssignments.submitted'), color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
    graded: { label: t('studentAssignments.graded'), color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  };

  const courseAssignments = courseIdFilter
    ? assignments.filter(a => a.courseId === courseIdFilter)
    : assignments;

  const filtered = filter === 'all'
    ? courseAssignments
    : courseAssignments.filter(a => a.status === filter);

  const selectedCourseName = coursesMap[courseIdFilter]?.title || assignments.find(a => a.courseId === courseIdFilter)?.course || '';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-dark dark:text-white transition-colors">{t('studentAssignments.title')}</h2>
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
            {courseAssignments.filter(a => a.status === 'pending').length} {t('studentAssignments.pendingCount')}
          </span>
        </div>

        {/* Active Course Filter Banner */}
        {courseIdFilter && (
          <div className="bg-[#FAF7F2] dark:bg-gray-800 border border-[#D4AF37]/50 dark:border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-primary flex items-center justify-center shrink-0">
                <i className="fa-solid fa-graduation-cap text-lg"></i>
              </div>
              <div className="text-start">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold block">
                  {dir === 'rtl' ? 'واجبات الدورة المحددة:' : 'Selected Course Assignments:'}
                </span>
                <h3 className="text-base font-bold text-dark dark:text-white">
                  {selectedCourseName || t('studentMyCourses.unknownCourse')}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setSearchParams({})}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 hover:border-primary text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-primary transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <i className="fa-solid fa-layer-group text-xs text-primary"></i>
              <span>{dir === 'rtl' ? 'عرض واجبات كافة الدورات' : 'Show All Courses Assignments'}</span>
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: t('studentAssignments.all') },
            { key: 'pending', label: t('studentAssignments.pending') },
            { key: 'submitted', label: t('studentAssignments.submitted') },
            { key: 'graded', label: t('studentAssignments.graded') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                filter === tab.key
                  ? 'bg-secondary text-white shadow-sm'
                  : 'bg-[#FAF7F2] text-gray-700 border border-[#E8E2D5] hover:bg-[#F3EFE6] dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500 text-center px-4">
              <i className="fa-regular fa-file-lines text-5xl mb-4"></i>
              <p className="text-lg font-bold">
                {courseIdFilter
                  ? (dir === 'rtl' ? 'لا توجد واجبات لهذه الدورة حالياً' : 'No assignments for this course yet')
                  : t('studentAssignments.noAssignments')}
              </p>
              {courseIdFilter && (
                <button
                  onClick={() => setSearchParams({})}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors shadow-xs cursor-pointer"
                >
                  {dir === 'rtl' ? 'عرض واجبات كافة الدورات' : 'View All Assignments'}
                </button>
              )}
            </div>
          )}

          {filtered.map((assignment) => (
            <div
              key={assignment.id}
              className="group rounded-2xl border border-[#E8E2D5] bg-white p-5 transition-all hover:border-[#D4AF37] hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/60"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-lg font-bold text-dark dark:text-white">{assignment.title}</h3>
                    <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${statusMap[assignment.status].color}`}>
                      {statusMap[assignment.status].label}
                    </span>
                    {assignment.grade && (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                        {t('studentAssignments.grade')} {assignment.grade}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-6">{assignment.description}</p>

                  <div className="mt-3 flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-book text-gray-400"></i>
                      {assignment.course}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-chalkboard-user text-gray-400"></i>
                      {assignment.instructor}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fa-regular fa-calendar text-gray-400"></i>
                      {assignment.deadline}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {assignment.status === 'pending' && (
                    <button
                      onClick={() => { setSubmitModal(assignment); setSubmitText(''); setSubmitFileName(''); }}
                      className="bg-secondary/10 text-secondary hover:bg-secondary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      <i className="fa-solid fa-upload ml-1 text-xs"></i>
                      {t('studentAssignments.submit')}
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewModal(assignment)}
                    className="bg-[#FAF7F2] text-gray-700 border border-[#E8E2D5] hover:bg-[#F3EFE6] dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    <i className="fa-solid fa-eye ml-1 text-xs"></i>
                    {t('studentAssignments.details')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= Preview Modal ================= */}
      {previewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="relative w-full max-w-xl rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewModal(null)}
              className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <i className="fa-regular fa-file-lines text-xl"></i>
            </div>

            <h3 className="text-center text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
              {t('studentAssignments.detailsTitle')}
            </h3>

            <div className="space-y-4 rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] p-5 dark:border-gray-700 dark:bg-gray-900/50">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('submittedAssignments.assignmentTitle')}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{previewModal.title}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('studentAssignments.courseName')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{previewModal.course}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('adminInstructors.instructor')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{previewModal.instructor}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('submittedAssignments.submissionDate')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{previewModal.deadline}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('studentAssignments.description')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-7">{previewModal.description}</p>
              </div>
              {previewModal.imageName && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('submittedAssignments.attachments')}</p>
                  <button 
                    onClick={() => {
                        const blob = new Blob([t('studentAssignments.demoImage')], { type: "image/png" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = previewModal.imageName;
                        a.click();
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <i className="fa-solid fa-image"></i>
                    {previewModal.imageName}
                    <i className="fa-solid fa-download ml-1 text-xs"></i>
                  </button>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('adminInstructors.status')}</p>
                <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${statusMap[previewModal.status].color}`}>
                  {statusMap[previewModal.status].label}
                </span>
                {previewModal.grade && (
                  <span className="mr-2 text-[11px] px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    {t('studentAssignments.grade')} {previewModal.grade}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setPreviewModal(null)}
                className="rounded-xl bg-secondary px-8 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Submit Assignment Modal ================= */}
      {submitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setSubmitModal(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSubmitModal(null)}
              className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <i className="fa-solid fa-paper-plane text-xl"></i>
            </div>

            <h3 className="text-center text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {t('studentAssignments.submit')}
            </h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">{submitModal.title}</p>

            <div className="space-y-4">
              {/* Text Content */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">{t('studentAssignments.answerContent')}</label>
                <textarea
                  rows="5"
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder={t('studentAssignments.answerPlaceholder')}
                  className="w-full resize-none rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-secondary"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">{t('studentAssignments.attachFile')}</label>
                <label
                  htmlFor="submit-file"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E2D5] bg-[#FAF7F2]/50 p-6 text-center transition hover:border-secondary hover:bg-rose-50/30 dark:border-gray-700 dark:hover:border-secondary/50 dark:hover:bg-rose-950/10"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {submitFileName || t('studentAssignments.clickToSelect')}
                  </p>
                  <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">PDF, DOCX, ZIP, PNG, JPG</span>
                  <input
                    id="submit-file"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSubmitFileName(file.name);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setSubmitModal(null)}
                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!submitText.trim() && !submitFileName)}
                className="flex-1 rounded-xl bg-secondary py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmitting ? t('studentAssignments.sending') : t('studentAssignments.submitSolution')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
