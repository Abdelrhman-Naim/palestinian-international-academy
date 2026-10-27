import Login from '@/pages/Login';

export const metadata = {
  title: 'تسجيل دخول المدربين | أكاديمية فلسطين الدولية (PIA)',
  description: 'بوابة تسجيل دخول المدربين والمحاضرين في أكاديمية فلسطين الدولية لإدارة المساقات والطلاب.',
  alternates: {
    canonical: '/login-trainer',
  },
};

export default function TrainerLoginPage() {
  return <Login defaultRole="instructor" />;
}
