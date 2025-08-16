import ProfileView from './ProfileView';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  return <ProfileView userId={id} />;
}
