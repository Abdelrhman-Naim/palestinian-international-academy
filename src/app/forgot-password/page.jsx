import ForgotPassword from '@/pages/ForgotPassword';

export const metadata = {
  title: 'استعادة كلمة المرور | أكاديمية فلسطين الدولية (PIA)',
  description: 'إعادة تعيين كلمة المرور لحسابك في أكاديمية فلسطين الدولية.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
