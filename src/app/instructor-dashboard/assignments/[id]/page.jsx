import ManageAssignments from '@/pages/ManageAssignments';

export const metadata = {
  title: 'إدارة التكليفات | لوحة المدرب',
  robots: { index: false, follow: false },
};

export default function InstructorAssignmentsPage() {
  return <ManageAssignments />;
}
