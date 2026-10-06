import EditCourse from '@/pages/EditCourse';

export const metadata = {
  title: 'تعديل الدورة | لوحة المدرب',
  robots: { index: false, follow: false },
};

export default function InstructorEditCoursePage() {
  return <EditCourse />;
}
