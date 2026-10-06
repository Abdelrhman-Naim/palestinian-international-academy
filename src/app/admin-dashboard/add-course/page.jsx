import AddCourse from '@/pages/add-courses';

export const metadata = {
  title: 'إضافة دورة جديدة | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminAddCoursePage() {
  return <AddCourse />;
}
