'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserIcon, 
  CheckBadgeIcon,
  UserMinusIcon,
  XMarkIcon,
  ArrowLeftIcon
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
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

interface FollowsViewProps {
  username: string;
  initialTab?: string;
}

export default function FollowsView({ username, initialTab }: FollowsViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(
    initialTab === 'followers' ? 'followers' : 'following'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchUserByUsername();
  }, [username]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'following') {
        fetchFollowing();
      } else {
        fetchFollowers();
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

  const fetchFollowing = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/users/${user.id}/following?page=${currentPage}&limit=20`);
      setFollowing(response.data.following);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      console.error('Error fetching following:', error);
      setError('Failed to load following list');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/users/${user.id}/followers?page=${currentPage}&limit=20`);
      setFollowers(response.data.followers);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      console.error('Error fetching followers:', error);
      setError('Failed to load followers list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!currentUser) return;
    
    setActionLoading(targetUserId);
    try {
      await axios.delete(`/users/${targetUserId}/follow`);
      
      // Remove from following list
      setFollowing(prev => prev.filter(u => u.id !== targetUserId));
      
      // Update user's following count
      setUser(prev => prev ? {
        ...prev,
        _count: {
          ...prev._count,
          following: prev._count.following - 1
        }
      } : null);
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      setError(error.response?.data?.message || 'Failed to unfollow user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!currentUser) return;
    
    setActionLoading(followerId);
    try {
      await axios.delete(`/users/${followerId}/remove-follower`);
      
      // Remove from followers list
      setFollowers(prev => prev.filter(u => u.id !== followerId));
      
      // Update user's followers count
      setUser(prev => prev ? {
        ...prev,
        _count: {
          ...prev._count,
          followers: prev._count.followers - 1
        }
      } : null);
    } catch (error: any) {
      console.error('Error removing follower:', error);
      setError(error.response?.data?.message || 'Failed to remove follower');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTabChange = (tab: 'following' | 'followers') => {
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
  const currentList = activeTab === 'following' ? following : followers;

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
                onClick={() => handleTabChange('following')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'following'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Following ({user._count.following})
              </button>
              <button
                onClick={() => handleTabChange('followers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'followers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Followers ({user._count.followers})
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
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} yet
              </h3>
              <p className="text-gray-600">
                {isOwnProfile 
                  ? `You're not ${activeTab === 'following' ? 'following anyone' : 'being followed by anyone'} yet.`
                  : `This user ${activeTab === 'following' ? "isn't following anyone" : "doesn't have any followers"} yet.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentList.map((followUser) => (
                <div key={followUser.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href={`/users/${followUser.username || followUser.id}/dashboard`}>
                      {followUser.avatar_url ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover"
                          src={followUser.avatar_url}
                          alt={followUser.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                    </Link>
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/users/${followUser.username || followUser.id}/dashboard`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {followUser.name}
                        </Link>
                        {followUser.is_verified && (
                          <CheckBadgeIcon className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      {followUser.username && (
                        <p className="text-gray-600 text-sm">@{followUser.username}</p>
                      )}
                      {followUser.bio && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-1">{followUser.bio}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{followUser._count.posts} posts</span>
                        <span>{followUser._count.followers} followers</span>
                        <span>{followUser._count.following} following</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isOwnProfile && (
                    <div className="flex-shrink-0">
                      {activeTab === 'following' ? (
                        <button
                          onClick={() => handleUnfollow(followUser.id)}
                          disabled={actionLoading === followUser.id}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === followUser.id ? (
                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <UserMinusIcon className="h-4 w-4 mr-2" />
                          )}
                          Unfollow
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoveFollower(followUser.id)}
                          disabled={actionLoading === followUser.id}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === followUser.id ? (
                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <XMarkIcon className="h-4 w-4 mr-2" />
                          )}
                          Remove
                        </button>
                      )}
                    </div>
                  )}
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
