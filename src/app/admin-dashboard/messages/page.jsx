import ChatPage from '@/pages/ChatPage';

export const metadata = {
  title: 'المحادثات والرسائل | الإدارة',
  robots: { index: false, follow: false },
};

export default function AdminMessagesPage() {
  return <ChatPage />;
}
