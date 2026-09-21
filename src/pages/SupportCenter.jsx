import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const SupportCenter = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketData, setTicketData] = useState({ name: '', email: '', subject: '', message: '' });

  const faqs = [
    {
      q: isRtl ? 'كيف يمكنني الحصول على شهادة الإتمام عند الانتهاء من الكورس؟' : 'How do I issue my course completion certificate?',
      a: isRtl ? 'بعد إكمال مشاهدة 100% من الدروس واجتياز التكليفات والاختبار النهائي بنسبة نجاح 70% أو أكثر، يمكنك التوجه إلى تبويب "شهاداتي" من لوحة التحكم وتحميل الشهادة مع كود QR الموثق.' : 'Upon completing 100% of lectures and passing required quizzes with >= 70%, your certificate becomes available under "My Certificates" in your dashboard.'
    },
    {
      q: isRtl ? 'ما هي طريقة استعادة كلمة المرور إذا نسيتها؟' : 'How can I reset my password if forgotten?',
      a: isRtl ? 'في صفحة تسجيل الدخول، اضغط على "نسيت كلمة المرور؟" وادخل بريدك الإلكتروني. سيصلك رابط أمان لإعادة تعيين كلمة المرور فوراً.' : 'On the Login page, click "Forgot Password?" and enter your email address to receive a password reset link.'
    },
    {
      q: isRtl ? 'هل تشمل المنصة دورات تدريبية تطبيقية ومعامل سحابية؟' : 'Does the platform include practical labs and cloud software?',
      a: isRtl ? 'نعم! تحتوي منصتنا على مكتبة هندسية شاملة بالإضافة إلى المعمل الافتراضي التطبيقي لتنفيذ المشاريع البرمجية والهندسية مباشرة من المتصفح.' : 'Yes! We feature a comprehensive engineering library alongside interactive cloud simulation environments.'
    },
    {
      q: isRtl ? 'كيف يمكن للمؤسسات والشركات طلب تدريب جماعي لموظفيها؟' : 'How can companies order team enterprise training?',
      a: isRtl ? 'يمكن للمؤسسات تقديم طلب عبر صفحة الشراكات والمؤسسات (/partnerships) لتخصيص مسارات تدريبية ولوحات متابعة إدارية خاصة.' : 'Organizations can submit requests through our Partnerships page (/partnerships) to set up custom team tracks.'
    },
    {
      q: isRtl ? 'كيف يمكنني التواصل المباشر مع المدرب أو المحاضر؟' : 'How do I communicate directly with my instructor?',
      a: isRtl ? 'يمكنك التراسل المباشر مع مدرب الكورس عبر نظام الرسائل الفورية المدمج داخل لوحة الطالب (/dashboard/messages).' : 'You can message your course instructor directly via the embedded instant messaging system in your dashboard (/dashboard/messages).'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors" dir={dir}>
      <Navbar />

      <main className="grow">
        {/* Search Hero */}
        <section className="relative bg-[#FAF7F2] dark:bg-gray-900 pt-20 pb-20 px-4 sm:px-6 md:px-8 border-b border-[#E8E2D5] dark:border-gray-800 transition-colors overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps mb-4">
              {isRtl ? 'مركز المساعدة والدعم الفني' : 'Help & Support Center'}
            </span>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-dark dark:text-white mb-6">
              {isRtl ? 'كيف يمكننا مساعدتك اليوم؟' : 'How can we help you today?'}
            </h1>

            {/* Search Input Box */}
            <div className="max-w-2xl mx-auto relative">
              <span className="material-symbols-outlined absolute inset-y-0 inset-s-4 my-auto text-gray-400 text-2xl h-fit pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث عن إجابة، سؤال شائع، أو مشكلة تقنية...' : 'Search for questions, help articles, or issues...'}
                className="w-full rounded-2xl border border-[#E8E2D5] dark:border-gray-700 bg-white dark:bg-gray-800 ps-12 pe-4 py-4 text-sm sm:text-base text-dark dark:text-white shadow-md focus:border-primary focus:outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white mb-2">
              {isRtl ? 'تصفح أقسام الدعم' : 'Browse Support Categories'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isRtl ? 'اختر القسم المناسب للوصول السريع إلى الإرشادات المطلوبة' : 'Select a category for quick guides'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: 'account_circle',
                title: isRtl ? 'الحساب والدخول' : 'Account & Login',
                desc: isRtl ? 'تغيير كلمة المرور، تعديل الملف الشخصي، وإدارة الأمان.' : 'Password reset, profile settings, and security.'
              },
              {
                icon: 'school',
                title: isRtl ? 'الكورسات والدورات' : 'Courses & Progress',
                desc: isRtl ? 'متابعة المحاضرات، حل الاختبارات، والتكليفات.' : 'Lecture video playback, quizzes, and assignments.'
              },
              {
                icon: 'verified_user',
                title: isRtl ? 'الشهادات والتحقق' : 'Certificates & QR',
                desc: isRtl ? 'تحميل الشهادات، التحقق الموثق، وبيانات التخرج.' : 'Download certificates and QR validation.'
              },
              {
                icon: 'handshake',
                title: isRtl ? 'الشراكات والمؤسسات' : 'Enterprise & B2B',
                desc: isRtl ? 'تدريب الموظفين، الترخيص المؤسسي، ولوحات الأداء.' : 'Team training, lab licensing, and corporate B2B.'
              }
            ].map((cat, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                </div>
                <h3 className="font-bold text-dark dark:text-white text-base mb-2">{cat.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="py-12 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto mb-16">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">
              {isRtl ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-dark dark:text-white">
              {isRtl ? 'إجابات مباشرة على استفساراتكم' : 'Quick Answers to Popular Inquiries'}
            </h2>
          </div>

          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl overflow-hidden transition-colors shadow-xs"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-5 text-start flex items-center justify-between gap-4 font-bold text-dark dark:text-white text-base sm:text-lg cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className="material-symbols-outlined text-primary shrink-0 transition-transform duration-300">
                        {isOpen ? 'remove' : 'add'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed border-t border-[#FAF7F2] dark:border-gray-700/60 pt-4">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-[#E8E2D5] dark:border-gray-700 text-gray-500">
                {isRtl ? 'لم نجد نتائج مطابقة لجميع كلمات البحث.' : 'No FAQ matches found for your search query.'}
              </div>
            )}
          </div>
        </section>

        {/* Contact Ticket Form Section */}
        <section className="py-16 bg-[#F3EFE6] dark:bg-gray-800/80 border-t border-[#E8E2D5] dark:border-gray-700 px-4 sm:px-6 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 sm:p-10 shadow-md">
              <div className="text-center max-w-xl mx-auto mb-8">
                <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">support_agent</span>
                </span>
                <h3 className="text-2xl font-extrabold text-dark dark:text-white mb-2">
                  {isRtl ? 'هل ما زلت بحاجة لمساعدة؟' : 'Still Need Assistance?'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  {isRtl ? 'أرسل تذكرة دعم مباشرة وسيقوم فريقنا التقني بالرد عليك عبر البريد الإلكتروني.' : 'Submit a support ticket and our technical team will assist you.'}
                </p>
              </div>

              {ticketSent ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl">check</span>
                  </div>
                  <h4 className="text-xl font-bold text-dark dark:text-white">
                    {isRtl ? 'تم إرسال تذكرة الدعم بنجاح' : 'Support Ticket Submitted!'}
                  </h4>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    {isRtl ? 'تم استلام تذكرتك ورقم المتابعة الخاص بك. سيتواصل معك أحد ممثلي الدعم قريباً.' : 'We have received your ticket and will respond to your email address soon.'}
                  </p>
                  <button
                    onClick={() => { setTicketSent(false); setTicketData({ name: '', email: '', subject: '', message: '' }); }}
                    className="bg-primary text-dark font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-secondary transition-colors"
                  >
                    {isRtl ? 'إرسال تذكرة أخرى' : 'Submit Another Ticket'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {isRtl ? 'الاسم *' : 'Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={ticketData.name}
                        onChange={e => setTicketData({ ...ticketData, name: e.target.value })}
                        placeholder={isRtl ? 'اسمك الكامل' : 'Your Name'}
                        className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {isRtl ? 'البريد الإلكتروني *' : 'Email *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={ticketData.email}
                        onChange={e => setTicketData({ ...ticketData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {isRtl ? 'عنوان الموضوع / المشكلة *' : 'Subject / Problem Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={ticketData.subject}
                      onChange={e => setTicketData({ ...ticketData, subject: e.target.value })}
                      placeholder={isRtl ? 'مثال: مشكلة في فتح محتوى كورس الهندسة' : 'e.g., Issue opening lecture video'}
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {isRtl ? 'تفاصيل التذكرة *' : 'Ticket Message Details *'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={ticketData.message}
                      onChange={e => setTicketData({ ...ticketData, message: e.target.value })}
                      placeholder={isRtl ? 'اشرح المشكلة بالتفصيل ومكان ظهورها...' : 'Describe the issue in detail...'}
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold text-base py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isRtl ? 'إرسال تذكرة الدعم' : 'Submit Support Ticket'}</span>
                    <span className="material-symbols-outlined text-lg rtl:rotate-180">send</span>
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

export default SupportCenter;
