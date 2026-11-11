import AdminShorts from '@/pages/admin/AdminShorts';

export const metadata = {
  title: 'الفيديوهات والمعلومات السريعة | لوحة تحكم الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminShortsPage() {
  return <AdminShorts />;
}
