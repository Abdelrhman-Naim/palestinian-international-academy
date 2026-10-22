import BookDetail from '@/pages/BookDetail';
import { supabase } from '@/supabase/client';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  try {
    const { data: book } = await supabase
      .from('books')
      .select('title, author, description, cover_url')
      .eq('id', id)
      .maybeSingle();

    if (book && book.title) {
      return {
        title: `${book.title} | المكتبة الرقمية (PIA)`,
        description: book.description || `كتاب ${book.title} للمؤلف ${book.author || ''}.`,
        alternates: {
          canonical: `/library/${id}`,
        },
        openGraph: {
          title: `${book.title} | أكاديمية فلسطين الدولية`,
          description: book.description || `كتاب ${book.title}.`,
          images: book.cover_url ? [{ url: book.cover_url }] : ['/screen.webp'],
        },
      };
    }
  } catch (e) {
    // fallback
  }

  return {
    title: 'تفاصيل الكتاب | أكاديمية فلسطين الدولية (PIA)',
    alternates: {
      canonical: id ? `/library/${id}` : '/library',
    },
  };
}

export default function BookDetailPage() {
  return <BookDetail />;
}
