import StudentAssignments from '@/pages/StudentAssignments';

export const metadata = {
  title: 'واجباتي وتكليفاتي | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function StudentAssignmentsPage() {
  return <StudentAssignments />;
}
