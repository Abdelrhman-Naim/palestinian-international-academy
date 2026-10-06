import Login from '@/pages/Login';

export const metadata = {
  title: 'تسجيل دخول المدربين | أكاديمية فلسطين الدولية (PIA)',
  description: 'بوابة تسجيل دخول المدربين لإدارة الدورات والطلاب.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrainerLoginPage() {
  return <Login defaultRole="instructor" />;
}
