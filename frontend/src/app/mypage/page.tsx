'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

export default function MyPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (isAuthenticated) {
      fetchUserPosts();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchUserPosts = async () => {
    try {
      const response = await axios.get('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to home page
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* User Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Manage your blog posts and account</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Dashboard</h2>
          <Link
            href="/create-post"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Post
          </Link>
        </div>

        {/* Posts Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">All Blog Posts</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading posts...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <h4 className="text-lg text-gray-600">No posts yet</h4>
              <p className="text-gray-500 mt-2">Start by creating your first post!</p>
              <Link
                href="/create-post"
                className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First Post
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Link href={`/posts/${post.id}`} key={post.id}>
                  <article
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h4>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {post.content.length > 150
                        ? `${post.content.substring(0, 150)}...`
                        : post.content}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>By {post.users.name}</span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 