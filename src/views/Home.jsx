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
  const { language, dir } = useLanguage();
  const isAr = language === 'ar';

  const homeSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    'name': isAr ? 'أكاديمية فلسطين الدولية' : 'Palestinian International Academy',
    'url': 'https://palestine-international-academy.netlify.app/',
    'logo': 'https://palestine-international-academy.netlify.app/logo-wep.png',
    'description': isAr
      ? 'منصة تعليمية وتدريبية متقدمة تقدم دبلومات ودورات تقنية ومهنية ومكتبة رقمية ومختبرات سحابية.'
      : 'Advanced educational platform offering accredited diplomas, technical courses, digital library, and cloud labs.'
  };

  return (
    <div
      className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased transition-colors"
      dir={dir}
    >
      <SEO
        title={isAr ? 'الرئيسية | أكاديمية فلسطين الدولية (PIA)' : 'Home | Palestinian International Academy (PIA)'}
        description={isAr 
          ? 'انضم إلى الأكاديمية الفلسطينية الدولية واحصل على أفضل الدورات البرمجية والتقنية بشهادات معتمدة ومختبرات سحابية تفاعلية ومكتبة رقمية شاملة.'
          : 'Join the Palestinian International Academy for accredited tech and programming courses, interactive cloud labs, and a comprehensive digital library.'}
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
