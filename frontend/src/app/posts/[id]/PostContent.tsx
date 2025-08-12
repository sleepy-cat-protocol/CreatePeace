'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

interface PostContentProps {
  postId: string;
}

export default function PostContent({ postId }: PostContentProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchPost();
    }
  }, [isAuthenticated, authLoading, router, postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching post with ID: ${postId}`);
      const response = await axios.get(`/posts/${postId}`);
      console.log('Post data received:', response.data);
      
      setPost(response.data);
    } catch (err: any) {
      console.error('Error fetching post:', err);
      
      if (err.response?.status === 401) {
        setError('You need to be logged in to view this post.');
        router.push('/login');
      } else if (err.response?.status === 404) {
        setError('Post not found.');
      } else {
        setError('Failed to load post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to view this post.</p>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Show loading while fetching post
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading post...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchPost}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/mypage"
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to My Posts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show post not found
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist.</p>
          <Link
            href="/mypage"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to My Posts
          </Link>
        </div>
      </div>
    );
  }

  // Render the post
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/mypage"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to My Posts
          </Link>
        </div>

        {/* Post Content */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Post Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            
            {/* Post Meta */}
            <div className="flex items-center text-gray-600 text-sm mb-4">
              <span>By {post.users?.name || post.users?.email || 'Unknown Author'}</span>
              <span className="mx-2">•</span>
              <span>
                {post.created_at 
                  ? new Date(post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Unknown Date'
                }
              </span>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tagItem, index) => (
                  <span
                    key={tagItem.tag?.id || index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {tagItem.tag?.name || 'Unknown Tag'}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Post Body */}
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {post.content}
            </div>
          </div>
        </article>

        {/* Actions */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            href="/mypage"
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to My Posts
          </Link>
          
          {/* Edit button if user owns the post */}
          {user && user.id === post.author_id && (
            <Link
              href={`/posts/${post.id}/edit`}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Post
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
