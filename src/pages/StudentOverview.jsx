import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import { useLanguage } from '../context/LanguageContext';

const StudentOverview = () => {
  const { t, dir } = useLanguage();
  const { user, currentUser } = useAuth();
  const [coursesCount, setCoursesCount] = useState(0);
  const [certCount, setCertCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const uid = currentUser?.uid || currentUser?.id || user?.uid || user?.id;
    if (!uid) {
      setLoadingStats(false);
      return;
    }

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const { count: cCount } = await supabase
          .from('course_requests')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', uid);

        setCoursesCount(cCount || 0);

        const { count: certC } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', uid);

        setCertCount(certC || 0);
      } catch (e) {
        console.warn('Error loading student stats from Supabase:', e);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, currentUser]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-[#E8E2D5] dark:border-gray-700 pb-6 gap-4 transition-colors">
          <div className="text-right">
            <h1 className="text-3xl md:text-4xl font-extrabold text-dark dark:text-white">
              {t('studentOverview.welcomeBack')} {user?.name || user?.full_name || currentUser?.displayName || t('common.students')}
            </h1>
          </div>
        </div>
        
        {/* Quick Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingStats ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm animate-pulse flex flex-col justify-between"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mb-4 ms-auto"></div>
                  <div className="space-y-3 text-end">
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg ms-auto"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md ms-auto"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Courses in Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-amber-400/10 text-primary dark:text-amber-400 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-graduation-cap text-lg"></i>
                </div>
                <div className="text-right w-full">
                  <h3 className="text-3xl font-black text-dark dark:text-white mb-1 font-jetbrains">{coursesCount}</h3>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('studentOverview.coursesInProgress')}</p>
                </div>
              </div>
              
              {/* Certificates Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-award text-lg"></i>
                </div>
                <div className="text-right w-full flex justify-between items-end">
                  <Link to="/dashboard/certificates" className="text-xs font-bold text-primary dark:text-amber-400 hover:underline flex items-center">
                    <i className="fa-solid fa-arrow-left ml-1 text-[10px] rtl:rotate-180"></i> {t('studentOverview.viewCertificate')}
                  </Link>
                  <div>
                    <h3 className="text-3xl font-black text-dark dark:text-white mb-1 font-jetbrains">{certCount}</h3>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{dir === 'rtl' ? 'الشهادات المكتسبة' : 'Earned Certificates'}</p>
                  </div>
                </div>
              </div>
              
              {/* Learning Time */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm flex flex-col items-end justify-between hover-lift transition-all">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                  <i className="fa-regular fa-clock text-lg"></i>
                </div>
                <div className="text-right w-full">
                  <h3 className="text-3xl font-black text-dark dark:text-white mb-1 font-jetbrains">0</h3>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('studentOverview.learningTime')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">{t('studentOverview.watchedVideos')}</p>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Main Content Area: Continue Learning & Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-dark dark:text-white mb-6 text-right transition-colors">{t('studentOverview.continueLearning')}</h2>
            <div className="bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] dark:border-gray-700 rounded-2xl h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
              <i className="fa-solid fa-book-open text-5xl mb-4 text-gray-300 dark:text-gray-600"></i>
              <p className="font-medium text-lg text-gray-500 dark:text-gray-400">
                {coursesCount > 0 ? t('studentOverview.coursesInProgress') : t('studentOverview.noCoursesInProgress')}
              </p>
              <Link to="/courses" className="mt-4 text-primary dark:text-orange-400 font-semibold hover:underline">{t('studentOverview.exploreCourses')}</Link>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm min-h-75 flex flex-col transition-colors">
              <div className="flex items-center justify-between mb-6">
                <a className="text-sm font-semibold text-primary dark:text-orange-400 hover:underline flex items-center" href="#">
                  <i className="fa-solid fa-arrow-left ml-1 text-xs"></i> {t('instructorOverview.viewAll')}
                </a>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-dark dark:text-white">{t('studentOverview.recentBadges')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">0 {t('common.of')} 8 {t('studentOverview.badgesUnlocked')}</p>
                </div>
              </div>
              
              <div className="bg-[#FAF7F2] dark:bg-gray-900 rounded-xl p-8 flex flex-col items-center justify-center text-center flex-1 border border-[#E8E2D5] dark:border-gray-800 transition-colors">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 mb-3 shadow-sm">
                  <i className="fa-solid fa-shield-halved text-xl"></i>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('studentOverview.noBadges')}</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
