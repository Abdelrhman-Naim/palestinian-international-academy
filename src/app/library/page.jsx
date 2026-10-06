import Library from '@/pages/Library';

export const metadata = {
  title: 'المكتبة الرقمية والمراجع الأكاديمية | أكاديمية فلسطين الدولية (PIA)',
  description: 'مكتبة رقمية غنية بآلاف الكتب العلمية والمراجع التقنية والأدبية المفتوحة للتحميل المباشر والقراءة.',
  alternates: {
    canonical: '/library',
  },
};

export default function LibraryPage() {
  return <Library />;
}
