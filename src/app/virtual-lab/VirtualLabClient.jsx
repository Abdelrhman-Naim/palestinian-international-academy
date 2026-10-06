"use client";

import dynamic from 'next/dynamic';
import PageLoader from '@/components/PageLoader';

const VirtualLab = dynamic(() => import('@/views/VirtualLab'), {
  ssr: false,
  loading: () => <PageLoader fullScreen={true} />,
});

export default function VirtualLabClient() {
  return <VirtualLab />;
}
