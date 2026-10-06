import Home from '@/pages/Home';

export const metadata = {
  title: 'الرئيسية | أكاديمية فلسطين الدولية (PIA)',
  description: 'انضم إلى الأكاديمية الفلسطينية الدولية واحصل على أفضل الدورات البرمجية والتقنية بشهادات معتمدة ومختبرات سحابية تفاعلية ومكتبة رقمية شاملة.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return <Home />;
}
