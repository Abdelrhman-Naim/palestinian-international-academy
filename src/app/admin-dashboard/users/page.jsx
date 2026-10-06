import AdminUsers from '@/pages/admin/AdminUsers';

export const metadata = {
  title: 'إدارة المستخدمين | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return <AdminUsers />;
}
