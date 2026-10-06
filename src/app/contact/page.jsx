import ContactUs from '@/pages/ContactUs';

export const metadata = {
  title: 'اتصل بنا | أكاديمية فلسطين الدولية (PIA)',
  description: 'تواصل مع فريق الدعم والإدارة في أكاديمية فلسطين الدولية للاستفسار عن الدورات والتسجيل والخدمات الأكاديمية.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return <ContactUs />;
}
