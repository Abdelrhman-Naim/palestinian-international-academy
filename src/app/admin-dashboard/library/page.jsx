import AdminLibrary from '@/pages/admin/AdminLibrary';

export const metadata = {
  title: 'إدارة المكتبة | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminLibraryPage() {
  return <AdminLibrary />;
}
