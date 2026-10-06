import AdminSettings from '@/pages/admin/AdminSettings';

export const metadata = {
  title: 'إعدادات النظام | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return <AdminSettings />;
}
