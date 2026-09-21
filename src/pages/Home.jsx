import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import LearningJourney from '../components/LearningJourney';
import CloudLab from '../components/CloudLab';
import PopularCourses from '../components/PopularCourses';
import TopBooks from '../components/TopBooks';
import PartnersTrust from '../components/PartnersTrust';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { dir } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors" dir={dir}>
      <Navbar />
      <main className="grow">
        <Hero />
        <Features />
        <LearningJourney />
        <CloudLab />
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
