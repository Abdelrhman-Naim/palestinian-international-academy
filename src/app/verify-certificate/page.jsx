import CertificateVerificationPage from '@/pages/CertificateVerificationPage';

export const metadata = {
  title: 'التحقق من صحة الشهادة | أكاديمية فلسطين الدولية (PIA)',
  description: 'خدمة التحقق الفوري المباشر من موثوقية وصحة الشهادات الصادرة عن أكاديمية فلسطين الدولية برقم الكود المعتمد.',
  alternates: {
    canonical: '/verify-certificate',
  },
};

export default function VerifyCertificateRoute() {
  return <CertificateVerificationPage />;
}
