import SubmittedAssignments from '@/pages/SubmittedAssignments';

export const metadata = {
  title: 'تسليمات الطلاب | لوحة المدرب',
  robots: { index: false, follow: false },
};

export default function InstructorSubmissionsPage() {
  return <SubmittedAssignments />;
}
