import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { createCourseGroupChat } from '../services/chatService';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isCourseOwnedByInstructor } from '../utils/courseUtils';

export default function MyCourses() {
  const { t, dir } = useLanguage();
  const { courses, loading } = useCourses();
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loadingGroupCourseId, setLoadingGroupCourseId] = useState(null);

  const handleOpenOrCreateGroup = async (course) => {
    if (!currentUser) return;
    setLoadingGroupCourseId(course.id);
    try {
      const chatId = await createCourseGroupChat(course, {
        uid: currentUser.uid,
        name: userData?.name || userData?.fullName || currentUser.email,
        role: 'instructor'
      });
      navigate(`/instructor-dashboard/messages?chatId=${chatId}`);
    } catch (err) {
      console.error('Error creating or opening course group chat:', err);
    } finally {
      setLoadingGroupCourseId(null);
    }
  };

  // Filter this instructor's courses using language-independent UID + multilingual fallback
  const myCourses = courses.filter(c => isCourseOwnedByInstructor(c, currentUser, userData));

  return (
    <div dir={dir} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-white transition-colors">
            {t('myCourses.title')}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 font-bold">{t('common.loading')}</div>
        ) : myCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] dark:border-gray-700 py-20 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-4 text-gray-300 dark:text-gray-600">menu_book</span>
            <p className="font-bold text-gray-500 dark:text-gray-400">{t('myCourses.noCourses')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('myCourses.contactAdmin')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E8E2D5] dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
            {myCourses.map(course => (
              <div key={course.id} className="group p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 border-b border-[#E8E2D5] dark:border-gray-700 last:border-0 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 transition-colors duration-300">
                
                <div className="w-full md:w-32 h-24 bg-[#FAF7F2] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 rounded-xl shadow-sm flex items-center justify-center text-gray-400 shrink-0">
                  <i className="fa-solid fa-book text-3xl"></i>
                </div>

                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-lg font-bold text-dark dark:text-white group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    {course.draft && (
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded font-bold">
                        {t('adminCourses.draft')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-300 mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-user-group text-gray-400"></i>
                      {course.students || 0} {t('common.students')}
                    </span>
                    {!course.draft && (
                      <>
                        <span className="flex items-center gap-1">
                          <i className="fa-solid fa-star text-orange-400"></i>
                          {course.rating || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fa-solid fa-tag text-gray-400"></i>
                          {course.category || 'غير محدد'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <button
                    onClick={() => handleOpenOrCreateGroup(course)}
                    disabled={loadingGroupCourseId === course.id}
                    className="bg-primary text-white hover:bg-secondary px-4 py-2 rounded-lg font-bold text-sm transition-all text-center shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">forum</span>
                    <span>{loadingGroupCourseId === course.id ? t('chat.loading') : t('chat.openGroup')}</span>
                  </button>

                  <Link to={`/instructor-dashboard/edit-course/${course.id}`} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors text-center shadow-sm">
                    {t('common.edit')}
                  </Link>
                  <Link to={`/instructor-dashboard/exam/${course.id}`} className="bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/40 px-4 py-2 rounded-lg font-bold text-sm transition-colors text-center shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">quiz</span>
                    <span>{dir === 'rtl' ? 'اختبار التخرج' : 'Graduation Exam'}</span>
                  </Link>
                  <Link to={`/instructor-dashboard/assignments/${course.id}`} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 px-4 py-2 rounded-lg font-bold text-sm transition-colors text-center shadow-sm">
                    {t('manageAssignments.title')}
                  </Link>
                  <Link to={`/instructor-dashboard/submissions/${course.id}`} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 px-4 py-2 rounded-lg font-bold text-sm transition-colors text-center shadow-sm">
                    {t('submittedAssignments.title')}
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
