import ManageCourseExam from '@/pages/ManageCourseExam';

export const metadata = {
  title: 'إدارة الاختبار النهائي | لوحة المدرب',
  robots: { index: false, follow: false },
};

export default function InstructorExamsAliasPage() {
  return <ManageCourseExam />;
}
