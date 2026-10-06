import SavedBooks from '@/pages/SavedBooks';

export const metadata = {
  title: 'الكتب المحفوظة | لوحة المدرب',
  robots: { index: false, follow: false },
};

export default function InstructorSavedBooksPage() {
  return <SavedBooks />;
}
