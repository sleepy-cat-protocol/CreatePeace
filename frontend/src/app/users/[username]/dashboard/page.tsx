import DashboardView from './DashboardView';

interface DashboardPageProps {
  params: Promise<{ username: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { username } = await params;
  return <DashboardView username={username} />;
}
