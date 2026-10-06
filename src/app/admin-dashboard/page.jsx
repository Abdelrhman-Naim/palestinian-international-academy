import AdminOverview from '@/pages/admin/AdminOverview';

export const metadata = {
  title: 'لوحة التحكم الإدارية | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return <AdminOverview />;
}
