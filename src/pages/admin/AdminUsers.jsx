import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminPageShell from './AdminPageShell';
import { collection, query, where, onSnapshot, doc, deleteDoc, db } from '../../firebase/config';
import { useLanguage } from '../../context/LanguageContext';
import { formatCustomDate } from '../../utils/formatDate';

export default function AdminUsers() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const [queryText, setQueryText] = useState(initialSearch);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync URL search parameters if changed externally
  useEffect(() => {
    const s = searchParams.get('search') || searchParams.get('q');
    if (s !== null) {
      setQueryText(s);
    }
  }, [searchParams]);

  useEffect(() => {
    // Fetch enrollments
    const unsubEnrollments = onSnapshot(collection(db, 'enrollments'), (snapshot) => {
      setEnrollments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch students
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsub = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(usersData);
      setLoading(false);
    });
    return () => {
      unsub();
      unsubEnrollments();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q)
    );
  }, [queryText, students]);

  const handleDelete = async (id) => {
    if (window.confirm(t('adminUsers.deleteConfirm'))) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (err) {
        alert(t('adminUsers.deleteError'));
        console.error(err);
      }
    }
  };

  return (
    <AdminPageShell
      parent={t('adminUsers.parent')}
      title={t('adminUsers.title')}
      subtitle={t('adminUsers.subtitle')}
      icon="group"
    >
      <div className="mb-6">
        <input
          type="search"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder={t('adminUsers.searchPlaceholder')}
          className="w-full rounded-xl border border-[#E8E2D5] bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="p-10 text-center text-sm font-bold text-gray-400">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm font-bold text-gray-400">{t('adminUsers.noResults')}</div>
        ) : (
          filtered.map((student) => {
            const studentEnrollments = enrollments.filter(e => e.uid === student.id);
            const coursesCount = studentEnrollments.length;

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
                <span>{coursesCount} {t('adminUsers.courses')}</span>
                <span>{t('adminUsers.joinDate')} {student.createdAt ? formatCustomDate(student.createdAt) : t('adminUsers.notSpecified')}</span>
                <span
                  className={`rounded-full px-3 py-1 ${
                    student.status !== 'inactive' && student.status !== t('adminUsers.inactive')
                      ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {student.status || t('adminUsers.active')}
                </span>
                <button
                  onClick={() => handleDelete(student.id)}
                  className="mr-4 text-rose-500 hover:text-rose-700 transition-colors"
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
    </AdminPageShell>
  );
}



