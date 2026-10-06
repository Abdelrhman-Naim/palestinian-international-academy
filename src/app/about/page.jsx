import About from '@/pages/About';

export const metadata = {
  title: 'من نحن والرسالة والأهداف | أكاديمية فلسطين الدولية (PIA)',
  description: 'تعرف على أكاديمية فلسطين الدولية، رؤيتنا، رسالتنا في نشر المعرفة التقنية، وفريق الخبراء والمدربين المعتمدين.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return <About />;
}
