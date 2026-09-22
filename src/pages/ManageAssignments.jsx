import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDoc, db } from "../firebase/config";
import { useLanguage } from '../context/LanguageContext';
import { notifyEnrolledStudents } from '../services/notificationService';
import CustomDatePicker from '../components/CustomDatePicker';

export default function ManageAssignments() {
  const { t, dir } = useLanguage();
    const { id } = useParams(); // courseId
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [newAssignment, setNewAssignment] = useState({ title: "", description: "", dueDate: "", imageName: "" });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignments, setAssignments] = useState([]);

    const [courseTitle, setCourseTitle] = useState('');

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
        if (!dateStr) return '';
        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const d = new Date(year, month - 1, day);
            return d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        } catch {
            return dateStr;
        }
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
        setNewAssignment({ title: "", description: "", dueDate: "", imageName: "" });
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewAssignment((prev) => ({ ...prev, imageName: file.name }));
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

            {/* Assignments List */}
            <div className="space-y-4">
                {assignments.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
                        <i className="fa-solid fa-clipboard-list text-5xl mb-4"></i>
                        <p className="text-lg font-bold">{t('manageAssignments.noAssignments')}</p>
                        <p className="text-sm mt-1">{t('manageAssignments.noAssignmentsHint')}</p>
                    </div>
                )}

                {assignments.map((assignment) => (
                    <div
                        key={assignment.id}
                        className="group rounded-2xl border border-[#E8E2D5] bg-white p-5 transition-all hover:border-[#D4AF37] hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-indigo-500/30"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1 text-start">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {assignment.title}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-6">
                                    {assignment.description}
                                </p>
                                <div className="mt-3 flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <i className="fa-regular fa-calendar text-gray-400"></i>
                                        {t('manageAssignments.dueDate')} {assignment.dueDate || assignment.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <i className="fa-solid fa-users text-gray-400"></i>
                                        {assignment.submissions} {t('manageAssignments.submissions')}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowDeleteModal(assignment.id)}
                                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-500 transition hover:bg-rose-100 hover:text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
                            >
                                <i className="fa-regular fa-trash-can"></i>
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

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
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">{t('manageAssignments.illustrationImage')}</label>
                                <label
                                    htmlFor="assignment-image"
                                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E2D5] bg-[#FAF7F2]/50 p-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-gray-700 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/10"
                                >
                                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                        <i className="fa-solid fa-image"></i>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {newAssignment.imageName || t('manageAssignments.clickToChooseImage')}
                                    </p>
                                    <input
                                        id="assignment-image"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="mt-7 flex gap-3">
                            <button
                                onClick={handleCloseAddModal}
                                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAddAssignment}
                                disabled={isSubmitting}
                                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:bg-indigo-600 dark:hover:bg-indigo-500"
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
                                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={() => handleDeleteAssignment(showDeleteModal)}
                                className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white transition hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500"
                            >
                                {t('manageAssignments.confirmDelete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


