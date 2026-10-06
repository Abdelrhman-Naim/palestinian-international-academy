import SupportCenter from '@/pages/SupportCenter';

export const metadata = {
  title: 'مركز الدعم والمساعدة | أكاديمية فلسطين الدولية (PIA)',
  description: 'إجابات على الأسئلة الشائعة وتواصل مع فريق الدعم الفني والأكاديمي.',
  alternates: {
    canonical: '/support',
  },
};

export default function SupportPage() {
  return <SupportCenter />;
}
