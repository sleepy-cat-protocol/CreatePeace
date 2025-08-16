import LikesCollectionsView from './LikesCollectionsView';

interface LikesCollectionsPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function LikesCollectionsPage({ params, searchParams }: LikesCollectionsPageProps) {
  const { username } = await params;
  const { tab } = await searchParams;
  
  return <LikesCollectionsView username={username} initialTab={tab} />;
}
