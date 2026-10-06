import AdminCourses from '@/pages/admin/AdminCourses';

export const metadata = {
  title: 'إدارة الدورات | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminCoursesPage() {
  return <AdminCourses />;
}
