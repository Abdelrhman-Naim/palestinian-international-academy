import AdminProfile from '@/pages/admin/AdminProfile';

export const metadata = {
  title: 'الملف الشخصي للمسؤول | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminProfilePage() {
  return <AdminProfile />;
}
