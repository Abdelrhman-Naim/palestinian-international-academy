import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageLoader from '../components/PageLoader';
import { getCertificateByCode } from '../services/certificateService';
import { useLanguage } from '../context/LanguageContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import CertificateModal from '../components/CertificateModal';

export default function CertificateVerificationPage() {
  const { code } = useParams();
  const { dir, t } = useLanguage();
  const isRtl = dir === 'rtl';

  const [searchCode, setSearchCode] = useState(code || '');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [searched, setSearched] = useState(Boolean(code));
  const [showFullCert, setShowFullCert] = useState(false);

  useEffect(() => {
    if (code) {
      handleVerify(code);
    }
  }, [code]);

  const handleVerify = async (codeToVerify) => {
    const clean = (codeToVerify || searchCode).trim();
    if (!clean) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await getCertificateByCode(clean);
      if (data && (!data.studentName || data.studentName === 'طالب' || data.studentName === 'طالب المنصة') && data.studentId) {
        try {
          const userSnap = await getDoc(doc(db, 'users', data.studentId));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            const realName = uData.fullName || uData.name;
            if (realName) {
              data.studentName = realName;
              updateDoc(doc(db, 'certificates', data.id), { studentName: realName }).catch(() => {});
            }
          }
        } catch (e) {
          console.warn('Error fetching user name for verification page:', e);
        }
      }
      setCertificate(data);
    } catch (err) {
      console.error('Verification error:', err);
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-950 text-dark dark:text-gray-100 transition-colors" dir={dir}>
      <Navbar />

      <main className="grow py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20 shadow-sm">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-dark dark:text-white tracking-tight mb-2">
              {isRtl ? 'التحقق من صحة الشهادات' : 'Certificate Verification System'}
            </h1>
            <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
              {isRtl 
                ? 'أدخل الرمز التعريفي الفريد للشهادة الصادرة عن المنصة للتحقق من مصداقيتها وصحة بيانات الطالب والدورة.' 
                : 'Enter the unique Certificate ID issued by the platform to verify its authenticity and course details.'}
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm mb-8">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
                  badge
                </span>
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder={isRtl ? 'مثال: EDU-2026-ABC123' : 'e.g. EDU-2026-ABC123'}
                  className="w-full ps-11 pe-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 text-dark dark:text-white text-sm font-mono focus:outline-none focus:border-primary uppercase tracking-wider transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !searchCode.trim()}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">search</span>
                    <span>{isRtl ? 'تحقق الآن' : 'Verify'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Area */}
          {loading ? (
            <div className="py-12 text-center">
              <PageLoader message={isRtl ? 'جاري التحقق من بيانات الشهادة في السجلات...' : 'Verifying certificate in records...'} />
            </div>
          ) : searched && (
            certificate ? (
              /* Verified Certificate Card */
              <div className="bg-white dark:bg-stone-900 border-2 border-emerald-500/40 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Status Badge */}
                <div className="flex items-center justify-between pb-6 border-b border-stone-200 dark:border-stone-800 mb-6 flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>{isRtl ? 'شهادة إلكترونية أصلية ومعتمدة ✓' : 'Authentic & Verified Certificate ✓'}</span>
                  </div>

                  <span className="font-mono text-xs font-bold text-stone-500 dark:text-stone-400">
                    ID: {certificate.certificateId}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                  <div>
                    <span className="block text-xs text-stone-400 mb-1">{isRtl ? 'اسم الطالب / المهندس:' : 'Student Name:'}</span>
                    <p className="text-lg font-bold text-dark dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">person</span>
                      <span>{certificate.studentName}</span>
                    </p>
                  </div>

                  <div>
                    <span className="block text-xs text-stone-400 mb-1">{isRtl ? 'عنوان الدورة المقررة:' : 'Completed Course:'}</span>
                    <p className="text-lg font-bold text-dark dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">school</span>
                      <span>{certificate.courseTitle}</span>
                    </p>
                  </div>

                  <div>
                    <span className="block text-xs text-stone-400 mb-1">{isRtl ? 'المدرب المشرف:' : 'Instructor:'}</span>
                    <p className="text-base font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-stone-400 text-base">badge</span>
                      <span>{certificate.instructorName || '—'}</span>
                    </p>
                  </div>

                  <div>
                    <span className="block text-xs text-stone-400 mb-1">{isRtl ? 'تاريخ التخرج والإصدار:' : 'Issue Date:'}</span>
                    <p className="text-base font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-stone-400 text-base">calendar_today</span>
                      <span>{certificate.formattedDate || certificate.formattedDateEn || new Date().toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                {/* Action button to open full certificate preview */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                  <button
                    onClick={() => setShowFullCert(true)}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-orange-700 text-white font-bold text-xs transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">visibility</span>
                    <span>{isRtl ? 'معاينة الشهادة الكاملة والطباعة' : 'View Full Certificate & Print'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Not Found Card */
              <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-2xl">error</span>
                </div>
                <h3 className="text-lg font-bold text-dark dark:text-white mb-2">
                  {isRtl ? 'لم يتم العثور على شهادة بهذا الرمز' : 'Certificate Not Found'}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                  {isRtl 
                    ? 'يرجى التأكد من كتابة رمز الشهادة بدقة مثل EDU-2026-XXXXXX كما هو مدون على وثيقة التخرج.' 
                    : 'Please ensure you entered the exact certificate ID (e.g. EDU-2026-XXXXXX) as shown on the document.'}
                </p>
              </div>
            )
          )}

        </div>
      </main>

      {/* Full Certificate Modal */}
      {showFullCert && certificate && (
        <CertificateModal
          certificate={certificate}
          onClose={() => setShowFullCert(false)}
        />
      )}

      <Footer />
    </div>
  );
}
