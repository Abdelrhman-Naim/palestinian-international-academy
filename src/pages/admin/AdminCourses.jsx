import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminPageShell from './AdminPageShell';
import { useCourses } from '../../context/CoursesContext';
import { useCategories } from '../../context/CategoriesContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';

export default function AdminCourses() {
  const { t, dir } = useLanguage();
  const { showToast } = useToast();
  const isRtl = dir === 'rtl';
  const { rawCourses: courses, removeCourse } = useCourses();
  const { rawCategories } = useCategories();

  // URL Search params support
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';

  // Search, Filter, Sort, and Pagination states
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Sync URL search changes
  useEffect(() => {
    const s = searchParams.get('search') || searchParams.get('q');
    if (s !== null) {
      setSearchQuery(s);
    }
  }, [searchParams]);

  const itemsPerPage = 8;

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedStatus, sortBy]);

  // Categories list
  const categoryOptions = useMemo(() => {
    const fromContext = rawCategories?.courses || [];
    const fromCourses = Array.from(new Set(courses.map(c => c.category).filter(Boolean)));
    const allUnique = Array.from(new Set([...fromContext, ...fromCourses]));
    return [
      { value: 'all', label: isRtl ? 'جميع التصنيفات' : 'All Categories' },
      ...allUnique.map(cat => ({ value: cat, label: cat }))
    ];
  }, [rawCategories, courses, isRtl]);

  const statusOptions = [
    { value: 'all', label: isRtl ? 'جميع الحالات' : 'All Statuses' },
    { value: 'published', label: isRtl ? 'منشورة' : 'Published' },
    { value: 'draft', label: isRtl ? 'مسودة' : 'Draft' },
  ];

  const sortOptions = [
    { value: 'newest', label: isRtl ? 'الأحدث أولاً' : 'Newest First' },
    { value: 'oldest', label: isRtl ? 'الأقدم أولاً' : 'Oldest First' },
    { value: 'title_asc', label: isRtl ? 'الاسم (أ - ي)' : 'Name (A - Z)' },
    { value: 'students_desc', label: isRtl ? 'الأكثر طلاباً' : 'Most Students' },
  ];

  // Helper to format course modification or creation date
  const formatCourseDate = (course) => {
    let date = null;
    let label = `${t('adminCourses.updatedAt')}:`;

    if (course.updatedAt) {
      if (course.updatedAt.toDate) {
        date = course.updatedAt.toDate();
      } else if (course.updatedAt.seconds) {
        date = new Date(course.updatedAt.seconds * 1000);
      } else {
        const d = new Date(course.updatedAt);
        if (!isNaN(d.getTime())) date = d;
      }
    }

    if (!date && course.createdAt) {
      label = `${t('adminCourses.createdAt')}:`;
      if (course.createdAt.toDate) {
        date = course.createdAt.toDate();
      } else if (course.createdAt.seconds) {
        date = new Date(course.createdAt.seconds * 1000);
      } else {
        const d = new Date(course.createdAt);
        if (!isNaN(d.getTime())) date = d;
      }
    }

    if (date) {
      return {
        label,
        dateStr: date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      };
    }

    if (course.year) {
      return {
        label: isRtl ? 'السنة:' : 'Year:',
        dateStr: String(course.year)
      };
    }

    return null;
  };

  // Helper to parse dates for sorting
  const getCourseTimestamp = (course, preferUpdated = true) => {
    const primary = preferUpdated ? (course.updatedAt || course.createdAt) : (course.createdAt || course.updatedAt);
    if (primary) {
      if (primary.toMillis) return primary.toMillis();
      if (primary.seconds) return primary.seconds * 1000;
      const parsed = new Date(primary).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return course.year ? Number(course.year) * 10000 : 0;
  };

  // Filtering & Sorting
  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        const query = debouncedSearch.trim().toLowerCase();
        const cleanQuery = query.startsWith('#') ? query.slice(1) : query;
        const matchSearch =
          !query ||
          course.title?.toLowerCase().includes(query) ||
          course.instructor?.toLowerCase().includes(query) ||
          course.id?.toLowerCase().includes(cleanQuery);

        const matchCategory =
          selectedCategory === 'all' || course.category === selectedCategory;

        const isDraft =
          course.status === t('adminCourses.draft') ||
          course.status?.toLowerCase() === 'draft' ||
          course.status === 'مسودة';

        let matchStatus = true;
        if (selectedStatus === 'published') {
          matchStatus = !isDraft;
        } else if (selectedStatus === 'draft') {
          matchStatus = isDraft;
        }

        return matchSearch && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return getCourseTimestamp(b, true) - getCourseTimestamp(a, true);
        }
        if (sortBy === 'oldest') {
          return getCourseTimestamp(a, false) - getCourseTimestamp(b, false);
        }
        if (sortBy === 'title_asc') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'students_desc') {
          return (b.students || 0) - (a.students || 0);
        }
        return 0;
      });
  }, [courses, debouncedSearch, selectedCategory, selectedStatus, sortBy, t]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, currentPage, itemsPerPage]);

  const isFilterActive =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'all' ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <AdminPageShell
      parent={t('adminCourses.parent')}
      title={t('adminCourses.title')}
      subtitle={t('adminCourses.subtitle')}
      icon="school"
      actions={
        <Link
          to="/admin-dashboard/add-course"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 shadow-md shadow-primary/20"
        >
          <span className="material-symbols-outlined text-base">add</span>
          {t('adminCourses.addCourse')}
        </Link>
      }
    >
      {/* ===== Controls Bar: Search, Category, Status, Sort ===== */}
      <div className="mb-6 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              search
            </span>
            <input
              type="text"
              aria-label={isRtl ? 'ابحث باسم الدورة أو المدرب' : 'Search by course or instructor'}
              placeholder={isRtl ? 'ابحث باسم الدورة أو المدرب...' : 'Search by course or instructor...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-2.5 ps-10 pe-9 text-sm text-gray-700 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:bg-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Clear Search"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <CustomSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categoryOptions}
            />
          </div>

          {/* Status Filter */}
          <div>
            <CustomSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
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

        {/* Reset Filter Action */}
        {isFilterActive && (
          <div className="mt-3 flex items-center justify-between border-t border-[#E8E2D5] pt-3 text-xs dark:border-gray-700">
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              {isRtl
                ? `نتائج البحث والفلترة: (${filteredCourses.length}) دورة`
                : `Filtered Results: (${filteredCourses.length}) courses`}
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

      {/* ===== Courses List Table / Grid ===== */}
      <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {paginatedCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary dark:bg-orange-950/40">
              <span className="material-symbols-outlined text-2xl">search_off</span>
            </div>
            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
              {isRtl ? 'لم يتم العثور على أي دورات' : 'No courses found'}
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
                className="mt-4 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] px-4 py-2 text-xs font-bold text-gray-700 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          <>
            {paginatedCourses.map((course) => {
              const isDraft =
                course.status === t('adminCourses.draft') ||
                course.status?.toLowerCase() === 'draft' ||
                course.status === 'مسودة';

              const dateInfo = formatCourseDate(course);

              return (
                <div
                  key={course.id}
                  className="flex flex-col gap-4 border-b border-[#E8E2D5] p-5 last:border-0 transition-colors hover:bg-[#FAF7F2] dark:border-gray-700 dark:hover:bg-gray-700/50 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1 min-w-0">
                    {/* Header Row: Title & Badges */}
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3
                        className="text-base sm:text-lg font-bold text-dark dark:text-white"
                        title={course.title}
                      >
                        {course.title}
                      </h3>

                      {/* Course ID / Code Badge with Copy */}
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-stone-700 dark:border-gray-600 dark:bg-gray-700 dark:text-stone-300"
                        title={`${isRtl ? 'المعرف الكامل:' : 'Full ID:'} ${course.id}`}
                      >
                        <span className="text-[10px] text-gray-400 font-sans">{t('adminCourses.courseCode')}:</span>
                        <span>#{course.id.length > 10 ? `${course.id.slice(0, 8)}...` : course.id}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(course.id);
                            setCopiedId(course.id);
                            showToast(t('adminCourses.copiedSuccess'), 'success');
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="text-gray-400 hover:text-primary transition-colors inline-flex items-center"
                          title={copiedId === course.id ? t('adminCourses.copied') : t('adminCourses.copyCode')}
                          aria-label={copiedId === course.id ? t('adminCourses.copied') : t('adminCourses.copyCode')}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {copiedId === course.id ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </span>

                      {/* Status Badge */}
                      {isDraft ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-yellow-200 bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800 dark:border-yellow-800/40 dark:bg-yellow-900/30 dark:text-yellow-300">
                          <span className="material-symbols-outlined text-[13px]">edit_note</span>
                          {t('adminCourses.draft')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          {t('adminCourses.published')}
                        </span>
                      )}

                      {/* Category Badge */}
                      {course.category && (
                        <span className="rounded-lg border border-[#E8E2D5] bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {course.category}
                        </span>
                      )}
                    </div>

                    {/* Metadata Row: Instructor, Students, Dates */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {/* Instructor */}
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-gray-400">person</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {course.instructor || (isRtl ? 'غير محدد' : 'Not assigned')}
                        </span>
                      </span>

                      {/* Students Count - Clickable to view course students */}
                      <Link
                        to={`/admin-dashboard/course-students/${course.id}`}
                        className="group/students inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-0.5 font-medium transition-all hover:border-[#E8E2D5] hover:bg-stone-100 hover:text-primary dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-amber-400 cursor-pointer text-gray-600 dark:text-gray-300"
                        title={isRtl ? 'عرض قائمة الطلاب المسجلين في هذه الدورة' : 'View students enrolled in this course'}
                      >
                        <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover/students:text-primary dark:group-hover/students:text-amber-400 transition-colors">
                          group
                        </span>
                        <span className="underline decoration-dotted underline-offset-4 decoration-gray-400 group-hover/students:decoration-primary dark:group-hover/students:decoration-amber-400 font-semibold">
                          {course.students || 0} {t('common.students')}
                        </span>
                        <span className="material-symbols-outlined text-[14px] opacity-70 group-hover/students:opacity-100 group-hover/students:translate-x-0.5 transition-all">
                          {isRtl ? 'arrow_back' : 'arrow_forward'}
                        </span>
                      </Link>

                      {/* Date Badge */}
                      {dateInfo && (
                        <span className="flex items-center gap-1 text-primary dark:text-amber-400 font-medium">
                          <span className="material-symbols-outlined text-[15px]">event</span>
                          <span>
                            {dateInfo.label} {dateInfo.dateStr}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit, Delete */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/admin-dashboard/edit-course/${course.id}`}
                      className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                      title={t('common.edit')}
                      aria-label={t('common.edit')}
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      {t('common.edit')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteModal(course)}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-secondary transition-colors hover:bg-rose-100 dark:bg-rose-900/20"
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCourses.length}
              itemsPerPage={itemsPerPage}
              itemName={isRtl ? 'دورة' : 'courses'}
            />
          </>
        )}
      </div>

      {/* ===== Delete Confirm Modal ===== */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-[#E8E2D5] p-6 shadow-2xl dark:border dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-secondary dark:bg-rose-900/20">
              <span className="material-symbols-outlined text-xl">delete</span>
            </div>
            <h3 className="text-center text-xl font-bold text-dark dark:text-white">{t('adminCourses.deleteTitle')}</h3>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('adminCourses.deleteConfirm', { title: deleteModal.title }).replace('{title}', deleteModal.title)}
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-3 text-sm font-bold text-gray-600 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeCourse(deleteModal.id);
                  showToast(t('adminCourses.deleteSuccess') || (isRtl ? 'تم حذف الدورة بنجاح' : 'Course deleted successfully'), 'success');
                  setDeleteModal(null);
                }}
                className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white hover:bg-rose-600"
              >
                {t('adminLibraryCategories.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
