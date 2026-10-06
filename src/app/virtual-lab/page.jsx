import dynamic from 'next/dynamic';
import PageLoader from '@/components/PageLoader';

const VirtualLabClient = dynamic(() => import('@/pages/VirtualLab'), {
  ssr: false,
  loading: () => <PageLoader fullScreen={true} />,
});

export const metadata = {
  title: 'المختبر الافتراضي الهندسي | أكاديمية فلسطين الدولية',
  description: 'منصة المحاكاة السحابية والمختبر الهندسي الافتراضي المتقدم لطلاب وأكاديميي أكاديمية فلسطين الدولية',
};

export default function VirtualLabPage() {
  return <VirtualLabClient />;
}
