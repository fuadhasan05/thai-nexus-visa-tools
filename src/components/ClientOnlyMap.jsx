import dynamic from 'next/dynamic';
import React from 'react';

const LeafletMapInner = dynamic(() => import('@/components/LeafletMapInner'), { ssr: false });

export default function ClientOnlyMap(props) {
  return <LeafletMapInner {...props} />;
}
