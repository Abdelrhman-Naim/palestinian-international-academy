import ChatPage from '@/pages/ChatPage';

export const metadata = {
  title: 'المحادثات والرسائل | لوحة المدرب',
  robots: { index: false, follow: false },
};

export default function InstructorMessagesPage() {
  return <ChatPage />;
}
