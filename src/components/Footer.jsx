import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full bg-[#FAF7F2] dark:bg-[#12100E] text-dark dark:text-white pt-16 pb-12 px-4 md:px-8 border-t border-[#E8E2D5] dark:border-[#2C2722] transition-colors"
      dir={dir}
    >
      <div className="max-w-7xl mx-auto">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 text-right rtl:text-right ltr:text-left">
          {/* Column 1: Brand Logo & Description */}
          <div className="space-y-4">
            <Link to="/" className="w-full justify-center inline-flex items-center gap-3 group">
              <div>
                <div className="w-full flex text-center">
                <img
                src={logo}
                alt="PALESTINIAN INTERNATIONAL ACADEMY (PIA)"
                className="h-25 w-full object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-300"
              />
              </div>
              </div>
            </Link>

            <p className="text-gray-600 dark:text-stone-400 text-xs sm:text-sm leading-relaxed max-w-xs font-body-md">
              {isRtl
                ? 'المنصة العربية المتخصصة في التدريب الهندسي التطبيقي والمعامل السحابية الافتراضية.'
                : 'The specialized Arab platform for applied engineering training and virtual cloud labs.'}
            </p>
          </div>

          {/* Column 2: المسارات والدورات (Courses & Tracks) */}
          <div>
            <h4 className="font-bold text-dark dark:text-white text-base mb-4 font-headline-sm">
              {isRtl ? 'المسارات والدورات' : 'Courses & Tracks'}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 dark:text-stone-400 font-body-md">
              <li>
                <Link to="/courses" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'جميع الدورات والبرامج' : 'All Courses & Programs'}
                </Link>
              </li>
              <li>
                <Link to="/library" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'المكتبة الهندسية والرقمية' : 'Engineering Digital Library'}
                </Link>
              </li>
              <li>
                <Link to="/virtual-lab" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'المعمل السحابي الافتراضي' : 'Virtual Cloud Lab'}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'عن الأكاديمية والاعتماد' : 'About PIA & Accreditation'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: الخدمات والتحقق (Services & Verification) */}
          <div>
            <h4 className="font-bold text-dark dark:text-white text-base mb-4 font-headline-sm">
              {isRtl ? 'الخدمات والتحقق' : 'Services & Verification'}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 dark:text-stone-400 font-body-md">
              <li>
                <Link to="/verify-certificate" className="hover:text-primary dark:hover:text-amber-400 transition-colors font-bold text-primary dark:text-amber-400">
                  {isRtl ? 'التحقق من الشهادة الرقمية' : 'Certificate Verification'}
                </Link>
              </li>
              <li>
                <Link to="/partnerships" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'المؤسسات والشراكات الهندسية' : 'Partnerships & Organizations'}
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'مركز المساعدة والدعم الفني' : 'Help & Support Center'}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'فريق العمل والمدربون' : 'Instructors & Team'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: السياسات والدعم (Policies & Support) */}
          <div>
            <h4 className="font-bold text-dark dark:text-white text-base mb-4 font-headline-sm">
              {isRtl ? 'السياسات والخصوصية' : 'Policies & Privacy'}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 dark:text-stone-400 font-body-md">
              <li>
                <Link to="/privacy" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'شروط الاستخدام والخدمة' : 'Terms of Service'}
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'الأسئلة الشائعة والدعم' : 'FAQ & Support'}
                </Link>
              </li>
              <li>
                <Link to="/verify-certificate" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
                  {isRtl ? 'فحص الكود والـ QR للشهادات' : 'QR Code Verification'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar Separator & Copyright */}
        <div className="border-t border-[#E8E2D5] dark:border-[#2C2722] pt-8 mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-stone-400 font-body-md">
          {/* Copyright text */}
          <p className="text-center md:text-right rtl:md:text-right ltr:md:text-left">
            © {currentYear} PALESTINIAN INTERNATIONAL ACADEMY (PIA).{' '}
            {isRtl
              ? 'جميع الحقوق محفوظة لـ أكاديمية فلسطين الدولية.'
              : 'All rights reserved.'}
          </p>

          {/* Bottom links */}
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
              {isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <Link to="/terms" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
              {isRtl ? 'شروط الاستخدام' : 'Terms of Use'}
            </Link>
            <Link to="/about" className="hover:text-primary dark:hover:text-amber-400 transition-colors">
              {isRtl ? 'مركز الدعم' : 'Support Center'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
