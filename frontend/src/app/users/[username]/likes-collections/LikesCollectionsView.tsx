'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserIcon, 
  CheckBadgeIcon,
  HeartIcon,
  BookmarkIcon,
  ArrowLeftIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url: string;
  bio: string;
  is_verified: boolean;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  created_at: string;
  status: string;
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

interface LikesCollectionsViewProps {
  username: string;
  initialTab?: string;
}

export default function LikesCollectionsView({ username, initialTab }: LikesCollectionsViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [collectedPosts, setCollectedPosts] = useState<Post[]>([]);
  const [likedPostsCount, setLikedPostsCount] = useState(0);
  const [collectedPostsCount, setCollectedPostsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'likes' | 'collections'>(
    initialTab === 'collections' ? 'collections' : 'likes'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchUserByUsername();
  }, [username]);

  useEffect(() => {
    if (user) {
      // When user changes or tab changes to a new tab, fetch posts for active tab
      // This will also update the count for the active tab
      if (activeTab === 'likes') {
        fetchLikedPosts();
        // If we don't have collected count yet, fetch it
        if (collectedPostsCount === 0) {
          fetchCollectedCount();
        }
      } else {
        fetchCollectedPosts();
        // If we don't have liked count yet, fetch it
        if (likedPostsCount === 0) {
          fetchLikedCount();
        }
      }
    }
  }, [user, activeTab, currentPage]);

  const fetchUserByUsername = async () => {
    try {
      let response;
      try {
        response = await axios.get(`/users/username/${username}`);
      } catch (usernameError: any) {
        if (usernameError.response?.status === 404) {
          response = await axios.get(`/users/${username}`);
        } else {
          throw usernameError;
        }
      }
      setUser(response.data);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      setError('User not found');
      setIsLoading(false);
    }
  };

  const fetchLikedCount = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/users/${user.id}/liked-posts?page=1&limit=1`);
      setLikedPostsCount(response.data.totalPosts || 0);
    } catch (error: any) {
      console.error('Error fetching liked count:', error);
    }
  };

  const fetchCollectedCount = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/users/${user.id}/collected-posts?page=1&limit=1`);
      setCollectedPostsCount(response.data.totalPosts || 0);
    } catch (error: any) {
      console.error('Error fetching collected count:', error);
    }
  };

  const fetchLikedPosts = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/users/${user.id}/liked-posts?page=${currentPage}&limit=20`);
      setLikedPosts(response.data.posts);
      setTotalPages(response.data.totalPages);
      setLikedPostsCount(response.data.totalPosts || 0);
    } catch (error: any) {
      console.error('Error fetching liked posts:', error);
      setError('Failed to load liked posts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollectedPosts = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/users/${user.id}/collected-posts?page=${currentPage}&limit=20`);
      setCollectedPosts(response.data.posts);
      setTotalPages(response.data.totalPages);
      setCollectedPostsCount(response.data.totalPosts || 0);
    } catch (error: any) {
      console.error('Error fetching collected posts:', error);
      setError('Failed to load collected posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'likes' | 'collections') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setError(null);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Something went wrong'}</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;
  const currentList = activeTab === 'likes' ? likedPosts : collectedPosts;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href={`/users/${username}/dashboard`}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            {user.avatar_url ? (
              <img
                className="h-16 w-16 rounded-full object-cover"
                src={user.avatar_url}
                alt={user.name}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-gray-600" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                {user.is_verified && (
                  <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
                )}
              </div>
              {user.username && (
                <p className="text-gray-600">@{user.username}</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => handleTabChange('likes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === 'likes'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HeartIcon className="h-4 w-4" />
                <span>Liked Posts ({likedPostsCount})</span>
              </button>
              <button
                onClick={() => handleTabChange('collections')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === 'collections'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookmarkIcon className="h-4 w-4" />
                <span>Collections ({collectedPostsCount})</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading {activeTab}...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="p-12 text-center">
              {activeTab === 'likes' ? (
                <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              ) : (
                <BookmarkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab === 'likes' ? 'liked posts' : 'collections'} yet
              </h3>
              <p className="text-gray-600">
                {isOwnProfile 
                  ? `You haven't ${activeTab === 'likes' ? 'liked any posts' : 'collected any posts'} yet.`
                  : `This user hasn't ${activeTab === 'likes' ? 'liked any posts' : 'collected any posts'} yet.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentList.map((post) => (
                <div key={post.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Author Avatar */}
                    <Link href={`/users/${post.users.username || post.users.id}/dashboard`}>
                      {post.users.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover hover:ring-2 hover:ring-blue-500 transition-all"
                          src={post.users.avatar_url}
                          alt={post.users.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors">
                          <UserIcon className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                    </Link>

                    {/* Post Content */}
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link
                          href={`/users/${post.users.username || post.users.id}/dashboard`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {post.users.name}
                        </Link>
                        {post.users.username && (
                          <span className="text-gray-500 text-sm">@{post.users.username}</span>
                        )}
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center text-gray-500 text-sm">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <Link
                        href={`/posts/${post.id}`}
                        className="block hover:bg-gray-50 rounded-lg p-3 -mx-3 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">{post.title}</h3>
                        
                        {post.summary && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.summary}</p>
                        )}

                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap mb-3">
                            {post.tags.slice(0, 4).map((tagItem) => (
                              <span
                                key={tagItem.tag.id}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                              >
                                #{tagItem.tag.name}
                              </span>
                            ))}
                            {post.tags.length > 4 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                                +{post.tags.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <HeartIcon className="h-4 w-4" />
                            <span>{post._count.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookmarkIcon className="h-4 w-4" />
                            <span>{post._count.collections}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post._count.comments}</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
