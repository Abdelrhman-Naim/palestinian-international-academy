import ChatPage from '@/pages/ChatPage';

export const metadata = {
  title: 'المحادثات والرسائل | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function StudentMessagesPage() {
  return <ChatPage />;
}
