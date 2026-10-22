import Home from '@/pages/Home';

export const metadata = {
  title: 'أكاديمية فلسطين الدولية (PIA) | الموقع الرسمي للدورات المعتمدة والمختبرات السحابية',
  description: 'الموقع الرسمي لأكاديمية فلسطين الدولية (PIA). منصة تعليمية وتدريبية معتمدة تقدم دورات البرمجة والذكاء الاصطناعي، ومكتبة رقمية ومختبرات سحابية تفاعلية بشهادات موثوقة.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return <Home />;
}
