import PostContent from './PostContent';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  
  return <PostContent postId={id} />;
}