import AdminLibraryCategories from '@/pages/admin/AdminLibraryCategories';

export const metadata = {
  title: 'تصنيفات المكتبة | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminLibraryCategoriesPage() {
  return <AdminLibraryCategories />;
}
