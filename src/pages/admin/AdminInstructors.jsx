import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrCreateDirectChat } from '../../services/chatService';
import AdminPageShell from './AdminPageShell';
import { supabase } from '../../supabase/client';
import { collection, query, where, onSnapshot, getDocs, doc, deleteDoc, db } from '../../firebase/config';
import { useLanguage } from '../../context/LanguageContext';
import { useDebounce } from '../../hooks/useDebounce';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';
import { isCourseOwnedByInstructor } from '../../utils/courseUtils';

export default function AdminInstructors() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [startingChatId, setStartingChatId] = useState(null);

  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort, Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedField, setSelectedField] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    // Fetch courses
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch instructors (only active / approved ones)
    const q = query(collection(db, 'users'), where('role', '==', 'instructor'));
    const unsub = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.is_approved === true && u.status === 'active');
      setInstructors(usersData);
      setLoading(false);
    });

    // Subscribe to realtime changes on profiles
    const channel = supabase
      .channel('admin-instructors-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          getDocs(q).then(snapshot => {
            const usersData = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(u => u.is_approved === true && u.status === 'active');
            setInstructors(usersData);
          });
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      getDocs(q).then(snapshot => {
        const usersData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.is_approved === true && u.status === 'active');
        setInstructors(usersData);
      });
    }, 4000);

    return () => {
      unsub();
      unsubCourses();
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedField, sortBy]);

  const handleStartChat = async (instructor) => {
    if (!currentUser?.uid) return;
    setStartingChatId(instructor.id);
    try {
      const adminUser = {
        uid: currentUser.uid,
        name: userData?.name || userData?.fullName || t('navbar.admin'),
        role: 'admin'
      };
      const instructorUser = {
        uid: instructor.id,
        name: instructor.name || instructor.fullName || t('navbar.instructor'),
        role: 'instructor'
      };
      const chatId = await getOrCreateDirectChat(adminUser, instructorUser);
      navigate(`/admin-dashboard/messages?chatId=${chatId}`);
    } catch (err) {
      console.error('Error starting chat with instructor:', err);
    } finally {
      setStartingChatId(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('adminInstructors.deleteConfirm'))) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (err) {
        alert(t('common.deleteError'));
        console.error(err);
      }
    }
  };

  // Build specialization options
  const fieldOptions = useMemo(() => {
    const fields = Array.from(new Set(instructors.map(i => i.field).filter(Boolean)));
    return [
      { value: 'all', label: isRtl ? 'جميع التخصصات' : 'All Specializations' },
      ...fields.map(f => ({ value: f, label: f }))
    ];
  }, [instructors, isRtl]);

  const sortOptions = [
    { value: 'name_asc', label: isRtl ? 'الاسم (أ - ي)' : 'Name (A - Z)' },
    { value: 'courses_desc', label: isRtl ? 'الأكثر دورات' : 'Most Courses' },
    { value: 'students_desc', label: isRtl ? 'الأكثر تسجيلاً' : 'Most Enrollments' },
    { value: 'newest', label: isRtl ? 'تاريخ الانضمام: الأحدث' : 'Joined: Newest' },
  ];

  // Enrich, filter and sort instructors
  const filteredInstructors = useMemo(() => {
    return instructors
      .map(item => {
        const instructorCourses = courses.filter(
          c => isCourseOwnedByInstructor(c, { uid: item.id || item.uid }, item)
        );
        const coursesCount = instructorCourses.length;
        const studentsCount = instructorCourses.reduce(
          (acc, curr) => acc + (curr.students || 0),
          0
        );
        return {
          ...item,
          coursesCount,
          studentsCount
        };
      })
      .filter(item => {
        const query = debouncedSearch.trim().toLowerCase();
        const matchSearch =
          !query ||
          item.name?.toLowerCase().includes(query) ||
          item.fullName?.toLowerCase().includes(query) ||
          item.email?.toLowerCase().includes(query) ||
          item.field?.toLowerCase().includes(query);

        const matchField =
          selectedField === 'all' || item.field === selectedField;

        return matchSearch && matchField;
      })
      .sort((a, b) => {
        if (sortBy === 'courses_desc') {
          return b.coursesCount - a.coursesCount;
        }
        if (sortBy === 'students_desc') {
          return b.studentsCount - a.studentsCount;
        }
        if (sortBy === 'newest') {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        // default name_asc
        const nameA = a.name || a.fullName || '';
        const nameB = b.name || b.fullName || '';
        return nameA.localeCompare(nameB);
      });
  }, [instructors, courses, debouncedSearch, selectedField, sortBy]);

  const totalPages = Math.ceil(filteredInstructors.length / itemsPerPage) || 1;
  const paginatedInstructors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInstructors.slice(start, start + itemsPerPage);
  }, [filteredInstructors, currentPage, itemsPerPage]);

  const isFilterActive =
    searchQuery.trim() !== '' || selectedField !== 'all' || sortBy !== 'name_asc';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedField('all');
    setSortBy('name_asc');
    setCurrentPage(1);
  };

  return (
    <AdminPageShell
      parent={t('adminInstructors.parent')}
      title={t('adminInstructors.title')}
      subtitle={t('adminInstructors.subtitle')}
      icon="badge"
    >
      {/* ===== Filter & Search Bar ===== */}
      <div className="mb-6 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              search
            </span>
            <input
              type="text"
              placeholder={isRtl ? 'ابحث بالاسم، البريد، أو التخصص...' : 'Search by name, email, or field...'}
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

          {/* Specialization Filter */}
          <div>
            <CustomSelect
              value={selectedField}
              onChange={setSelectedField}
              options={fieldOptions}
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

        {/* Reset Filter Button & Count */}
        {isFilterActive && (
          <div className="mt-3 flex items-center justify-between border-t border-[#E8E2D5] pt-3 text-xs dark:border-gray-700">
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              {isRtl
                ? `نتائج البحث والفلترة: (${filteredInstructors.length}) مدرب`
                : `Filtered Results: (${filteredInstructors.length}) instructors`}
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

      {/* ===== Instructors Table ===== */}
      <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="hidden grid-cols-12 gap-4 border-b border-[#E8E2D5] bg-[#FAF7F2] px-6 py-3 text-xs font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 md:grid">
          <span className="col-span-3">{t('adminInstructors.instructor')}</span>
          <span className="col-span-3">{t('adminInstructors.specialization')}</span>
          <span className="col-span-2">{t('adminInstructors.courses')}</span>
          <span className="col-span-2">{t('adminInstructors.totalEnrollments')}</span>
          <span className="col-span-2">{t('adminInstructors.status')}</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm font-bold text-gray-400">{t('common.loading')}</div>
        ) : paginatedInstructors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary dark:bg-orange-950/40">
              <span className="material-symbols-outlined text-2xl">person_search</span>
            </div>
            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
              {isRtl ? 'لم يتم العثور على أي مدربين' : 'No instructors found'}
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
            {paginatedInstructors.map((item) => (
              <div
                key={item.id || item.email}
                className="flex flex-col gap-3 border-b border-[#E8E2D5] px-6 py-4 last:border-0 hover:bg-[#FAF7F2] dark:border-gray-700 dark:hover:bg-gray-700/50 md:grid md:grid-cols-12 md:items-center md:gap-4"
              >
                <div className="col-span-3 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{t('adminInstructors.instructor')}</span>
                  <p className="font-bold text-dark dark:text-white">{item.name || item.fullName}</p>
                  {item.email && <p className="text-xs text-gray-400">{item.email}</p>}
                </div>
                <div className="col-span-3 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{t('adminInstructors.specialization')}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.field || t('adminRequests.notSpecified')}</p>
                </div>
                <div className="col-span-2 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{t('adminInstructors.courses')}</span>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.coursesCount}</p>
                </div>
                <div className="col-span-2 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{t('adminInstructors.totalEnrollments')}</span>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {item.studentsCount} {isRtl ? 'تسجيل' : 'enrollments'}
                  </p>
                </div>
                
                <div className="col-span-2 flex items-center justify-between mt-2 md:mt-0 pt-3 md:pt-0 border-t border-[#E8E2D5] dark:border-gray-700 md:border-0">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      (item.status === 'active' || item.is_approved === true)
                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}
                  >
                    {(item.status === 'active' || item.is_approved === true)
                      ? t('adminInstructors.active')
                      : t('adminInstructors.pending')}
                  </span>
                  <div className="flex items-center gap-1.5 mr-2">
                    <button
                      onClick={() => handleStartChat(item)}
                      disabled={startingChatId === item.id}
                      title={t('chat.messageInstructor')}
                      aria-label={t('chat.messageInstructor')}
                      className="text-primary hover:text-white bg-primary/10 hover:bg-primary transition-all flex items-center justify-center p-2 rounded-xl shadow-xs"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {startingChatId === item.id ? 'sync' : 'chat'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                      className="text-rose-500 hover:text-rose-700 transition-colors flex items-center justify-center p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredInstructors.length}
              itemsPerPage={itemsPerPage}
              itemName={isRtl ? 'مدرب' : 'instructors'}
            />
          </>
        )}
      </div>
    </AdminPageShell>
  );
}
