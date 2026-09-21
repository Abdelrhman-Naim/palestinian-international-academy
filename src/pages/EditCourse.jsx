import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useCategories } from "../context/CategoriesContext";
import { doc, getDoc, updateDoc, db } from "../firebase/config";
import CustomSelect from "../components/CustomSelect";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from '../context/LanguageContext';
import { notifyEnrolledStudents } from '../services/notificationService';

export default function EditCourse() {
  const { t, dir } = useLanguage();
    const { id } = useParams();
    const { rawCategories } = useCategories();
    const { userRole, currentUser } = useAuth();

    const coursesBackPath = userRole === 'admin' ? '/admin-dashboard/courses' : '/instructor-dashboard/my-courses';
    const coursesBackLabel = userRole === 'admin' ? (dir === 'rtl' ? 'الدورات' : 'Courses') : t('submittedAssignments.myCourses');
    const [loading, setLoading] = useState(true);
    const [courseTitle, setCourseTitle] = useState('');
    const [courseInstructor, setCourseInstructor] = useState('');
    const [category, setCategory] = useState('');
    const [icon, setIcon] = useState('code');
    const [level, setLevel] = useState('BEGINNER');
    const [goals, setGoals] = useState(['']);
    const [sessions, setSessions] = useState([{ number: 1, title: '', link: '' }]);
    const [description, setDescription] = useState('');
    const [lecturesCount, setLecturesCount] = useState(1);
    const [initialLecturesCount, setInitialLecturesCount] = useState(0);
    const [status, setStatus] = useState('');

    const [openSession, setOpenSession] = useState(0);
    const [modal, setModal] = useState(null);
    const [errors, setErrors] = useState({});

    const validateEditCourseForm = () => {
        const errs = {};
        if (!courseTitle?.trim()) {
            errs.courseTitle = dir === 'rtl' ? 'يرجى إدخال عنوان الدورة' : 'Course title is required';
        }
        if (userRole === 'admin' && !courseInstructor?.trim()) {
            errs.courseInstructor = dir === 'rtl' ? 'يرجى إدخال اسم المدرب' : 'Instructor is required';
        }
        if (userRole === 'admin' && !category?.trim()) {
            errs.category = dir === 'rtl' ? 'يرجى اختيار تصنيف الدورة' : 'Category is required';
        }
        if (!description?.trim()) {
            errs.description = dir === 'rtl' ? 'يرجى كتابة نبذة عن الدورة' : 'Description is required';
        }
        if (!lecturesCount || Number(lecturesCount) <= 0) {
            errs.lecturesCount = dir === 'rtl' ? 'يرجى إدخال عدد محاضرات صالح (> 0)' : 'Valid lecture count (> 0) is required';
        }
        const hasValidGoal = goals?.some(g => g && g.trim() !== '');
        if (!hasValidGoal) {
            errs.goals = dir === 'rtl' ? 'يرجى كتابة هدف تعليمي واحد على الأقل' : 'At least one learning goal is required';
        }
        const hasValidSession = sessions?.some(s => s && s.title?.trim() !== '');
        if (!hasValidSession) {
            errs.sessions = dir === 'rtl' ? 'يرجى إدخال عنوان لمحاضرة واحدة على الأقل' : 'At least one lecture with title is required';
        }

        // Check for duplicate non-empty lesson links
        const filledLinks = sessions?.map(s => s?.link?.trim()).filter(Boolean);
        if (filledLinks && filledLinks.length > 0) {
            const uniqueLinks = new Set(filledLinks);
            if (filledLinks.length > uniqueLinks.size) {
                errs.sessions = dir === 'rtl'
                    ? 'روابط الدروس مكررة! يرجى التأكد من إدخال رابط فيديو مختلف لكل درس.'
                    : 'Duplicate lesson links detected! Please ensure each lesson has a unique video link.';
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Fetch course from Firestore
    useEffect(() => {
        if (!id) return;
        const fetchCourse = async () => {
            const snap = await getDoc(doc(db, 'courses', id));
            if (snap.exists()) {
                const data = snap.data();
                setCourseTitle(data.title || '');
                setCourseInstructor(data.instructor || '');
                setCategory(data.category || '');
                setIcon(data.icon || 'code');
                setLevel(data.level || 'BEGINNER');
                setDescription(data.description || '');
                setLecturesCount(data.lecturesCount || data.lectures?.length || 1);
                setInitialLecturesCount(data.lectures?.length || 0);
                setStatus(data.status || '');
                setGoals(data.goals?.length ? data.goals : ['']);
                setSessions(data.lectures?.length ? data.lectures : [{ number: 1, title: '', link: '' }]);
            }
            setLoading(false);
        };
        fetchCourse();
    }, [id]);

    const handleSaveToFirestore = async () => {
        if (!id) return;
        const updateData = {
            level,
            icon,
            description,
            lecturesCount,
            goals,
            lectures: sessions,
        };
        if (userRole === 'admin') {
            updateData.title = courseTitle;
            updateData.instructor = courseInstructor;
            updateData.category = category;
        }

        if (userRole === 'instructor' && currentUser?.uid) {
            updateData.instructorId = currentUser.uid;
        }

        if (userRole === 'instructor' && status === t('adminCourses.draft')) {
            const hasValidLecture = sessions.some(s => s.title?.trim() !== '' && s.link?.trim() !== '');
            if (hasValidLecture) {
                updateData.status = t('addCourse.published');
            }
        }

        updateData.updatedAt = new Date().toISOString();
        await updateDoc(doc(db, 'courses', id), updateData);

        // Notify enrolled students in real-time
        try {
            const isNewLecture = sessions.length > initialLecturesCount;
            await notifyEnrolledStudents(id, {
                title: isNewLecture ? 'محاضرة جديدة' : 'تحديث في الدورة',
                title_en: isNewLecture ? 'New Lecture Added' : 'Course Updated',
                message: isNewLecture 
                    ? `تم إضافة محاضرة جديدة لدورة «${courseTitle}». يمكنك مشاهدتها الآن!` 
                    : `تم تحديث محتوى ومحاضرات دورة «${courseTitle}».`,
                message_en: isNewLecture 
                    ? `A new lecture was added to "${courseTitle}". Check it out now!` 
                    : `Course content for "${courseTitle}" was updated.`,
                type: 'lecture',
                link: '/dashboard/my-courses',
            });
            setInitialLecturesCount(sessions.length);
        } catch (notifErr) {
            console.warn('Could not dispatch course update notifications:', notifErr);
        }

        setModal(null);
    };

    // =========================
    // Goals
    // =========================

    const addGoal = () => {

        setGoals((prev) => [...prev, ""]);
    };

    const removeGoal = (index) => {

        if (goals.length === 1) return;
        setGoals((prev) => prev.filter((_, i) => i !== index));
    };

    const updateGoal = (index, value) => {

        setGoals((prev) => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    // =========================
    // Sessions
    // =========================

    const addSession = () => {

        setSessions((prev) => {
            const newSession = {
                number: prev.length + 1,
                title: "",
                link: "",
            };
            return [...prev, newSession];
        });
        setOpenSession(sessions.length);
    };

    const removeSession = (index) => {

        if (sessions.length === 1) return;

        const updatedSessions = sessions
            .filter((_, i) => i !== index)
            .map((session, i) => ({
                ...session,
                number: i + 1,
            }));

        setSessions(updatedSessions);

        if (openSession === index) {
            setOpenSession(
                updatedSessions.length > 0
                    ? Math.min(index, updatedSessions.length - 1)
                    : null
            );
        } else if (openSession > index) {
            setOpenSession(openSession - 1);
        }
    };

    const updateSession = (index, field, value) => {

        setSessions((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value,
            };
            return updated;
        });
    };

    const toggleSession = (index) => {

        setOpenSession((current) => (current === index ? null : index));
    };


    return (
        <div
            dir={dir}
            className="min-h-full rounded-2xl border border-[#E8E2D5] bg-white p-4 transition-colors duration-200 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
        >
            {/* ================= Header ================= */}
            <div className="mb-8">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Link to={coursesBackPath} className="text-gray-400 dark:text-gray-500 hover:text-primary transition-colors">{coursesBackLabel}</Link>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="text-orange-600 dark:text-orange-500">{t('editCourse.title')}</span>
                </div>

                <h2 className="flex items-center gap-2 text-2xl font-bold text-orange-600 dark:text-orange-500">
                    <i className="fa-solid fa-pen-to-square"></i>
                    {t('editCourse.title')}
                </h2>

                <p className="mt-1 text-sm text-gray-400 dark:text-gray-400">
                    {t('editCourse.subtitle')} {userRole === 'instructor' && t('editCourse.note')}
                </p>
            </div>

            {/* ================= Main Content ================= */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* ================= Course Details ================= */}
                <section>
                    <h3 className="mb-4 text-lg font-bold text-gray-700 dark:text-gray-200">
                        {t('addCourse.courseDetails')}
                    </h3>

                    <div className="rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] p-5 transition-colors duration-200 dark:border-gray-700 dark:bg-gray-800/60 sm:p-6">
                        <div className="space-y-5">
                            {/* Title */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('addCourse.courseTitle')}
                                    {userRole === 'instructor' && <span className="mr-2 text-xs text-gray-400 font-normal">{t('editCourse.cannotEdit')}</span>}
                                </label>
                                <input
                                    type="text"
                                    value={loading ? t('common.loading') : courseTitle}
                                    onChange={(e) => { setCourseTitle(e.target.value); if (errors.courseTitle) setErrors(p => ({ ...p, courseTitle: null })); }}
                                    disabled={userRole === 'instructor'}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${errors.courseTitle ? "border-rose-500 ring-2 ring-rose-500/10" : "border-[#E8E2D5] dark:border-gray-700"} ${userRole === "instructor" ? "cursor-not-allowed opacity-70 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 focus:border-orange-500 focus:ring-2"}`}
                                />
                                {errors.courseTitle && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.courseTitle}</p>}
                            </div>

                            {/* Instructor */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('adminInstructors.instructor')}
                                    {userRole === 'instructor' && <span className="mr-2 text-xs text-gray-400 font-normal">{t('editCourse.cannotEdit')}</span>}
                                </label>
                                <input
                                    type="text"
                                    value={loading ? t('common.loading') : courseInstructor}
                                    onChange={(e) => setCourseInstructor(e.target.value)}
                                    disabled={userRole === 'instructor'}
                                    className={`w-full rounded-xl border border-[#E8E2D5] bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none ${userRole === 'instructor' ? 'cursor-not-allowed opacity-70' : 'bg-white focus:border-orange-500 focus:ring-2'} dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400`}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('addCourse.category')}
                                    {userRole === 'instructor' && <span className="mr-2 text-xs text-gray-400 font-normal">{t('editCourse.cannotEdit')}</span>}
                                </label>
                                <CustomSelect
                                    value={category}
                                    onChange={setCategory}
                                    disabled={userRole === 'instructor'}
                                    options={[
                                        { value: "", label: t('addCourse.selectCategory') },
                                        ...rawCategories.courses.map((item) => ({ value: item, label: item }))
                                    ]}
                                />
                            </div>

                            {/* Level */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('addCourse.level')}
                                </label>
                                <CustomSelect
                                    value={level}
                                    onChange={setLevel}
                                    options={[
                                        { value: "BEGINNER", label: t('addCourse.beginner') },
                                        { value: "INTERMEDIATE", label: t('addCourse.intermediate') },
                                        { value: "ADVANCED", label: t('addCourse.advanced') }
                                    ]}
                                />
                            </div>

                            {/* Course Icon */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {dir === 'rtl' ? 'أيقونة الدورة' : 'Course Icon'}
                                </label>

                                <CustomSelect
                                    value={icon}
                                    onChange={setIcon}
                                    options={[
                                        { value: "code", label: dir === 'rtl' ? '💻 كود وتطوير (Code)' : '💻 Code & Development' },
                                        { value: "palette", label: dir === 'rtl' ? '🎨 تصميم وجرافيك (Palette)' : '🎨 UI/UX & Design' },
                                        { value: "terminal", label: dir === 'rtl' ? '⚡ برمجة وأنظمة (Terminal)' : '⚡ Terminal & Systems' },
                                        { value: "language", label: dir === 'rtl' ? '🌐 تطوير الويب (Web)' : '🌐 Web Development' },
                                        { value: "image", label: dir === 'rtl' ? '🖼️ إظهار ورسم (Render)' : '🖼️ Render & Photoshop' },
                                        { value: "database", label: dir === 'rtl' ? '🗄️ قواعد بيانات (Database)' : '🗄️ Database' },
                                        { value: "design_services", label: dir === 'rtl' ? '📐 تصميم واجهات (Design)' : '📐 Design Services' },
                                        { value: "school", label: dir === 'rtl' ? '🎓 تعليم عام (Education)' : '🎓 Education' },
                                        { value: "auto_stories", label: dir === 'rtl' ? '📚 معرفة وفكر (Knowledge)' : '📚 Knowledge' },
                                        { value: "view_quilt", label: dir === 'rtl' ? '🧱 تنسيق وتخطيط (Layout)' : '🧱 Layout' }
                                    ]}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('addCourse.aboutCourse')}
                                </label>

                                <textarea
                                    rows="4"
                                    value={description}
                                    onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors(p => ({ ...p, description: null })); }}
                                    className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 outline-none transition dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 ${errors.description ? "border-rose-500 ring-2 ring-rose-500/10" : "border-[#E8E2D5] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-gray-700"}`}
                                />
                                {errors.description && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.description}</p>}
                            </div>

                            {/* Lectures Count */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('addCourse.lectureCount')}
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={lecturesCount}
                                    onChange={(e) => setLecturesCount(e.target.value)}
                                    className="w-full rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-500"
                                />
                            </div>

                            {/* Goals */}
                            <div>
                                {errors.goals && <p className="mb-2 text-xs font-semibold text-rose-500">{errors.goals}</p>}
                                <div className="mb-3 flex items-center justify-between">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {t('addCourse.objectivesTitle')}
                                    </label>

                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {goals.length} {t('addCourse.objectives')}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {goals.map((goal, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={goal}
                                                onChange={(e) => updateGoal(index, e.target.value)}
                                                placeholder={`${t('addCourse.goalPlaceholder')} ${index + 1}...`}
                                                className="flex-1 rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-500"
                                            />

                                            {goals.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeGoal(index)}
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 transition hover:bg-rose-100 hover:text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60"
                                                    title={t('addCourse.deleteGoal')}
                                                    aria-label={t('addCourse.deleteGoal')}
                                                >
                                                    <i className="fa-regular fa-trash-can text-sm"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={addGoal}
                                    className="mt-3 flex items-center gap-2 text-sm font-bold text-orange-600 transition hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                >
                                    <i className="fa-solid fa-plus text-xs"></i>
                                    {t('addCourse.addGoal')}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= Course Content ================= */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">{t('addCourse.courseContent')}</h3>

                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            {sessions.length} {t('addCourse.lecturesLabel')}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {sessions.map((session, index) => {
                            const isOpen = openSession === index;

                            return (
                                <div
                                    key={index}
                                    className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                                        isOpen
                                            ? "border-orange-400 bg-white shadow-sm dark:border-orange-500/60 dark:bg-gray-800/80"
                                            : "border-[#E8E2D5] bg-[#FAF7F2] dark:border-gray-700 dark:bg-gray-800/40"
                                    }`}
                                >
                                    {/* Header */}
                                    <div
                                        className="flex cursor-pointer items-center justify-between gap-2 sm:gap-3 p-3 sm:p-5"
                                        onClick={() => toggleSession(index)}
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                                            <div
                                                className={`flex h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-base shrink-0 items-center justify-center rounded-xl font-bold transition ${
                                                    isOpen
                                                        ? "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400"
                                                        : "bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                                                }`}
                                            >
                                                {session.number}
                                            </div>

                                            <div className="min-w-0">
                                                <h4 className="truncate font-bold text-xs sm:text-base text-gray-800 dark:text-gray-200">
                                                    {session.title.trim()
                                                        ? session.title
                                                        : `${t('addCourse.lecture')} ${session.number}`}
                                                </h4>

                                                <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500">
                                                    {isOpen ? t('addCourse.lectureDetails') : t('addCourse.clickToOpen')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1">
                                            {sessions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeSession(index);
                                                    }}
                                                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-rose-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                                                    title={t('addCourse.deleteLecture')}
                                                    aria-label={t('addCourse.deleteLecture')}
                                                >
                                                    <i className="fa-regular fa-trash-can text-xs sm:text-sm"></i>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSession(index);
                                                }}
                                                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition ${
                                                    isOpen
                                                        ? "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                                                        : "text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
                                                }`}
                                                title={isOpen ? t('common.close') : t('common.open')}
                                                aria-label={isOpen ? t('common.close') : t('common.open')}
                                            >
                                                <i
                                                    className={`fa-solid fa-chevron-down text-xs sm:text-sm transition-transform duration-300 ${
                                                        isOpen ? "rotate-180" : ""
                                                    }`}
                                                ></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    {isOpen && (
                                        <div className="border-t border-gray-100 px-4 pb-5 pt-4 dark:border-gray-700/60 sm:px-5">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        {t('addCourse.lectureNumber')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={session.number}
                                                        readOnly
                                                        className="w-full rounded-xl border border-[#E8E2D5] bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        {t('addCourse.lectureTitle')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={session.title}
                                                        onChange={(e) =>
                                                            updateSession(index, "title", e.target.value)
                                                        }
                                                        placeholder={t('addCourse.lectureTitlePlaceholder')}
                                                        className="w-full rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        {t('addCourse.lectureLink')}
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={session.link}
                                                        onChange={(e) =>
                                                            updateSession(index, "link", e.target.value)
                                                        }
                                                        placeholder={t('addCourse.lectureLinkPlaceholder')}
                                                        className="w-full rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={addSession}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-orange-300 bg-orange-50/40 py-4 text-sm font-bold text-orange-600 transition hover:border-orange-500 hover:bg-orange-50 dark:border-orange-500/40 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:border-orange-500 dark:hover:bg-orange-950/40"
                        >
                            <i className="fa-solid fa-plus"></i>
                            {t('addCourse.addLecture')}
                        </button>
                    </div>
                </section>
            </div>

            {Object.keys(errors).length > 0 && (
                <div className="mx-auto mb-4 flex max-w-xl items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>{t('addCourse.requiredFields') || 'يرجى تعبئة كافة الحقول المطلوبة قبل حفظ التعديلات.'}</span>
                </div>
            )}
            {/* ================= Bottom Buttons ================= */}
            <div className="mb-6 mt-8 flex flex-col-reverse items-center justify-center gap-3 border-t border-[#E8E2D5] pt-7 pb-6 dark:border-gray-800 sm:flex-row">
                <Link
                    to={coursesBackPath}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] px-8 py-3 text-sm font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 sm:w-auto"
                >
                    <i className="fa-solid fa-arrow-right"></i>
                    {t('common.back')}
                </Link>

                <button
                    type="button"
                    onClick={() => { if (validateEditCourseForm()) { setErrors({}); setModal("save"); } }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 sm:w-auto"
                >
                    <i className="fa-solid fa-bookmark"></i>
                    {t('editCourse.saveChanges')}
                </button>
            </div>

            {/* ================= Modal ================= */}
            <AnimatePresence>
                {modal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
                        onClick={() => setModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-md rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl transition-colors duration-200 dark:border dark:border-gray-700 dark:bg-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                                title={t('common.close') || 'Close'}
                                aria-label={t('common.close') || 'Close'}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>

                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                                <i className="text-xl fa-solid fa-check"></i>
                            </div>

                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                    {t('editCourse.saveChanges')}
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                    {t('editCourse.confirmSave')}
                                </p>
                            </div>

                            <div className="mt-7 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 transition hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    {t('common.back')}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveToFirestore}
                                    className="flex-1 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500"
                                >
                                    {t('adminAddBook.confirmSaveBtn')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}








