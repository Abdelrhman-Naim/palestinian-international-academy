"use client";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import LearningJourney from "../components/LearningJourney";
import CloudLab from "../components/CloudLab";
import Projects from "../components/Projects";
import PopularCourses from "../components/PopularCourses";
import TopBooks from "../components/TopBooks";
import PartnersTrust from "../components/PartnersTrust";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { useLanguage } from "../context/LanguageContext";

const Home = () => {
  const { language, dir, t } = useLanguage();
  const isAr = language === 'ar';

  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': 'https://palestine-international-academy.netlify.app/#organization',
        'name': isAr ? 'أكاديمية فلسطين الدولية' : 'Palestinian International Academy',
        'alternateName': ['PIA', 'أكاديمية فلسطين', 'PIA Academy', 'Palestinian International Academy'],
        'url': 'https://palestine-international-academy.netlify.app/',
        'logo': 'https://palestine-international-academy.netlify.app/logo-wep.png',
        'image': 'https://palestine-international-academy.netlify.app/screen.webp',
        'description': isAr
          ? 'منصة تعليمية وتدريبية متقدمة تقدم دبلومات ودورات تقنية ومهنية ومكتبة رقمية ومختبرات سحابية.'
          : 'Advanced educational platform offering accredited diplomas, technical courses, digital library, and cloud labs.',
        'foundingLocation': {
          '@type': 'Place',
          'name': isAr ? 'فلسطين' : 'Palestine'
        },
        'areaServed': [
          { '@type': 'Country', 'name': 'Palestine' },
          'Middle East',
          'Worldwide'
        ],
        'knowsAbout': [
          'Software Engineering',
          'Web Development',
          'Artificial Intelligence',
          'Cybersecurity',
          'Cloud Computing',
          'Data Science',
          'Computer Science'
        ],
        'sameAs': [
          'https://palestine-international-academy.netlify.app/',
          'https://twitter.com/PIA_Academy',
          'https://www.linkedin.com/school/palestine-international-academy'
        ],
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'customer support',
          'email': 'support@palestine-international-academy.netlify.app',
          'availableLanguage': ['Arabic', 'English']
        }
      },
      {
        '@type': 'WebSite',
        '@id': 'https://palestine-international-academy.netlify.app/#website',
        'url': 'https://palestine-international-academy.netlify.app/',
        'name': isAr ? 'أكاديمية فلسطين الدولية (PIA)' : 'Palestinian International Academy (PIA)',
        'publisher': {
          '@id': 'https://palestine-international-academy.netlify.app/#organization'
        },
        'inLanguage': isAr ? 'ar' : 'en',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://palestine-international-academy.netlify.app/courses?search={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://palestine-international-academy.netlify.app/#faq',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': t('homeNew.faq1Q') || 'هل الدورات مناسبة للمبتدئين أم تتطلب خبرة هندسية مسبقة؟',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': t('homeNew.faq1A') || 'تبدأ مساراتنا من الصفر بتأسيس متين ومشاريع عملية متدرجة حتى الاحتراف، مع تحديد المستوى المناسب لكل دورة بوضوح قبل البدء.'
            }
          },
          {
            '@type': 'Question',
            'name': t('homeNew.faq2Q') || 'كيف يتم توثيق الشهادات وما مدى اعتمادها في سوق العمل؟',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': t('homeNew.faq2A') || 'شهاداتنا معتمدة ومدعومة بروابط تحقق رقمية فريدة ومعترف بها لدى كبرى الشركات والمكاتب الهندسية الشريكة محلياً ودولياً.'
            }
          },
          {
            '@type': 'Question',
            'name': t('homeNew.faq3Q') || 'هل يمكنني الوصول للدورات والمختبر في أي وقت ومن أي جهاز؟',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': t('homeNew.faq3A') || 'نعم بالتأكيد! الوصول للمحتوى ولمختبر المحاكاة السحابي متاح 24/7 ومن أي جهاز عبر المتصفح مباشرة دون قيود.'
            }
          },
          {
            '@type': 'Question',
            'name': t('homeNew.faq4Q') || 'كيف يمكنني الحصول على مساعدة أو استفسار أكاديمي خلال دراستي؟',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': t('homeNew.faq4A') || 'يتوفر مجتمع تفاعلي وقنوات تواصل مباشرة مع المدربين والخبراء للرد على جميع استفساراتك وتوجيهك خطوة بخطوة.'
            }
          }
        ]
      }
    ]
  };

  return (
    <div
      className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased transition-colors"
      dir={dir}
    >
      <SEO
        title={isAr ? 'أكاديمية فلسطين الدولية (PIA) | الموقع الرسمي للدورات والشهادات المعتمدة' : 'Palestinian International Academy (PIA) | Official Platform'}
        description={isAr 
          ? 'الموقع الرسمي لأكاديمية فلسطين الدولية (PIA). منصة تدريبية رائدة تقدم مسارات تقنية معتمدة، مختبرات سحابية تفاعلية، ومكتبة رقمية تخصصية.'
          : 'Official platform of Palestinian International Academy (PIA). Premier educational institution providing accredited certifications, cloud labs, and digital library.'}
        canonical="/"
        schema={homeSchema}
      />
      <Navbar />
      <main className="grow">
        <Hero />
        <Features />
        <LearningJourney />
        <CloudLab />
        <Projects />
        <PopularCourses />
        <TopBooks />
        <PartnersTrust />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
