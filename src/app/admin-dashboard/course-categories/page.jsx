import AdminCategories from '@/pages/admin/AdminCategories';

export const metadata = {
  title: 'تصنيفات الدورات | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminCourseCategoriesPage() {
  return <AdminCategories />;
}
