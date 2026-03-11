import type { Metadata } from 'next';
import ArchiveClient from '@/components/archive/ArchiveClient';

export const metadata: Metadata = {
  title: 'Archive | David & Goliath AI Intelligence Report',
  description: 'Browse all published editions of the David & Goliath AI Intelligence Report. Strategic AI insights for Australian operators.',
  openGraph: {
    title: 'AI Intelligence Report Archive',
    description: 'Strategic AI insights for Australian operators. Browse all published editions.',
    type: 'website',
    siteName: 'David & Goliath',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Intelligence Report Archive',
    description: 'Strategic AI insights for Australian operators.',
  },
};

export default function ArchivePage() {
  return <ArchiveClient />;
}
