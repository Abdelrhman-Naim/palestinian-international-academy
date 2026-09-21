import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomSelect from '../components/CustomSelect';
import { useLanguage } from '../context/LanguageContext';

const Partnerships = () => {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const [formData, setFormData] = useState({
    fullName: '',
    orgName: '',
    email: '',
    phone: '',
    partnershipType: 'corporate_training',
    traineesCount: '10-50',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const typeOptions = [
    { value: 'corporate_training', label: isRtl ? 'تدريب كوادر ومهندسين' : 'Corporate Team Training' },
    { value: 'academic_partner', label: isRtl ? 'شراكة أكاديمية / جامعية' : 'Academic / University Partnership' },
    { value: 'lab_license', label: isRtl ? 'ترخيص معامل افتراضية' : 'Virtual Cloud Lab Licensing' },
    { value: 'sponsorship', label: isRtl ? 'رعاية وتوظيف متدربين' : 'Student Sponsorship & Hiring' },
    { value: 'other', label: isRtl ? 'خيار آخر' : 'Other' }
  ];

  const countOptions = [
    { value: '1-10', label: '1 - 10' },
    { value: '10-50', label: '10 - 50' },
    { value: '50-200', label: '50 - 200' },
    { value: '200+', label: '200+' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors" dir={dir}>
      <Navbar />

      <main className="grow">
        {/* Hero Section */}
        <section className="relative bg-[#FAF7F2] dark:bg-gray-900 pt-20 pb-20 px-4 sm:px-6 md:px-8 border-b border-[#E8E2D5] dark:border-gray-800 transition-colors overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              <span className="block text-dark dark:text-white mb-2">
                {isRtl ? 'نبني الشراكات الرقمية مع' : 'Partnering with Leading'}
              </span>
              <span className="bg-linear-to-r from-[#e5be53] via-primary to-[#b38b22] bg-clip-text text-transparent">
                {isRtl ? 'المؤسسات والشركات الهندسية' : 'Engineering Enterprises & Universities'}
              </span>
            </h1>

            <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-8">
              {isRtl
                ? 'نوفر برامج تدريبية مخصصة، ترخيص معامل سحابية، ولوحات تحكم متابعة للمؤسسات والجامعات لرفع كفاءة الكوادر الهندسية بأعلى المعايير العالمية.'
                : 'Empowering enterprise teams and academic institutions with tailored engineering tracks, cloud labs, and analytics dashboards.'}
            </p>
          </div>
        </section>

        {/* Form & Value Proposition Section */}
        <section className="py-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Info Box (5 cols) */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">
                  {isRtl ? 'لماذا تختار منصتنا لمؤسستك؟' : 'Why Partner With Us?'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white mb-4">
                  {isRtl ? 'منظومة تدريبية متكاملة تخدم اهداف مؤسستك' : 'Comprehensive Training Engine for Enterprise'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                  {isRtl
                    ? 'صممنا حلولنا المؤسسية لتلبي متطلبات المشاريع الضخمة وسوق العمل الهندسي الحقيقي.'
                    : 'Custom enterprise programs built for large-scale engineering delivery and real market standards.'}
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-4">
                {[
                  {
                    icon: 'dashboard_customize',
                    title: isRtl ? 'لوحة تحكم إدارية خاصة' : 'Custom Management Dashboard',
                    desc: isRtl ? 'متابعة نِسب الإنجاز، الحضور، وتقارير أداء الكوادر لحظة بلحظة.' : 'Track team attendance, progress metrics, and performance analytics.'
                  },
                  {
                    icon: 'verified',
                    title: isRtl ? 'شهادات معتمدة ورسمية' : 'Verified Enterprise Certificates',
                    desc: isRtl ? 'إصدار شهادات موثقة برمز كيو آر (QR) لمنع التزوير وتسهيل التحقق.' : 'Issue verified credentials with instant QR verification.'
                  },
                  {
                    icon: 'cloud_sync',
                    title: isRtl ? 'ربط المعامل الافتراضية' : 'Cloud Simulation Lab Integration',
                    desc: isRtl ? 'إتاحة بيئة محاكاة تطبيقية لتدريب المهندسين على البرامج والمشاريع.' : 'Provide engineers with cloud simulation sandbox environments.'
                  },
                  {
                    icon: 'support_agent',
                    title: isRtl ? 'مدير حساب فني مخصص' : 'Dedicated Account Manager',
                    desc: isRtl ? 'دعم وتنسيق متواصل لضمان تحقيق الأهداف التدريبية للمؤسسة.' : 'Continuous technical support to ensure your organization goals.'
                  }
                ].map((item, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 p-5 rounded-2xl flex items-start gap-4 shadow-xs transition-all hover:border-primary/40">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-dark dark:text-white text-base mb-1">{item.title}</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Form Card (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 sm:p-10 shadow-md">
              {submitted ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-dark dark:text-white">
                    {isRtl ? 'تم استلام طلب الشراكة بنجاح!' : 'Partnership Request Submitted!'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                    {isRtl
                      ? 'شكراً لتواصلك معنا. سيتواصل معك مستشار العلاقات المؤسسية في أقرب وقت لمناقشة التفاصيل وتصميم الخطة المناسبة.'
                      : 'Thank you for reaching out. Our institutional partnerships team will contact you shortly.'}
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ fullName: '', orgName: '', email: '', phone: '', partnershipType: 'corporate_training', traineesCount: '10-50', message: '' }); }}
                    className="mt-4 bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm shadow-sm"
                  >
                    {isRtl ? 'إرسال طلب آخر' : 'Submit Another Request'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="border-b border-[#E8E2D5] dark:border-gray-700 pb-4 mb-6">
                    <h3 className="text-xl font-bold text-dark dark:text-white mb-1">
                      {isRtl ? 'طلب تواصل للشراكات والمؤسسات' : 'Institutional Lead Generation Form'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                      {isRtl ? 'يرجى تعبئة النموذج التالي وسيقوم فريقنا بالتواصل معكم في غضون 24 ساعة.' : 'Fill out the form below and our partnerships team will get back to you within 24 hours.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {isRtl ? 'الاسم الكامل *' : 'Full Name *'}
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute inset-y-0 inset-s-3.5 my-auto text-gray-400 text-lg h-fit pointer-events-none">
                          person
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder={isRtl ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                          className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-700/60 ps-10 pe-4 py-3 text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {isRtl ? 'اسم المؤسسة / الشركة / الجامعة *' : 'Organization Name *'}
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute inset-y-0 inset-s-3.5 my-auto text-gray-400 text-lg h-fit pointer-events-none">
                          domain
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.orgName}
                          onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                          placeholder={isRtl ? 'مثال: شركة الإنشاءات الوطنية' : 'e.g., National Eng Corp'}
                          className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-700/60 ps-10 pe-4 py-3 text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {isRtl ? 'البريد الإلكتروني الرسمي *' : 'Official Work Email *'}
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute inset-y-0 inset-s-3.5 my-auto text-gray-400 text-lg h-fit pointer-events-none">
                          mail
                        </span>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-700/60 ps-10 pe-4 py-3 text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {isRtl ? 'رقم التواصل / الواتساب *' : 'Phone / WhatsApp *'}
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute inset-y-0 inset-s-3.5 my-auto text-gray-400 text-lg h-fit pointer-events-none">
                          call
                        </span>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+966 5x xxx xxxx"
                          className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-700/60 ps-10 pe-4 py-3 text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {isRtl ? 'نوع الشراكة المطلوب' : 'Partnership Type'}
                      </label>
                      <CustomSelect
                        options={typeOptions}
                        value={formData.partnershipType}
                        onChange={val => setFormData({ ...formData, partnershipType: val })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {isRtl ? 'عدد المتدربين المتوقع' : 'Estimated Trainees Count'}
                      </label>
                      <CustomSelect
                        options={countOptions}
                        value={formData.traineesCount}
                        onChange={val => setFormData({ ...formData, traineesCount: val })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {isRtl ? 'تفاصيل الإحتياج التدريبي أو الرسالة' : 'Additional Message Details'}
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder={isRtl ? 'اكتب باختصار أهداف المؤسسة والمسارات المطلوبة...' : 'Briefly describe your training goals and requirements...'}
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-700/60 p-4 text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold text-base py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>{isRtl ? 'إرسال طلب الشراكة' : 'Submit Partnership Inquiry'}</span>
                        <span className="material-symbols-outlined text-lg rtl:rotate-180">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Partnerships;
