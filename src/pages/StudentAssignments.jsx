import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase/client';
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
  const [lightboxImage, setLightboxImage] = useState(null);
  const [submitText, setSubmitText] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitFileData, setSubmitFileData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [loading, setLoading] = useState(true);

  const userId = currentUser?.uid || currentUser?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: requests } = await supabase
          .from('course_requests')
          .select('course_id')
          .eq('student_id', userId);

        const courseIds = (requests || []).map(r => r.course_id).filter(Boolean);

        if (courseIds.length === 0) {
          setAssignments([]);
          setLoading(false);
          return;
        }

        const { data: assignmentsData } = await supabase.from('assignments').select('*');
        const { data: coursesData } = await supabase.from('courses').select('*');
        const { data: submissionsData } = await supabase.from('submitted_assignments').select('*').eq('student_id', userId);

        const cMap = {};
        (coursesData || []).forEach(c => { cMap[c.id] = c; });
        setCoursesMap(cMap);

        const subMap = {};
        (submissionsData || []).forEach(s => { subMap[s.assignment_id] = s; });

        const filteredAssignments = (assignmentsData || [])
          .filter(a => courseIds.includes(a.course_id))
          .map(a => {
            const sub = subMap[a.id];
            return {
              ...a,
              courseId: a.course_id,
              course: cMap[a.course_id]?.title || 'دورة',
              instructor: cMap[a.course_id]?.instructor_name || 'المدرب',
              deadline: a.due_date ? new Date(a.due_date).toLocaleDateString('ar-EG') : '—',
              status: sub ? (sub.grade ? 'graded' : 'submitted') : 'pending',
              grade: sub?.grade || null,
              file_url: a.file_url || a.fileUrl || '',
              fileUrl: a.file_url || a.fileUrl || '',
              image_name: a.image_name || a.imageName || '',
              imageName: a.image_name || a.imageName || '',
            };
          });

        setAssignments(filteredAssignments);
      } catch (err) {
        console.error('Error fetching student assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleDownloadAttachment = async (url, customFileName) => {
    const defaultName = dir === 'rtl' ? 'مرفق_الواجب' : 'assignment_attachment';
    const fileName = customFileName || `${defaultName}.png`;

    if (!url) {
      const blob = new Blob([`الأكاديمية الدولية الفلسطينية\nمرفق الواجب: ${customFileName || 'ملف توضيحي'}`], { type: 'text/plain;charset=utf-8' });
      const bUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = bUrl;
      a.download = fileName.includes('.') ? fileName : `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(bUrl);
      return;
    }

    try {
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const res = await fetch(url);
      const blob = await res.blob();
      const bUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = bUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(bUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleSubmit = async () => {
    if (!submitText.trim() && !submitFileName) return;
    setIsSubmitting(true);
    try {
      await supabase.from('submitted_assignments').insert([{
        assignment_id: submitModal.id,
        student_id: userId,
        student_name: currentUser.name || currentUser.email || 'طالب',
        notes: submitText,
        file_url: submitFileData || submitFileName,
        submitted_at: new Date()
      }]);

      setAssignments(prev => prev.map(a => 
        a.id === submitModal.id ? { ...a, status: 'submitted' } : a
      ));

      try {
        const studentName = currentUser.name || currentUser.email || 'طالب';
        await notifyInstructor(submitModal.courseId, {
          title: 'تسليم واجب جديد',
          title_en: 'New Assignment Submission',
          message: `قام الطالب «${studentName}» بتسليم حل واجب «${submitModal.title}».`,
          message_en: `Student "${studentName}" submitted assignment "${submitModal.title}".`,
          type: 'submission',
          link: `/instructor-dashboard/submissions/${submitModal.courseId}`
        });
      } catch (notifErr) {
        console.warn('Notification error:', notifErr);
      }
      
      setSubmitModal(null);
      setSubmitText('');
      setSubmitFileName('');
      setSubmitFileData('');
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
                    {(assignment.file_url || assignment.fileUrl || assignment.image_name || assignment.imageName) && (
                      <span className="flex items-center gap-1 text-secondary dark:text-amber-400 bg-secondary/5 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                        <i className="fa-solid fa-paperclip text-xs"></i>
                        <span>{dir === 'rtl' ? 'صورة مرفقة' : 'Attachment'}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {assignment.status === 'pending' && (
                    <button
                      onClick={() => { setSubmitModal(assignment); setSubmitText(''); setSubmitFileName(''); setSubmitFileData(''); }}
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

      {previewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="relative w-full max-w-xl rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewModal(null)}
              className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 cursor-pointer"
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

              {/* Attachment / Illustration Image Section */}
              {(() => {
                const attachmentUrl = previewModal.file_url || previewModal.fileUrl;
                const attachmentName = previewModal.image_name || previewModal.imageName || (attachmentUrl ? (dir === 'rtl' ? 'صورة توضيحية للواجب' : 'Assignment Illustration') : '');
                const hasAttachment = Boolean(attachmentUrl || attachmentName);

                if (!hasAttachment) return null;

                return (
                  <div className="pt-3 border-t border-[#E8E2D5] dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2.5 flex items-center gap-1.5">
                      <i className="fa-solid fa-paperclip text-secondary"></i>
                      <span>{t('studentAssignments.attachedImage') || 'الصورة التوضيحية المرفقة'}</span>
                    </p>

                    <div className="rounded-2xl border border-[#E8E2D5] bg-white p-3.5 shadow-xs transition hover:border-[#D4AF37]/60 dark:border-gray-700 dark:bg-gray-800/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {attachmentUrl ? (
                            <div
                              onClick={() => setLightboxImage({ url: attachmentUrl, name: attachmentName })}
                              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer group bg-stone-100 dark:bg-gray-900"
                              title={t('studentAssignments.previewImage') || 'معاينة الصورة'}
                            >
                              <img
                                src={attachmentUrl}
                                alt={attachmentName || 'Attachment'}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                                <i className="fa-solid fa-magnifying-glass-plus"></i>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-secondary dark:bg-orange-950/50 dark:text-amber-400">
                              <i className="fa-solid fa-image text-xl"></i>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100" title={attachmentName}>
                              {attachmentName || (dir === 'rtl' ? 'صورة توضيحية للواجب' : 'Assignment image')}
                            </p>
                            <span className="inline-flex items-center gap-1 mt-0.5 text-xs font-semibold text-secondary dark:text-amber-400">
                              <i className="fa-regular fa-image text-[10px]"></i>
                              {dir === 'rtl' ? 'ملف مرفق بالواجب' : 'Attached assignment file'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                          {attachmentUrl && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ url: attachmentUrl, name: attachmentName })}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-800/40 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 shadow-xs cursor-pointer"
                            >
                              <i className="fa-solid fa-eye text-xs"></i>
                              <span>{t('studentAssignments.previewImage') || 'معاينة الصورة'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(attachmentUrl, attachmentName)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 shadow-xs cursor-pointer"
                          >
                            <i className="fa-solid fa-download text-xs"></i>
                            <span>{t('studentAssignments.downloadAttachment') || 'تحميل المرفق'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setPreviewModal(null)}
                className="rounded-xl bg-secondary px-8 py-3 text-sm font-bold text-white transition hover:bg-rose-700 cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      if (file) {
                        setSubmitFileName(file.name);
                        try {
                          const reader = new FileReader();
                          reader.onload = () => setSubmitFileData(reader.result);
                          reader.readAsDataURL(file);
                        } catch (err) {
                          console.warn('Could not read file:', err);
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={() => { setSubmitModal(null); setSubmitFileName(''); setSubmitFileData(''); }}
                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!submitText.trim() && !submitFileName)}
                className="flex-1 rounded-xl bg-secondary py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? t('studentAssignments.sending') : t('studentAssignments.submitSolution')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Image Lightbox Modal ================= */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-all"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative flex flex-col items-center max-w-4xl max-h-[92vh] w-full rounded-3xl bg-gray-900/95 border border-gray-700 p-4 sm:p-6 text-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex w-full items-center justify-between pb-3 border-b border-gray-800 px-2">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <i className="fa-regular fa-image text-sm"></i>
                </div>
                <span className="text-sm font-bold truncate text-gray-200">
                  {lightboxImage.name || (dir === 'rtl' ? 'معاينة الصورة المرفقة' : 'Attachment Preview')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(lightboxImage.url, lightboxImage.name)}
                  className="flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs cursor-pointer"
                  title={t('studentAssignments.downloadAttachment') || 'تحميل المرفق'}
                >
                  <i className="fa-solid fa-download"></i>
                  <span className="hidden sm:inline">{t('studentAssignments.downloadAttachment') || 'تحميل'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Lightbox Body */}
            <div className="my-auto flex items-center justify-center p-3 overflow-auto max-h-[75vh] w-full">
              {lightboxImage.url ? (
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.name || 'Preview'}
                  className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl"
                />
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <i className="fa-regular fa-file-image text-4xl mb-3 text-gray-500"></i>
                  <p>{dir === 'rtl' ? 'لا يتوفر رابط مباشر لهذه الصورة' : 'Direct link not available for this image'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
