import AdminCourseStudents from '@/pages/admin/AdminCourseStudents';

export const metadata = {
  title: 'طلاب الدورة | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminCoursesStudentsAliasPage() {
  return <AdminCourseStudents />;
}
