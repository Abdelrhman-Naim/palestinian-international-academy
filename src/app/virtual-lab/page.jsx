import VirtualLabClient from './VirtualLabClient';

export const metadata = {
  title: 'المختبر الافتراضي الهندسي | أكاديمية فلسطين الدولية',
  description: 'منصة المحاكاة السحابية والمختبر الهندسي الافتراضي المتقدم لطلاب وأكاديميي أكاديمية فلسطين الدولية',
};

export default function VirtualLabPage() {
  return <VirtualLabClient />;
}
