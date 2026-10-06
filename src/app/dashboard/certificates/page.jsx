import StudentCertificates from '@/pages/student/StudentCertificates';

export const metadata = {
  title: 'شهاداتي وإنجازاتي | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function StudentCertificatesPage() {
  return <StudentCertificates />;
}
