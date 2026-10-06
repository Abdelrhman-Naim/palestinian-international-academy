import AdminActivityLogs from '@/pages/admin/AdminActivityLogs';

export const metadata = {
  title: 'سجلات النشاط | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminActivityLogsPage() {
  return <AdminActivityLogs />;
}
