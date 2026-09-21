import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

const TermsOfService = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors" dir={dir}>
      <Navbar />

      <main className="grow">
        {/* Header */}
        <section className="bg-[#FAF7F2] dark:bg-gray-900 pt-16 pb-12 px-4 sm:px-6 md:px-8 border-b border-[#E8E2D5] dark:border-gray-800 transition-colors">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps mb-4">
              {isRtl ? 'الوثائق القانونية' : 'Legal Documentation'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-dark dark:text-white mb-4">
              {isRtl ? 'شروط وسياسة الاستخدام' : 'Terms of Service'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {isRtl ? 'آخر تحديث: 14 سبتمبر 2026' : 'Last updated: September 14, 2026'}
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-16 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 sm:p-12 shadow-sm space-y-10">
            
            {/* Intro */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base font-extrabold">1</span>
                <span>{isRtl ? 'مقدمة والقبول بالشروط' : '1. Acceptance of Terms'}</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? 'مرحباً بكم في منصتنا التعليمية والهندسية. بإنشائك لحساب أو استخدامك لأي من خدمات المنصة والدورات والمكتبة والمعامل الافتراضية، فإنك توافق التزاماً كاملاً بهذه الشروط والسياسات. إذا كنت لا توافق على أي من هذه البنود، يرجى عدم استخدام المنصة.'
                  : 'Welcome to our platform. By registering or using any service, course, library, or virtual lab, you fully agree to comply with these terms.'}
              </p>
            </div>

            {/* Section 2: Account Terms */}
            <div className="space-y-4 pt-6 border-t border-[#E8E2D5] dark:border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base font-extrabold">2</span>
                <span>{isRtl ? 'شروط الحساب والأمان' : '2. Account Registration & Security'}</span>
              </h2>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed space-y-2">
                <li>{isRtl ? 'يجب تقديم معلومات دقيقة وحقيقية عند التسجيل (الاسم، البريد الإلكتروني، نوع الحساب).' : 'You must provide accurate and true registration info.'}</li>
                <li>{isRtl ? 'أنت مسؤول بشكل كامل عن حماية كلمة المرور والأنشطة الصادرة من حسابك الشخصي.' : 'You are responsible for protecting password and account activities.'}</li>
                <li>{isRtl ? 'يُحظر مشاركة بيانات الحساب أو استخدام الحساب من قِبل أكثر من شخص.' : 'Account credentials sharing is strictly prohibited.'}</li>
              </ul>
            </div>

            {/* Section 3: Intellectual Property */}
            <div className="space-y-4 pt-6 border-t border-[#E8E2D5] dark:border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base font-extrabold">3</span>
                <span>{isRtl ? 'حقوق الملكية الفكرية' : '3. Intellectual Property Rights'}</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? 'جميع المحتويات المرئية، المواد الهندسية، الكتب المرفوعة، الشفرات المصدريّة، والتصاميم هي ملك حصري للمنصة ولصنّاع المحتوى والمدربين المعتمدين. يُمنع منعاً باتاً نسخ أو إعادة إعادة بيع أو تسجيل أجزاء من الكورسات دون إذن خطي مسبق.'
                  : 'All course video material, library books, and source designs belong strictly to the platform and certified instructors.'}
              </p>
            </div>

            {/* Section 4: Subscriptions & Payments */}
            <div className="space-y-4 pt-6 border-t border-[#E8E2D5] dark:border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base font-extrabold">4</span>
                <span>{isRtl ? 'الشهادات والاعتمادات' : '4. Certificates & Verification'}</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? 'تُمنح شهادات إتمام الدورات فقط بعد استكمال كافة الدروس واجتياز التكليفات والاختبارات المحددة. كل شهادة تصدر مع كود تحقق موثق (QR Code) لضمان صحة البيانات.'
                  : 'Certificates are issued upon completing all course components and passing required assessments, backed by instant QR verification.'}
              </p>
            </div>

            {/* Section 5: Conduct & Termination */}
            <div className="space-y-4 pt-6 border-t border-[#E8E2D5] dark:border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base font-extrabold">5</span>
                <span>{isRtl ? 'قواعد السلوك وإنهاء الخدمة' : '5. Code of Conduct & Account Termination'}</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? 'تحتفظ المنصة بحق تعليق أو إغلاق أي حساب يخالف شروط الاستخدام أو يمارس سلوكاً غير لائق في بيئة التعلم أو المحادثات الفورية.'
                  : 'The platform reserves the right to suspend any account violating the code of conduct or terms of service.'}
              </p>
            </div>

            {/* Contact Info */}
            <div className="pt-6 border-t border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900/50 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-dark dark:text-white text-base">
                  {isRtl ? 'هل لديك أسئلة حول الشروط والقوانين؟' : 'Questions regarding our terms?'}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  {isRtl ? 'فريقنا القانوني والدعم الفني متواجد لمساعدتك.' : 'Our legal and support team is here to assist.'}
                </p>
              </div>
              <a
                href="mailto:support@pia.edu.ps"
                className="bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                support@pia.edu.ps
              </a>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
