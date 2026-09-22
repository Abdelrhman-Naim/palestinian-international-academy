import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminPageShell from './AdminPageShell';
import { supabase } from '../../supabase/client';
import { collection, query, where, onSnapshot, getDocs, doc, deleteDoc, db } from '../../firebase/config';
import { useLanguage } from '../../context/LanguageContext';
import { useDebounce } from '../../hooks/useDebounce';
import CustomSelect from '../../components/CustomSelect';
import Pagination from '../../components/Pagination';
import { formatCustomDate } from '../../utils/formatDate';

export default function AdminUsers() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const [searchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sync URL search parameters if changed externally
  useEffect(() => {
    const s = searchParams.get('search') || searchParams.get('q');
    if (s !== null) {
      setSearchQuery(s);
    }
  }, [searchParams]);

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(usersData);
    } catch (err) {
      console.warn('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch courses
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch enrollments & course requests
    const unsubEnrollments = onSnapshot(collection(db, 'enrollments'), (snapshot) => {
      setEnrollments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    fetchStudents();

    // Realtime channel for profiles
    const channel = supabase
      .channel('admin-students-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    const interval = setInterval(fetchStudents, 4000);

    return () => {
      unsubCourses();
      unsubEnrollments();
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Reset page to 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCourse, sortBy]);

  const handleDelete = async (id) => {
    if (window.confirm(t('adminUsers.deleteConfirm'))) {
      try {
        await deleteDoc(doc(db, 'users', id));
        fetchStudents();
      } catch (err) {
        alert(t('adminUsers.deleteError'));
        console.error(err);
      }
    }
  };

  // Build Course filter dropdown options
  const courseOptions = useMemo(() => {
    return [
      { value: 'all', label: isRtl ? 'جميع الدورات' : 'All Courses' },
      ...courses.map(c => ({ value: c.id, label: c.title }))
    ];
  }, [courses, isRtl]);

  const sortOptions = [
    { value: 'name_asc', label: isRtl ? 'الاسم (أ - ي)' : 'Name (A - Z)' },
    { value: 'courses_desc', label: isRtl ? 'الأكثر تسجيلاً بالدورات' : 'Most Enrolled Courses' },
    { value: 'newest', label: isRtl ? 'تاريخ الانضمام: الأحدث' : 'Joined: Newest' },
    { value: 'oldest', label: isRtl ? 'تاريخ الانضمام: الأقدم' : 'Joined: Oldest' },
  ];

  // Enrich, filter and sort students
  const filteredStudents = useMemo(() => {
    return students
      .map(student => {
        const studentEnrollments = enrollments.filter(e => 
          e.uid === student.id || 
          e.student_id === student.id || 
          e.studentId === student.id || 
          e.studentEmail === student.email
        );
        const coursesCount = studentEnrollments.length;
        const enrolledCourseIds = studentEnrollments.map(e => e.courseId || e.course_id);
        const enrolledCourseTitles = studentEnrollments.map(e => e.courseTitle || e.course_title);

        return {
          ...student,
          coursesCount,
          enrolledCourseIds,
          enrolledCourseTitles
        };
      })
      .filter(student => {
        // Search text matching
        const query = debouncedSearch.trim().toLowerCase();
        const matchSearch =
          !query ||
          student.name?.toLowerCase().includes(query) ||
          student.fullName?.toLowerCase().includes(query) ||
          student.email?.toLowerCase().includes(query) ||
          student.id?.toLowerCase().includes(query);

        // Course matching
        let matchCourse = true;
        if (selectedCourse !== 'all') {
          const selectedCourseObj = courses.find(c => c.id === selectedCourse);
          const targetTitle = selectedCourseObj?.title;
          matchCourse = 
            student.enrolledCourseIds.includes(selectedCourse) ||
            (targetTitle && student.enrolledCourseTitles.includes(targetTitle));
        }

        return matchSearch && matchCourse;
      })
      .sort((a, b) => {
        if (sortBy === 'courses_desc') {
          return b.coursesCount - a.coursesCount;
        }
        if (sortBy === 'newest') {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const dateB = b.created_at ? new Date(b.created_at).getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return dateB - dateA;
        }
        if (sortBy === 'oldest') {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const dateB = b.created_at ? new Date(b.created_at).getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return dateA - dateB;
        }
        // default name_asc
        const nameA = a.name || a.fullName || '';
        const nameB = b.name || b.fullName || '';
        return nameA.localeCompare(nameB);
      });
  }, [students, enrollments, courses, debouncedSearch, selectedCourse, sortBy]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const isFilterActive =
    searchQuery.trim() !== '' || selectedCourse !== 'all' || sortBy !== 'name_asc';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCourse('all');
    setSortBy('name_asc');
    setCurrentPage(1);
  };

  return (
    <AdminPageShell
      parent={t('adminUsers.parent')}
      title={t('adminUsers.title')}
      subtitle={t('adminUsers.subtitle')}
      icon="group"
    >
      {/* ===== Advanced Filter & Search Bar ===== */}
      <div className="mb-6 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث بالاسم، البريد أو المعرف...' : 'Search by name, email or ID...'}
              className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-2.5 pl-4 pr-10 text-sm font-semibold text-dark outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900"
            />
          </div>

          {/* Filter by Course */}
          <div>
            <CustomSelect
              options={courseOptions}
              value={selectedCourse}
              onChange={setSelectedCourse}
              placeholder={isRtl ? 'اختر الدورة' : 'Select Course'}
            />
          </div>

          {/* Sort By */}
          <div>
            <CustomSelect
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder={isRtl ? 'ترتيب حسب' : 'Sort by'}
            />
          </div>
        </div>

        {/* Active Filter Bar & Total Count */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E2D5]/60 pt-3 text-xs dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-500 dark:text-stone-400">
              {isRtl ? `إجمالي العناصر: ${filteredStudents.length} طالب` : `Total items: ${filteredStudents.length} students`}
            </span>
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                <span>{isRtl ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}</span>
              </button>
            )}
          </div>

          {selectedCourse !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              <span className="material-symbols-outlined text-xs">school</span>
              <span>
                {courses.find(c => c.id === selectedCourse)?.title || selectedCourse}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ===== Students List ===== */}
      <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 mb-6">
        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-gray-400">{t('common.loading')}</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">person_search</span>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-400">{t('adminUsers.noResults')}</p>
          </div>
        ) : (
          paginatedStudents.map((student) => {
            const dateDisplay = student.created_at 
              ? formatCustomDate(student.created_at) 
              : (student.createdAt ? formatCustomDate(student.createdAt) : t('adminUsers.notSpecified'));

            return (
              <div
                key={student.id || student.email}
                className="flex flex-col gap-3 border-b border-[#E8E2D5] px-6 py-4 last:border-0 hover:bg-[#FAF7F2] dark:border-gray-700 dark:hover:bg-gray-700/50 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-bold text-dark dark:text-white">{student.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 dark:bg-stone-800 px-2.5 py-1 text-stone-700 dark:text-stone-300">
                    <span className="material-symbols-outlined text-sm text-primary">menu_book</span>
                    <span>{student.coursesCount} {t('adminUsers.courses')}</span>
                  </span>

                  <span>{t('adminUsers.joinDate')} {dateDisplay}</span>

                  <span
                    className={`rounded-full px-3 py-1 ${
                      student.status !== 'inactive' && student.status !== t('adminUsers.inactive')
                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {student.status || t('adminUsers.active')}
                  </span>

                  <button
                    onClick={() => handleDelete(student.id)}
                    className="mr-2 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 transition-colors cursor-pointer"
                    title={t('adminUsers.deleteStudent')}
                    aria-label={t('adminUsers.deleteStudent')}
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== Pagination ===== */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </AdminPageShell>
  );
}
