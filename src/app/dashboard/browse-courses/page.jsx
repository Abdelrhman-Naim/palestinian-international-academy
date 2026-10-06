import Courses from '@/pages/Courses';

export const metadata = {
  title: 'استعراض الدورات | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function StudentBrowseCoursesPage() {
  return <Courses embedded={true} />;
}
