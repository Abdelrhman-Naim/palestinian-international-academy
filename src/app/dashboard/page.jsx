import StudentOverview from '@/pages/StudentOverview';

export const metadata = {
  title: 'لوحة تحكم الطالب | أكاديمية فلسطين الدولية',
  description: 'لوحة تحكم الطالب الأكاديمية لمتابعة الدورات والواجبات والإنجازات',
  robots: { index: false, follow: false },
};

export default function StudentDashboardPage() {
  return <StudentOverview />;
}
