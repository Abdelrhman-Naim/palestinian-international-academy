import SavedBooks from '@/pages/SavedBooks';

export const metadata = {
  title: 'الكتب المحفوظة | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function StudentSavedBooksPage() {
  return <SavedBooks />;
}
