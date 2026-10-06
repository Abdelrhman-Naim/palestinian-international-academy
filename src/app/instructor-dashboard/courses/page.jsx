import MyCourses from '@/views/MyCourses';

export const metadata = {
  title: 'إدارة دوراتي | لوحة المدرب',
  robots: { index: false, follow: false },
};

export default function InstructorCoursesAliasPage() {
  return <MyCourses />;
}
