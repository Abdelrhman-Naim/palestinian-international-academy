import TermsOfService from '@/pages/TermsOfService';

export const metadata = {
  title: 'شروط الخدمة والاستخدام | أكاديمية فلسطين الدولية (PIA)',
  description: 'شروط الاستخدام والاتفاقية التعليمية لمنصة أكاديمية فلسطين الدولية.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return <TermsOfService />;
}
