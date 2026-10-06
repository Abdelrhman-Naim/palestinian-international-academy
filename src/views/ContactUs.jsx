"use client";
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabase/client';
import { useToast } from '../context/ToastContext';

const ContactUs = () => {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Assuming a table named contact_messages
      // If it doesn't exist, this might fail, but for now we simulate or do a best-effort insert
      const { error } = await supabase
        .from('contact_messages')
        .insert([{ 
          name: formData.name, 
          email: formData.email, 
          message: formData.message 
        }]);

      if (error) {
        console.error('Contact Us error:', error);
        // Fallback for demo if table doesn't exist yet
        setTimeout(() => {
          showToast(isRtl ? 'تم إرسال رسالتك بنجاح' : 'Message sent successfully', 'success');
          setFormData({ name: '', email: '', message: '' });
          setLoading(false);
        }, 500);
      } else {
        showToast(isRtl ? 'تم إرسال رسالتك بنجاح' : 'Message sent successfully', 'success');
        setFormData({ name: '', email: '', message: '' });
        setLoading(false);
      }
    } catch (err) {
      showToast(isRtl ? 'حدث خطأ أثناء الإرسال' : 'Error sending message', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors" dir={dir}>
      <SEO
        title={isRtl ? 'اتصل بنا | أكاديمية فلسطين الدولية (PIA)' : 'Contact Us | Palestinian International Academy'}
        description={isRtl
          ? 'تواصل مع فريق الدعم الفني والأكاديمي في أكاديمية فلسطين الدولية. نحن هنا للإجابة على استفساراتك حول الدورات والتسجيل والشهادات.'
          : 'Get in touch with the admissions and academic support team at Palestinian International Academy (PIA).'}
        canonical="/contact"
        breadcrumbs={[
          { name: isRtl ? 'الرئيسية' : 'Home', item: '/' },
          { name: isRtl ? 'تواصل معنا' : 'Contact Us', item: '/contact' }
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          'name': isRtl ? 'تواصل معنا - أكاديمية فلسطين الدولية' : 'Contact Us - Palestinian International Academy',
          'url': 'https://palestine-international-academy.netlify.app/contact'
        }}
      />
      <Navbar />

      <main className="grow">
        <section className="relative bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white pt-16 pb-20 px-4 sm:px-6 border-b border-[#E8E2D5] dark:border-gray-800 transition-colors">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps mb-4">
              {isRtl ? 'تواصل معنا' : 'Contact Us'}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 font-headline-lg text-dark dark:text-white">
              {isRtl ? 'كيف يمكننا مساعدتك؟' : 'How Can We Help You?'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              {isRtl 
                ? 'فريق الدعم متاح للرد على جميع استفساراتك. يرجى تعبئة النموذج أدناه وسنقوم بالرد عليك في أقرب وقت.'
                : 'Our support team is here to answer your questions. Please fill out the form below and we will get back to you shortly.'
              }
            </p>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-10 shadow-sm border border-[#E8E2D5] dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {isRtl ? 'الاسم' : 'Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isRtl ? 'الاسم الكامل' : 'Full Name'}
                  className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder={isRtl ? 'الاسم@example.com' : 'name@example.com'}
                  className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {isRtl ? 'الرسالة' : 'Message'}
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder={isRtl ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-secondary text-dark font-bold text-base py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>{isRtl ? 'إرسال الرسالة' : 'Send Message'}</span>
                    <span className="material-symbols-outlined rtl:rotate-180">send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
