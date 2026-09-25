import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminPageShell from './AdminPageShell';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getOrCreateDirectChat } from '../../services/chatService';
import { useDebounce } from '../../hooks/useDebounce';
import CustomSelect from '../../components/CustomSelect';
import Pagination from '../../components/Pagination';
import { formatCustomDate } from '../../utils/formatDate';

export default function AdminUsers() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [searchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState(null);

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setStudents(data);
      }
    } catch (err) {
      console.warn('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [cRes, eRes] = await Promise.all([
          supabase.from('courses').select('id, title'),
          supabase.from('course_requests').select('*')
        ]);
        if (cRes.data) setCourses(cRes.data);
        if (eRes.data) setEnrollments(eRes.data);
      } catch (e) {}
    };

    fetchAuxData();
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

    const interval = setInterval(() => {
      fetchStudents();
      fetchAuxData();
    }, 6000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Reset page to 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCourse, sortBy]);

  const handleStartChat = async (student) => {
    if (!currentUser?.uid) return;
    setStartingChatId(student.id);
    try {
      const adminUser = {
        uid: currentUser.uid,
        name: userData?.name || userData?.fullName || (isRtl ? 'مسؤول' : 'Admin'),
        role: 'admin'
      };
      const studentUser = {
        uid: student.id,
        name: student.name || student.fullName || (isRtl ? 'طالب' : 'Student'),
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

  const handleDelete = async (id) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الطالب؟' : 'Are you sure you want to delete this student?')) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
        fetchStudents();
      } catch (err) {
        alert(isRtl ? 'حدث خطأ أثناء حذف الطالب' : 'Error deleting student');
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
      parent={isRtl ? 'إدارة الطلاب' : 'Students Management'}
      title={isRtl ? 'جميع الطلاب' : 'All Students'}
      subtitle={isRtl ? 'ابحث عن الطلاب وتابع حالة حساباتهم' : 'Search students and track their account status'}
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
              aria-label={isRtl ? 'ابحث بالاسم، البريد أو المعرف' : 'Search by name, email or ID'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث بالاسم، البريد أو المعرف...' : 'Search by name, email or ID...'}
              className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-2.5 pl-4 pr-10 text-sm font-semibold text-dark outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                aria-label="Clear Search"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
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

        {/* Active Filter Bar & Reset Button */}
        {isFilterActive && (
          <div className="mt-3 flex items-center justify-between border-t border-[#E8E2D5] pt-3 text-xs dark:border-gray-700">
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              {isRtl
                ? `نتائج البحث والفلترة: (${filteredStudents.length}) طالب`
                : `Filtered Results: (${filteredStudents.length}) students`}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        )}
      </div>

      {/* ===== Students Table ===== */}
      <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="hidden grid-cols-12 gap-4 border-b border-[#E8E2D5] bg-[#FAF7F2] px-6 py-3 text-xs font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 md:grid">
          <span className="col-span-3">{isRtl ? 'الطالب' : 'Student'}</span>
          <span className="col-span-3">{isRtl ? 'تاريخ الانضمام' : 'Joined Date'}</span>
          <span className="col-span-2">{isRtl ? 'الدورات' : 'Courses'}</span>
          <span className="col-span-2">{isRtl ? 'الحالة' : 'Status'}</span>
          <span className="col-span-2 text-left rtl:text-right">{isRtl ? 'الإجراءات' : 'Actions'}</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm font-bold text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary dark:bg-orange-950/40">
              <span className="material-symbols-outlined text-2xl">person_search</span>
            </div>
            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
              {isRtl ? 'لم يتم العثور على أي طلاب' : 'No students found'}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isRtl
                ? 'جرب تعديل كلمات البحث أو تصفية الخيارات لإظهار النتائج.'
                : 'Try adjusting your search terms or filters.'}
            </p>
            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] px-4 py-2 text-xs font-bold text-gray-700 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
              >
                {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          <>
            {paginatedStudents.map((student) => {
              const dateDisplay = student.created_at 
                ? formatCustomDate(student.created_at) 
                : (student.createdAt ? formatCustomDate(student.createdAt) : (isRtl ? 'غير محدد' : 'N/A'));

              return (
                <div
                  key={student.id || student.email}
                  className="flex flex-col gap-3 border-b border-[#E8E2D5] px-6 py-4 last:border-0 hover:bg-[#FAF7F2] dark:border-gray-700 dark:hover:bg-gray-700/50 md:grid md:grid-cols-12 md:items-center md:gap-4"
                >
                  {/* Student Column */}
                  <div className="col-span-3 flex flex-col">
                    <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{isRtl ? 'الطالب' : 'Student'}</span>
                    <p className="font-bold text-dark dark:text-white">{student.name || student.fullName || (isRtl ? 'طالب' : 'Student')}</p>
                    {student.email && <p className="text-xs text-gray-400">{student.email}</p>}
                  </div>

                  {/* Joined Date Column */}
                  <div className="col-span-3 flex flex-col">
                    <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{isRtl ? 'تاريخ الانضمام' : 'Joined Date'}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{dateDisplay}</p>
                  </div>

                  {/* Courses Column */}
                  <div className="col-span-2 flex flex-col">
                    <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{isRtl ? 'الدورات' : 'Courses'}</span>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {student.coursesCount} {isRtl ? 'دورة' : 'courses'}
                    </p>
                  </div>

                  {/* Status Column */}
                  <div className="col-span-2 flex flex-col">
                    <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{isRtl ? 'الحالة' : 'Status'}</span>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          student.status !== 'inactive' && student.status !== 'غير نشط'
                            ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {student.status || (isRtl ? 'نشط' : 'Active')}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-2 flex items-center justify-between md:justify-start gap-1.5 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-[#E8E2D5] dark:border-gray-700 md:border-0">
                    <span className="md:hidden text-xs text-gray-400 font-bold">{isRtl ? 'الإجراءات' : 'Actions'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartChat(student)}
                        disabled={startingChatId === student.id}
                        title={isRtl ? 'مراسلة الطالب' : 'Message Student'}
                        aria-label={isRtl ? 'مراسلة الطالب' : 'Message Student'}
                        className="text-primary hover:text-white bg-primary/10 hover:bg-primary transition-all flex items-center justify-center p-2 rounded-xl shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {startingChatId === student.id ? 'sync' : 'chat'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDelete(student.id)}
                        title={isRtl ? 'حذف الطالب' : 'Delete Student'}
                        aria-label={isRtl ? 'حذف الطالب' : 'Delete Student'}
                        className="text-rose-500 hover:text-rose-700 transition-colors flex items-center justify-center p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Component with Footer */}
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
    </AdminPageShell>
  );
}
