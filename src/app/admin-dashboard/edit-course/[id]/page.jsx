import EditCourse from '@/pages/EditCourse';

export const metadata = {
  title: 'تعديل الدورة | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminEditCoursePage() {
  return <EditCourse />;
}
