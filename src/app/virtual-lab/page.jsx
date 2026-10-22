import VirtualLabClient from './VirtualLabClient';

export const metadata = {
  title: 'المختبر الافتراضي الهندسي | أكاديمية فلسطين الدولية (PIA)',
  description: 'منصة المحاكاة السحابية والمختبر الهندسي والبرمجي الافتراضي المتقدم لطلاب وأكاديميي أكاديمية فلسطين الدولية (PIA).',
  alternates: {
    canonical: '/virtual-lab',
  },
};

export default function VirtualLabPage() {
  return <VirtualLabClient />;
}
