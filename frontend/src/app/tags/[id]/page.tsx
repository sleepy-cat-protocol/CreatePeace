'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import axios from '@/lib/axios';
import Link from 'next/link';
import { 
  TagIcon,
  CalendarIcon,
  HeartIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ChevronDownIcon,
  RssIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';

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

interface TagDetail {
  id: string;
  name: string;
  created_at: string;
  postsCount: number;
  subscribersCount: number;
}

interface TagDetailResponse {
  tag: TagDetail;
  posts: Post[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

type SortBy = 'date' | 'likes' | 'title';
type SortOrder = 'asc' | 'desc';

export default function TagDetailPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tagId = params.id as string;
  
  const [tagData, setTagData] = useState<TagDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  
  // Filter and sort states
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (tagId) {
      fetchTagDetail(1);
      if (isAuthenticated) {
        checkSubscriptionStatus();
      }
    }
  }, [tagId, isAuthenticated, sortBy, sortOrder]);

  const fetchTagDetail = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get<TagDetailResponse>(
        `/tags/${tagId}?page=${page}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      setTagData(response.data);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Tag detail error:', err);
      setError('Failed to load tag details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`/users/tags/${tagId}/subscription-status`);
      setIsSubscribed(response.data.isSubscribed);
    } catch (err: any) {
      console.error('Subscription status error:', err);
    }
  };

  const handleSubscription = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setSubscriptionLoading(true);
      
      if (isSubscribed) {
        await axios.delete(`/users/tags/${tagId}/subscribe`);
        setIsSubscribed(false);
      } else {
        await axios.post(`/users/tags/${tagId}/subscribe`);
        setIsSubscribed(true);
      }
      
      // Refresh tag data to update subscriber count
      fetchTagDetail(currentPage);
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSortChange = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    fetchTagDetail(page);
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

  if (loading && !tagData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tag details...</p>
        </div>
      </div>
    );
  }

  if (error && !tagData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <TagIcon className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Failed to Load Tag</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchTagDetail(1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/search" className="text-blue-600 hover:text-blue-800">
              ← Back to Search
            </Link>
          </div>

          {tagData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <TagIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">#{tagData.tag.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                      <span>{tagData.tag.postsCount} posts</span>
                      <span>•</span>
                      <span>{tagData.tag.subscribersCount} subscribers</span>
                      <span>•</span>
                      <span>Created {formatDate(tagData.tag.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Subscribe Button */}
                {isAuthenticated && (
                  <button
                    onClick={handleSubscription}
                    disabled={subscriptionLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSubscribed
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isSubscribed ? (
                      <>
                        <HeartSolidIcon className="h-4 w-4" />
                        <span>{subscriptionLoading ? 'Unsubscribing...' : 'Unsubscribe'}</span>
                      </>
                    ) : (
                      <>
                        <RssIcon className="h-4 w-4" />
                        <span>{subscriptionLoading ? 'Subscribing...' : 'Subscribe'}</span>
                      </>
                    )}
                  </button>
                )}

                {!isAuthenticated && (
                  <Link
                    href="/login"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RssIcon className="h-4 w-4" />
                    <span>Login to Subscribe</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort and Filter Controls */}
        {tagData && tagData.posts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Posts ({tagData.pagination.totalCount})
              </h2>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortBy, sortOrder)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date">Date</option>
                    <option value="likes">Likes</option>
                    <option value="title">Title</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Order:</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => handleSortChange(sortBy, e.target.value as SortOrder)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="desc">
                      {sortBy === 'date' ? 'Newest First' : 
                       sortBy === 'likes' ? 'Most Liked' : 
                       'Z to A'}
                    </option>
                    <option value="asc">
                      {sortBy === 'date' ? 'Oldest First' : 
                       sortBy === 'likes' ? 'Least Liked' : 
                       'A to Z'}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        )}

        {/* Error State */}
        {error && tagData && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => fetchTagDetail(currentPage)}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Posts List */}
        {tagData && !loading && (
          <>
            {tagData.posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <TagIcon className="mx-auto h-16 w-16" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-600">
                  No posts have been tagged with "#{tagData.tag.name}" yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {tagData.posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Post Header */}
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
                            <div className="flex items-center space-x-1">
                              <EyeIcon className="h-3 w-3" />
                              <span>{post.view_count} views</span>
                            </div>
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

                      {/* Tags (excluding current tag) */}
                      {post.tags.filter(t => t.tag.id !== tagId).length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-4">
                          {post.tags
                            .filter(t => t.tag.id !== tagId)
                            .slice(0, 4)
                            .map((tagItem) => (
                            <Link
                              key={tagItem.tag.id}
                              href={`/tags/${tagItem.tag.id}`}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                            >
                              #{tagItem.tag.name}
                            </Link>
                          ))}
                          {post.tags.filter(t => t.tag.id !== tagId).length > 4 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
                              +{post.tags.filter(t => t.tag.id !== tagId).length - 4} more
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
            {tagData.pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(tagData.pagination.totalPages, 5) }, (_, i) => {
                    const page = Math.max(1, Math.min(tagData.pagination.totalPages - 4, currentPage - 2)) + i;
                    if (page > tagData.pagination.totalPages) return null;
                    
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
                  disabled={currentPage === tagData.pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Page Info */}
            {tagData.pagination.totalCount > 0 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing page {currentPage} of {tagData.pagination.totalPages} ({tagData.pagination.totalCount} total posts)
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
