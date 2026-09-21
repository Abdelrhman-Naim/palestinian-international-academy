import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import CertificateModal from '../../components/CertificateModal';
import { Link } from 'react-router-dom';

export default function StudentCertificates() {
  const { t, dir } = useLanguage();
  const { currentUser } = useAuth();
  const isRtl = dir === 'rtl';

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    
    async function fetchCertificates() {
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('student_id', currentUser.id || currentUser.uid);

        if (error) {
          console.warn('Certificates fetch error:', error);
          setCertificates([]);
        } else {
          const mapped = (data || []).map(cert => ({
            ...cert,
            id: cert.id,
            certificateId: cert.certificate_number || cert.certificateId || cert.id,
            courseTitle: cert.course_title || cert.courseTitle,
            studentName: cert.student_name || cert.studentName,
            instructorName: cert.instructor_name || cert.instructorName || '—',
            formattedDate: cert.issue_date ? new Date(cert.issue_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : ''
          }));
          setCertificates(mapped);
        }
      } catch (err) {
        console.warn('Certificates fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCertificates();
  }, [currentUser, isRtl]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E2D5] dark:border-gray-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">verified</span>
              <span>{isRtl ? 'شهاداتي المعتمدة' : 'My Earned Certificates'}</span>
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {isRtl 
                ? 'شهادات إتمام الدورات الصادرة لك تلقائياً فور إكمال محاضرات الدورة بنسبة 100%.' 
                : 'Official completion certificates issued automatically upon 100% course lecture completion.'}
            </p>
          </div>

          <Link
            to="/verify-certificate"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:border-primary hover:text-primary transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-base">search_check</span>
            <span>{isRtl ? 'صفحة التحقق العامة' : 'Verification Page'}</span>
          </Link>
        </div>

        {/* Certificates Grid */}
        {loading ? (
          <div className="text-center py-20 text-stone-400 font-bold">
            {t('common.loading')}
          </div>
        ) : certificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-[#F3EFE6]/40 dark:bg-gray-800/40 border-2 border-dashed border-[#E8E2D5] dark:border-gray-700 py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">military_tech</span>
            </div>
            <h3 className="text-lg font-bold text-dark dark:text-white mb-2">
              {isRtl ? 'لم تحصل على أي شهادة بعد' : 'No Certificates Yet'}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mb-6 leading-relaxed">
              {isRtl 
                ? 'عند إكمال 100% من محاضرات أي دورة مسجل بها، ستظهر شهادتك المعتمدة هنا فوراً مع رمز تحقق دائم.' 
                : 'Complete 100% of any enrolled course lectures to automatically unlock and receive your verified certificate here.'}
            </p>
            <Link
              to="/dashboard/my-courses"
              className="px-6 py-3 rounded-xl bg-primary hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-primary/20 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">play_circle</span>
              <span>{isRtl ? 'متابعة دوراتي الآن' : 'Continue My Courses'}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="group relative bg-white dark:bg-stone-900 border border-[#E8E2D5] dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Top Badge & Code */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>{isRtl ? 'معتمدة' : 'Verified'}</span>
                    </span>
                    <span className="font-mono text-xs text-stone-400 font-bold">
                      {cert.certificateId}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="text-lg font-bold text-dark dark:text-white group-hover:text-primary transition-colors mb-2">
                    {cert.courseTitle}
                  </h3>

                  <div className="space-y-1.5 text-xs text-stone-500 dark:text-stone-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-stone-400">badge</span>
                      <span>{isRtl ? 'المدرب:' : 'Instructor:'} <strong className="text-stone-700 dark:text-stone-300">{cert.instructorName || '—'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-stone-400">calendar_today</span>
                      <span>{isRtl ? 'تاريخ الإصدار:' : 'Issue Date:'} <strong className="text-stone-700 dark:text-stone-300">{cert.formattedDate || cert.formattedDateEn || new Date().toLocaleDateString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    <span>{isRtl ? 'عرض الشهادة والطباعة' : 'View & Print'}</span>
                  </button>

                  <Link
                    to={`/verify-certificate/${cert.certificateId}`}
                    target="_blank"
                    className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-primary hover:border-primary font-bold text-xs transition-all flex items-center gap-1"
                    title={isRtl ? 'رابط التحقق العام' : 'Public Verification Link'}
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Full Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}
