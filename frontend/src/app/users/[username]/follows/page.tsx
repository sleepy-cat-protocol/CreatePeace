import FollowsView from './FollowsView';

interface FollowsPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function FollowsPage({ params, searchParams }: FollowsPageProps) {
  const { username } = await params;
  const { tab } = await searchParams;
  
  return <FollowsView username={username} initialTab={tab} />;
}
