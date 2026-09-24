import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDoc, db } from '../supabase/db';
import { supabase } from '../supabase/client';
import { useLanguage } from '../context/LanguageContext';
import { notifyEnrolledStudents } from '../services/notificationService';
import CustomDatePicker from '../components/CustomDatePicker';
import Pagination from '../components/Pagination';

export default function ManageAssignments() {
  const { t, dir } = useLanguage();
    const { id } = useParams(); // courseId
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [newAssignment, setNewAssignment] = useState({ title: "", description: "", dueDate: "", imageName: "", fileUrl: "", file_url: "" });
    const [lightboxImage, setLightboxImage] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [courseTitle, setCourseTitle] = useState('');

    useEffect(() => {
        setCurrentPage(1);
    }, [id]);

    const totalPages = Math.ceil(assignments.length / itemsPerPage) || 1;
    const paginatedAssignments = assignments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, 'assignments'), where('courseId', '==', id));
        const unsub = onSnapshot(q, (snap) => {
            setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Fetch course title for notification context
        getDoc(doc(db, 'courses', id)).then((snap) => {
            if (snap.exists()) {
                setCourseTitle(snap.data().title || '');
            }
        }).catch(err => console.warn('Could not fetch course title:', err));

        return unsub;
    }, [id]);

    const formatDueDate = (dateStr, isRtl) => {
        if (!dateStr) return '—';
        if (typeof dateStr === 'string' && dateStr.includes('Invalid')) return '—';
        
        // If string already contains localized arabic month name, return it directly
        const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        if (typeof dateStr === 'string' && arabicMonths.some(m => dateStr.includes(m))) {
            return dateStr;
        }

        try {
            if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
                const [year, month, day] = dateStr.trim().split('-').map(Number);
                const d = new Date(year, month - 1, day);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    });
                }
            }

            const raw = dateStr?.toDate ? dateStr.toDate() : dateStr;
            const parsed = new Date(raw);
            if (!isNaN(parsed.getTime())) {
                return parsed.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });
            }
        } catch (e) {}
        
        return typeof dateStr === 'string' && !dateStr.includes('Invalid') ? dateStr : '—';
    };

    const validateAssignmentForm = () => {
        const errs = {};
        if (!newAssignment.title || !newAssignment.title.trim()) {
            errs.title = t('manageAssignments.titleRequired');
        }
        if (!newAssignment.description || !newAssignment.description.trim()) {
            errs.description = t('manageAssignments.descRequired');
        }
        if (!newAssignment.dueDate) {
            errs.dueDate = t('manageAssignments.dueDateRequired');
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setErrors({});
        setNewAssignment({ title: "", description: "", dueDate: "", imageName: "", fileUrl: "", file_url: "" });
        setIsUploadingImage(false);
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        let downloadUrl = '';
        try {
            const fileExt = file.name ? file.name.split('.').pop() : 'png';
            const filePath = `assignments/${id}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('assignments')
                .upload(filePath, file, { upsert: true });

            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(filePath);
                downloadUrl = urlData?.publicUrl || '';
            }
        } catch (storageErr) {
            console.warn('Supabase storage upload error, using Data URL fallback:', storageErr);
        }

        if (!downloadUrl) {
            downloadUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => resolve('');
                reader.readAsDataURL(file);
            });
        }

        setNewAssignment((prev) => ({
            ...prev,
            imageName: file.name,
            fileUrl: downloadUrl,
            file_url: downloadUrl
        }));
        setIsUploadingImage(false);
    };

    const handleRemoveImage = () => {
        setNewAssignment((prev) => ({
            ...prev,
            imageName: "",
            fileUrl: "",
            file_url: ""
        }));
    };

    const handleDownloadAttachment = async (url, customFileName) => {
        const defaultName = dir === 'rtl' ? 'صورة_الواجب' : 'assignment_image';
        const fileName = customFileName || `${defaultName}.png`;
        if (!url) return;
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

    const handleAddAssignment = async () => {
        if (!validateAssignmentForm()) return;
        setIsSubmitting(true);
        const assignmentTitle = newAssignment.title.trim();
        const formattedDueDate = formatDueDate(newAssignment.dueDate, dir === 'rtl');
        try {
            await addDoc(collection(db, 'assignments'), {
                courseId: id,
                course_id: id,
                title: assignmentTitle,
                description: newAssignment.description.trim(),
                imageName: newAssignment.imageName,
                image_name: newAssignment.imageName,
                file_url: newAssignment.fileUrl || newAssignment.file_url || '',
                fileUrl: newAssignment.fileUrl || newAssignment.file_url || '',
                dueDate: formattedDueDate,
                due_date: formattedDueDate,
                rawDueDate: newAssignment.dueDate,
                raw_due_date: newAssignment.dueDate,
                date: formattedDueDate,
                createdAt: new Date().toISOString(),
                created_at: new Date().toISOString(),
            });

            // Notify enrolled students in real-time
            try {
                await notifyEnrolledStudents(id, {
                    title: 'واجب جديد',
                    title_en: 'New Assignment Added',
                    message: `تم إضافة واجب جديد: «${assignmentTitle}» في دورة «${courseTitle || 'الدورة'}». موعد التسليم: ${formattedDueDate}.`,
                    message_en: `A new assignment "${assignmentTitle}" was added to "${courseTitle || 'your course'}". Due date: ${formattedDueDate}.`,
                    type: 'assignment',
                    link: '/dashboard/assignments',
                });
            } catch (notifErr) {
                console.warn('Could not send assignment notifications:', notifErr);
            }

            handleCloseAddModal();
        } catch (err) {
            console.error("Error adding assignment:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId) => {
        try {
            await deleteDoc(doc(db, 'assignments', assignmentId));
            setShowDeleteModal(null);
        } catch (err) {
            console.error("Error deleting assignment:", err);
        }
    };

    return (
        <div dir={dir} className="min-h-full rounded-2xl border border-[#E8E2D5] bg-white p-4 transition-colors duration-200 dark:border-gray-700 dark:bg-gray-900 sm:p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Link to="/instructor-dashboard/my-courses" className="text-gray-400 dark:text-gray-500 hover:text-indigo-500 transition-colors">{t('submittedAssignments.myCourses')}</Link>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{t('manageAssignments.title')}</span>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        <i className="fa-solid fa-clipboard-list"></i>
                        {t('manageAssignments.subtitle')}
                    </h2>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    >
                        <i className="fa-solid fa-plus"></i>
                        {t('manageAssignments.addNew')}
                    </button>
                </div>

                <p className="mt-1 text-sm text-gray-400">{t('manageAssignments.addDeleteHint')}</p>
            </div>

            {/* Assignments Table / List */}
            {assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500 text-center px-4">
                    <i className="fa-solid fa-clipboard-list text-5xl mb-4"></i>
                    <p className="text-lg font-bold">{t('manageAssignments.noAssignments')}</p>
                    <p className="text-sm mt-1">{t('manageAssignments.noAssignmentsHint')}</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {/* Desktop Table Header */}
                    <div className="hidden grid-cols-12 gap-4 border-b border-[#E8E2D5] bg-[#FAF7F2] px-6 py-3.5 text-xs font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 md:grid">
                        <span className="col-span-4">{dir === 'rtl' ? 'الواجب' : 'Assignment'}</span>
                        <span className="col-span-2">{dir === 'rtl' ? 'تاريخ التسليم' : 'Due Date'}</span>
                        <span className="col-span-2">{dir === 'rtl' ? 'المرفقات' : 'Attachments'}</span>
                        <span className="col-span-2">{dir === 'rtl' ? 'التسليمات' : 'Submissions'}</span>
                        <span className="col-span-2 text-center">{dir === 'rtl' ? 'الإجراءات' : 'Actions'}</span>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-[#E8E2D5] dark:divide-gray-700">
                        {paginatedAssignments.map((assignment) => {
                            const hasAttachment = Boolean(assignment.file_url || assignment.fileUrl || assignment.image_name || assignment.imageName);
                            const attachmentUrl = assignment.file_url || assignment.fileUrl;
                            const attachmentName = assignment.image_name || assignment.imageName || (attachmentUrl ? (dir === 'rtl' ? 'صورة مرفقة' : 'Attachment') : '');
                            const formattedDate = formatDueDate(assignment.dueDate || assignment.date, dir === 'rtl') || assignment.dueDate || assignment.date || '—';

                            return (
                                <div
                                    key={assignment.id}
                                    className="flex flex-col gap-3 px-6 py-4 hover:bg-[#FAF7F2] dark:hover:bg-gray-700/50 transition-colors md:grid md:grid-cols-12 md:items-center md:gap-4"
                                >
                                    {/* Assignment (col-span-4) */}
                                    <div className="col-span-4 flex flex-col text-start">
                                        <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{dir === 'rtl' ? 'الواجب' : 'Assignment'}</span>
                                        <p className="font-bold text-dark dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            {assignment.title}
                                        </p>
                                        {assignment.description && (
                                            <p className="text-xs text-gray-400 truncate mt-0.5" title={assignment.description}>
                                                {assignment.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Due Date (col-span-2) */}
                                    <div className="col-span-2 flex flex-col text-start">
                                        <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{dir === 'rtl' ? 'تاريخ التسليم' : 'Due Date'}</span>
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                            <i className="fa-regular fa-calendar text-gray-400 text-xs"></i>
                                            <span>{formattedDate}</span>
                                        </div>
                                    </div>

                                    {/* Attachments (col-span-2) */}
                                    <div className="col-span-2 flex flex-col text-start">
                                        <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{dir === 'rtl' ? 'المرفقات' : 'Attachments'}</span>
                                        {hasAttachment ? (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {attachmentUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setLightboxImage({ url: attachmentUrl, name: attachmentName })}
                                                        title={dir === 'rtl' ? 'معاينة الصورة' : 'Preview Image'}
                                                        aria-label={dir === 'rtl' ? 'معاينة الصورة' : 'Preview Image'}
                                                        className="text-primary hover:text-white bg-primary/10 hover:bg-primary transition-all flex items-center justify-center p-2 rounded-xl shadow-xs cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-base">visibility</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadAttachment(attachmentUrl, attachmentName)}
                                                    title={dir === 'rtl' ? 'تحميل المرفق' : 'Download Attachment'}
                                                    aria-label={dir === 'rtl' ? 'تحميل المرفق' : 'Download Attachment'}
                                                    className="text-secondary hover:text-white bg-secondary/10 hover:bg-secondary transition-all flex items-center justify-center p-2 rounded-xl shadow-xs cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-base">download</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </div>

                                    {/* Submissions (col-span-2) */}
                                    <div className="col-span-2 flex flex-col text-start">
                                        <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{dir === 'rtl' ? 'التسليمات' : 'Submissions'}</span>
                                        <div>
                                            <Link
                                                to={`/instructor-dashboard/submissions/${id}`}
                                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors"
                                                title={dir === 'rtl' ? 'عرض حلول الطلاب' : 'View Student Submissions'}
                                            >
                                                <i className="fa-solid fa-users text-xs"></i>
                                                <span>{assignment.submissions || 0} {t('manageAssignments.submissions')}</span>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Actions (col-span-2) */}
                                    <div className="col-span-2 flex items-center justify-end md:justify-center gap-2">
                                        <Link
                                            to={`/instructor-dashboard/submissions/${id}`}
                                            className="p-2 text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer"
                                            title={dir === 'rtl' ? 'متابعة التسليمات' : 'Submissions'}
                                            aria-label={dir === 'rtl' ? 'متابعة التسليمات' : 'Submissions'}
                                        >
                                            <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteModal(assignment.id)}
                                            className="p-2 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer"
                                            title={t('common.delete')}
                                            aria-label={t('common.delete')}
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Footer */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={assignments.length}
                        itemsPerPage={itemsPerPage}
                        itemName={dir === 'rtl' ? 'واجب' : 'assignments'}
                    />
                </div>
            )}

            {/* ================= Add Assignment Modal ================= */}
            {showAddModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 py-8 overflow-y-auto backdrop-blur-sm dark:bg-black/60"
                    onClick={handleCloseAddModal}
                >
                    <div
                        className="relative w-full max-w-lg rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseAddModal}
                            className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            <i className="fa-solid fa-plus text-xl"></i>
                        </div>

                        <h3 className="text-center text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                            {t('manageAssignments.addNew')}
                        </h3>

                        {/* Validation Error Banner */}
                        {Object.keys(errors).length > 0 && (
                            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs font-bold text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-400">
                                <i className="fa-solid fa-circle-exclamation text-base shrink-0"></i>
                                <span>{t('manageAssignments.validationErrorBanner')}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <span className="text-rose-500 font-bold ml-1">*</span>
                                    {t('submittedAssignments.assignmentTitle')}
                                </label>
                                <input
                                    type="text"
                                    value={newAssignment.title}
                                    onChange={(e) => {
                                        setNewAssignment((prev) => ({ ...prev, title: e.target.value }));
                                        if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                                    }}
                                    placeholder={t('manageAssignments.assignmentTitlePlaceholder')}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-700 outline-none transition dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 ${
                                        errors.title
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 focus:border-rose-500'
                                            : 'border-[#E8E2D5] bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-gray-700 dark:focus:border-indigo-500'
                                    }`}
                                />
                                {errors.title && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                                        <i className="fa-solid fa-circle-exclamation text-xs"></i>
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* Due Date Picker */}
                            <div>
                                <CustomDatePicker
                                    label={t('manageAssignments.dueDateLabel')}
                                    required={true}
                                    value={newAssignment.dueDate}
                                    minDate={new Date().toISOString().split('T')[0]}
                                    placeholder={t('manageAssignments.dueDatePlaceholder')}
                                    hasError={!!errors.dueDate}
                                    onChange={(val) => {
                                        setNewAssignment((prev) => ({ ...prev, dueDate: val }));
                                        if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: null }));
                                    }}
                                />
                                {errors.dueDate && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                                        <i className="fa-solid fa-circle-exclamation text-xs"></i>
                                        {errors.dueDate}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <span className="text-rose-500 font-bold ml-1">*</span>
                                    {t('manageAssignments.assignmentDesc')}
                                </label>
                                <textarea
                                    rows="3"
                                    value={newAssignment.description}
                                    onChange={(e) => {
                                        setNewAssignment((prev) => ({ ...prev, description: e.target.value }));
                                        if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
                                    }}
                                    placeholder={t('manageAssignments.assignmentDescPlaceholder')}
                                    className={`w-full resize-none rounded-xl border px-4 py-3 text-sm text-gray-700 outline-none transition dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 ${
                                        errors.description
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 focus:border-rose-500'
                                            : 'border-[#E8E2D5] bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-gray-700 dark:focus:border-indigo-500'
                                    }`}
                                />
                                {errors.description && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                                        <i className="fa-solid fa-circle-exclamation text-xs"></i>
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('manageAssignments.illustrationImage')}
                                </label>
                                {newAssignment.fileUrl ? (
                                    <div className="relative rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] p-3 dark:border-gray-700 dark:bg-gray-900/60 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={newAssignment.fileUrl}
                                                alt="Preview"
                                                className="h-14 w-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                                                    {newAssignment.imageName || (dir === 'rtl' ? 'صورة توضيحية' : 'Illustration Image')}
                                                </p>
                                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                                    {dir === 'rtl' ? 'تم تجهيز الصورة للإرفاق' : 'Image ready to attach'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition shrink-0 cursor-pointer"
                                            title={dir === 'rtl' ? 'حذف الصورة' : 'Remove Image'}
                                        >
                                            <i className="fa-solid fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="assignment-image"
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E2D5] bg-[#FAF7F2]/50 p-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-gray-700 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/10"
                                    >
                                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                            {isUploadingImage ? (
                                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                            ) : (
                                                <i className="fa-solid fa-image"></i>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {isUploadingImage ? (dir === 'rtl' ? 'جاري تجهيز الصورة...' : 'Processing image...') : t('manageAssignments.clickToChooseImage')}
                                        </p>
                                        <input
                                            id="assignment-image"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="mt-7 flex gap-3">
                            <button
                                onClick={handleCloseAddModal}
                                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAddAssignment}
                                disabled={isSubmitting || isUploadingImage}
                                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:bg-indigo-600 dark:hover:bg-indigo-500 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                        <span>{t('common.saving')}</span>
                                    </>
                                ) : (
                                    t('manageAssignments.addAssignment')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= Delete Confirmation Modal ================= */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
                    onClick={() => setShowDeleteModal(null)}
                >
                    <div
                        className="relative w-full max-w-md rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400">
                            <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                        </div>

                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('manageAssignments.deleteTitle')}</h3>
                            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                {t('manageAssignments.deleteConfirm')}
                            </p>
                        </div>

                        <div className="mt-7 flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(null)}
                                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={() => handleDeleteAssignment(showDeleteModal)}
                                className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white transition hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 cursor-pointer"
                            >
                                {t('manageAssignments.confirmDelete')}
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
                        <div className="flex w-full items-center justify-between pb-3 border-b border-gray-800 px-2">
                            <div className="flex items-center gap-2.5 truncate">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
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
                                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
                                    title={dir === 'rtl' ? 'تحميل الصورة' : 'Download Image'}
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


