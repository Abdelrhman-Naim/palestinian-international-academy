import Login from '@/pages/Login';

export const metadata = {
  title: 'تسجيل الدخول | أكاديمية فلسطين الدولية (PIA)',
  description: 'تسجيل الدخول إلى حسابك في أكاديمية فلسطين الدولية للوصول إلى لوحة التحكم والمساقات التعليمية.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return <Login />;
}
