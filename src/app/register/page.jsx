import Register from '@/pages/Register';

export const metadata = {
  title: 'إنشاء حساب جديد | أكاديمية فلسطين الدولية (PIA)',
  description: 'انضم إلى طلاب ومتدربي أكاديمية فلسطين الدولية وابدأ رحلتك في تعلم البرمجة والتقنيات الحديثة.',
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterPage() {
  return <Register />;
}
