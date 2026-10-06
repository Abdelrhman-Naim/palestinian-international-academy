import StudentProfile from '@/pages/student/StudentProfile';

export const metadata = {
  title: 'الملف الشخصي للطالب | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function StudentProfilePage() {
  return <StudentProfile />;
}
