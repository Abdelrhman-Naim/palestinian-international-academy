import AdminLogin from '@/pages/AdminLogin';

export const metadata = {
  title: 'تسجيل دخول الإدارة | أكاديمية فلسطين الدولية (PIA)',
  description: 'بوابة الدخول المخصصة لإدارة منصة أكاديمية فلسطين الدولية.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}
