"use client";

import dynamic from 'next/dynamic';
import PageLoader from '@/components/PageLoader';

const ChatPage = dynamic(() => import('@/views/ChatPage'), {
  ssr: false,
  loading: () => <PageLoader fullScreen={true} />,
});

export default function ChatClient() {
  return <ChatPage />;
}
