import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { featureFlags } from '@/lib/config/flags';
import { getPassageFromId } from '@/lib/server/posts';
import { PassageClient } from './passage-client';

function createTitle(referenceLabel: string) {
  return `${referenceLabel} - GO'EL Passage Viewer`;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const passage = await getPassageFromId(params.id);
  if (!passage) {
    return {
      title: "Passage Not Found - GO'EL",
    };
  }

  const { book, chapter, startVerse, endVerse } = passage.reference;
  const referenceLabel =
    endVerse && endVerse !== startVerse
      ? `${book} ${chapter}:${startVerse}-${endVerse}`
      : `${book} ${chapter}:${startVerse}`;

  return {
    title: createTitle(referenceLabel),
    description: `Meditate on ${referenceLabel} in the World English Bible translation within GO'EL.`,
  };
}

export default async function PassagePage({ params }: { params: { id: string } }) {
  const passage = await getPassageFromId(params.id);
  if (!passage) {
    notFound();
  }

  return <PassageClient passage={passage} featureFlags={featureFlags} />;
}