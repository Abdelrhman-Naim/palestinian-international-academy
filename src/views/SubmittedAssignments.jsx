"use client";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, updateDoc, db } from '../supabase/db';
import { supabase } from '../supabase/client';
import { useAuth } from "../context/AuthContext";
import { useLanguage } from '../context/LanguageContext';
import { getOrCreateDirectChat } from '../services/chatService';
import { createNotification } from '../services/notificationService';

export default function SubmittedAssignments() {
  const { t, dir } = useLanguage();
  const { id } = useParams(); // courseId
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [previewModal, setPreviewModal] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [messagingStudentId, setMessagingStudentId] = useState(null);

  const handleMessageStudent = async (sub) => {
    if (!sub.studentId || !currentUser) return;
    setMessagingStudentId(sub.id);
    try {
      const instructorName = userData?.name || userData?.fullName || currentUser.displayName || 'المدرب';
      const userId = currentUser.id || currentUser.uid;
      const res = await getOrCreateDirectChat(
        userId,
        sub.studentId,
        instructorName,
        sub.studentName || sub.student || 'طالب',
        'instructor',
        'student'
      );
      const chatId = typeof res === 'object' ? res?.id : res;
      navigate(`/instructor-dashboard/messages?chatId=${chatId}`);
    } catch (err) {
      console.error('Error starting chat with student:', err);
    } finally {
      setMessagingStudentId(null);
    }
  };

  useEffect(() => {
    if (!id || id === 'undefined') return;

    let isMounted = true;

    const fetchDirectSubmissions = async () => {
      try {
        const { data: cAssigns } = await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', id);

        const aIds = (cAssigns || []).map(a => a.id);

        let supaRes;
        if (aIds.length > 0) {
          supaRes = await supabase
            .from('submitted_assignments')
            .select('*')
            .or(`course_id.eq.${id},assignment_id.in.(${aIds.join(',')})`);
        } else {
          supaRes = await supabase
            .from('submitted_assignments')
            .select('*')
            .eq('course_id', id);
        }

        if (supaRes.data && isMounted) {
          const list = supaRes.data.map(d => ({
            id: d.id,
            studentId: d.student_id,
            studentName: d.student_name || d.email || 'طالب',
            student: d.student_name || d.email || 'طالب',
            assignment: d.notes ? 'تسليم الواجب' : 'حل الواجب',
            courseId: d.course_id || id,
            fileUrl: d.file_url || d.fileUrl || d.file || '',
            file_url: d.file_url || d.fileUrl || d.file || '',
            fileName: d.file_name || d.fileName || '',
            file_name: d.file_name || d.fileName || '',
            content: d.notes || d.content || '',
            notes: d.notes || d.content || '',
            date: d.submitted_at ? new Date(d.submitted_at).toLocaleDateString('ar-EG') : '—',
            grade: d.grade ?? d.score,
            score: d.score ?? d.grade,
            status: d.status || (d.grade !== undefined && d.grade !== null ? 'graded' : (d.viewed ? 'viewed' : 'pending')),
            viewed: d.viewed || false,
            ...d
          }));
          setSubmissions(list);
        }
      } catch (err) {
        console.warn('Submissions initial fetch notice:', err);
      }
    };

    fetchDirectSubmissions();

    const q = query(collection(db, 'submissions'), where('courseId', '==', id));
    const unsub = onSnapshot(q, (snap) => {
      if (!isMounted) return;
      const snapData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (snapData.length > 0) {
        setSubmissions(snapData);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [id]);

  const handleSaveGrade = async () => {
    if (!previewModal?.score && previewModal?.score !== 0) return;
    setIsSaving(true);
    const numGrade = Number(previewModal.score);
    try {
      // 1. Update in db wrapper
      await updateDoc(doc(db, 'submissions', previewModal.id), {
        grade: numGrade,
        score: numGrade,
        status: 'graded',
        viewed: true,
        gradedAt: new Date()
      });

      // 2. Direct Supabase update to guarantee persistence
      try {
        await supabase
          .from('submitted_assignments')
          .update({
            grade: numGrade,
            score: numGrade,
            status: 'graded',
            viewed: true,
            graded_at: new Date().toISOString()
          })
          .eq('id', previewModal.id);
      } catch (e) {
        console.warn('Direct supabase grade update notice:', e);
      }

      // 3. Immediately update local state so UI updates dynamically without refresh!
      setSubmissions(prev => prev.map(s => 
        s.id === previewModal.id 
          ? {
              ...s,
              grade: numGrade,
              score: numGrade,
              status: 'graded',
              viewed: true,
              gradedAt: new Date()
            }
          : s
      ));

      // Notify student in real-time
      if (previewModal.studentId) {
        try {
          await createNotification({
            recipientId: previewModal.studentId,
            recipientRole: 'student',
            title: 'تم تقييم واجبك',
            title_en: 'Assignment Graded',
            message: `تم تقييم حل واجب «${previewModal.assignment || 'الواجب'}». درجتك: ${numGrade}/100.`,
            message_en: `Your submission for "${previewModal.assignment || 'Assignment'}" has been graded: ${numGrade}/100.`,
            type: 'assignment',
            link: '/dashboard/assignments',
            courseId: id,
          });
        } catch (notifErr) {
          console.warn('Could not notify student of grade:', notifErr);
        }
      }

      setPreviewModal(null);
    } catch (err) {
      console.error("Error saving grade", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPreview = async (sub) => {
    const existingScore = sub.grade ?? sub.score ?? '';
    setPreviewModal({
      ...sub,
      score: existingScore
    });

    if (!sub.viewed && !sub.grade && sub.grade !== 0 && !sub.score && sub.status !== 'graded') {
      // Immediately mark as viewed in local state
      setSubmissions(prev => prev.map(s => 
        s.id === sub.id ? { ...s, viewed: true, status: 'viewed' } : s
      ));
      try {
        await updateDoc(doc(db, 'submissions', sub.id), {
          viewed: true,
          status: 'viewed'
        });
      } catch (err) {
        console.warn('Could not mark submission as viewed:', err);
      }
    }
  };

  const getSubmissionStatus = (sub) => {
    const hasGrade = (sub.grade !== undefined && sub.grade !== null && sub.grade !== '') ||
                     (sub.score !== undefined && sub.score !== null && sub.score !== '') ||
                     sub.status === 'graded';
    if (hasGrade) {
      const scoreVal = sub.grade ?? sub.score;
      return {
        key: 'graded',
        label: dir === 'rtl' ? `تم التقييم (${scoreVal}/100)` : `Graded (${scoreVal}/100)`,
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        icon: 'verified'
      };
    }
    if (sub.viewed || sub.status === 'viewed') {
      return {
        key: 'viewed',
        label: dir === 'rtl' ? 'تمت المعاينة' : 'Viewed',
        badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
        icon: 'visibility'
      };
    }
    return {
      key: 'pending',
      label: dir === 'rtl' ? 'قيد الانتظار' : 'Pending',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      icon: 'schedule'
    };
  };

  const pendingCount = submissions.filter(s => !s.grade && s.grade !== 0 && !s.score && !s.viewed && s.status !== 'viewed' && s.status !== 'graded').length;
  const viewedCount = submissions.filter(s => (!s.grade && s.grade !== 0 && !s.score && s.status !== 'graded') && (s.viewed || s.status === 'viewed')).length;
  const gradedCount = submissions.filter(s => (s.grade !== undefined && s.grade !== null && s.grade !== '') || (s.score !== undefined && s.score !== null && s.score !== '') || s.status === 'graded').length;

  return (
    <div dir={dir} className="min-h-full rounded-2xl border border-[#E8E2D5] bg-white p-4 transition-colors duration-200 dark:border-gray-700 dark:bg-gray-900 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Link to="/instructor-dashboard/my-courses" className="text-gray-400 dark:text-gray-500 hover:text-emerald-500 transition-colors">{t('submittedAssignments.myCourses')}</Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-emerald-600 dark:text-emerald-400">{t('submittedAssignments.title')}</span>
        </div>

        <h2 className="flex items-center gap-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          <i className="fa-solid fa-file-circle-check"></i>
          {t('submittedAssignments.title')}
        </h2>

        <p className="mt-1 text-sm text-gray-400">{t('submittedAssignments.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] p-3.5 text-center dark:border-gray-700 dark:bg-gray-800/60">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{submissions.length}</p>
          <p className="text-xs font-bold text-gray-500 mt-1">{t('submittedAssignments.totalSubmissions')}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1">{dir === 'rtl' ? 'قيد الانتظار' : 'Pending'}</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 text-center dark:border-sky-900/50 dark:bg-sky-950/20">
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{viewedCount}</p>
          <p className="text-xs font-bold text-sky-700 dark:text-sky-300 mt-1">{dir === 'rtl' ? 'تمت المعاينة' : 'Viewed'}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{gradedCount}</p>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">{dir === 'rtl' ? 'تم التقييم' : 'Graded'}</p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-2xl border border-[#E8E2D5] bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-800/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right">
            <thead className="bg-[#FAF7F2] dark:bg-gray-700/50 border-b border-[#E8E2D5] dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">{t('submittedAssignments.studentName')}</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">{t('submittedAssignments.assignment')}</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">{dir === 'rtl' ? 'حالة التسليم' : 'Status'}</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">{t('submittedAssignments.submissionDate')}</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">{t('submittedAssignments.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D5] dark:divide-gray-700">
              {submissions.map((sub) => {
                const st = getSubmissionStatus(sub);
                const hasAttachment = Boolean(sub.file_url || sub.fileUrl || sub.file || sub.fileName || sub.file_name);
                return (
                  <tr key={sub.id} className="hover:bg-[#FAF7F2] dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                          {(sub.student || sub.studentName || 'S').charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800 dark:text-white">{sub.student || sub.studentName}</span>
                          {sub.studentId && (
                            <button
                              type="button"
                              onClick={() => handleMessageStudent(sub)}
                              disabled={messagingStudentId === sub.id}
                              className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 mt-0.5 text-right cursor-pointer"
                              title={t('chat.messageStudent')}
                            >
                              <span className="material-symbols-outlined text-[13px]">chat</span>
                              <span>{messagingStudentId === sub.id ? t('chat.loading') : t('chat.messageStudent')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        {hasAttachment && (
                          <span className="material-symbols-outlined text-amber-500 text-sm shrink-0" title={dir === 'rtl' ? 'يحتوي على مرفق/صورة' : 'Has attachment'}>attach_file</span>
                        )}
                        <span className="truncate">{sub.assignment || (sub.notes ? 'تسليم الواجب' : 'حل الواجب')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${st.badgeClass}`}>
                        <span className="material-symbols-outlined text-xs">{st.icon}</span>
                        <span>{st.label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{sub.date || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {sub.studentId && (
                          <button
                            type="button"
                            onClick={() => handleMessageStudent(sub)}
                            disabled={messagingStudentId === sub.id}
                            className="flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary hover:text-white px-3 py-2 text-xs font-bold text-primary transition-all cursor-pointer shadow-xs"
                            title={t('chat.messageStudent')}
                          >
                            <span className="material-symbols-outlined text-base">chat</span>
                            <span className="hidden sm:inline">{t('chat.messageInstructor')}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenPreview(sub)}
                          className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 cursor-pointer"
                        >
                          <i className="fa-solid fa-eye"></i>
                          {t('submittedAssignments.preview')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= Preview Modal ================= */}
      {previewModal && (() => {
        const attachmentUrl = previewModal.file_url || previewModal.fileUrl || previewModal.file || previewModal.url || '';
        const attachmentName = previewModal.file_name || previewModal.fileName || previewModal.imageName || previewModal.image_name || (attachmentUrl ? (dir === 'rtl' ? 'صورة/مرفق الواجب' : 'Attachment') : '');

        const isImage = Boolean(
          attachmentUrl && (
            attachmentUrl.startsWith('data:image/') ||
            attachmentUrl.startsWith('blob:') ||
            /\.(png|jpe?g|gif|webp|svg)($|\?)/i.test(attachmentUrl) ||
            (attachmentUrl.length > 50 && !attachmentUrl.includes('.pdf') && !attachmentUrl.includes('.docx') && !attachmentUrl.includes('.zip'))
          )
        );

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
            onClick={() => setPreviewModal(null)}
          >
            <div
              className="relative w-full max-w-2xl rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800 max-h-[88vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewModal(null)}
                className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <i className="fa-solid fa-file-lines text-xl"></i>
              </div>

              <h3 className="text-center text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {t('submittedAssignments.previewTitle')}
              </h3>

              {/* Status Header Banner inside Modal */}
              {(() => {
                const st = getSubmissionStatus(previewModal);
                return (
                  <div className={`mx-auto mb-5 max-w-md p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${st.badgeClass}`}>
                    <span className="material-symbols-outlined text-sm">{st.icon}</span>
                    <span>
                      {st.key === 'graded'
                        ? (dir === 'rtl' ? `تم تقييم هذا التسليم مسبقاً بدرجة: ${previewModal.score ?? previewModal.grade}/100` : `Graded: ${previewModal.score ?? previewModal.grade}/100`)
                        : st.key === 'viewed'
                        ? (dir === 'rtl' ? 'تمت معاينة الحل (يمكنك رصد الدرجة وحفظها الآن)' : 'Solution viewed (ready for grading)')
                        : (dir === 'rtl' ? 'تسليم جديد قيد الانتظار لم يتم معاينته من قبل' : 'New pending submission')}
                    </span>
                  </div>
                );
              })()}

              <div className="space-y-4 rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] p-5 dark:border-gray-700 dark:bg-gray-900/50">
                <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-4 dark:border-gray-700">
                  <span className="text-xs text-gray-400">{previewModal.date || '—'}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold dark:bg-emerald-900/30 dark:text-emerald-400">
                      {(previewModal.student || previewModal.studentName || 'S').charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">{previewModal.student || previewModal.studentName}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('submittedAssignments.assignmentTitle')}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{previewModal.assignment || 'تسليم الواجب'}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('submittedAssignments.submissionContent')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-7 whitespace-pre-wrap">
                    {previewModal.notes || previewModal.content || t('submittedAssignments.noText')}
                  </p>
                </div>

                {/* ===== Attachment Display (Image or File) ===== */}
                {attachmentUrl ? (
                  <div className="mt-4 pt-4 border-t border-[#E8E2D5] dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-emerald-500">attach_file</span>
                      <span>{t('submittedAssignments.attachments')}</span>
                    </p>

                    {isImage ? (
                      <div className="rounded-2xl border border-[#E8E2D5] bg-white p-3 dark:border-gray-700 dark:bg-gray-800 flex flex-col items-center shadow-xs">
                        <img
                          src={attachmentUrl}
                          alt={attachmentName}
                          className="max-h-80 w-full object-contain rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 bg-black/5 dark:bg-black/30 p-1"
                        />
                        <div className="mt-3 flex items-center justify-center gap-2 w-full flex-wrap">
                          <button
                            type="button"
                            onClick={() => setLightboxImage({ url: attachmentUrl, name: attachmentName })}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>{dir === 'rtl' ? 'معاينة ملء الشاشة' : 'Fullscreen Preview'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = attachmentUrl;
                              a.download = attachmentName.includes('.') ? attachmentName : `${attachmentName}.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>{dir === 'rtl' ? 'تحميل الصورة' : 'Download Image'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#E8E2D5] bg-white dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-2.5 truncate">
                          <i className="fa-solid fa-paperclip text-indigo-500 text-base"></i>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{attachmentName}</span>
                        </div>
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = attachmentUrl;
                            a.download = attachmentName || 'submission_file';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          <i className="fa-solid fa-download text-xs"></i>
                          <span>{dir === 'rtl' ? 'تحميل الملف' : 'Download File'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                  {t('submittedAssignments.gradeLabel')} (من 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={previewModal.score !== undefined ? previewModal.score : ''}
                  onChange={(e) => setPreviewModal({ ...previewModal, score: e.target.value })}
                  placeholder={t('submittedAssignments.gradePlaceholder')}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-indigo-500"
                />
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={handleSaveGrade}
                  disabled={isSaving || (previewModal.score === '' || previewModal.score === null || previewModal.score === undefined)}
                  className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSaving ? t('submittedAssignments.saving') : t('submittedAssignments.saveGrade')}
                </button>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shadow-xs"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <i className="fa-regular fa-image text-sm"></i>
                </div>
                <span className="text-sm font-bold truncate text-gray-200">
                  {lightboxImage.name || (dir === 'rtl' ? 'معاينة الصورة المرفقة' : 'Attachment Preview')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = lightboxImage.url;
                    a.download = lightboxImage.name || 'image.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                >
                  <i className="fa-solid fa-download"></i>
                  <span className="hidden sm:inline">{dir === 'rtl' ? 'تحميل' : 'Download'}</span>
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
}
