import PrivacyPolicy from '@/pages/PrivacyPolicy';

export const metadata = {
  title: 'سياسة الخصوصية | أكاديمية فلسطين الدولية (PIA)',
  description: 'سياسة الخصوصية وحماية بيانات المستخدمين في أكاديمية فلسطين الدولية.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
