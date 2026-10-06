import ChatClient from './ChatClient';

export const metadata = {
  title: 'المحادثات والرسائل | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return <ChatClient />;
}
