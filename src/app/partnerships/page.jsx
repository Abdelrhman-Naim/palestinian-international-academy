import Partnerships from '@/pages/Partnerships';

export const metadata = {
  title: 'الشراكات والتعاون الأكاديمي | أكاديمية فلسطين الدولية (PIA)',
  description: 'برامج الشراكة مع الجامعات والشركات التكنولوجية والمؤسسات المحلية والدولية.',
  alternates: {
    canonical: '/partnerships',
  },
};

export default function PartnershipsPage() {
  return <Partnerships />;
}
