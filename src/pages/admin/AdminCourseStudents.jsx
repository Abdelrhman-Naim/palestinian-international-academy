import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, increment, db } from '../../supabase/db';
import AdminPageShell from './AdminPageShell';
import { useCourses } from '../../context/CoursesContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import CustomSelect from '../../components/CustomSelect';
import Pagination from '../../components/Pagination';
import { getOrCreateDirectChat } from '../../services/chatService';

export default function AdminCourseStudents() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { currentUser, userData } = useAuth();
  const { rawCourses } = useCourses();

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search, Filter, Sort, and Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState('all'); // all | certified | in_progress
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Fetch Course Data
  useEffect(() => {
    if (!courseId) return;

    // Check context first
    const fromContext = rawCourses.find(c => c.id === courseId);
    if (fromContext) {
      setCourse(fromContext);
    }

    // Subscribe to course document for real-time changes
    const unsubCourse = onSnapshot(doc(db, 'courses', courseId), (snap) => {
      if (snap.exists()) {
        setCourse({ id: snap.id, ...snap.data() });
      }
    }, (err) => {
      console.warn('Error fetching course doc:', err);
    });

    return () => unsubCourse();
  }, [courseId, rawCourses]);

  // 2. Fetch Enrollments for this course
  useEffect(() => {
    if (!courseId) return;

    const q = query(collection(db, 'enrollments'), where('courseId', '==', courseId));
    const unsubEnrollments = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setEnrollments(docs);
      setLoading(false);
    }, (err) => {
      console.warn('Error fetching enrollments:', err);
      setLoading(false);
    });

    return () => unsubEnrollments();
  }, [courseId]);

  // 3. Fetch Student User Details
  useEffect(() => {
    const qUsers = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const map = {};
      snapshot.docs.forEach(docSnap => {
        map[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
      });
      setStudentsMap(map);
    }, (err) => {
      console.warn('Error fetching students users:', err);
    });

    return () => unsubUsers();
  }, []);

  // Merge enrollments with student profile info
  const combinedStudents = useMemo(() => {
    return enrollments.map(enr => {
      const studentUser = studentsMap[enr.uid] || {};
      
      // Enrollment date
      let enrolledDate = null;
      if (enr.enrolledAt) {
        if (enr.enrolledAt.toDate) {
          enrolledDate = enr.enrolledAt.toDate();
        } else if (enr.enrolledAt.seconds) {
          enrolledDate = new Date(enr.enrolledAt.seconds * 1000);
        } else {
          const d = new Date(enr.enrolledAt);
          if (!isNaN(d.getTime())) enrolledDate = d;
        }
      }

      return {
        enrollmentId: enr.id,
        uid: enr.uid,
        name: studentUser.name || studentUser.displayName || studentUser.fullName || enr.studentName || (isRtl ? 'طالب' : 'Student'),
        email: studentUser.email || enr.studentEmail || '—',
        avatar: studentUser.avatar || studentUser.photoURL || null,
        status: studentUser.status || 'active',
        progress: typeof enr.progress === 'number' ? enr.progress : 0,
        passedExam: Boolean(enr.passedExam),
        examScore: enr.examScore,
        certificateId: enr.certificateId || null,
        enrolledDate,
        enrolledDateStr: enrolledDate ? enrolledDate.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : (isRtl ? 'غير محدد' : 'N/A')
      };
    });
  }, [enrollments, studentsMap, isRtl]);

  // Filtering & Sorting
  const filteredStudents = useMemo(() => {
    return combinedStudents
      .filter(st => {
        const queryStr = debouncedSearch.trim().toLowerCase();
        const cleanQuery = queryStr.startsWith('#') ? queryStr.slice(1) : queryStr;
        const matchSearch =
          !queryStr ||
          (st.name && st.name.toLowerCase().includes(queryStr)) ||
          (st.email && st.email.toLowerCase().includes(queryStr)) ||
          (st.uid && String(st.uid).toLowerCase().includes(cleanQuery));

        let matchStatus = true;
        if (statusFilter === 'certified') {
          matchStatus = st.passedExam || !!st.certificateId;
        } else if (statusFilter === 'in_progress') {
          matchStatus = !st.passedExam && !st.certificateId;
        }

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          const timeA = a.enrolledDate ? a.enrolledDate.getTime() : 0;
          const timeB = b.enrolledDate ? b.enrolledDate.getTime() : 0;
          return timeB - timeA;
        }
        if (sortBy === 'oldest') {
          const timeA = a.enrolledDate ? a.enrolledDate.getTime() : 0;
          const timeB = b.enrolledDate ? b.enrolledDate.getTime() : 0;
          return timeA - timeB;
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'progress_desc') {
          return (b.progress || 0) - (a.progress || 0);
        }
        return 0;
      });
  }, [combinedStudents, debouncedSearch, statusFilter, sortBy]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Metrics
  const certifiedCount = useMemo(() => {
    return combinedStudents.filter(s => s.passedExam || !!s.certificateId).length;
  }, [combinedStudents]);

  const averageProgress = useMemo(() => {
    if (combinedStudents.length === 0) return 0;
    const sum = combinedStudents.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    return Math.round(sum / combinedStudents.length);
  }, [combinedStudents]);

  // Start direct chat with student
  const handleStartChat = async (student) => {
    if (!currentUser?.uid) return;
    setStartingChatId(student.uid);
    try {
      const adminUser = {
        uid: currentUser.uid,
        name: userData?.name || userData?.fullName || (isRtl ? 'إدارة المنصة' : 'Platform Admin'),
        role: 'admin'
      };
      const studentUser = {
        uid: student.uid,
        name: student.name,
        role: 'student'
      };
      const chatId = await getOrCreateDirectChat(adminUser, studentUser);
      navigate(`/admin-dashboard/messages?chatId=${chatId}`);
    } catch (err) {
      console.error('Error starting chat with student:', err);
    } finally {
      setStartingChatId(null);
    }
  };

  // Remove enrollment
  const handleConfirmRemove = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      // 1. Delete enrollment doc
      await deleteDoc(doc(db, 'enrollments', deleteModal.enrollmentId));

      // 2. Decrement students count on course
      if (courseId) {
        await updateDoc(doc(db, 'courses', courseId), {
          students: increment(-1)
        }).catch(err => console.warn('Could not decrement course students count:', err));
      }

      setDeleteModal(null);
    } catch (err) {
      console.error('Error removing student from course:', err);
      alert(isRtl ? 'حدث خطأ أثناء إلغاء التسجيل.' : 'Error removing student enrollment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: isRtl ? 'جميع الحالات' : 'All Statuses' },
    { value: 'certified', label: isRtl ? 'الحاصلون على الشهادة' : 'Certified / Passed' },
    { value: 'in_progress', label: isRtl ? 'قيد الدراسة' : 'In Progress' },
  ];

  const sortOptions = [
    { value: 'newest', label: isRtl ? 'الأحدث تسجيلاً' : 'Newest Enrolled' },
    { value: 'oldest', label: isRtl ? 'الأقدم تسجيلاً' : 'Oldest Enrolled' },
    { value: 'name_asc', label: isRtl ? 'الاسم (أ - ي)' : 'Name (A - Z)' },
    { value: 'progress_desc', label: isRtl ? 'الأعلى إنجازاً' : 'Highest Progress' },
  ];

  const isFilterActive = searchQuery.trim() !== '' || statusFilter !== 'all' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const pageTitle = course?.title
    ? `${isRtl ? 'طلاب دورة' : 'Students of'} «${course.title}»`
    : (isRtl ? 'الطلاب المسجلون في الدورة' : 'Enrolled Course Students');

  return (
    <AdminPageShell
      parent={
        <Link
          to="/admin-dashboard/courses"
          className="text-gray-400 dark:text-gray-500 hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">school</span>
          <span>{t('adminCourses.title')}</span>
        </Link>
      }
      title={pageTitle}
      subtitle={isRtl ? 'عرض ومتابعة سجل الطلاب المسجلين ودرجاتهم ونسبة إنجازهم' : 'View and monitor student registrations and learning progress'}
      icon="groups"
      actions={
        <div className="flex items-center gap-2">
          {courseId && (
            <Link
              to={`/admin-dashboard/edit-course/${courseId}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D5] bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-[#FAF7F2] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>{isRtl ? 'تعديل الدورة' : 'Edit Course'}</span>
            </Link>
          )}
          <Link
            to="/admin-dashboard/courses"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF7F2] dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-[#F3EFE6] dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">{isRtl ? 'arrow_forward' : 'arrow_back'}</span>
            <span>{isRtl ? 'كل الدورات' : 'All Courses'}</span>
          </Link>
        </div>
      }
    >
      {/* Course Summary Banner */}
      {course && (
        <div className="mb-6 rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 transition-colors">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-primary dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-dark dark:text-white">
                    {course.title}
                  </h3>
                  <span className="rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-600 dark:border-gray-600 dark:bg-gray-700 dark:text-stone-300">
                    #{course.id.slice(0, 8)}
                  </span>
                  {course.category && (
                    <span className="rounded-md border border-[#E8E2D5] bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {course.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">person</span>
                    <span>{course.instructor || (isRtl ? 'غير محدد' : 'Unassigned')}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold text-primary dark:text-amber-400">
                    <span className="material-symbols-outlined text-[15px]">group</span>
                    <span>{enrollments.length} {isRtl ? 'طالب مسجل' : 'Students Enrolled'}</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-[#E8E2D5] pt-3 sm:border-t-0 sm:pt-0 dark:border-gray-700">
              <div className="rounded-xl bg-[#FAF7F2] dark:bg-gray-900/60 p-2.5 text-center border border-[#E8E2D5] dark:border-gray-700/60">
                <p className="text-base font-bold text-primary dark:text-amber-400">{enrollments.length}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{isRtl ? 'إجمالي المسجلين' : 'Enrolled'}</p>
              </div>
              <div className="rounded-xl bg-[#FAF7F2] dark:bg-gray-900/60 p-2.5 text-center border border-[#E8E2D5] dark:border-gray-700/60">
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{certifiedCount}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{isRtl ? 'اجتازوا الدورة' : 'Certified'}</p>
              </div>
              <div className="rounded-xl bg-[#FAF7F2] dark:bg-gray-900/60 p-2.5 text-center border border-[#E8E2D5] dark:border-gray-700/60">
                <p className="text-base font-bold text-sky-600 dark:text-sky-400">{averageProgress}%</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{isRtl ? 'متوسط التقدم' : 'Avg Progress'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="mb-6 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              search
            </span>
            <input
              type="text"
              placeholder={isRtl ? 'ابحث باسم الطالب، البريد، أو المعرّف...' : 'Search student by name, email, or ID...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-2.5 pr-10 pl-9 text-sm text-gray-700 outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:bg-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Clear Search"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          </div>

          {/* Sort By */}
          <div>
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
            />
          </div>
        </div>

        {/* Reset Filter Button */}
        {isFilterActive && (
          <div className="mt-3 flex items-center justify-between border-t border-[#E8E2D5] pt-3 text-xs dark:border-gray-700">
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              {isRtl
                ? `نتائج البحث: (${filteredStudents.length}) طالب`
                : `Filtered Results: (${filteredStudents.length}) students`}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        )}
      </div>

      {/* Enrolled Students Table / Cards */}
      <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-gray-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>{isRtl ? 'جاري تحميل قائمة الطلاب...' : 'Loading students...'}</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary dark:bg-orange-950/40">
              <span className="material-symbols-outlined text-2xl">person_off</span>
            </div>
            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
              {enrollments.length === 0
                ? (isRtl ? 'لا يوجد طلاب مسجلون في هذه الدورة حالياً' : 'No students enrolled in this course yet')
                : (isRtl ? 'لم يتم العثور على أي نتائج مطابقة للبحث' : 'No matching students found')}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-md">
              {enrollments.length === 0
                ? (isRtl ? 'فور انضمام أي طالب للدورة ستظهر بيانات تقدمه وشهاداته وإمكانية التواصل معه هنا.' : 'When a student enrolls, their profile, progress, and certificates will appear here.')
                : (isRtl ? 'جرب تعديل كلمات البحث أو تصفية الخيارات.' : 'Try adjusting your search terms or filters.')}
            </p>
            {isFilterActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] px-4 py-2 text-xs font-bold text-gray-700 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            ) : (
              <Link
                to="/admin-dashboard/courses"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">{isRtl ? 'arrow_forward' : 'arrow_back'}</span>
                <span>{isRtl ? 'العودة لقائمة الدورات' : 'Back to Courses'}</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 border-b border-[#E8E2D5] bg-[#FAF7F2] px-6 py-3.5 text-xs font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <div className="col-span-5">{isRtl ? 'الطالب' : 'Student'}</div>
              <div className="col-span-2">{isRtl ? 'تاريخ التسجيل' : 'Enrolled Date'}</div>
              <div className="col-span-3">{isRtl ? 'التقدم والاختبار' : 'Progress & Exam'}</div>
              <div className="col-span-2 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</div>
            </div>

            {/* Students List */}
            <div className="divide-y divide-[#E8E2D5] dark:divide-gray-700">
              {paginatedStudents.map((st) => {
                return (
                  <div
                    key={st.enrollmentId}
                    className="flex flex-col gap-4 p-5 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-700/40 md:grid md:grid-cols-12 md:items-center md:gap-4 md:px-6 md:py-4"
                  >
                    {/* Student Info */}
                    <div className="md:col-span-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-bold text-sm border border-amber-200 dark:border-amber-800/40">
                        {st.avatar ? (
                          <img src={st.avatar} alt={st.name || ''} className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          (st.name?.charAt(0) || 'S').toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-dark dark:text-white truncate" title={st.name || ''}>
                            {st.name || t('adminCourseStudents.student')}
                          </h4>
                          <span className="rounded bg-stone-100 dark:bg-gray-700 px-1.5 py-0.2 text-[10px] font-mono text-gray-500 dark:text-gray-300 border border-stone-200 dark:border-gray-600">
                            #{st.uid ? st.uid.slice(0, 6) : st.id ? String(st.id).slice(0, 6) : '—'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={st.email}>
                          {st.email}
                        </p>
                      </div>
                    </div>

                    {/* Enrolled Date */}
                    <div className="md:col-span-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                      <span className="material-symbols-outlined text-[15px] text-gray-400 md:hidden">event</span>
                      <span>{st.enrolledDateStr}</span>
                    </div>

                    {/* Progress & Exam Badge */}
                    <div className="md:col-span-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">
                          {isRtl ? 'نسبة الإنجاز:' : 'Progress:'}
                        </span>
                        <span className="font-bold text-primary dark:text-amber-400">{st.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-gray-700">
                        <div
                          className={`h-full rounded-full transition-all ${
                            st.passedExam ? 'bg-emerald-500' : 'bg-primary dark:bg-amber-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, st.progress))}%` }}
                        ></div>
                      </div>

                      {/* Certification status */}
                      {st.passedExam ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="material-symbols-outlined text-sm">workspace_premium</span>
                          <span>
                            {isRtl ? 'اجتاز الاختبار' : 'Passed Exam'}
                            {st.examScore ? ` (${st.examScore}%)` : ''}
                          </span>
                          {st.certificateId && (
                            <Link
                              to={`/verify-certificate/${st.certificateId}`}
                              target="_blank"
                              className="underline hover:text-emerald-700 dark:hover:text-emerald-300 ml-1"
                              title={isRtl ? 'عرض الشهادة المعتمدة' : 'View Certificate'}
                            >
                              [{isRtl ? 'الشهادة' : 'Cert'}]
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                          <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                          <span>{isRtl ? 'قيد دراسة المحاضرات' : 'In Progress'}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex items-center justify-end md:justify-center gap-2">
                      {/* Chat Button */}
                      <button
                        type="button"
                        onClick={() => handleStartChat(st)}
                        disabled={startingChatId === st.uid}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-900/50 transition-colors"
                        title={isRtl ? 'مراسلة الطالب' : 'Chat with student'}
                        aria-label="Chat"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {startingChatId === st.uid ? 'sync' : 'chat'}
                        </span>
                      </button>

                      {/* Remove Enrollment */}
                      <button
                        type="button"
                        onClick={() => setDeleteModal(st)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors"
                        title={isRtl ? 'إلغاء تسجيل الطالب من الدورة' : 'Remove from course'}
                        aria-label="Remove enrollment"
                      >
                        <span className="material-symbols-outlined text-[17px]">person_remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredStudents.length}
              itemsPerPage={itemsPerPage}
              itemName={isRtl ? 'طالب' : 'students'}
            />
          </>
        )}
      </div>

      {/* Delete / Remove Modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm dark:bg-black/70"
          onClick={() => !isDeleting && setDeleteModal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <span className="material-symbols-outlined text-2xl">person_remove</span>
            </div>
            <h3 className="text-center text-lg font-bold text-dark dark:text-white">
              {isRtl ? 'إلغاء تسجيل الطالب من الدورة' : 'Remove Student Enrollment'}
            </h3>
            <p className="mt-2 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {isRtl
                ? `هل أنت متأكد من إلغاء تسجيل الطالب «${deleteModal.name}» من دورة «${course?.title || ''}»؟ لن يتمكن من متابعة محتوى الدورة إلا بإعادة التسجيل.`
                : `Are you sure you want to remove "${deleteModal.name}" from "${course?.title || ''}"?`}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-2.5 text-xs font-bold text-gray-600 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmRemove}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-50 inline-flex items-center justify-center gap-1"
              >
                {isDeleting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isRtl ? 'تأكيد الإلغاء' : 'Confirm Removal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
