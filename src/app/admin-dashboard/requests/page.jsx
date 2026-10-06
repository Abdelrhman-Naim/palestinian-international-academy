import AdminRequests from '@/pages/admin/AdminRequests';

export const metadata = {
  title: 'طلبات الانضمام | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminRequestsPage() {
  return <AdminRequests />;
}
