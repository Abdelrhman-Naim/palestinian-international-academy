import AdminShortsCategories from '@/pages/admin/AdminShortsCategories';

export const metadata = {
  title: 'تصنيفات الفيديوهات والمعلومات | لوحة تحكم الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminShortsCategoriesPage() {
  return <AdminShortsCategories />;
}
