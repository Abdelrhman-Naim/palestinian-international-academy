import { useState, useEffect } from "react";
import { useCategories } from "../context/CategoriesContext";
import { useCourses } from "../context/CoursesContext";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, db } from '../supabase/db';
import CustomSelect from "../components/CustomSelect";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { notifyInstructor, notifyAdmins } from '../services/notificationService';

export default function AddCourse() {
    const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const { addCourse } = useCourses();
  const { rawCategories } = useCategories();
  const { userRole, currentUser, userData } = useAuth();

  // State declarations
  const [instructorsList, setInstructorsList] = useState([]);
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [description, setDescription] = useState("");
  const [lecturesCount, setLecturesCount] = useState("");
  const [level, setLevel] = useState("مبتدئ");
  const [category, setCategory] = useState("");
  const [icon, setIcon] = useState("code");
  const [goals, setGoals] = useState([""]);
  const [sessions, setSessions] = useState([
    {
      number: 1,
      title: "",
      link: "",
    },
  ]);
  const [openSession, setOpenSession] = useState(0);
  const [modal, setModal] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInstructors = async () => {
      const q = query(collection(db, "users"), where("role", "==", "instructor"));
      const snap = await getDocs(q);
      setInstructorsList(snap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().fullName || doc.id,
        fullName: doc.data().fullName || doc.data().name || doc.id,
      })));
    };
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (userRole === 'instructor' && !instructor) {
      const myName = userData?.name || userData?.fullName || currentUser?.displayName;
      if (myName) setInstructor(myName);
    }
  }, [userRole, userData, currentUser, instructor]);

  const validateCourseForm = (isDraft = false) => {
        const errs = {};
        if (!title?.trim()) {
            errs.title = dir === 'rtl' ? 'يرجى إدخال عنوان الدورة' : 'Course title is required';
        }
        if (!instructor?.trim()) {
            errs.instructor = dir === 'rtl' ? 'يرجى اختيار المدرب' : 'Instructor is required';
        }
        if (!category?.trim()) {
            errs.category = dir === 'rtl' ? 'يرجى اختيار تصنيف الدورة' : 'Category is required';
        }
        if (!isDraft) {
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
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
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

        // افتح {t('addCourse.lecture')} الجديدة مباشرة
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

    // =========================
    // Save Course
    // =========================

    const handleSaveCourse = async (status = t('addCourse.published')) => {
        if (isSubmitting) return; // Prevent double submit
        if (!title || !instructor || !category) {
            alert(t('addCourse.requiredFields'));
            setModal(null);
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedInst = instructorsList.find(i => (typeof i === 'object' ? (i.name === instructor || i.fullName === instructor) : i === instructor));
            const instructorId = userRole === 'instructor'
                ? (currentUser?.uid || userData?.uid || '')
                : (selectedInst?.id || selectedInst?.uid || '');

            const result = await addCourse({
                title,
                instructor,
                instructorId,
                category,
                icon: icon || 'code',
                description,
                goals,
                sessions,
                lecturesCount,
                imageName: 'screen.png',
                level: (level === 'مبتدئ' || level === 'Beginner' || level === t('addCourse.beginner'))
                    ? 'BEGINNER' 
                    : (level === 'متوسط' || level === 'Intermediate' || level === t('addCourse.intermediate'))
                    ? 'INTERMEDIATE' 
                    : 'ADVANCED',
                price: 'Free',
                rating: 0,
                status: status,
                students: 0,
                avatar: instructor.substring(0, 2).toUpperCase()
            });

            // Notify instructor and platform admins in real-time
            try {
                const newCourseId = result?.id || null;
                await notifyInstructor({ instructor }, {
                    title: 'دورة جديدة في حسابك',
                    title_en: 'New Course Assigned',
                    message: `تم إدراج دورة جديدة لدوراتك: «${title}». يمكنك الآن إضافة وتعديل المحاضرات والواجبات.`,
                    message_en: `A new course "${title}" has been added to your instructor profile.`,
                    type: 'course',
                    link: newCourseId ? `/instructor-dashboard/edit-course/${newCourseId}` : '/instructor-dashboard/my-courses',
                    courseId: newCourseId,
                    metadata: { courseTitle: title, courseId: newCourseId }
                });

                await notifyAdmins({
                    title: 'دورة جديدة على المنصة',
                    title_en: 'New Platform Course',
                    message: `تم إضافة دورة جديدة «${title}» للمدرب «${instructor}».`,
                    message_en: `New course "${title}" was created for instructor "${instructor}".`,
                    type: 'course',
                    link: newCourseId ? `/admin-dashboard/edit-course/${newCourseId}` : `/admin-dashboard/courses?search=${encodeURIComponent(title)}`,
                    courseId: newCourseId,
                    metadata: { courseTitle: title, courseId: newCourseId }
                });
            } catch (notifErr) {
                console.warn('Could not dispatch course creation notifications:', notifErr);
            }
            
            setModal(null);
            navigate(userRole === 'admin' ? '/admin-dashboard/courses' : '/instructor-dashboard/my-courses');
        } catch (err) {
            console.error('Error saving course:', err);
            alert(dir === 'rtl' ? 'حدث خطأ أثناء حفظ الدورة. يرجى المحاولة ثانية.' : 'Failed to save course. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmCancel = () => {
        setTitle("");
        setInstructor(userRole === 'instructor' ? (userData?.name || userData?.fullName || currentUser?.displayName || "") : "");
        setDescription("");
        setLecturesCount("");
        setLevel("مبتدئ");
        setCategory("");
        setGoals([""]);
        setSessions([
            {
                number: 1,
                title: "",
                link: "",
            },
        ]);
        setOpenSession(0);
        setErrors({});
        setModal(null);
        const targetBackPath = userRole === 'admin' ? '/admin-dashboard/courses' : '/instructor-dashboard/my-courses';
        navigate(targetBackPath);
    };

    return (
        <div
            dir={dir}
            className="min-h-full rounded-2xl border border-[#E8E2D5] bg-white p-4 transition-colors duration-200 dark:border-gray-700 dark:bg-gray-900 sm:p-6"
        >
            {/* ================= Header ================= */}
            <div className="mb-8">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <span className="text-gray-400 dark:text-gray-500">{t('adminCategories.parent')}</span>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="text-orange-600 dark:text-orange-500">{t('adminCourses.addCourse')}</span>
                </div>

                <h2 className="flex items-center gap-2 text-2xl font-bold text-orange-600 dark:text-orange-500">
                    <i className="fa-solid fa-file-circle-plus"></i>
                    {t('adminCourses.addCourse')}
                </h2>

                <p className="mt-1 text-sm text-gray-400 dark:text-gray-400">
                    {t('addCourse.subtitle')}
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
                                </label>

                                <input
                                    type="text"
                                    placeholder={t('addCourse.courseTitlePlaceholder')}
                                    value={title}
                                    onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors(p => ({ ...p, title: null })); }}
                                    className="w-full rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-500 ${errors.title ? 'border-rose-500 ring-2 ring-rose-500/10' : ''}"
                                />
                                {errors.title && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.title}</p>}
                            </div>

                            {/* Instructor */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('adminInstructors.instructor')}
                                </label>

                                <CustomSelect
                                    value={instructor}
                                    onChange={setInstructor}
                                    placeholder={t('addCourse.selectInstructor')}
                                    options={[
                                        { value: "", label: "اختر المدرب" },
                                        ...instructorsList.map((inst) => {
                                            const val = typeof inst === 'object' ? inst.name : inst;
                                            return { value: val, label: val };
                                        })
                                    ]}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('adminAddBook.category')}
                                </label>

                                <CustomSelect
                                    value={category}
                                    onChange={setCategory}
                                    placeholder={t('addCourse.selectCategory')}
                                    options={[
                                        { value: "", label: "اختر تصنيف الدورة" },
                                        ...rawCategories.courses.map((item) => ({ value: item, label: item }))
                                    ]}
                                />

                                {rawCategories.courses.length === 0 && (
                                    <p className="mt-2 text-xs font-bold text-rose-500">
                                        {t('addCourse.noCategories')}
                                    </p>
                                )}
                            </div>

                            {/* Level */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {t('addCourse.level')}
                                </label>

                                <CustomSelect
                                    value={level}
                                    onChange={setLevel}
                                    placeholder={t('addCourse.selectLevel')}
                                    options={[
                                        { value: "مبتدئ", label: "مبتدئ" },
                                        { value: "متوسط", label: "متوسط" },
                                        { value: "متقدم", label: "متقدم" }
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
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('addCourse.aboutCoursePlaceholder')}
                                    className="w-full resize-none rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-500"
                                />
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
                    <span>{t('addCourse.requiredFields') || 'يرجى تعبئة كافة الحقول المطلوبة قبل المتابعة.'}</span>
                </div>
            )}
            {/* ================= Bottom Buttons ================= */}
            <div className="mb-6 mt-8 flex flex-col-reverse items-center justify-center gap-3 border-t border-[#E8E2D5] pt-7 pb-6 dark:border-gray-800 sm:flex-row">
                <button
                    type="button"
                    onClick={() => setModal("cancel")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-8 py-3 text-sm font-bold text-rose-500 transition hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/30 sm:w-auto"
                >
                    <i className="fa-regular fa-circle-xmark"></i>
                    {t('common.cancel')}
                </button>

                <button
                    type="button"
                    onClick={() => { if (validateCourseForm(true)) { setErrors({}); setModal("draft"); } }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200  px-8 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-50 dark:border-amber-500 /40 dark:text-amber-300  dark:hover:bg-amber-300/20 sm:w-auto"
                >
                    <i className="fa-regular fa-circle-xmark"></i>
                    {t('addCourse.saveDraft')}
                </button>

                <button
                    type="button"
                    onClick={() => { if (validateCourseForm(false)) { setErrors({}); setModal("save"); } }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 sm:w-auto"
                >
                    <i className="fa-solid fa-bookmark"></i>
                    {t('addCourse.saveCourse')}
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

                            <div
                                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                                    modal === "save"
                                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border border-primary/20"
                                        : modal === "draft"
                                        ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                                        : "bg-rose-100 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400"
                                }`}
                            >
                                <i
                                    className={`text-xl ${
                                        modal === "save" || modal === "draft"
                                            ? "fa-solid fa-check"
                                            : "fa-solid fa-triangle-exclamation"
                                    }`}
                                ></i>
                            </div>

                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                    {modal === "save" ? t('addCourse.saveCourse') : modal === "draft" ? t('addCourse.saveDraft') : t('addCourse.cancelTitle')}
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                    {modal === "save"
                                        ? t('addCourse.confirmSavePublish')
                                        : modal === "draft"
                                        ? t('addCourse.confirmSaveDraft')
                                        : t('addCourse.confirmCancel')}
                                </p>
                            </div>

                            <div className="mt-7 flex gap-3">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setModal(null)}
                                    className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('common.back')}
                                </button>

                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={async () => {
                                        if (modal === "save") {
                                            await handleSaveCourse(t('addCourse.published'));
                                        } else if (modal === "draft") {
                                            await handleSaveCourse(t('adminCourses.draft'));
                                        } else {
                                            handleConfirmCancel();
                                        }
                                    }}
                                    className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                        modal === "save"
                                            ? "bg-primary hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 shadow-md shadow-primary/20"
                                            : modal === "draft"
                                            ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
                                            : "bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500"
                                    }`}
                                >
                                    {isSubmitting && (
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span>
                                        {isSubmitting
                                            ? (dir === 'rtl' ? 'جاري الحفظ...' : 'Saving...')
                                            : (modal === "save" || modal === "draft" ? t('addCourse.confirmSaveBtn') : t('addCourse.confirmCancelBtn'))}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}








