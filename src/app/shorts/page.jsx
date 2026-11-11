import Shorts from '@/pages/Shorts';

export const metadata = {
  title: 'فيديوهات ومعلومات هندسية وبرمجية سريعة | أكاديمية فلسطين الدولية (PIA)',
  description: 'تصفح كبسولات علمية وتقنية مكثفة وفيديوهات سريعة تواكب أحدث المستجدات في البرمجة والذكاء الاصطناعي والهندسة.',
  alternates: {
    canonical: '/shorts',
  },
};

export default function ShortsPage() {
  return <Shorts />;
}
