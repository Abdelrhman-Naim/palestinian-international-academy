import AddCourse from '@/pages/add-courses';

export const metadata = {
  title: 'إضافة دورة جديدة | لوحة المدرب',
  robots: { index: false, follow: false },
};

export default function InstructorAddCoursesAliasPage() {
  return <AddCourse />;
}
