import CourseDetail from '@/pages/CourseDetail';
import { supabase } from '@/supabase/client';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  try {
    const { data: course } = await supabase
      .from('courses')
      .select('title, description, image_url')
      .eq('id', id)
      .maybeSingle();

    if (course && course.title) {
      return {
        title: `${course.title} | أكاديمية فلسطين الدولية (PIA)`,
        description: course.description || 'تفاصيل الدورة التدريبية والشهادة المعتمدة والمحاضرات.',
        alternates: {
          canonical: `/courses/${id}`,
        },
        openGraph: {
          title: `${course.title} | أكاديمية فلسطين الدولية`,
          description: course.description || 'تفاصيل الدورة التدريبية.',
          images: course.image_url ? [{ url: course.image_url }] : ['/screen.webp'],
        },
      };
    }
  } catch (e) {
    // fallback if query fails
  }

  return {
    title: 'تفاصيل الدورة التدريبية | أكاديمية فلسطين الدولية (PIA)',
  };
}

export default function CourseDetailPage() {
  return <CourseDetail />;
}
