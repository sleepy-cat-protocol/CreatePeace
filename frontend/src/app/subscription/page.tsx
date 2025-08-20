'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import Link from 'next/link';
import { 
  CalendarIcon,
  HeartIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  RssIcon
} from '@heroicons/react/24/outline';

interface Post {
  id: string;
  title: string;
  content: string;
  summary?: string;
  created_at: string;
  published_at?: string;
  view_count: number;
  users: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar_url: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    likes: number;
    collections: number;
    comments: number;
  };
}

interface SubscriptionFeedResponse {
  posts: Post[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function SubscriptionPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchSubscriptionFeed(1);
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchSubscriptionFeed = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      console.log('fetchSubscriptionFeed frontend', page);
      
      const response = await axios.get<SubscriptionFeedResponse>(`/users/subscription-feed?page=${page}&limit=10`);
      const data = response.data;
      
      setPosts(data.posts);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (err: any) {
      console.error('Subscription feed error:', err);
      setError('Failed to load subscription feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchSubscriptionFeed(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return formatDate(dateString);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <RssIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Subscription Feed</h1>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>
          <p className="text-gray-600">
            Latest posts from users you follow in the past week
            {totalCount > 0 && (
              <span className="font-medium text-gray-900"> ({totalCount} posts)</span>
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscription feed...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => fetchSubscriptionFeed(currentPage)}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <RssIcon className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No posts in your feed</h3>
            <p className="text-gray-600 mb-4">
              Follow some users to see their latest posts here.
            </p>
            <div className="space-x-4">
              <Link
                href="/search"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Find Users to Follow
              </Link>
            </div>
          </div>
        )}

        {/* Posts List */}
        {!loading && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Link href={`/users/${post.users.username || post.users.id}/dashboard`}>
                      {post.users.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={post.users.avatar_url}
                          alt={post.users.name}
                        />
                      ) : (
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {(post.users.username || post.users.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/users/${post.users.username || post.users.id}/dashboard`}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {post.users.username || post.users.name}
                        </Link>
                        {post.users.username && (
                          <span className="text-gray-500 text-sm">@{post.users.username}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{getTimeAgo(post.published_at || post.created_at)}</span>
                        </div>
                        <span>•</span>
                        <span>{post.view_count} views</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <Link href={`/posts/${post.id}`} className="block group">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    {post.summary && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.summary}
                      </p>
                    )}
                  </Link>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-4">
                      {post.tags.slice(0, 5).map((tagItem) => (
                        <span
                          key={tagItem.tag.id}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          #{tagItem.tag.name}
                        </span>
                      ))}
                      {post.tags.length > 5 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          +{post.tags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Post Stats */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <HeartIcon className="h-4 w-4" />
                      <span>{post._count.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookmarkIcon className="h-4 w-4" />
                      <span>{post._count.collections}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                      <span>{post._count.comments}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Page Info */}
        {!loading && totalCount > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing page {currentPage} of {totalPages} ({totalCount} total posts)
          </div>
        )}
      </div>
    </div>
  );
}
