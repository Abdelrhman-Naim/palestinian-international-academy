import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const PrivacyPolicy = () => {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors" dir={dir}>
      <Navbar />

      <main className="grow">
        {/* Header Banner */}
        <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white py-16 md:py-20 px-4 text-center border-b border-[#E8E2D5] dark:border-gray-800 relative overflow-hidden transition-colors">
          <div className="relative z-10 max-w-4xl mx-auto">
            <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps mb-4">
              {isRtl ? 'الحماية والخصوصية' : 'Security & Privacy'}
            </span>
            
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 font-headline-lg text-dark dark:text-white">
              {t('footer.privacy') || (isRtl ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection Policy')}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              {isRtl 
                ? 'نحن نلتزم بحماية بياناتك الشخصية وحريتك في التحكم بمعلوماتك وفقاً لقانون حماية البيانات الشخصية رقم 151 لسنة 2020 وأعلى المعايير الأمنية العالمية.'
                : 'We are committed to safeguarding your personal data and privacy in compliance with Law 151/2020 (PDPL) and global cybersecurity standards.'
              }
            </p>

            <div className="mt-4 text-xs font-bold text-gray-500 dark:text-gray-400">
              {isRtl ? 'آخر تحديث: سبتمبر 2026' : 'Last Updated: September 2026'}
            </div>
          </div>
        </section>

        {/* Policy Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-10">
          
          {/* Card 1: Overview */}
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-xs transition-colors">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">info</span>
              <h2 className="text-xl md:text-2xl font-bold text-dark dark:text-white">
                {isRtl ? '1. مقدمة ونطاق التطبيق' : '1. Overview & Scope'}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
              {isRtl
                ? 'توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية البيانات الشخصية للطلاب والمدربين والزوار على منصة أكاديمية فلسطين الدولية. باستخدامك للمنصة، فإنك توافق على ممارسات جمع البيانات الموضحة في هذه السياسة.'
                : 'This Privacy Policy explains how PALESTINIAN INTERNATIONAL ACADEMY (PIA) collects, uses, stores, and protects personal data for students, instructors, and visitors. By accessing our platform, you agree to the data handling practices described herein.'
              }
            </p>
          </div>

          {/* Card 2: Data We Collect */}
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-xs transition-colors">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">database</span>
              <h2 className="text-xl md:text-2xl font-bold text-dark dark:text-white">
                {isRtl ? '2. البيانات التي نجمعها' : '2. Information We Collect'}
              </h2>
            </div>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">check_circle</span>
                <span><strong>{isRtl ? 'بيانات الحساب:' : 'Account Details:'}</strong> {isRtl ? 'الاسم الكامل، البريد الإلكتروني، نوع الحساب (طالب / مدرب / أدمن)، ورابط الصورة الشخصية.' : 'Full name, email address, role type (student/instructor/admin), and profile image.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">check_circle</span>
                <span><strong>{isRtl ? 'بيانات التعلم والتفاعل:' : 'Learning & Progress:'}</strong> {isRtl ? 'الدورات المسجلة، التقدم الدراسي، التكليفات المرفوعة، والمحادثات التفاعلية داخل المجموعات الرسمية.' : 'Enrolled courses, completion progress, assignment submissions, and interactive course chat messages.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">check_circle</span>
                <span><strong>{isRtl ? 'البيانات التقنية:' : 'Technical Data:'}</strong> {isRtl ? 'نوع المتصفح، عنوان IP، والتأكيدات الأمنية المشفرة أثناء تسجيل الدخول.' : 'Browser type, IP address, and secure authentication tokens.'}</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Security & Encryption */}
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-xs transition-colors">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
              <h2 className="text-xl md:text-2xl font-bold text-dark dark:text-white">
                {isRtl ? '3. الأمان وتشفير البيانات' : '3. Data Security & Encryption'}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base mb-4">
              {isRtl
                ? 'تلتزم المنصة بتطبيق أعلى البروتوكولات الأمنية العالمية لمنع الوصول غير المصرح به أو تسريب البيانات:'
                : 'PALESTINIAN INTERNATIONAL ACADEMY (PIA) implements enterprise-grade technical and organizational security measures:'
              }
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-gray-700/50 border border-[#E8E2D5] dark:border-gray-600">
                <h4 className="font-bold text-dark dark:text-white mb-1 text-sm">{isRtl ? 'التشفير أثناء النقل (TLS/SSL)' : 'In-Transit Encryption'}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{isRtl ? 'جميع الاتصالات مشفرة ببروتوكول HTTPS المشفر.' : 'All network traffic is encrypted via TLS/HTTPS.'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-gray-700/50 border border-[#E8E2D5] dark:border-gray-600">
                <h4 className="font-bold text-dark dark:text-white mb-1 text-sm">{isRtl ? 'حماية الرؤوس الأمنية (Security Headers)' : 'Strict Security Headers'}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{isRtl ? 'تطبيق حماية CSP، منع Clickjacking، وحظر MIME Sniffing.' : 'Enforces CSP, anti-Clickjacking, and nosniff protection.'}</p>
              </div>
            </div>
          </div>

          {/* Card 4: User Rights */}
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-xs transition-colors">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">gavel</span>
              <h2 className="text-xl md:text-2xl font-bold text-dark dark:text-white">
                {isRtl ? '4. حقوق المستخدم (قانون 151 لسنة 2020)' : '4. Your Rights (PDPL Compliance)'}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base mb-3">
              {isRtl
                ? 'يحق لك في أي وقت ممارسة حقوقك المتعلقة ببياناتك الشخصية:'
                : 'Under Personal Data Protection regulations, you reserve the right to:'
              }
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm md:text-base pe-2">
              <li>{isRtl ? 'الاطلاع والحصول على نسخة من بياناتك الشخصية.' : 'Access and request a copy of your stored personal data.'}</li>
              <li>{isRtl ? 'تعديل أو تصحيح البيانات غير الدقيقة.' : 'Request correction or updates to inaccurate records.'}</li>
              <li>{isRtl ? 'طلب حذف حسابك وبياناتك نهائياً من سيرفرات المنصة.' : 'Request permanent deletion of your profile and data.'}</li>
              <li>{isRtl ? 'سحب الموافقة على معالجة البيانات غير الأساسية.' : 'Withdraw consent for optional non-essential processing.'}</li>
            </ul>
          </div>

          {/* Card 5: Contact */}
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-xs text-center transition-colors">
            <h3 className="text-lg md:text-xl font-bold text-dark dark:text-white mb-2">
              {isRtl ? 'هل لديك أي استفسار حول الخصوصية؟' : 'Have Questions About Privacy?'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              {isRtl ? 'فريق مسؤول حماية البيانات (DPO) متواجد للرد على كافة الاستفسارات بخصوص بياناتك.' : 'Our Data Protection team is here to assist with any questions regarding your data rights.'}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold px-6 py-3 rounded-xl transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">mail</span>
              <span>{isRtl ? 'تواصل معنا' : 'Contact Support'}</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
