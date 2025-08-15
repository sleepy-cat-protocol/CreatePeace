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
  summary?: string;
  slug: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  
  // Creative work fields
  word_count: number;
  chapter_count: number;
  is_complete: boolean;
  
  // Content warnings and ratings
  content_warning?: string;
  rating?: string;
  
  // Media
  featured_image?: string;
  
  // Status
  status: string;
  
  // Statistics
  view_count: number;
  
  users: {
    id: string;
    name: string;
    email: string;
    username?: string;
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

  // useEffect(() => {
  //   if (!authLoading && !isAuthenticated) {
  //     router.push('/login');
  //     return;
  //   }

  //   if (isAuthenticated) {
  //     fetchPost();
  //   }
  // }, [isAuthenticated, authLoading, router, postId]);

  useEffect(() => {
      fetchPost();
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
  // if (authLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-lg text-gray-600">Loading...</div>
  //     </div>
  //   );
  // }

  // // Redirect if not authenticated
  // if (!isAuthenticated) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
  //         <p className="text-gray-600 mb-6">Please log in to view this post.</p>
  //         <Link
  //           href="/login"
  //           className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
  //         >
  //           Go to Login
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

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
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="w-full h-64 bg-gray-200">
              <img 
                src={post.featured_image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Post Header */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>
              
              {/* Summary */}
              {post.summary && (
                <div className="text-lg text-gray-700 mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="italic">{post.summary}</p>
                </div>
              )}

              {/* Author and Meta Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-gray-600 text-sm">
                  <span>By {post.users?.username || post.users?.name || 'Unknown Author'}</span>
                  <span className="mx-2">•</span>
                  <span>
                    {post.published_at || post.created_at
                      ? new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Unknown Date'
                    }
                  </span>
                  {post.updated_at !== post.created_at && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-blue-600">
                        Updated {new Date(post.updated_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
                
                {/* View Count */}
                <div className="text-sm text-gray-500">
                  {post.view_count} {post.view_count === 1 ? 'view' : 'views'}
                </div>
              </div>

              {/* Work Details */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center">
                  📖 {post.word_count.toLocaleString()} words
                </span>
                <span className="flex items-center">
                  📑 {post.chapter_count} {post.chapter_count === 1 ? 'chapter' : 'chapters'}
                </span>
                <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  post.is_complete 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {post.is_complete ? '✓ Complete' : '⏳ In Progress'}
                </span>
                {post.rating && (
                  <span className="flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                    Rated {post.rating}
                  </span>
                )}
              </div>

              {/* Content Warning */}
              {post.content_warning && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-yellow-600 font-medium mr-2">⚠️ Content Warning:</span>
                    <span className="text-yellow-800">{post.content_warning}</span>
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tagItem, index) => (
                    <span
                      key={tagItem.tag?.id || index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      #{tagItem.tag?.name || 'Unknown Tag'}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Post Body */}
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
                {post.content}
              </div>
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
