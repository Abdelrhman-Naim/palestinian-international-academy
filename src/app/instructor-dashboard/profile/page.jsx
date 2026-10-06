import InstructorProfile from '@/pages/instructor/InstructorProfile';

export const metadata = {
  title: 'الملف الشخصي للمدرب | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function InstructorProfilePage() {
  return <InstructorProfile />;
}
