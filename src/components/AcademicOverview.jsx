'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function AcademicOverview() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <section
      aria-label={isAr ? 'عن أكاديمية فلسطين الدولية والمسارات الأكاديمية' : 'About Palestinian International Academy and Academic Programs'}
      className="py-16 bg-white/70 dark:bg-[#151311] border-y border-stone-200/80 dark:border-stone-800/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="space-y-10 text-stone-800 dark:text-stone-200">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              {isAr ? 'صرح أكاديمي وتقني رائد' : 'Leading Academic & Technological Hub'}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              {isAr
                ? 'أكاديمية فلسطين الدولية: بوابتك لاحتراف التكنولوجيا وهندسة المستقبل'
                : 'Palestinian International Academy: Your Gateway to Tech Mastery'}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              {isAr
                ? 'تأسست أكاديمية فلسطين الدولية (PIA) لتكون المرجع التعليمي والتقني الرائد لإعداد الكفاءات الرقمية والهندسية المؤهلة للمنافسة في أسواق العمل المحلية والإقليمية والدولية، من خلال بيئة تعليمية تجمع بين التأصيل النظري والممارسة العملية المتطورة.'
                : 'Palestinian International Academy (PIA) was established as the premier academic and technical center empowering students and engineers with modern skills for the global technological marketplace.'}
            </p>
          </div>

          {/* Core Feature Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-4">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 space-y-3">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {isAr ? 'دبلومات ومسارات معتمدة' : 'Accredited Diplomas & Programs'}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {isAr
                  ? 'تغطي مساراتنا تخصصات هندسة البرمجيات المتقدمة، تطوير الويب المتكامل (Full-Stack)، علوم البيانات والذكاء الاصطناعي، الأمن السيبراني واختبار الاختراق، والحوسبة السحابية، بإشراف مدربين ومهندسين ذوي خبرة صناعية واسعة.'
                  : 'Comprehensive curricula spanning full-stack development, artificial intelligence, cybersecurity defense, and enterprise cloud architecture guided by senior industry veterans.'}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 space-y-3">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {isAr ? 'مكتبة رقمية تخصصية (1,500+ كتاب)' : 'Digital Specialized Library (1,500+ Books)'}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {isAr
                  ? 'نوفر لطلابنا وباحثينا مكتبة رقمية متكاملة تضم أكثر من 1525 كتاباً ومرجعاً أكاديمياً وبحثاً تخصصياً في علوم الحاسوب والرياضيات التطبيقية والشبكات، مع إمكانية التصفح السريع والتحميل المباشر الآمن.'
                  : 'An expansive technical library hosting over 1,525 curated textbooks, academic publications, and reference guides spanning programming, mathematics, and systems.'}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 space-y-3">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {isAr ? 'مختبرات سحابية وتوثيق رقمي فوري' : 'Cloud Labs & Instant Verification'}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {isAr
                  ? 'مختبرات افتراضية مدمجة لكتابة واختبار الأكواد البرمجية مباشرة من المتصفح دون تعقيدات التثبيت، إلى جانب منظومة التحقق الفوري بالرمز المشفر للشهادات الرسمية لضمان مصداقية الخريج أمام كافة جهات التوظيف.'
                  : 'Hands-on browser cloud coding sandboxes paired with cryptographically verified digital certificate authentication trusted by employers and academic institutions.'}
              </p>
            </div>
          </div>

          {/* Quick Links Footer */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-semibold">
            <Link
              href="/courses"
              className="text-amber-700 dark:text-amber-400 hover:underline"
            >
              {isAr ? '← استكشف جميع الدورات والمسارات' : 'Explore Courses →'}
            </Link>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <Link
              href="/library"
              className="text-amber-700 dark:text-amber-400 hover:underline"
            >
              {isAr ? '← تصفح المكتبة الأكاديمية' : 'Browse Library →'}
            </Link>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <Link
              href="/verify-certificate"
              className="text-amber-700 dark:text-amber-400 hover:underline"
            >
              {isAr ? '← فحص مصداقية الشهادات' : 'Verify Certificates →'}
            </Link>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <Link
              href="/about"
              className="text-amber-700 dark:text-amber-400 hover:underline"
            >
              {isAr ? '← عن الأكاديمية والاعتمادات' : 'About PIA →'}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
