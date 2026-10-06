import dynamic from 'next/dynamic';
import PageLoader from '@/components/PageLoader';

const ChatPageClient = dynamic(() => import('@/pages/ChatPage'), {
  ssr: false,
  loading: () => <PageLoader fullScreen={true} />,
});

export const metadata = {
  title: 'المحادثات والرسائل | أكاديمية فلسطين الدولية',
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return <ChatPageClient />;
}
