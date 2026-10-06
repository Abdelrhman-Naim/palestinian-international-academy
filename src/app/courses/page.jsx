import Courses from '@/pages/Courses';

export const metadata = {
  title: 'الدورات التدريبية المعتمدة | أكاديمية فلسطين الدولية (PIA)',
  description: 'تصفح باقة شاملة من الدورات التدريبية الاحترافية والشهادات المعتمدة في البرمجة وتكنولوجيا المعلومات والتصميم والذكاء الاصطناعي.',
  alternates: {
    canonical: '/courses',
  },
};

export default function CoursesPage() {
  return <Courses />;
}
