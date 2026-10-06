import AdminAddBook from '@/pages/admin/AdminAddBook';

export const metadata = {
  title: 'إضافة كتاب جديد | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminAddBookPage() {
  return <AdminAddBook />;
}
