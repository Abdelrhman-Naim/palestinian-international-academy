import InstructorOverview from '@/pages/InstructorOverview';

export const metadata = {
  title: 'لوحة تحكم المدرب | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function InstructorDashboardPage() {
  return <InstructorOverview />;
}
